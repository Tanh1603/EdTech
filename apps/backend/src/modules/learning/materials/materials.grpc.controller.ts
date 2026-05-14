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
  toObjectResponse,
  toPageResponse,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcUserId } from '../../../common/grpc/metadata.mapper';
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
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getMaterials,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getMaterials(payload: any) {
    return this.materialsService
      .getMaterials({
        lessonId: payload.lessonId || undefined,
        status: payload.status || undefined,
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
      })
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getMaterialDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getMaterialDetail(payload: any) {
    return this.materialsService
      .getMaterialDetail(payload.materialId)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.updateMaterial,
  )
  @Permissions(RolePermissions.lessonsManage)
  updateMaterial(payload: any) {
    return this.materialsService
      .updateMaterial(payload.materialId, fromProtoStruct(payload.body) as any)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.deleteMaterial,
  )
  @Permissions(RolePermissions.lessonsManage)
  deleteMaterial(payload: any) {
    return this.materialsService.deleteMaterial(payload.materialId);
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getMaterialChunks,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getMaterialChunks(payload: any) {
    return this.materialsService
      .getMaterialChunks(payload.materialId, {
        page: payload.page || undefined,
        limit: payload.limit || undefined,
      })
      .then((page) => toPageResponse(page as any));
  }

  @GrpcContractMethod(
    GrpcServices.learningMaterials,
    GrpcMethods.learningMaterials.getChunkDetail,
  )
  @Permissions(RolePermissions.learningRead, RolePermissions.lessonsManage)
  getChunkDetail(payload: any) {
    return this.materialsService
      .getChunkDetail(payload.materialId, payload.chunkId)
      .then(toObjectResponse);
  }
}
