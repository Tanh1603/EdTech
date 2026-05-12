import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { getAuthenticatedGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { AssessmentsSharedService } from './assessments-shared.service';

@Controller()
export class AssessmentsGrpcController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.createExam)
  createExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService.createExam(
        fromProtoStruct(payload.body) as any,
        await getAuthenticatedGrpcUserId(metadata),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.getExams)
  getExams(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService.getExams({
        classId: payload.classId || undefined,
        status: payload.status || undefined,
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
      }, await getAuthenticatedGrpcUserId(metadata)).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.getExamDetail)
  getExamDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .getExamDetail(payload.examId, await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.updateExam)
  updateExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.updateExam(
          payload.examId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.deleteExam)
  deleteExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService.deleteExam(
        payload.examId,
        await getAuthenticatedGrpcUserId(metadata),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.publishExam)
  publishExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .publishExam(payload.examId, await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.closeExam)
  closeExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .closeExam(payload.examId, await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.createQuestion)
  createQuestion(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.createQuestion(
          payload.examId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.getExamQuestions)
  getExamQuestions(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.getExamQuestions(
          payload.examId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.getQuestionDetail)
  getQuestionDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.getQuestionDetail(
          payload.questionId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.updateQuestion)
  updateQuestion(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.updateQuestion(
          payload.questionId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.deleteQuestion)
  deleteQuestion(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService.deleteQuestion(
        payload.questionId,
        await getAuthenticatedGrpcUserId(metadata),
      ),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.reorderQuestions)
  reorderQuestions(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .reorderQuestions(
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.startExam)
  startExam(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .startExam(payload.examId, await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.getSubmissionDetail)
  getSubmissionDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.getSubmissionDetail(
          payload.submissionId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.autosaveAnswers)
  autosaveAnswers(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.autosaveAnswers(
          payload.submissionId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.submitSubmission)
  submitSubmission(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .submitSubmission(payload.submissionId, await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentResults, GrpcMethods.assessmentResults.getResult)
  getResult(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      Promise.resolve(
        this.assessmentsService.getResult(
          payload.submissionId,
          await getAuthenticatedGrpcUserId(metadata),
        ),
      ).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentResults, GrpcMethods.assessmentResults.manualGrade)
  manualGrade(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .manualGrade(
          payload.submissionId,
          fromProtoStruct(payload.body) as any,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentAnalytics, GrpcMethods.assessmentAnalytics.getExamAnalytics)
  getExamAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .getExamAnalytics(payload.examId, await getAuthenticatedGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentAnalytics, GrpcMethods.assessmentAnalytics.getQuestionAnalytics)
  getQuestionAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .getQuestionAnalytics(
          payload.examId,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.assessmentAnalytics, GrpcMethods.assessmentAnalytics.getStudentAnalytics)
  getStudentAnalytics(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, async () =>
      this.assessmentsService
        .getStudentAnalytics(
          payload.studentId,
          await getAuthenticatedGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}
