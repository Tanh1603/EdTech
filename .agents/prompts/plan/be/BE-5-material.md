# BE-5 Material: Documents/Materials + Ingest Jobs

## 1. Objective
Triển khai quản lý tài liệu học tập và tracking ingest job, chưa xử lý AI RAG sâu.

## 2. Scope In / Out
### In Scope
- `GET/POST /documents`
- `PUT/DELETE /documents/{documentId}`
- `GET /jobs/{jobId}`
- Producer cho ingest/index jobs.

### Out Scope
- Embedding/vector search thực thi thật.

## 3. API Contract Mapping
- Bám schema `Document`, `PaginatedDocuments`, `JobStatus`.

## 4. Prisma/DB Changes
- Bảng: `materials`, `material_chunks`, `jobs`.
- Index theo `(course_id, status)`.

## 5. Implementation Steps
1. Tạo `DocumentsModule`.
2. Implement document CRUD metadata.
3. Khi create/update cần index, enqueue `material_ingest` job.
4. Implement `JobsModule` read-only cho `/jobs/{id}`.
5. Worker stub cập nhật trạng thái `queued/running/succeeded/failed`.

## 6. Acceptance Criteria
- CRUD tài liệu hoạt động đúng contract.
- Job tracking trả trạng thái chính xác.

## 7. Test Cases
### Unit
- DTO validation cho documents.
- Job status mapper.

### Integration
- Create document -> sinh job ingest.

### E2E
- Full flow document + polling job status.

## 8. Deliverables
- Documents + jobs tracking cho ingest.
