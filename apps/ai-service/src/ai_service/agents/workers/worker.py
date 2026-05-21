from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from ai_service.agents.clients.be_core import FakeBeCoreClient


@dataclass(frozen=True)
class JobMessage:
    job_id: str
    type: str
    resource_id: str
    payload: dict[str, Any]
    attempts: int = 1


JobHandler = Callable[[JobMessage], dict[str, Any]]


class Worker:
    def __init__(self, be_core: FakeBeCoreClient) -> None:
        self.be_core = be_core

    def process(self, message: JobMessage, handler: JobHandler) -> dict[str, Any]:
        self.be_core.update_job_status(message.job_id, "running")
        try:
            result = handler(message)
        except Exception as error:
            self.be_core.update_job_status(message.job_id, "failed", {"message": str(error)})
            raise
        self.be_core.update_job_status(message.job_id, "succeeded", result)
        return result
