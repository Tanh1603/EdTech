import unittest
from unittest.mock import Mock, patch
import json
import pika
import sys
import os

# Add src/ folder to Python path to resolve imports correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

from agents.workers.worker import Worker, JobMessage, GrpcCommunicationError
from agents.workers.rabbitmq import RabbitMqWorkerRunner


class TestWorkerRetryMechanism(unittest.TestCase):
    def setUp(self):
        self.mock_be_core = Mock()
        self.worker = Worker(self.mock_be_core)

    def test_job_success_acks_message(self):
        # 1. Mock the handler to succeed
        mock_handler = Mock(return_value={"status": "ok"})
        message = JobMessage(
            job_id="test-job-id",
            type="ai.assessment.grade",
            resource_id="res-123",
            payload={}
        )

        # 2. Run process
        result = self.worker.process(message, mock_handler)

        # 3. Assertions
        self.assertEqual(result, {"status": "ok"})
        self.mock_be_core.mark_job_running.assert_called_once_with("test-job-id")
        self.mock_be_core.mark_job_succeeded.assert_called_once_with("test-job-id", {"status": "ok"})
        self.mock_be_core.mark_job_failed.assert_not_called()

    def test_job_business_failure_raises_original_error_and_marks_failed(self):
        # 1. Mock handler to throw an error
        mock_handler = Mock(side_effect=ValueError("LLM error"))
        message = JobMessage(
            job_id="test-job-id",
            type="ai.assessment.grade",
            resource_id="res-123",
            payload={}
        )

        # 2. Run process and assert original error is raised
        with self.assertRaises(ValueError) as context:
            self.worker.process(message, mock_handler)
        self.assertEqual(str(context.exception), "LLM error")

        # 3. Assertions
        self.mock_be_core.mark_job_running.assert_called_once_with("test-job-id")
        self.mock_be_core.mark_job_failed.assert_called_once_with("test-job-id", {"message": "LLM error"})
        self.mock_be_core.mark_job_succeeded.assert_not_called()

    def test_grpc_failure_during_mark_running_raises_grpc_communication_error(self):
        self.mock_be_core.mark_job_running.side_effect = Exception("gRPC timeout")
        mock_handler = Mock()
        message = JobMessage(
            job_id="test-job-id",
            type="ai.assessment.grade",
            resource_id="res-123",
            payload={}
        )

        with self.assertRaises(GrpcCommunicationError) as context:
            self.worker.process(message, mock_handler)
        self.assertIn("gRPC timeout", str(context.exception))
        mock_handler.assert_not_called()

    def test_grpc_failure_during_mark_failed_raises_grpc_communication_error(self):
        mock_handler = Mock(side_effect=ValueError("original error"))
        self.mock_be_core.mark_job_failed.side_effect = Exception("gRPC failed on mark failed")
        message = JobMessage(
            job_id="test-job-id",
            type="ai.assessment.grade",
            resource_id="res-123",
            payload={}
        )

        with self.assertRaises(GrpcCommunicationError) as context:
            self.worker.process(message, mock_handler)
        self.assertIn("original error", str(context.exception))

    @patch("agents.workers.rabbitmq.logger")
    def test_rabbitmq_runner_ack_on_business_failure(self, mock_logger):
        # 1. Mock the channel and method/properties
        mock_channel = Mock()
        mock_method = Mock(delivery_tag=42)
        mock_properties = Mock()
        
        # 2. Define payload
        payload = {
            "jobId": "job-1",
            "type": "ai.assessment.grade",
            "resourceId": "res-1",
            "payload": {}
        }
        body = json.dumps(payload).encode("utf-8")

        # 3. Mock handler to raise a ValueError (represents business failure after successfully calling mark_job_failed)
        mock_handler = Mock(side_effect=ValueError("Business Failure"))

        # 4. Instantiate runner and get callback
        runner = RabbitMqWorkerRunner()
        callback = runner._consume(mock_handler)

        # 5. Invoke callback
        callback(mock_channel, mock_method, mock_properties, body)

        # 6. Verify basic_ack was called and basic_nack was not
        mock_channel.basic_ack.assert_called_once_with(delivery_tag=42)
        mock_channel.basic_nack.assert_not_called()

    @patch("agents.workers.rabbitmq.logger")
    def test_rabbitmq_runner_nack_with_requeue_on_grpc_error(self, mock_logger):
        mock_channel = Mock()
        mock_method = Mock(delivery_tag=42)
        mock_properties = Mock()
        
        payload = {
            "jobId": "job-1",
            "type": "ai.assessment.grade",
            "resourceId": "res-1",
            "payload": {}
        }
        body = json.dumps(payload).encode("utf-8")

        # Mock handler to raise GrpcCommunicationError
        mock_handler = Mock(side_effect=GrpcCommunicationError("gRPC Error"))

        runner = RabbitMqWorkerRunner()
        callback = runner._consume(mock_handler)

        callback(mock_channel, mock_method, mock_properties, body)

        # Verify basic_nack with requeue=True was called and basic_ack was not
        mock_channel.basic_nack.assert_called_once_with(delivery_tag=42, requeue=True)
        mock_channel.basic_ack.assert_not_called()


if __name__ == "__main__":
    unittest.main()
