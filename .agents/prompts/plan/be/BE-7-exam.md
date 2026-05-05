# BE-7 Exam: Assessment Lifecycle v1

## 1. Objective
Triển khai vòng đời thi online cơ bản và cơ chế chấm điểm sync/async.

## 2. Scope In / Out
### In Scope
- `POST /exams/generate`
- `PUT /exams/{examId}`
- `POST /exams/{examId}/publish`
- `POST /exams/{examId}/attempts`
- `POST /attempts/{attemptId}/submit`
- `GET /results`
- `POST /results/{resultId}/override`
- Objective grading sync, essay grading async job.

### Out Scope
- Proctoring nâng cao realtime.

## 3. API Contract Mapping
- Bám schema `Exam`, `Submission`, `Result`, `JobAcceptedResponse`.

## 4. Prisma/DB Changes
- Bảng: `exams`, `exam_versions`, `questions`, `exam_questions`, `personalized_exam_sets`, `submissions`, `submission_answers`, `results`, `result_overrides`, `jobs`.

## 5. Implementation Steps
1. Tạo `AssessmentModule`.
2. Implement exam generation/edit/publish base.
3. Implement attempt start + timer fields.
4. Implement submit: objective score tính ngay.
5. Enqueue essay grading job.
6. Implement result query + override by teacher/admin.

## 6. Acceptance Criteria
- Student làm bài và có điểm objective tức thì.
- Essay grading có job để polling.
- Teacher override score được lưu audit.

## 7. Test Cases
### Unit
- Objective scoring engine.
- Result override validation.

### Integration
- Submit attempt sinh job essay grading.

### E2E
- End-to-end exam lifecycle.

## 8. Deliverables
- Assessment v1 chạy đầy đủ theo contract.
