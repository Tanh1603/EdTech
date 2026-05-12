import { AssessmentRealtimeEvents } from './realtime-events';

export interface DeletedResourcePayload {
  id: string;
  deleted: true;
}

export interface QuestionReorderedPayload {
  items: unknown[];
}

export interface AssessmentRealtimePayloads {
  [AssessmentRealtimeEvents.examCreated]: unknown;
  [AssessmentRealtimeEvents.examUpdated]: unknown;
  [AssessmentRealtimeEvents.examDeleted]: DeletedResourcePayload;
  [AssessmentRealtimeEvents.examPublished]: unknown;
  [AssessmentRealtimeEvents.examClosed]: unknown;
  [AssessmentRealtimeEvents.questionCreated]: unknown;
  [AssessmentRealtimeEvents.questionUpdated]: unknown;
  [AssessmentRealtimeEvents.questionDeleted]: DeletedResourcePayload;
  [AssessmentRealtimeEvents.questionReordered]: QuestionReorderedPayload | unknown;
  [AssessmentRealtimeEvents.submissionStarted]: unknown;
  [AssessmentRealtimeEvents.submissionAnswersAutosaved]: unknown;
  [AssessmentRealtimeEvents.submissionSubmitted]: unknown;
  [AssessmentRealtimeEvents.resultGraded]: unknown;
}

