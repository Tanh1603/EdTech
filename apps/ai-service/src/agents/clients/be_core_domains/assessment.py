from __future__ import annotations

from typing import Any

from agents.clients.be_core_common import BeCoreCallContext, to_struct


class AssessmentClientMixin:
    def get_submission_detail(
        self,
        submission_id: str,
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._submissions_pb2.SubmissionIdRequest(submission_id=submission_id)
        return self._call_object(
            self.assessment_submissions.GetSubmissionDetail,
            request,
            context,
            True,
        )

    def manual_grade_submission(
        self,
        submission_id: str,
        body: dict[str, Any],
        context: BeCoreCallContext,
    ) -> dict[str, Any]:
        request = self._results_pb2.ManualGradeRequest(
            submission_id=submission_id,
            body=to_struct(body),
        )
        return self._call_object(self.assessment_results.ManualGrade, request, context, True)
