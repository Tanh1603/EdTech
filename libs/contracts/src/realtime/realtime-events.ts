export const ChatRealtimeEvents = {
  sessionCreated: 'chat.session.created',
  sessionUpdated: 'chat.session.updated',
  sessionDeleted: 'chat.session.deleted',
  messageCreated: 'chat.message.created',
  messageDeleted: 'chat.message.deleted',
} as const;

export const AssessmentRealtimeEvents = {
  examCreated: 'exam.created',
  examUpdated: 'exam.updated',
  examDeleted: 'exam.deleted',
  examPublished: 'exam.published',
  examClosed: 'exam.closed',
  questionCreated: 'question.created',
  questionUpdated: 'question.updated',
  questionDeleted: 'question.deleted',
  questionReordered: 'question.reordered',
  submissionStarted: 'submission.started',
  submissionAnswersAutosaved: 'submission.answers.autosaved',
  submissionSubmitted: 'submission.submitted',
  resultGraded: 'result.graded',
} as const;

export const NotificationRealtimeEvents = {
  heartbeat: 'heartbeat',
  notificationCreated: 'notification.created',
  notificationRead: 'notification.read',
  notificationReadAll: 'notification.read_all',
  unreadCountUpdated: 'notification.unread_count.updated',
} as const;

export const AiRealtimeEvents = {
  chatStarted: 'ai.chat.started',
  chatToken: 'ai.chat.token',
  chatCompleted: 'ai.chat.completed',
  chatFailed: 'ai.chat.failed',
  materialIngestStarted: 'ai.material.ingest.started',
  materialIngestProgress: 'ai.material.ingest.progress',
  materialIngestCompleted: 'ai.material.ingest.completed',
  materialIngestFailed: 'ai.material.ingest.failed',
  assessmentGradingStarted: 'ai.assessment.grading.started',
  assessmentGradingCompleted: 'ai.assessment.grading.completed',
  assessmentGradingFailed: 'ai.assessment.grading.failed',
} as const;

export type ChatRealtimeEventName =
  (typeof ChatRealtimeEvents)[keyof typeof ChatRealtimeEvents];

export type AssessmentRealtimeEventName =
  (typeof AssessmentRealtimeEvents)[keyof typeof AssessmentRealtimeEvents];

export type NotificationRealtimeEventName =
  (typeof NotificationRealtimeEvents)[keyof typeof NotificationRealtimeEvents];

export type AiRealtimeEventName =
  (typeof AiRealtimeEvents)[keyof typeof AiRealtimeEvents];

export type RealtimeEventName =
  | ChatRealtimeEventName
  | AssessmentRealtimeEventName
  | NotificationRealtimeEventName
  | AiRealtimeEventName;

