export const RealtimeRooms = {
  user: (userId: string) => `user:${userId}`,
  chatSession: (sessionId: string) => `chat:session:${sessionId}`,
  class: (classId: string) => `class:${classId}`,
  exam: (examId: string) => `exam:${examId}`,
  submission: (submissionId: string) => `submission:${submissionId}`,
  aiJob: (jobId: string) => `ai:job:${jobId}`,
  aiChat: (sessionId: string) => `ai:chat:${sessionId}`,
} as const;

