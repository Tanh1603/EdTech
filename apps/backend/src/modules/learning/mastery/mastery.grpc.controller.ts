import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  fromProtoStruct,
  toListResponse,
  toObjectResponse,
} from '../../../common/grpc/json.mapper';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { MasteryService } from './mastery.service';

@Controller()
export class MasteryGrpcController {
  constructor(private readonly masteryService: MasteryService) {}

  @GrpcMethod('LearningMasteryService', 'GetMyMastery')
  getMyMastery(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService.getMyMastery(getGrpcUserId(metadata)).then(toListResponse),
    );
  }

  @GrpcMethod('LearningMasteryService', 'GetMasteryByClass')
  getMasteryByClass(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService.getMasteryByClass(payload.classId).then(toListResponse),
    );
  }

  @GrpcMethod('LearningMasteryService', 'GetMasteryByTopic')
  getMasteryByTopic(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .getMasteryByTopic(payload.topic, getGrpcUserId(metadata))
        .then(toListResponse),
    );
  }

  @GrpcMethod('LearningMasteryService', 'GetMasteryAnalytics')
  getMasteryAnalytics(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .getMasteryAnalytics(getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningMasteryService', 'UpsertMastery')
  upsertMastery(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .upsertMastery(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningMasteryService', 'BulkUpsertMastery')
  bulkUpsertMastery(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.masteryService
        .bulkUpsertMastery(fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningMasteryService', 'GetRiskStudents')
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
