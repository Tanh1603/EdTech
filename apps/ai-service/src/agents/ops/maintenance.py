from __future__ import annotations

import argparse
import logging

from agents.clients.be_core import BeCoreGrpcClient
from agents.memory.factory import create_memory_key_builder, create_memory_store
from agents.rag.factory import create_vector_store
from config.logging import configure_logging
from config.settings import get_settings

logger = logging.getLogger(__name__)


def main() -> None:
    configure_logging()
    parser = argparse.ArgumentParser(description="AI service maintenance commands")
    subcommands = parser.add_subparsers(dest="command", required=True)

    delete_qdrant = subcommands.add_parser("delete-qdrant-material")
    delete_qdrant.add_argument("material_id")

    reindex = subcommands.add_parser("reindex-material")
    reindex.add_argument("material_id")

    clear_memory = subcommands.add_parser("clear-session-memory")
    clear_memory.add_argument("session_id")

    args = parser.parse_args()
    settings = get_settings()

    if args.command == "delete-qdrant-material":
        create_vector_store(settings).delete_material(args.material_id)
        logger.info(
            "Deleted Qdrant material points",
            extra={
                "component": "ai.ops",
                "step": "qdrant.delete_material",
                "materialId": args.material_id,
            },
        )
        return

    if args.command == "reindex-material":
        client = BeCoreGrpcClient(settings)
        try:
            job = client.create_job(
                "ai.material.ingest",
                payload={"materialId": args.material_id},
                resource_type="material",
                resource_id=args.material_id,
            )
            logger.info(
                "Queued material reindex job",
                extra={
                    "component": "ai.ops",
                    "step": "material.reindex.queued",
                    "materialId": args.material_id,
                    "jobId": str(job.get("id") or job.get("jobId") or ""),
                },
            )
        finally:
            client.close()
        return

    if args.command == "clear-session-memory":
        memory = create_memory_store(settings)
        keys = create_memory_key_builder(settings)
        memory.delete(keys.session_scratchpad(args.session_id))
        memory.delete(keys.session_interactive(args.session_id))
        memory.delete(keys.session_token_budget(args.session_id))
        logger.info(
            "Cleared AI session memory",
            extra={
                "component": "ai.ops",
                "step": "memory.session.clear",
                "sessionId": args.session_id,
            },
        )


if __name__ == "__main__":
    main()
