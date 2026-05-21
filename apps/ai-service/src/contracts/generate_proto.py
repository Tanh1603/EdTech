from importlib.resources import files
from pathlib import Path

PROTO_RELATIVE_PATHS = [
    "common/pagination.proto",
    "common/envelope.proto",
    "common/json.proto",
    "academic/courses.proto",
    "academic/classrooms.proto",
    "academic/lessons.proto",
    "academic/enrollments.proto",
    "assessments/exams.proto",
    "assessments/questions.proto",
    "assessments/submissions.proto",
    "assessments/results.proto",
    "assessments/analytics.proto",
    "chat/sessions.proto",
    "chat/messages.proto",
    "chat/analytics.proto",
    "learning/materials.proto",
    "learning/roadmaps.proto",
    "learning/mastery.proto",
    "storage/storage.proto",
    "users/users.proto",
    "jobs/jobs.proto",
    "notifications/notifications.proto",
    "ai/orchestrator.proto",
    "ai/jobs.proto",
    "ai/rag.proto",
]


def find_workspace_root(start: Path) -> Path:
    current = start.resolve()
    for candidate in [current, *current.parents]:
        if (candidate / "libs" / "contracts" / "proto").exists():
            return candidate
    raise RuntimeError("Could not locate workspace root with libs/contracts/proto")


def generate() -> None:
    from grpc_tools import protoc

    app_root = Path(__file__).resolve().parents[3]
    workspace_root = find_workspace_root(app_root)
    proto_root = workspace_root / "libs" / "contracts" / "proto"
    well_known_proto_root = files("grpc_tools") / "_proto"
    output_dir = app_root / "src" / "ai_service" / "contracts" / "generated"
    output_dir.mkdir(parents=True, exist_ok=True)

    proto_files = [proto_root / relative_path for relative_path in PROTO_RELATIVE_PATHS]

    args = [
        "grpc_tools.protoc",
        f"-I{proto_root}",
        f"-I{well_known_proto_root}",
        f"--python_out={output_dir}",
        f"--grpc_python_out={output_dir}",
        *[str(path) for path in proto_files],
    ]
    result = protoc.main(args)
    if result != 0:
        raise SystemExit(result)


if __name__ == "__main__":
    generate()
