import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '../../../common/grpc/json.mapper';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { RoadmapsService } from './roadmaps.service';

@Controller()
export class RoadmapsGrpcController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @GrpcMethod('LearningRoadmapsService', 'CreateRoadmap')
  createRoadmap(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .createRoadmap(fromProtoStruct(payload.body) as any, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'GetRoadmaps')
  getRoadmaps(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.getRoadmaps(
        {
          status: payload.status || undefined,
          page: payload.page || undefined,
          limit: payload.limit || undefined,
        },
        getGrpcUserId(metadata),
      ).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'GetNextRoadmapItem')
  getNextRoadmapItem(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .getNextRoadmapItem(getGrpcUserId(metadata))
        .then((result) => toObjectResponse(result ?? {})),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'GetRoadmapDetail')
  getRoadmapDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .getRoadmapDetail(payload.roadmapId, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'UpdateRoadmap')
  updateRoadmap(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .updateRoadmap(
          payload.roadmapId,
          fromProtoStruct(payload.body) as any,
          getGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'DeleteRoadmap')
  deleteRoadmap(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.deleteRoadmap(payload.roadmapId, getGrpcUserId(metadata)),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'CreateRoadmapItem')
  createRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .createRoadmapItem(
          payload.roadmapId,
          fromProtoStruct(payload.body) as any,
          getGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'GetRoadmapProgress')
  getRoadmapProgress(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .getRoadmapProgress(payload.roadmapId, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'UpdateRoadmapItem')
  updateRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .updateRoadmapItem(payload.itemId, fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'DeleteRoadmapItem')
  deleteRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.deleteRoadmapItem(payload.itemId),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'CompleteRoadmapItem')
  completeRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.completeRoadmapItem(payload.itemId).then(toObjectResponse),
    );
  }

  @GrpcMethod('LearningRoadmapsService', 'UncompleteRoadmapItem')
  uncompleteRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .uncompleteRoadmapItem(payload.itemId)
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}
