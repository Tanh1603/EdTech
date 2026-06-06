import { Metadata } from '@grpc/grpc-js';
import { Controller, Logger, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
} from '@edtech/contracts';
import {
  fromProtoStruct,
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { GrpcServiceAuthGuard } from '../../../common/guards/grpc-service-auth.guard';
import { getGrpcIdentity, getGrpcUserId } from '../../../common/grpc/metadata.mapper';
import { MaterialsService } from './materials.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class MaterialsGrpcController {
  constructor(private readonly materialsService: MaterialsService) {}

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.createMaterial,
  )
  @Permissions(RolePermissions.lessonsManage)
  createMaterial(payload: any, metadata: Metadata) {
    return this.materialsService
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
        getGrpcIdentity(metadata).roles,
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getMaterials,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getMaterials(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.materialsService
      .getMaterials({
        lessonId: payload.lessonId || undefined,
        status: payload.status || undefined,
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
      }, identity.userId, identity.roles)
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getMaterialDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getMaterialDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.materialsService
      .getMaterialDetail(payload.materialId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.generateMaterialSummary,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  generateMaterialSummary(payload: any, metadata: Metadata) {
    return this.materialsService
      .enqueueMaterialSummaryJob(payload.materialId, getGrpcUserId(metadata))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.updateMaterial,
  )
  @Permissions(RolePermissions.lessonsManage)
  updateMaterial(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.materialsService
      .updateMaterial(
        payload.materialId,
        fromProtoStruct(payload.body) as any,
        identity.userId,
        identity.roles,
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.deleteMaterial,
  )
  @Permissions(RolePermissions.lessonsManage)
  deleteMaterial(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.materialsService.deleteMaterial(
      payload.materialId,
      identity.userId,
      identity.roles,
    );
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getMaterialChunks,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getMaterialChunks(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.materialsService
      .getMaterialChunks(payload.materialId, {
        page: payload.page || undefined,
        limit: payload.limit || undefined,
      }, identity.userId, identity.roles)
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getChunkDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getChunkDetail(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.materialsService
      .getChunkDetail(
        payload.materialId,
        payload.chunkId,
        identity.userId,
        identity.roles,
      )
      .then(toObjectResponse);
  }
}

@Controller()
@UseGuards(GrpcServiceAuthGuard)
export class MaterialsInternalGrpcController {
  private readonly logger = new Logger(MaterialsInternalGrpcController.name);

  constructor(private readonly materialsService: MaterialsService) {}

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.replaceMaterialChunks,
  )
  replaceMaterialChunks(payload: any) {
    this.logger.log({
      type: 'REPLACE_MATERIAL_CHUNKS',
      materialId: payload.materialId,
      chunkCount: payload.chunks?.length ?? 0,
    });
    return this.materialsService
      .replaceMaterialChunks(
        payload.materialId,
        (payload.chunks ?? []).map((chunk: any) => ({
          chunkId: chunk.chunkId,
          content: chunk.content,
          preview: chunk.preview,
          orderNo: chunk.orderNo,
          tokenCount: chunk.tokenCount,
          embeddingId: chunk.embeddingId,
          storageKey: chunk.storageKey,
          pageNo: chunk.pageNo,
          source: fromProtoStruct(chunk.source),
          checksum: chunk.checksum,
        })),
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.clearMaterialChunks,
  )
  clearMaterialChunks(payload: any) {
    this.logger.log({
      type: 'CLEAR_MATERIAL_CHUNKS',
      materialId: payload.materialId,
    });
    return this.materialsService
      .clearMaterialChunks(payload.materialId)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.appendMaterialChunks,
  )
  appendMaterialChunks(payload: any) {
    this.logger.log({
      type: 'APPEND_MATERIAL_CHUNKS',
      materialId: payload.materialId,
      chunkCount: payload.chunks?.length ?? 0,
    });
    return this.materialsService
      .appendMaterialChunks(
        payload.materialId,
        (payload.chunks ?? []).map((chunk: any) => ({
          chunkId: chunk.chunkId,
          content: chunk.content,
          preview: chunk.preview,
          orderNo: chunk.orderNo,
          tokenCount: chunk.tokenCount,
          embeddingId: chunk.embeddingId,
          storageKey: chunk.storageKey,
          pageNo: chunk.pageNo,
          source: fromProtoStruct(chunk.source),
          checksum: chunk.checksum,
        })),
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.updateMaterialStatus,
  )
  updateMaterialStatus(payload: any) {
    return this.materialsService
      .updateMaterialStatus(
        payload.materialId,
        payload.status,
        fromProtoStruct(payload.error),
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.updateMaterialSummary,
  )
  updateMaterialSummary(payload: any) {
    this.logger.log({
      type: 'UPDATE_MATERIAL_SUMMARY',
      materialId: payload.materialId,
    });
    return this.materialsService
      .updateMaterialSummary(payload.materialId, payload.summary)
      .then(toObjectResponse);
  }
}
