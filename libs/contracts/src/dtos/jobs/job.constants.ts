export const JobTypes = {
  notificationDispatch: 'notification.dispatch',
  aiMaterialIngest: 'ai.material.ingest',
  aiAssessmentGrade: 'ai.assessment.grade',
  aiRoadmapGenerate: 'ai.roadmap.generate',
  aiRecommendationRefresh: 'ai.recommendation.refresh',
  aiChatTitleGenerate: 'ai.chat.title.generate',
  aiExamGenerate: 'ai.exam.generate',
  aiMaterialSummarize: 'ai.material.summarize',
} as const;

export type JobType = (typeof JobTypes)[keyof typeof JobTypes];

export const JobStatuses = {
  queued: 'queued',
  running: 'running',
  retrying: 'retrying',
  succeeded: 'succeeded',
  failed: 'failed',
  deadLettered: 'dead_lettered',
  cancelled: 'cancelled',
} as const;

export type JobStatusValue = (typeof JobStatuses)[keyof typeof JobStatuses];

export const JobQueues = {
  notificationDispatch: 'edtech.notification.dispatch',
  aiMaterialIngest: 'edtech.ai.material.ingest',
  aiAssessmentGrade: 'edtech.ai.assessment.grade',
  aiRoadmapGenerate: 'edtech.ai.roadmap.generate',
  aiRecommendationRefresh: 'edtech.ai.recommendation.refresh',
  aiChatTitleGenerate: 'edtech.ai.chat.title.generate',
  aiExamGenerate: 'edtech.ai.exam.generate',
  aiMaterialSummarize: 'edtech.ai.material.summarize',
} as const;

export const JobTypeToQueue: Record<JobType, string> = {
  [JobTypes.notificationDispatch]: JobQueues.notificationDispatch,
  [JobTypes.aiMaterialIngest]: JobQueues.aiMaterialIngest,
  [JobTypes.aiAssessmentGrade]: JobQueues.aiAssessmentGrade,
  [JobTypes.aiRoadmapGenerate]: JobQueues.aiRoadmapGenerate,
  [JobTypes.aiRecommendationRefresh]: JobQueues.aiRecommendationRefresh,
  [JobTypes.aiChatTitleGenerate]: JobQueues.aiChatTitleGenerate,
  [JobTypes.aiExamGenerate]: JobQueues.aiExamGenerate,
  [JobTypes.aiMaterialSummarize]: JobQueues.aiMaterialSummarize,
};

