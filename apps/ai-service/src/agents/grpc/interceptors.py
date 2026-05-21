from collections.abc import Callable
from typing import Any

from grpc.errors import AiServiceError, grpc_status_for


def abort_for_error(context: Any, error: AiServiceError) -> None:
    context.abort(grpc_status_for(error.code), error.message)


def handle_service_errors(handler: Callable[..., Any]) -> Callable[..., Any]:
    def wrapped(request: Any, context: Any) -> Any:
        try:
            return handler(request, context)
        except AiServiceError as error:
            abort_for_error(context, error)

    return wrapped
