import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { AssessmentsSharedService } from './assessments-shared.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class AssessmentsGrpcController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.createExam)
  createExam(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService.createExam(
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.getExams)
  getExams(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService.getExams({
        classId: payload.classId || undefined,
        status: payload.status || undefined,
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
      }, identity.userId, identity.roles).then((page) => toPageResponse(page as any));
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.getExamDetail)
  getExamDetail(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .getExamDetail(payload.examId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.updateExam)
  updateExam(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.updateExam(
          payload.examId,
          fromProtoStruct(payload.body) as any,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.deleteExam)
  deleteExam(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService.deleteExam(
        payload.examId,
        identity.userId,
        identity.roles,
      );
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.publishExam)
  publishExam(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .publishExam(payload.examId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentExams, GrpcMethods.assessmentExams.closeExam)
  closeExam(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .closeExam(payload.examId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.createQuestion)
  createQuestion(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.createQuestion(
          payload.examId,
          fromProtoStruct(payload.body) as any,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.getExamQuestions)
  getExamQuestions(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.getExamQuestions(
          payload.examId,
          identity.userId,
          identity.roles,
        ),
      ).then(toListResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.getQuestionDetail)
  getQuestionDetail(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.getQuestionDetail(
          payload.questionId,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.updateQuestion)
  updateQuestion(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.updateQuestion(
          payload.questionId,
          fromProtoStruct(payload.body) as any,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.deleteQuestion)
  deleteQuestion(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService.deleteQuestion(
        payload.questionId,
        identity.userId,
        identity.roles,
      );
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentQuestions, GrpcMethods.assessmentQuestions.reorderQuestions)
  reorderQuestions(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .reorderQuestions(
          fromProtoStruct(payload.body) as any,
          identity.userId,
          identity.roles,
        )
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.startExam)
  startExam(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .startExam(payload.examId, identity.userId)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.getSubmissionDetail)
  getSubmissionDetail(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.getSubmissionDetail(
          payload.submissionId,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.autosaveAnswers)
  autosaveAnswers(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.autosaveAnswers(
          payload.submissionId,
          fromProtoStruct(payload.body) as any,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentSubmissions, GrpcMethods.assessmentSubmissions.submitSubmission)
  submitSubmission(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .submitSubmission(payload.submissionId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentResults, GrpcMethods.assessmentResults.getResult)
  getResult(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return Promise.resolve(
        this.assessmentsService.getResult(
          payload.submissionId,
          identity.userId,
          identity.roles,
        ),
      ).then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentResults, GrpcMethods.assessmentResults.manualGrade)
  manualGrade(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .manualGrade(
          payload.submissionId,
          fromProtoStruct(payload.body) as any,
          identity.userId,
          identity.roles,
        )
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentAnalytics, GrpcMethods.assessmentAnalytics.getExamAnalytics)
  getExamAnalytics(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .getExamAnalytics(payload.examId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentAnalytics, GrpcMethods.assessmentAnalytics.getQuestionAnalytics)
  getQuestionAnalytics(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .getQuestionAnalytics(payload.examId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }

  @GrpcContractMethod(GrpcServices.assessmentAnalytics, GrpcMethods.assessmentAnalytics.getStudentAnalytics)
  getStudentAnalytics(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      return this.assessmentsService
        .getStudentAnalytics(payload.studentId, identity.userId, identity.roles)
        .then(toObjectResponse);
    });
  }
}
