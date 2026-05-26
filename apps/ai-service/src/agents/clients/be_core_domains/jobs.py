from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext, to_struct


class JobsClientMixin:
    def create_job(
        self,
        job_type: str,
        payload: dict[str, Any] | None = None,
        context: BeCoreCallContext | None = None,
        priority: int = 0,
        max_attempts: int = 0,
        created_by: str | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.CreateJobRequest(
            type=job_type,
            payload=to_struct(payload),
            priority=priority,
            max_attempts=max_attempts,
            request_id=context.request_id if context else "",
            correlation_id=context.correlation_id if context else "",
            created_by=created_by or (context.user_id if context else "") or "",
            resource_type=resource_type or "",
            resource_id=resource_id or "",
        )
        return self._call_object(self.jobs.CreateJob, request, context, False)

    def get_job_status(
        self,
        job_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.JobIdRequest(job_id=job_id)
        return self._call_object(self.jobs.GetJobStatus, request, context, True)

    def mark_job_running(self, job_id: str) -> dict[str, Any]:
        request = self._jobs_pb2.JobIdRequest(job_id=job_id)
        return self._call_object(self.jobs.MarkJobRunning, request, None, False)

    def mark_job_succeeded(
        self,
        job_id: str,
        result: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.CompleteJobRequest(
            job_id=job_id,
            result=to_struct(result),
        )
        return self._call_object(self.jobs.MarkJobSucceeded, request, None, False)

    def mark_job_failed(
        self,
        job_id: str,
        error: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        request = self._jobs_pb2.FailJobRequest(job_id=job_id, error=to_struct(error))
        return self._call_object(self.jobs.MarkJobFailed, request, None, False)
