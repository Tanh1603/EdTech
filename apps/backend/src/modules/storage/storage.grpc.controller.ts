import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { toObjectResponse } from '../../common/grpc/json.mapper';
import { runGrpc } from '../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../common/grpc/service-token';
import { StorageService as BackendStorageService } from './storage.service';

@Controller()
export class StorageGrpcController {
  constructor(private readonly storageService: BackendStorageService) {}

  @GrpcMethod('StorageService', 'DeleteFile')
  deleteFile(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      toObjectResponse(await this.storageService.deleteFile(payload.publicId)),
    );
  }
}
