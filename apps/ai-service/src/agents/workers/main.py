from agents.clients.be_core import BeCoreGrpcClient
from agents.runtime.factory import create_agent_runtime
from agents.workers.grading_worker import GradingWorker
from agents.workers.material_ingest_worker import MaterialIngestWorker
from agents.workers.rabbitmq import RabbitMqWorkerRunner
from agents.workers.roadmap_worker import RoadmapWorker
from agents.workers.worker import Worker
from config.settings import get_settings


def main() -> None:
    settings = get_settings()
    be_core = BeCoreGrpcClient(settings)
    worker = Worker(be_core)
    runtime = create_agent_runtime(settings)
    material_worker = MaterialIngestWorker(be_core=be_core)
    grading_worker = GradingWorker(runtime)
    roadmap_worker = RoadmapWorker(runtime)
    RabbitMqWorkerRunner(settings).run(
        {
            "ai.material.ingest": lambda message: worker.process(
                message,
                material_worker.handle,
            ),
            "ai.assessment.grade": lambda message: worker.process(
                message,
                grading_worker.handle,
            ),
            "ai.roadmap.generate": lambda message: worker.process(
                message,
                roadmap_worker.handle,
            ),
        }
    )


if __name__ == "__main__":
    main()
