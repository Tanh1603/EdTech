-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "permissions" (
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_name" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_name")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_name" TEXT NOT NULL,
    "permission_name" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_name","permission_name")
);

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "roles"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_name_fkey" FOREIGN KEY ("role_name") REFERENCES "roles"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_name_fkey" FOREIGN KEY ("permission_name") REFERENCES "permissions"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default roles.
INSERT INTO "roles" ("name", "description") VALUES
  ('admin', 'System administrator'),
  ('teacher', 'Teacher'),
  ('student', 'Student')
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";

-- Seed default permissions.
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

-- Seed role-permission mappings.
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
