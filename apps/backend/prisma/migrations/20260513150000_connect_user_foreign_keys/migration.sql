-- Backfill minimal user rows for legacy records before enforcing foreign keys.
INSERT INTO "users" ("id", "status", "created_at", "updated_at")
SELECT DISTINCT "user_id", 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT "teacher_id" AS "user_id" FROM "courses"
  UNION
  SELECT "user_id" FROM "enrollments"
  UNION
  SELECT "created_by" AS "user_id" FROM "materials"
  UNION
  SELECT "user_id" FROM "chat_sessions"
  UNION
  SELECT "created_by" AS "user_id" FROM "exams"
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

-- Infer coarse default roles for backfilled users. Admin-managed role changes
-- still happen through the users service after sync.
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

-- User FK lookup indexes. Composite/unique indexes already cover some leading
-- columns, so only add direct indexes needed for reverse user lookups.
CREATE INDEX IF NOT EXISTS "courses_teacher_id_idx" ON "courses"("teacher_id");
CREATE INDEX IF NOT EXISTS "enrollments_user_id_idx" ON "enrollments"("user_id");
CREATE INDEX IF NOT EXISTS "materials_created_by_idx" ON "materials"("created_by");
CREATE INDEX IF NOT EXISTS "chat_sessions_user_id_idx" ON "chat_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "exams_created_by_idx" ON "exams"("created_by");
CREATE INDEX IF NOT EXISTS "submissions_student_id_idx" ON "submissions"("student_id");
CREATE INDEX IF NOT EXISTS "learning_roadmaps_user_id_idx" ON "learning_roadmaps"("user_id");
CREATE INDEX IF NOT EXISTS "student_topic_mastery_student_id_idx" ON "student_topic_mastery"("student_id");

ALTER TABLE "courses"
  ADD CONSTRAINT "courses_teacher_id_fkey"
  FOREIGN KEY ("teacher_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enrollments"
  ADD CONSTRAINT "enrollments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "materials"
  ADD CONSTRAINT "materials_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_sessions"
  ADD CONSTRAINT "chat_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "exams"
  ADD CONSTRAINT "exams_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "submissions"
  ADD CONSTRAINT "submissions_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "learning_roadmaps"
  ADD CONSTRAINT "learning_roadmaps_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_topic_mastery"
  ADD CONSTRAINT "student_topic_mastery_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
