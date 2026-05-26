import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
} from '@edtech/contracts';
import { toObjectResponse } from '@edtech/contracts';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { GrpcServiceAuthGuard } from '../../common/guards/grpc-service-auth.guard';
import { GrpcUserAuthGuard } from '../../common/guards/grpc-user-auth.guard';
import { StorageService as BackendStorageService } from './storage.service';

@Controller()
export class StorageGrpcController {
  constructor(private readonly storageService: BackendStorageService) {}

  @UseGuards(GrpcUserAuthGuard)
  @Permissions(RolePermissions.lessonsManage)
  @GrpcContractMethod(GrpcServices.storage, GrpcMethods.storage.deleteFile)
  deleteFile(payload: any) {
    return this.storageService
      .deleteFile(payload.publicId)
      .then(toObjectResponse);
  }

  @UseGuards(GrpcServiceAuthGuard)
  @GrpcContractMethod(GrpcServices.storage, GrpcMethods.storage.resolveFileAccess)
  resolveFileAccess(payload: any) {
    return this.storageService.resolveFileAccess({
      materialId: payload.materialId || undefined,
      publicId: payload.publicId || undefined,
    });
  }
}
