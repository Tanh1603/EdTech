export const ClassRole = {
  teacher: 'teacher',
  student: 'student',
} as const;

export type ClassRole = (typeof ClassRole)[keyof typeof ClassRole];

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
