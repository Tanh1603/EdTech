"""Generated protobuf modules emitted from libs/contracts/proto.

Do not edit generated files here. Change the source proto files under
libs/contracts/proto and rerun `nx run ai-service:proto:generate`.
"""

from pathlib import Path
import sys

GENERATED_PROTO_ROOT = Path(__file__).resolve().parent


def ensure_generated_proto_path() -> None:
    path = str(GENERATED_PROTO_ROOT)
    if path not in sys.path:
        sys.path.insert(0, path)


ensure_generated_proto_path()
