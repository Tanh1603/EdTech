import { Controller, UseGuards } from '@nestjs/common';
import {
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  RolePermissions,
} from '@edtech/contracts';
import { toObjectResponse } from '@edtech/contracts';
import { Permissions } from '../../common/decorators/permissions.decorator';
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
}
