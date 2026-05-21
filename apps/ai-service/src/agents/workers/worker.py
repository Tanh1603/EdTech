from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from agents.clients.be_core import BeCoreGrpcClient


@dataclass(frozen=True)
class JobMessage:
    job_id: str
    type: str
    resource_id: str
    payload: dict[str, Any]
    attempts: int = 1


JobHandler = Callable[[JobMessage], dict[str, Any]]


class Worker:
    def __init__(self, be_core: BeCoreGrpcClient) -> None:
        self.be_core = be_core

    def process(self, message: JobMessage, handler: JobHandler) -> dict[str, Any]:
        self.be_core.mark_job_running(message.job_id)
        try:
            result = handler(message)
        except Exception as error:
            self.be_core.mark_job_failed(message.job_id, {"message": str(error)})
            raise
        self.be_core.mark_job_succeeded(message.job_id, result)
        return result
