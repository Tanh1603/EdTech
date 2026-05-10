import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import { toPageResponse } from '@edtech/contracts';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../../common/grpc/service-token';
import { UsersService } from '../services/users.service';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.getUsers)
  getUsers(payload: any, metadata: Metadata) {
    assertServiceToken(metadata);
    return runGrpc(async () =>
      toPageResponse(
        (await this.usersService.getUsers({
          page: payload.page || undefined,
          limit: payload.limit || undefined,
        })) as any,
      ),
    );
  }
}
