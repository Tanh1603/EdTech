import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
} from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { MasteryService } from './mastery.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class MasteryGrpcController {
  constructor(private readonly masteryService: MasteryService) {}

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMyMastery)
  getMyMastery(_: any, metadata: Metadata) {
    return runGrpc(() =>
      this.masteryService.getMyMastery(getGrpcUserId(metadata)).then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMasteryByClass)
  getMasteryByClass(payload: any) {
    return runGrpc(() =>
      this.masteryService.getMasteryByClass(payload.classId).then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMasteryByTopic)
  getMasteryByTopic(payload: any, metadata: Metadata) {
    return runGrpc(() =>
      this.masteryService
        .getMasteryByTopic(payload.topic, getGrpcUserId(metadata))
        .then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMasteryAnalytics)
  getMasteryAnalytics(_: any, metadata: Metadata) {
    return runGrpc(() =>
      this.masteryService
        .getMasteryAnalytics(getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.upsertMastery)
  upsertMastery(payload: any) {
    return runGrpc(() =>
      this.masteryService
        .upsertMastery(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.bulkUpsertMastery)
  bulkUpsertMastery(payload: any) {
    return runGrpc(() =>
      this.masteryService
        .bulkUpsertMastery(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getRiskStudents)
  getRiskStudents() {
    return runGrpc(() =>
      this.masteryService.getRiskStudents().then(toObjectResponse),
    );
  }
}
