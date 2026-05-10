import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  AssessmentAnalyticsGrpc,
  AssessmentExamsGrpc,
  AssessmentQuestionsGrpc,
  AssessmentResultsGrpc,
  AssessmentSubmissionsGrpc,
  ChatAnalyticsGrpc,
  ChatMessagesGrpc,
  ChatSessionsGrpc,
  LearningMasteryGrpc,
  LearningMaterialsGrpc,
  LearningRoadmapsGrpc,
  StorageGrpc,
  UsersGrpc,
} from './core-grpc.types';

export const CORE_GRPC_CLIENT = 'CORE_GRPC_CLIENT';

@Injectable()
export class CoreGrpcClientService implements OnModuleInit {
  assessmentExams!: AssessmentExamsGrpc;
  assessmentQuestions!: AssessmentQuestionsGrpc;
  assessmentSubmissions!: AssessmentSubmissionsGrpc;
  assessmentResults!: AssessmentResultsGrpc;
  assessmentAnalytics!: AssessmentAnalyticsGrpc;
  chatSessions!: ChatSessionsGrpc;
  chatMessages!: ChatMessagesGrpc;
  chatAnalytics!: ChatAnalyticsGrpc;
  learningMaterials!: LearningMaterialsGrpc;
  learningRoadmaps!: LearningRoadmapsGrpc;
  learningMastery!: LearningMasteryGrpc;
  storage!: StorageGrpc;
  users!: UsersGrpc;

  constructor(@Inject(CORE_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.assessmentExams = this.client.getService('AssessmentExamsService');
    this.assessmentQuestions = this.client.getService('AssessmentQuestionsService');
    this.assessmentSubmissions = this.client.getService('AssessmentSubmissionsService');
    this.assessmentResults = this.client.getService('AssessmentResultsService');
    this.assessmentAnalytics = this.client.getService('AssessmentAnalyticsService');
    this.chatSessions = this.client.getService('ChatSessionsService');
    this.chatMessages = this.client.getService('ChatMessagesService');
    this.chatAnalytics = this.client.getService('ChatAnalyticsService');
    this.learningMaterials = this.client.getService('LearningMaterialsService');
    this.learningRoadmaps = this.client.getService('LearningRoadmapsService');
    this.learningMastery = this.client.getService('LearningMasteryService');
    this.storage = this.client.getService('StorageService');
    this.users = this.client.getService('UsersService');
  }
}
