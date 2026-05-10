import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { RoadmapsService } from './roadmaps.service';

@Controller()
export class RoadmapsGrpcController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.createRoadmap)
  createRoadmap(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .createRoadmap(fromProtoStruct(payload.body) as any, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.getRoadmaps)
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

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.getNextRoadmapItem)
  getNextRoadmapItem(_: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .getNextRoadmapItem(getGrpcUserId(metadata))
        .then((result) => toObjectResponse(result ?? {})),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.getRoadmapDetail)
  getRoadmapDetail(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .getRoadmapDetail(payload.roadmapId, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.updateRoadmap)
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

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.deleteRoadmap)
  deleteRoadmap(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.deleteRoadmap(payload.roadmapId, getGrpcUserId(metadata)),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.createRoadmapItem)
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

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.getRoadmapProgress)
  getRoadmapProgress(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .getRoadmapProgress(payload.roadmapId, getGrpcUserId(metadata))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.updateRoadmapItem)
  updateRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService
        .updateRoadmapItem(payload.itemId, fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.deleteRoadmapItem)
  deleteRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.deleteRoadmapItem(payload.itemId),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.completeRoadmapItem)
  completeRoadmapItem(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.roadmapsService.completeRoadmapItem(payload.itemId).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningRoadmaps, GrpcMethods.learningRoadmaps.uncompleteRoadmapItem)
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
