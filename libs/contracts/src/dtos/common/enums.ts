export const ClassRole = {
  teacher: 'teacher',
  student: 'student',
} as const;

export type ClassRole = (typeof ClassRole)[keyof typeof ClassRole];

export const UserRole = {
  admin: 'admin',
  teacher: 'teacher',
  student: 'student',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RolePermissions = {
  usersManage: 'users.manage',
  rolesManage: 'roles.manage',
  coursesManage: 'courses.manage',
  classesManage: 'classes.manage',
  lessonsManage: 'lessons.manage',
  enrollmentsManage: 'enrollments.manage',
  learningRead: 'learning.read',
  chatUse: 'chat.use',
  examsManage: 'exams.manage',
  examsTake: 'exams.take',
  submissionsManage: 'submissions.manage',
  submissionsGrade: 'submissions.grade',
  resultsReadOwn: 'results.read_own',
  notificationsManage: 'notifications.manage',
  notificationsReadOwn: 'notifications.read_own',
  analyticsView: 'analytics.view',
} as const;

export type RolePermission =
  (typeof RolePermissions)[keyof typeof RolePermissions];

export const MaterialStatus = {
  uploaded: 'uploaded',
  indexing: 'indexing',
  ready: 'ready',
  failed: 'failed',
} as const;

export type MaterialStatus = (typeof MaterialStatus)[keyof typeof MaterialStatus];

export const RoadmapStatus = {
  active: 'active',
  completed: 'completed',
  paused: 'paused',
} as const;

export type RoadmapStatus = (typeof RoadmapStatus)[keyof typeof RoadmapStatus];
