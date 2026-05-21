from enum import StrEnum


class AiErrorCode(StrEnum):
    INVALID_ARGUMENT = "INVALID_ARGUMENT"
    UNAUTHENTICATED = "UNAUTHENTICATED"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    NOT_FOUND = "NOT_FOUND"
    DEADLINE_EXCEEDED = "DEADLINE_EXCEEDED"
    UNAVAILABLE = "UNAVAILABLE"
    INTERNAL = "INTERNAL"


class AiServiceError(Exception):
    def __init__(self, code: AiErrorCode, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def grpc_status_for(code: AiErrorCode):
    import grpc

    mapping = {
        AiErrorCode.INVALID_ARGUMENT: grpc.StatusCode.INVALID_ARGUMENT,
        AiErrorCode.UNAUTHENTICATED: grpc.StatusCode.UNAUTHENTICATED,
        AiErrorCode.PERMISSION_DENIED: grpc.StatusCode.PERMISSION_DENIED,
        AiErrorCode.NOT_FOUND: grpc.StatusCode.NOT_FOUND,
        AiErrorCode.DEADLINE_EXCEEDED: grpc.StatusCode.DEADLINE_EXCEEDED,
        AiErrorCode.UNAVAILABLE: grpc.StatusCode.UNAVAILABLE,
        AiErrorCode.INTERNAL: grpc.StatusCode.INTERNAL,
    }
    return mapping[code]
