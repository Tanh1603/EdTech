export const GrpcPackages = {
  academic: 'academic',
  assessments: 'assessments',
  chat: 'chat',
  learning: 'learning',
  storage: 'storage',
  users: 'users',
  jobs: 'jobs',
  notifications: 'notifications',
} as const;

export const AllGrpcPackages = [
  GrpcPackages.academic,
  GrpcPackages.assessments,
  GrpcPackages.chat,
  GrpcPackages.learning,
  GrpcPackages.storage,
  GrpcPackages.users,
  GrpcPackages.jobs,
  GrpcPackages.notifications,
] as const;
