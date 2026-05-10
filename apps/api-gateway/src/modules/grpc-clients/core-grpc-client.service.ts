import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { GrpcServices } from '@edtech/contracts';
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
    this.assessmentExams = this.client.getService(GrpcServices.assessmentExams);
    this.assessmentQuestions = this.client.getService(GrpcServices.assessmentQuestions);
    this.assessmentSubmissions = this.client.getService(GrpcServices.assessmentSubmissions);
    this.assessmentResults = this.client.getService(GrpcServices.assessmentResults);
    this.assessmentAnalytics = this.client.getService(GrpcServices.assessmentAnalytics);
    this.chatSessions = this.client.getService(GrpcServices.chatSessions);
    this.chatMessages = this.client.getService(GrpcServices.chatMessages);
    this.chatAnalytics = this.client.getService(GrpcServices.chatAnalytics);
    this.learningMaterials = this.client.getService(GrpcServices.learningMaterials);
    this.learningRoadmaps = this.client.getService(GrpcServices.learningRoadmaps);
    this.learningMastery = this.client.getService(GrpcServices.learningMastery);
    this.storage = this.client.getService(GrpcServices.storage);
    this.users = this.client.getService(GrpcServices.users);
  }
}
