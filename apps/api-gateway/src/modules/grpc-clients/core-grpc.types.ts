import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

type GrpcCall = (payload: unknown, metadata?: Metadata) => Observable<any>;

export interface AssessmentExamsGrpc {
  createExam: GrpcCall;
  getExams: GrpcCall;
  getExamDetail: GrpcCall;
  updateExam: GrpcCall;
  deleteExam: GrpcCall;
  publishExam: GrpcCall;
  closeExam: GrpcCall;
}

export interface AssessmentQuestionsGrpc {
  createQuestion: GrpcCall;
  getExamQuestions: GrpcCall;
  getQuestionDetail: GrpcCall;
  updateQuestion: GrpcCall;
  deleteQuestion: GrpcCall;
  reorderQuestions: GrpcCall;
}

export interface AssessmentSubmissionsGrpc {
  startExam: GrpcCall;
  getSubmissionDetail: GrpcCall;
  autosaveAnswers: GrpcCall;
  submitSubmission: GrpcCall;
}

export interface AssessmentResultsGrpc {
  getResult: GrpcCall;
  manualGrade: GrpcCall;
}

export interface AssessmentAnalyticsGrpc {
  getExamAnalytics: GrpcCall;
  getQuestionAnalytics: GrpcCall;
  getStudentAnalytics: GrpcCall;
}

export interface ChatSessionsGrpc {
  createSession: GrpcCall;
  getSessions: GrpcCall;
  getSessionDetail: GrpcCall;
  updateSession: GrpcCall;
  deleteSession: GrpcCall;
}

export interface ChatMessagesGrpc {
  getMessages: GrpcCall;
  createMessage: GrpcCall;
  getMessageDetail: GrpcCall;
  deleteMessage: GrpcCall;
}

export interface ChatAnalyticsGrpc {
  getMyAnalytics: GrpcCall;
  getClassroomAnalytics: GrpcCall;
}

export interface LearningMaterialsGrpc {
  createMaterial: GrpcCall;
  getMaterials: GrpcCall;
  getMaterialDetail: GrpcCall;
  updateMaterial: GrpcCall;
  deleteMaterial: GrpcCall;
  getMaterialChunks: GrpcCall;
  getChunkDetail: GrpcCall;
}

export interface LearningRoadmapsGrpc {
  createRoadmap: GrpcCall;
  getRoadmaps: GrpcCall;
  getNextRoadmapItem: GrpcCall;
  getRoadmapDetail: GrpcCall;
  updateRoadmap: GrpcCall;
  deleteRoadmap: GrpcCall;
  createRoadmapItem: GrpcCall;
  getRoadmapProgress: GrpcCall;
  updateRoadmapItem: GrpcCall;
  deleteRoadmapItem: GrpcCall;
  completeRoadmapItem: GrpcCall;
  uncompleteRoadmapItem: GrpcCall;
}

export interface LearningMasteryGrpc {
  getMyMastery: GrpcCall;
  getMasteryByClass: GrpcCall;
  getMasteryByTopic: GrpcCall;
  getMasteryAnalytics: GrpcCall;
  upsertMastery: GrpcCall;
  bulkUpsertMastery: GrpcCall;
  getRiskStudents: GrpcCall;
}

export interface StorageGrpc {
  deleteFile: GrpcCall;
}

export interface UsersGrpc {
  getUsers: GrpcCall;
}
