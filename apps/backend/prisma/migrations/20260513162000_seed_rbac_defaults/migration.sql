-- Deployment-safe idempotent RBAC reseed. Keep in sync with
-- apps/backend/prisma/seeds/rbac.sql.

INSERT INTO "roles" ("name", "description") VALUES
  ('admin', 'System administrator'),
  ('teacher', 'Teacher'),
  ('student', 'Student')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "permissions" ("name", "description") VALUES
  ('users.manage', 'Manage users and role assignments'),
  ('roles.manage', 'Manage roles and permissions'),
  ('courses.manage', 'Create and manage courses'),
  ('classes.manage', 'Create and manage classes'),
  ('lessons.manage', 'Create and manage lessons'),
  ('enrollments.manage', 'Manage classroom enrollments'),
  ('learning.read', 'Read enrolled learning content'),
  ('chat.use', 'Use own chat sessions and messages'),
  ('exams.manage', 'Create, update, publish, and close exams'),
  ('exams.take', 'Take published exams'),
  ('submissions.manage', 'View and manage submissions for owned classes'),
  ('submissions.grade', 'Grade submissions'),
  ('results.read_own', 'Read own assessment results'),
  ('notifications.manage', 'Create broad or class-scoped notifications'),
  ('notifications.read_own', 'Read own notifications'),
  ('analytics.view', 'View analytics')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("role_name", "permission_name")
SELECT 'admin', "name" FROM "permissions"
ON CONFLICT ("role_name", "permission_name") DO NOTHING;

INSERT INTO "role_permissions" ("role_name", "permission_name") VALUES
  ('teacher', 'courses.manage'),
  ('teacher', 'classes.manage'),
  ('teacher', 'lessons.manage'),
  ('teacher', 'enrollments.manage'),
  ('teacher', 'learning.read'),
  ('teacher', 'chat.use'),
  ('teacher', 'exams.manage'),
  ('teacher', 'submissions.manage'),
  ('teacher', 'submissions.grade'),
  ('teacher', 'notifications.manage'),
  ('teacher', 'analytics.view')
ON CONFLICT ("role_name", "permission_name") DO NOTHING;

INSERT INTO "role_permissions" ("role_name", "permission_name") VALUES
  ('student', 'learning.read'),
  ('student', 'chat.use'),
  ('student', 'exams.take'),
  ('student', 'results.read_own'),
  ('student', 'notifications.read_own')
ON CONFLICT ("role_name", "permission_name") DO NOTHING;

INSERT INTO "users" ("id", "status", "created_at", "updated_at")
SELECT DISTINCT "user_id", 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT "teacher_id" AS "user_id" FROM "courses"
  UNION
  SELECT "created_by" AS "user_id" FROM "materials"
  UNION
  SELECT "created_by" AS "user_id" FROM "exams"
  UNION
  SELECT "user_id" FROM "enrollments"
  UNION
  SELECT "user_id" FROM "chat_sessions"
  UNION
  SELECT "student_id" AS "user_id" FROM "submissions"
  UNION
  SELECT "user_id" FROM "learning_roadmaps"
  UNION
  SELECT "student_id" AS "user_id" FROM "student_topic_mastery"
  UNION
  SELECT "user_id" FROM "notifications"
) AS "legacy_user_refs"
WHERE "user_id" IS NOT NULL AND "user_id" <> ''
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "user_roles" ("user_id", "role_name")
SELECT DISTINCT "user_id", 'teacher'
FROM (
  SELECT "teacher_id" AS "user_id" FROM "courses"
  UNION
  SELECT "created_by" AS "user_id" FROM "materials"
  UNION
  SELECT "created_by" AS "user_id" FROM "exams"
) AS "teacher_refs"
WHERE "user_id" IS NOT NULL AND "user_id" <> ''
ON CONFLICT ("user_id", "role_name") DO NOTHING;

INSERT INTO "user_roles" ("user_id", "role_name")
SELECT DISTINCT "user_id", 'student'
FROM (
  SELECT "user_id" FROM "enrollments"
  UNION
  SELECT "user_id" FROM "chat_sessions"
  UNION
  SELECT "student_id" AS "user_id" FROM "submissions"
  UNION
  SELECT "user_id" FROM "learning_roadmaps"
  UNION
  SELECT "student_id" AS "user_id" FROM "student_topic_mastery"
  UNION
  SELECT "user_id" FROM "notifications"
) AS "student_refs"
WHERE "user_id" IS NOT NULL AND "user_id" <> ''
ON CONFLICT ("user_id", "role_name") DO NOTHING;

INSERT INTO "user_roles" ("user_id", "role_name")
SELECT "id", 'student'
FROM "users"
WHERE NOT EXISTS (
  SELECT 1 FROM "user_roles" WHERE "user_roles"."user_id" = "users"."id"
)
ON CONFLICT ("user_id", "role_name") DO NOTHING;
