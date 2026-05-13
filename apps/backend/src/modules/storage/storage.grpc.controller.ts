import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import { toObjectResponse } from '@edtech/contracts';
import { runGrpc } from '../../common/grpc/error-to-rpc-exception';
import { StorageService as BackendStorageService } from './storage.service';

@Controller()
export class StorageGrpcController {
  constructor(private readonly storageService: BackendStorageService) {}

  @GrpcContractMethod(GrpcServices.storage, GrpcMethods.storage.deleteFile)
  deleteFile(payload: any) {
    return runGrpc(async () =>
      toObjectResponse(await this.storageService.deleteFile(payload.publicId)),
    );
  }
}
