from typing import Any

from agents.clients.be_core import BeCoreGrpcClient
from agents.runtime.factory import create_agent_runtime
from agents.workers.grading_worker import GradingWorker
from agents.workers.material_ingest_worker import MaterialIngestWorker
from agents.workers.rabbitmq import RabbitMqWorkerRunner
from agents.workers.roadmap_worker import RoadmapWorker
from agents.workers.worker import Worker
from config.logging import configure_logging
from config.settings import get_settings


def main() -> None:
    configure_logging()
    settings = get_settings()
    settings.validate_runtime("worker")
    be_core = BeCoreGrpcClient(settings)
    worker = Worker(be_core)
    material_worker = MaterialIngestWorker(be_core=be_core)
    runtime_factory = _LazyRuntimeFactory(settings)
    RabbitMqWorkerRunner(settings).run(
        {
            "ai.material.ingest": lambda message: worker.process(
                message,
                material_worker.handle,
            ),
            "ai.assessment.grade": lambda message: worker.process(
                message,
                GradingWorker(runtime_factory()).handle,
            ),
            "ai.roadmap.generate": lambda message: worker.process(
                message,
                RoadmapWorker(runtime_factory()).handle,
            ),
        }
    )


class _LazyRuntimeFactory:
    def __init__(self, settings: Any) -> None:
        self.settings = settings
        self._runtime: Any | None = None

    def __call__(self) -> Any:
        if self._runtime is None:
            self._runtime = create_agent_runtime(self.settings)
        return self._runtime


if __name__ == "__main__":
    main()
