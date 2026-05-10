import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
  toPageResponse,
} from '../../../common/grpc/json.mapper';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { AssessmentsSharedService } from './assessments-shared.service';

@Controller()
export class AssessmentsGrpcController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @GrpcMethod('AssessmentExamsService', 'CreateExam')
  createExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.createExam(
        fromProtoStruct(payload.body) as any,
        getGrpcUserId(metadata),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentExamsService', 'GetExams')
  getExams(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.getExams({
        classId: payload.classId || undefined,
        status: payload.status || undefined,
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
      }).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcMethod('AssessmentExamsService', 'GetExamDetail')
  getExamDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.getExamDetail(payload.examId).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentExamsService', 'UpdateExam')
  updateExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.assessmentsService.updateExam(
          payload.examId,
          fromProtoStruct(payload.body) as any,
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentExamsService', 'DeleteExam')
  deleteExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.deleteExam(payload.examId),
    );
  }

  @GrpcMethod('AssessmentExamsService', 'PublishExam')
  publishExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.publishExam(payload.examId).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentExamsService', 'CloseExam')
  closeExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.closeExam(payload.examId).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentQuestionsService', 'CreateQuestion')
  createQuestion(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.assessmentsService.createQuestion(
          payload.examId,
          fromProtoStruct(payload.body) as any,
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentQuestionsService', 'GetExamQuestions')
  getExamQuestions(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(this.assessmentsService.getExamQuestions(payload.examId)).then(
        toListResponse,
      ),
    );
  }

  @GrpcMethod('AssessmentQuestionsService', 'GetQuestionDetail')
  getQuestionDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.assessmentsService.getQuestionDetail(payload.questionId),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentQuestionsService', 'UpdateQuestion')
  updateQuestion(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.assessmentsService.updateQuestion(
          payload.questionId,
          fromProtoStruct(payload.body) as any,
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentQuestionsService', 'DeleteQuestion')
  deleteQuestion(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService.deleteQuestion(payload.questionId),
    );
  }

  @GrpcMethod('AssessmentQuestionsService', 'ReorderQuestions')
  reorderQuestions(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .reorderQuestions(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentSubmissionsService', 'StartExam')
  startExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .startExam(payload.examId, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentSubmissionsService', 'GetSubmissionDetail')
  getSubmissionDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.assessmentsService.getSubmissionDetail(payload.submissionId),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentSubmissionsService', 'AutosaveAnswers')
  autosaveAnswers(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(
        this.assessmentsService.autosaveAnswers(
          payload.submissionId,
          fromProtoStruct(payload.body) as any,
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentSubmissionsService', 'SubmitSubmission')
  submitSubmission(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .submitSubmission(payload.submissionId)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentResultsService', 'GetResult')
  getResult(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      Promise.resolve(this.assessmentsService.getResult(payload.submissionId)).then(
        toObjectResponse,
      ),
    );
  }

  @GrpcMethod('AssessmentResultsService', 'ManualGrade')
  manualGrade(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .manualGrade(payload.submissionId, fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentAnalyticsService', 'GetExamAnalytics')
  getExamAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .getExamAnalytics(payload.examId)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentAnalyticsService', 'GetQuestionAnalytics')
  getQuestionAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .getQuestionAnalytics(payload.examId)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('AssessmentAnalyticsService', 'GetStudentAnalytics')
  getStudentAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.assessmentsService
        .getStudentAnalytics(payload.studentId)
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}
