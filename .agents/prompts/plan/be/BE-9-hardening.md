# BE-9 Hardening: Quality, Security, Observability

## 1. Objective
Đóng gói backend core thành release candidate ổn định.

## 2. Scope In / Out
### In Scope
- Contract tests, e2e tests, baseline load tests.
- Security checklist (authz, validation, rate limit, sensitive log masking).
- Observability checklist (requestId, latency, error rate, audit trace).

### Out Scope
- Multi-region deployment.

## 3. API Contract Mapping
- Toàn bộ endpoint BE core phải pass contract compliance với `docs/api-contract.yml`.

## 4. Prisma/DB Changes
- Bổ sung index theo truy vấn thực tế.
- Rà soát FK/unique constraints.
- Chuẩn bị migration hardening nếu cần.

## 5. Implementation Steps
1. Viết contract test theo endpoint groups.
2. Viết e2e smoke cho từng phase BE-1..BE-8.
3. Chạy load test baseline cho chat/exam/analytics reads.
4. Rà log privacy + masking PII.
5. Tối ưu queries chậm bằng indexes.

## 6. Acceptance Criteria
- Contract test pass >= 95%.
- Không có lỗi critical security.
- P95 latency các endpoint chính trong ngưỡng mục tiêu nội bộ.

## 7. Test Cases
### Unit
- Error mapper, guards, interceptors.

### Integration
- DB constraints + transaction safety.

### E2E
- Full regression cho luồng chính.

## 8. Deliverables
- Backend core release candidate.
- Báo cáo quality gate (test, perf, security).
