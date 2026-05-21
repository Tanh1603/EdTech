from collections.abc import Iterable
from dataclasses import dataclass

MetadataItems = Iterable[tuple[str, str | bytes]]


@dataclass(frozen=True)
class RequestMetadata:
    authorization: str | None = None
    service_token: str | None = None
    request_id: str | None = None
    correlation_id: str | None = None
    user_id: str | None = None
    roles: tuple[str, ...] = ()
    permissions: tuple[str, ...] = ()
    class_id: str | None = None
    ai_job_id: str | None = None


def parse_metadata(items: MetadataItems | None) -> RequestMetadata:
    normalized = {
        key.lower(): value.decode("utf-8") if isinstance(value, bytes) else value
        for key, value in items or []
    }
    return RequestMetadata(
        authorization=normalized.get("authorization"),
        service_token=normalized.get("x-service-token"),
        request_id=normalized.get("x-request-id"),
        correlation_id=normalized.get("x-correlation-id"),
        user_id=normalized.get("x-user-id"),
        roles=parse_csv_metadata(normalized.get("x-user-roles")),
        permissions=parse_csv_metadata(normalized.get("x-user-permissions")),
        class_id=normalized.get("x-class-id"),
        ai_job_id=normalized.get("x-ai-job-id"),
    )


def parse_csv_metadata(value: str | None) -> tuple[str, ...]:
    if not value:
        return ()
    return tuple(item.strip() for item in value.split(",") if item.strip())
