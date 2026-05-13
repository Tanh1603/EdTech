import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { MaterialsService } from './materials.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class MaterialsGrpcController {
  constructor(private readonly materialsService: MaterialsService) {}

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.createMaterial)
  createMaterial(payload: any, metadata: Metadata) {
    return runGrpc(() =>
      this.materialsService
        .createMaterial(
          {
            lessonId: payload.lessonId,
            title: payload.title,
            storageUrl: payload.storageUrl,
            publicId: payload.publicId || undefined,
            mimeType: payload.mimeType || undefined,
            size: payload.size || undefined,
          },
          getGrpcUserId(metadata),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.getMaterials)
  getMaterials(payload: any) {
    return runGrpc(() =>
      this.materialsService.getMaterials({
        lessonId: payload.lessonId || undefined,
        status: payload.status || undefined,
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
      }).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.getMaterialDetail)
  getMaterialDetail(payload: any) {
    return runGrpc(() =>
      this.materialsService
        .getMaterialDetail(payload.materialId)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.updateMaterial)
  updateMaterial(payload: any) {
    return runGrpc(() =>
      this.materialsService
        .updateMaterial(payload.materialId, fromProtoStruct(payload.body) as any)
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.deleteMaterial)
  deleteMaterial(payload: any) {
    return runGrpc(() => this.materialsService.deleteMaterial(payload.materialId));
  }

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.getMaterialChunks)
  getMaterialChunks(payload: any) {
    return runGrpc(() =>
      this.materialsService.getMaterialChunks(payload.materialId, {
        page: payload.page || undefined,
        limit: payload.limit || undefined,
      }).then((page) => toPageResponse(page as any)),
    );
  }

  @GrpcContractMethod(GrpcServices.learningMaterials, GrpcMethods.learningMaterials.getChunkDetail)
  getChunkDetail(payload: any) {
    return runGrpc(() =>
      this.materialsService
        .getChunkDetail(payload.materialId, payload.chunkId)
        .then(toObjectResponse),
    );
  }
}
