from __future__ import annotations

import json
import signal
from collections.abc import Callable
from typing import Any

import pika

from agents.workers.worker import JobMessage
from config.settings import Settings, get_settings

JobHandler = Callable[[JobMessage], dict[str, Any]]

JOB_QUEUES = {
    "ai.material.ingest": "edtech.ai.material.ingest",
    "ai.assessment.grade": "edtech.ai.assessment.grade",
    "ai.roadmap.generate": "edtech.ai.roadmap.generate",
}


class RabbitMqWorkerRunner:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.connection: pika.BlockingConnection | None = None
        self.channel: pika.channel.Channel | None = None
        self._stopping = False

    def run(self, handlers: dict[str, JobHandler]) -> None:
        parameters = pika.URLParameters(self.settings.rabbitmq_url)
        self.connection = pika.BlockingConnection(parameters)
        self.channel = self.connection.channel()
        self.channel.basic_qos(prefetch_count=self.settings.rabbitmq_prefetch)
        self._assert_topology()
        for job_type, handler in handlers.items():
            queue = JOB_QUEUES[job_type]
            self.channel.basic_consume(
                queue=queue,
                on_message_callback=self._consume(handler),
            )
        signal.signal(signal.SIGINT, self._request_stop)
        signal.signal(signal.SIGTERM, self._request_stop)
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
            try:
                payload = json.loads(body.decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("RabbitMQ job payload must be a JSON object")
                handler(JobMessage.from_payload(payload))
            except Exception:
                channel.basic_nack(delivery_tag=_method.delivery_tag, requeue=False)
                return
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
