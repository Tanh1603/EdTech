export const GrpcPackages = {
  academic: 'academic',
  assessments: 'assessments',
  chat: 'chat',
  learning: 'learning',
  storage: 'storage',
  users: 'users',
} as const;

export const AllGrpcPackages = [
  GrpcPackages.academic,
  GrpcPackages.assessments,
  GrpcPackages.chat,
  GrpcPackages.learning,
  GrpcPackages.storage,
  GrpcPackages.users,
] as const;

export const CoreGrpcPackages = [
  GrpcPackages.assessments,
  GrpcPackages.chat,
  GrpcPackages.learning,
  GrpcPackages.storage,
  GrpcPackages.users,
] as const;
