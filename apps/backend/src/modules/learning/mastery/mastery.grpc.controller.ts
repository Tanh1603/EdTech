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
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { MasteryService } from './mastery.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class MasteryGrpcController {
  constructor(private readonly masteryService: MasteryService) {}

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.getMyMastery,
  )
  @Permissions(RolePermissions.learningRead)
  getMyMastery(_: any, metadata: Metadata) {
    return this.masteryService
      .getMyMastery(getGrpcUserId(metadata))
      .then(toListResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.getMasteryByClass,
  )
  @Permissions(RolePermissions.analyticsView)
  getMasteryByClass(payload: any) {
    return this.masteryService
      .getMasteryByClass(payload.classId)
      .then(toListResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.getMasteryByTopic,
  )
  @Permissions(RolePermissions.learningRead)
  getMasteryByTopic(payload: any, metadata: Metadata) {
    return this.masteryService
      .getMasteryByTopic(payload.topic, getGrpcUserId(metadata))
      .then(toListResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.getMasteryAnalytics,
  )
  @Permissions(RolePermissions.learningRead)
  getMasteryAnalytics(_: any, metadata: Metadata) {
    return this.masteryService
      .getMasteryAnalytics(getGrpcUserId(metadata))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.upsertMastery,
  )
  @Permissions(RolePermissions.analyticsView)
  upsertMastery(payload: any) {
    return this.masteryService
      .upsertMastery(fromProtoStruct(payload.body) as any)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.bulkUpsertMastery,
  )
  @Permissions(RolePermissions.analyticsView)
  bulkUpsertMastery(payload: any) {
    return this.masteryService
      .bulkUpsertMastery(fromProtoStruct(payload.body) as any)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMastery,
    GrpcMethods.learningMastery.getRiskStudents,
  )
  @Permissions(RolePermissions.analyticsView)
  getRiskStudents() {
    return this.masteryService.getRiskStudents().then(toObjectResponse);
  }
}
