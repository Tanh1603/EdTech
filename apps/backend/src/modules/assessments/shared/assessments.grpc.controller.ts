import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
} from '@edtech/contracts';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { AssessmentsSharedService } from './assessments-shared.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class AssessmentsGrpcController {
  constructor(private readonly assessmentsService: AssessmentsSharedService) {}

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.createExam,
  )
  @Permissions(RolePermissions.examsManage)
  createExam(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .createExam(
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.getExams,
  )
  @Permissions(RolePermissions.examsTake, RolePermissions.examsManage)
  getExams(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .getExams(
        {
          classId: payload.classId || undefined,
          status: payload.status || undefined,
          page: payload.page || undefined,
          limit: payload.limit || undefined,
          search: payload.search || undefined,
        },
        identity.userId,
        identity.roles,
      )
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.getExamDetail,
  )
  @Permissions(RolePermissions.examsTake, RolePermissions.examsManage)
  getExamDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .getExamDetail(payload.examId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.updateExam,
  )
  @Permissions(RolePermissions.examsManage)
  updateExam(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.updateExam(
        payload.examId,
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.deleteExam,
  )
  @Permissions(RolePermissions.examsManage)
  deleteExam(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService.deleteExam(
      payload.examId,
      identity.userId,
      identity.roles,
    );
  }

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.publishExam,
  )
  @Permissions(RolePermissions.examsManage)
  publishExam(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .publishExam(payload.examId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentExams,
    GrpcMethods.assessmentExams.closeExam,
  )
  @Permissions(RolePermissions.examsManage)
  closeExam(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .closeExam(payload.examId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentQuestions,
    GrpcMethods.assessmentQuestions.createQuestion,
  )
  @Permissions(RolePermissions.examsManage)
  createQuestion(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.createQuestion(
        payload.examId,
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentQuestions,
    GrpcMethods.assessmentQuestions.getExamQuestions,
  )
  @Permissions(RolePermissions.examsTake, RolePermissions.examsManage)
  getExamQuestions(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.getExamQuestions(
        payload.examId,
        identity.userId,
        identity.roles,
      ),
    ).then(toListResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentQuestions,
    GrpcMethods.assessmentQuestions.getQuestionDetail,
  )
  @Permissions(RolePermissions.examsTake, RolePermissions.examsManage)
  getQuestionDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.getQuestionDetail(
        payload.questionId,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentQuestions,
    GrpcMethods.assessmentQuestions.updateQuestion,
  )
  @Permissions(RolePermissions.examsManage)
  updateQuestion(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.updateQuestion(
        payload.questionId,
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentQuestions,
    GrpcMethods.assessmentQuestions.deleteQuestion,
  )
  @Permissions(RolePermissions.examsManage)
  deleteQuestion(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService.deleteQuestion(
      payload.questionId,
      identity.userId,
      identity.roles,
    );
  }

  @GrpcContractMethod(
    GrpcServices.assessmentQuestions,
    GrpcMethods.assessmentQuestions.reorderQuestions,
  )
  @Permissions(RolePermissions.examsManage)
  reorderQuestions(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .reorderQuestions(
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentSubmissions,
    GrpcMethods.assessmentSubmissions.startExam,
  )
  @Permissions(RolePermissions.examsTake)
  startExam(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .startExam(payload.examId, identity.userId)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentSubmissions,
    GrpcMethods.assessmentSubmissions.getSubmissionDetail,
  )
  @Permissions(
    RolePermissions.resultsReadOwn,
    RolePermissions.submissionsManage,
  )
  getSubmissionDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.getSubmissionDetail(
        payload.submissionId,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentSubmissions,
    GrpcMethods.assessmentSubmissions.autosaveAnswers,
  )
  @Permissions(RolePermissions.examsTake)
  autosaveAnswers(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.autosaveAnswers(
        payload.submissionId,
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentSubmissions,
    GrpcMethods.assessmentSubmissions.submitSubmission,
  )
  @Permissions(RolePermissions.examsTake)
  submitSubmission(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .submitSubmission(payload.submissionId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentResults,
    GrpcMethods.assessmentResults.getResult,
  )
  @Permissions(
    RolePermissions.resultsReadOwn,
    RolePermissions.submissionsManage,
  )
  getResult(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return Promise.resolve(
      this.assessmentsService.getResult(
        payload.submissionId,
        identity.userId,
        identity.roles,
      ),
    ).then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentResults,
    GrpcMethods.assessmentResults.manualGrade,
  )
  @Permissions(RolePermissions.examsManage)
  manualGrade(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .manualGrade(
        payload.submissionId,
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentAnalytics,
    GrpcMethods.assessmentAnalytics.getExamAnalytics,
  )
  @Permissions(RolePermissions.examsManage)
  getExamAnalytics(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .getExamAnalytics(payload.examId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentAnalytics,
    GrpcMethods.assessmentAnalytics.getQuestionAnalytics,
  )
  @Permissions(RolePermissions.examsManage)
  getQuestionAnalytics(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .getQuestionAnalytics(payload.examId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.assessmentAnalytics,
    GrpcMethods.assessmentAnalytics.getStudentAnalytics,
  )
  @Permissions(RolePermissions.analyticsView)
  getStudentAnalytics(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.assessmentsService
      .getStudentAnalytics(payload.studentId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }
}
