You are a senior software architect and system designer.

I will provide a list of User Stories for an AI-powered EdTech system.

Your task is to transform these user stories into COMPLETE system workflows and diagrams.

---

# 🎯 OBJECTIVE

From the User Stories, you MUST:

1. Identify ALL core business flows
2. Group related User Stories into flows
3. Design detailed interactions between:

   * User
   * Backend
   * AI Service
   * Agents
   * Database

---

# 📌 REQUIRED OUTPUT

## 1. Flow Identification

* Group User Stories into logical flows:

  * Authentication Flow
  * Learning / Tutor Flow
  * AI Chat Flow
  * Assessment Flow (Exam Lifecycle)
  * Adaptive Learning Flow
  * Analytics Flow
  * Notification Flow

👉 For each flow:

* List related User Story IDs

---

## 2. High-Level Flow (Business Flow)

For each flow:

* Provide step-by-step description (human readable)
* Show clear roles:

  * Student / Teacher / Admin / System

---

## 3. Sequence Diagram (PlantUML)

For EACH flow, generate a FULL sequence diagram using PlantUML.

Requirements:

* MUST include:

  * UI
  * API Gateway
  * Backend (Monolith)
  * AI Service
  * Agents (Orchestrator, Tutor, Assessment, Analytics...)
  * Database
* Use clear naming
* Use valid PlantUML syntax:
  @startuml FlowName
  ...
  @enduml

---

## 4. AI Orchestration Logic

* Explain how Orchestrator Agent:

  * Detects intent
  * Routes to correct agent
* Show decision logic (if/else or intent classification)

---

## 5. Data Flow Explanation

* For each flow:

  * What data is read/write
  * Where it is stored:

    * PostgreSQL
    * Vector DB
    * Cache

---

# ❗ IMPORTANT RULES

* DO NOT skip any major flow
* DO NOT give generic explanation
* MUST map everything back to User Stories
* MUST produce PlantUML for each flow
* Keep explanation concise but technical

---

# 📥 USER STORIES

