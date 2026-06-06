from __future__ import annotations

import json
import logging
import signal
import time
from collections.abc import Callable
from typing import Any

import pika

from agents.workers.worker import GrpcCommunicationError, JobMessage
from config.settings import Settings, get_settings

JobHandler = Callable[[JobMessage], dict[str, Any]]
logger = logging.getLogger(__name__)

JOB_QUEUES = {
    "ai.material.ingest": "edtech.ai.material.ingest",
    "ai.assessment.grade": "edtech.ai.assessment.grade",
    "ai.roadmap.generate": "edtech.ai.roadmap.generate",
    "ai.exam.generate": "edtech.ai.exam.generate",
    "ai.chat.title.generate": "edtech.ai.chat.title.generate",
    "ai.material.summarize": "edtech.ai.material.summarize",
}


class RabbitMqWorkerRunner:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.connection: pika.BlockingConnection | None = None
        self.channel: pika.channel.Channel | None = None
        self._stopping = False

    def run(self, handlers: dict[str, JobHandler]) -> None:
        signal.signal(signal.SIGINT, self._request_stop)
        signal.signal(signal.SIGTERM, self._request_stop)
        while not self._stopping:
            try:
                self._run_once(handlers)
            except Exception:
                if self._stopping:
                    break
                logger.exception(
                    "RabbitMQ consumer connection lost; reconnecting",
                    extra={
                        "component": "rabbitmq.worker",
                        "step": "consumer.reconnect",
                    },
                )
                self.close()
                time.sleep(5)

    def _run_once(self, handlers: dict[str, JobHandler]) -> None:
        parameters = pika.URLParameters(self.settings.rabbitmq_url)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.basic_qos(prefetch_count=self.settings.rabbitmq_prefetch)
        self._assert_topology()
        for job_type, handler in handlers.items():
            queue = JOB_QUEUES[job_type]
            logger.info(
                "RabbitMQ consumer registered",
                extra={
                    "component": "rabbitmq.worker",
                    "step": "consumer.registered",
                    "jobType": job_type,
                    "queue": queue,
                },
            )
            self.channel.basic_consume(
                queue=queue,
                on_message_callback=self._consume(handler),
            )
        self.channel.start_consuming()

    def close(self) -> None:
        if self.channel and self.channel.is_open:
            self.channel.close()
        if self.connection and self.connection.is_open:
            self.connection.close()

    def _consume(self, handler: JobHandler) -> Any:
        def callback(
            channel: pika.channel.Channel,
            _method: Any,
            _properties: pika.BasicProperties,
            body: bytes,
        ) -> None:
            message: JobMessage | None = None
            try:
                payload = json.loads(body.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("RabbitMQ job payload must be a JSON object")
                message = JobMessage.from_payload(payload)
                logger.info(
                    "RabbitMQ message received",
                    extra={
                        "component": "rabbitmq.worker",
                        "step": "consume.received",
                        "jobId": message.job_id,
                        "jobType": message.type,
                        "materialId": message.resource_id
                        if message.type == "ai.material.ingest"
                        else None,
                        "requestId": message.request_id,
                        "correlationId": message.correlation_id,
                    },
                )
                handler(message)
            except GrpcCommunicationError as error:
                logger.warning(
                    "RabbitMQ job processing failed due to Backend gRPC communication error. Requeueing.",
                    extra={
                        "component": "rabbitmq.worker",
                        "step": "consume.requeue",
                        "jobId": message.job_id if message else None,
                        "jobType": message.type if message else None,
                        "error": str(error),
                    },
                )
                try:
                    channel.basic_nack(delivery_tag=_method.delivery_tag, requeue=True)
                except Exception:
                    logger.exception(
                        "RabbitMQ requeue nack failed",
                        extra={
                            "component": "rabbitmq.worker",
                            "step": "consume.requeue_failed",
                            "jobId": message.job_id if message else None,
                        },
                    )
                    raise
                return
            except Exception:
                logger.exception(
                    "RabbitMQ message failed, but status was recorded. Acknowledging message.",
                    extra={
                        "component": "rabbitmq.worker",
                        "step": "consume.ack_on_failure",
                        "jobId": message.job_id if message else None,
                        "jobType": message.type if message else None,
                        "materialId": message.resource_id if message else None,
                    },
                )
                try:
                    channel.basic_ack(delivery_tag=_method.delivery_tag)
                except Exception:
                    logger.exception(
                        "RabbitMQ ack on failure failed",
                        extra={
                            "component": "rabbitmq.worker",
                            "step": "consume.ack_on_failure_failed",
                            "jobId": message.job_id if message else None,
                        },
                    )
                    raise
                return
            logger.info(
                "RabbitMQ message acknowledged",
                extra={
                    "component": "rabbitmq.worker",
                    "step": "consume.ack",
                    "jobId": message.job_id,
                    "jobType": message.type,
                    "materialId": message.resource_id
                    if message.type == "ai.material.ingest"
                    else None,
                },
            )
            channel.basic_ack(delivery_tag=_method.delivery_tag)

        return callback

    def _assert_topology(self) -> None:
        if self.channel is None:
            return
        exchange = self.settings.rabbitmq_exchange
        dlx = f"{exchange}.dlx"
        self.channel.exchange_declare(exchange=exchange, exchange_type="direct", durable=True)
        self.channel.exchange_declare(exchange=dlx, exchange_type="direct", durable=True)
        for queue in JOB_QUEUES.values():
            dlq = f"{queue}.dlq"
            retry_queue = f"{queue}.retry"
            self.channel.queue_declare(queue=dlq, durable=True)
            self.channel.queue_bind(queue=dlq, exchange=dlx, routing_key=dlq)
            self.channel.queue_declare(
                queue=retry_queue,
                durable=True,
                arguments={
                    "x-dead-letter-exchange": exchange,
                    "x-dead-letter-routing-key": queue,
                },
            )
            self.channel.queue_bind(queue=retry_queue, exchange=exchange, routing_key=retry_queue)
            self.channel.queue_declare(
                queue=queue,
                durable=True,
                arguments={
                    "x-dead-letter-exchange": dlx,
                    "x-dead-letter-routing-key": dlq,
                },
            )
            self.channel.queue_bind(queue=queue, exchange=exchange, routing_key=queue)

    def _request_stop(self, _signum: int, _frame: Any) -> None:
        if self._stopping:
            return
        self._stopping = True
        if self.channel and self.channel.is_open:
            self.channel.stop_consuming()
