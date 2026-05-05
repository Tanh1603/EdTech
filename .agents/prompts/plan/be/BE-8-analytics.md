# BE-8 Analytics + Notification

## 1. Objective
Triển khai analytics dashboard và notification dispatch async cho backend core.

## 2. Scope In / Out
### In Scope
- `GET /analytics/student`
- `GET /analytics/class/{classId}`
- `POST /analytics/export`
- `GET/POST /notifications`
- `GET /admin/metrics`
- `GET /admin/agents/monitor`
- `GET /admin/logs`

### Out Scope
- ML analytics nâng cao.

## 3. API Contract Mapping
- Bám schema `AnalyticsReport`, `Notification`, `JobStatus`, `SystemMetrics`, `AgentMonitorReport`, `LogEntry`.

## 4. Prisma/DB Changes
- Bảng: `analytics_snapshots`, `student_topic_mastery`, `class_topic_metrics`, `notifications`, `notification_recipients`, `jobs`, `audit_logs`.

## 5. Implementation Steps
1. Tạo `AnalyticsModule`, `NotificationsModule`, `AdminOpsModule`.
2. Implement read APIs cho dashboard.
3. Implement export analytics -> enqueue job.
4. Implement create/list notifications và dispatch job.
5. Implement admin metrics/logs query cơ bản.

## 6. Acceptance Criteria
- Dashboard student/class có dữ liệu đúng schema.
- Export và notification trả jobId và theo dõi được.
- Admin đọc metrics/logs thành công.

## 7. Test Cases
### Unit
- Metrics aggregation mapper.
- Notification payload validation.

### Integration
- Export/notification sinh jobs.

### E2E
- Full flow analytics export + notification dispatch.

## 8. Deliverables
- Analytics + Notification core features.
