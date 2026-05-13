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
  coursesManage: 'courses.manage',
  classesManage: 'classes.manage',
  enrollmentsManage: 'enrollments.manage',
  examsManage: 'exams.manage',
  submissionsGrade: 'submissions.grade',
  notificationsManage: 'notifications.manage',
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
