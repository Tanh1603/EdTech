# Phase 3: Assessment Module

## Goal

Implement tests for exam lifecycle, questions, submissions, answers, results, manual grading, and analytics.

## Public Contract Source

- `docs/api-contract/gateway.md`
- `docs/api-contract/assessment.md`
- `docs/flow/assessment.puml`

## Implementation Order

1. Exam CRUD.
2. Exam publish/close state machine.
3. Question CRUD and reorder.
4. Student start/autosave/submit.
5. Results and manual grading.
6. Exam/question/student analytics.
7. Full exam lifecycle E2E.

## API Gateway E2E Files

```txt
apps/api-gateway-e2e/src/assessments/exams.e2e-spec.ts
apps/api-gateway-e2e/src/assessments/questions.e2e-spec.ts
apps/api-gateway-e2e/src/assessments/submissions.e2e-spec.ts
apps/api-gateway-e2e/src/assessments/results.e2e-spec.ts
apps/api-gateway-e2e/src/assessments/analytics.e2e-spec.ts
apps/api-gateway-e2e/src/flows/exam-lifecycle.e2e-spec.ts
```

## Gateway Unit/Integration Files

```txt
apps/api-gateway/src/modules/assessments/*.spec.ts
apps/api-gateway/src/modules/assessments/*.integration.spec.ts
```

## Backend Whitebox Files

```txt
apps/backend/src/modules/assessments/exams/*.spec.ts
apps/backend/src/modules/assessments/questions/*.spec.ts
apps/backend/src/modules/assessments/submissions/*.spec.ts
apps/backend/src/modules/assessments/results/*.spec.ts
apps/backend/src/modules/assessments/analytics/*.spec.ts
```

## Blackbox Cases

| Area | Cases |
| --- | --- |
| Exams | create draft, list by class/status/search, detail, update, delete |
| Lifecycle | publish draft, close published, reject publish closed/deleted exam |
| Questions | add, list, detail, update, delete |
| Reorder | reorder multiple questions, reject duplicate `orderNo`, reject unknown question |
| Start attempt | student starts published exam, rejects draft/closed exam |
| Autosave answers | patch answers, retrieve submission with latest answers |
| Submit | submit in-progress submission, reject duplicate submit |
| Results | student views own result, teacher views class result |
| Manual grade | teacher sets score/feedback, rejects student |
| Analytics | exam summary, question analytics, student analytics |

## Whitebox Cases

| Service rule | Cases |
| --- | --- |
| Exam state machine | draft -> published -> closed; invalid transitions reject |
| Question validation | enum type, prompt non-empty, points positive, answer key matches options |
| Reorder transaction | all question orders update atomically |
| Submission uniqueness | one active submission per `(examId, studentId)` |
| Autosave policy | clarify and test merge or replace behavior |
| Submit policy | cannot modify submitted/graded answers unless explicitly allowed |
| Score bounds | manual score must be `0..maxExamScore` |
| Analytics | handles no submissions, partial graded submissions, all graded submissions |

## E2E Flow

1. Teacher creates class-linked exam.
2. Teacher adds three questions.
3. Teacher reorders questions.
4. Teacher publishes exam.
5. Student starts exam.
6. Student autosaves answers.
7. Student submits exam.
8. Teacher manually grades.
9. Student views result.
10. Teacher views exam analytics.

## Done Criteria

- Exam lifecycle and invalid transitions are covered.
- Student attempt flow is fully tested through Gateway.
- Manual grading and analytics have deterministic tests.