US-001	Epic 1	Học sinh	Là học sinh, tôi muốn đăng ký tài khoản bằng email để sử dụng hệ thống	Cao	Tài khoản được tạo, email xác thực gửi thành công	
US-002	Epic 1	Học sinh	Là học sinh, tôi muốn đăng nhập bằng Google/email để truy cập nhanh	Cao	Đăng nhập thành công, redirect đến dashboard	
US-003	Epic 1	Học sinh	Là học sinh, tôi muốn làm bài kiểm tra đầu vào để hệ thống đánh giá trình độ	Cao	Hệ thống phân loại học sinh vào đúng level	
US-004	Epic 1	Giáo viên	Là giáo viên, tôi muốn tạo lớp học và mời học sinh tham gia	Cao	Lớp được tạo, học sinh nhận link mời	
US-005	Epic 1	Admin	Là admin, tôi muốn quản lý toàn bộ tài khoản người dùng	Cao	CRUD user, phân quyền thành công	
US-006	Epic 2	Học sinh	Là học sinh, tôi muốn chat với AI và hệ thống tự hiểu tôi cần học hay cần thi để điều hướng đúng agent	Cao	Orchestrator phân loại đúng intent ≥ 90%	
US-007	Epic 2	Hệ thống	Là hệ thống, tôi muốn Orchestrator phân tích intent và gọi đúng agent xử lý	Cao	Intent được classify và route đúng agent	
US-008	Epic 2	Hệ thống	Là hệ thống, tôi muốn các agent giao tiếp với nhau qua Orchestrator	Cao	Agent A có thể trigger Agent B	
US-009	Epic 2	Học sinh	Là học sinh, tôi muốn hội thoại liên tục không bị mất context	Cao	Context được giữ xuyên suốt session	
US-010	Epic 2	Hệ thống	Là hệ thống, tôi muốn log toàn bộ quá trình agent xử lý	Trung bình	Log đầy đủ: intent, agent, response time	
US-011	Epic 3	Học sinh	Là học sinh, tôi muốn hỏi AI và nhận giải thích từng bước	Cao	Có giải thích + ví dụ, không chỉ đáp án	
US-012	Epic 3	Học sinh	Là học sinh, tôi muốn AI hỏi ngược lại để kiểm tra hiểu bài	Cao	AI đặt câu hỏi kiểm tra	
US-013	Epic 3	Học sinh	Là học sinh, tôi muốn AI phát hiện tôi hiểu sai	Cao	AI phát hiện misconception và sửa	
US-014	Epic 3	Học sinh	Là học sinh, tôi muốn xem lịch sử chat	Trung bình	Hiển thị đầy đủ chat history	
US-015	Epic 3	Học sinh	Là học sinh, tôi muốn chọn ngôn ngữ	Trung bình	AI trả lời đúng ngôn ngữ	
US-016	Epic 3	Học sinh	Là học sinh, tôi muốn upload ảnh bài toán	Trung bình	AI nhận diện và giải đúng	
US-017	Epic 3	Học sinh	Là học sinh, tôi muốn AI tạo lộ trình học cá nhân hóa	Cao	Có roadmap + timeline	
US-018	Epic 3	Học sinh	Là học sinh, tôi muốn lộ trình tự cập nhật	Cao	Update sau mỗi lần đánh giá	
US-019	Epic 3	Học sinh	Là học sinh, tôi muốn gợi ý bài học tiếp theo	Cao	Gợi ý đúng theo tiến độ	
US-020	Epic 3	Học sinh	Là học sinh, tôi muốn xem tiến độ	Trung bình	Hiển thị % hoàn thành	
US-021	Epic 3	Học sinh	Là học sinh, tôi muốn được nhắc khi tụt tiến độ	Trung bình	Notify khi chậm >2 ngày	
US-022	Epic 3	Giáo viên	Là giáo viên, tôi muốn upload tài liệu để AI học	Cao	AI trả lời đúng theo tài liệu	
US-023	Epic 3	Học sinh	Là học sinh, tôi muốn AI trích dẫn nguồn	Trung bình	Có citation rõ ràng	
US-024	Epic 3	Giáo viên	Là giáo viên, tôi muốn quản lý tài liệu	Trung bình	CRUD tài liệu hoạt động	
US-025	Epic 4	Giáo viên	Là giáo viên, tôi muốn AI sinh đề thi	Cao	Đề đúng chuẩn	
US-026	Epic 4	Giáo viên	Là giáo viên, tôi muốn chỉnh sửa đề	Cao	Edit + publish được	
US-027	Epic 4	Giáo viên	Là giáo viên, tôi muốn đề cá nhân hóa	Cao	Mỗi học sinh đề khác nhau	
US-028	Epic 4	Giáo viên	Là giáo viên, tôi muốn chọn loại câu hỏi	Trung bình	Đúng format	
US-029	Epic 4	Hệ thống	AI phải phân bổ độ khó	Cao	Đúng 20-60-20	
US-030	Epic 4	Học sinh	Là học sinh, tôi muốn làm bài online	Cao	Có timer	
US-031	Epic 4	Học sinh	Là học sinh, tôi muốn nhận kết quả ngay	Cao	< 5 giây	
US-032	Epic 4	Hệ thống	AI chấm tự luận	Cao	≥ 85% accuracy	
US-033	Epic 4	Học sinh	Là học sinh, tôi muốn biết sai ở đâu	Cao	Có giải thích	
US-034	Epic 4	Giáo viên	Là giáo viên, tôi muốn xem kết quả	Cao	Dashboard đầy đủ	
US-035	Epic 4	Giáo viên	Là giáo viên, tôi muốn sửa điểm	Trung bình	Override được	
US-036	Epic 4	Giáo viên	Phát hiện copy bài	Cao	Similarity ≥ 80%	
US-037	Epic 4	Hệ thống	Detect hành vi bất thường	Trung bình	Log + cảnh báo	
US-038	Epic 5	Học sinh	Xem dashboard cá nhân	Cao	Hiển thị đúng dữ liệu	
US-039	Epic 5	Học sinh	Xem điểm yếu	Cao	Top 3 điểm yếu	
US-040	Epic 5	Học sinh	Xem tiến bộ	Trung bình	Biểu đồ	
US-041	Epic 5	Học sinh	So sánh với lớp	Thấp	Ranking ẩn danh	
US-042	Epic 5	Giáo viên	Xem tổng quan lớp	Cao	Dashboard lớp	
US-043	Epic 5	Giáo viên	Detect học sinh yếu	Cao	Cảnh báo	
US-044	Epic 5	Giáo viên	Xem câu hỏi sai nhiều	Cao	Thống kê	
US-045	Epic 5	Giáo viên	Gợi ý nội dung cần dạy lại	Cao	AI đề xuất	
US-046	Epic 5	Giáo viên	Export báo cáo	Trung bình	PDF/Excel	
US-047	Epic 5	Admin	Xem thống kê hệ thống	Cao	Real-time	
US-048	Epic 5	Admin	Monitor AI agent	Trung bình	Response time	
US-049	Epic 5	Admin	Xem log hệ thống	Trung bình	Searchable	
US-050	Epic 6	Học sinh	Nhận nhắc học	Trung bình	Đúng giờ	
US-051	Epic 6	Học sinh	Nhận thông báo thi	Cao	< 1 phút	
US-052	Epic 6	Giáo viên	Gửi thông báo	Cao	Gửi đúng user	

---
Also optimize flows for real-world scalability and clearly separate synchronous vs asynchronous processing using queues.

Generate ALL flows now.
