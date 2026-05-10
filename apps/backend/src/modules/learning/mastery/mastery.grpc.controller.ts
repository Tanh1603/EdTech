import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
} from '@edtech/contracts';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { MasteryService } from './mastery.service';

@Controller()
export class MasteryGrpcController {
  constructor(private readonly masteryService: MasteryService) {}

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMyMastery)
  getMyMastery(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService.getMyMastery(getGrpcUserId(metadata)).then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMasteryByClass)
  getMasteryByClass(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService.getMasteryByClass(payload.classId).then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMasteryByTopic)
  getMasteryByTopic(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .getMasteryByTopic(payload.topic, getGrpcUserId(metadata))
        .then(toListResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getMasteryAnalytics)
  getMasteryAnalytics(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .getMasteryAnalytics(getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.upsertMastery)
  upsertMastery(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .upsertMastery(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.bulkUpsertMastery)
  bulkUpsertMastery(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .bulkUpsertMastery(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMastery, GrpcMethods.learningMastery.getRiskStudents)
  getRiskStudents(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService.getRiskStudents().then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}
