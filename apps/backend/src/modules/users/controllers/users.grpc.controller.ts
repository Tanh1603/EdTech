import { Metadata } from '@grpc/grpc-js';
import { Controller, ForbiddenException, UseGuards } from '@nestjs/common';
import { GrpcContractMethod, GrpcMethods, GrpcServices } from '@edtech/contracts';
import { UserRole } from '@edtech/contracts';
import { toPageResponse } from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { runGrpc } from '../../../common/grpc/error-to-rpc-exception';
import { UsersService } from '../services/users.service';

@Controller()
@UseGuards(GrpcUserAuthGuard)
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.getUsers)
  getUsers(payload: any, metadata: Metadata) {
    return runGrpc(async () => {
      const identity = getGrpcIdentity(metadata);
      if (!identity.roles.includes(UserRole.admin)) {
        throw new ForbiddenException('Insufficient role');
      }

      return toPageResponse(
        (await this.usersService.getUsers({
          page: payload.page || undefined,
          limit: payload.limit || undefined,
        })) as any,
      );
    });
  }
}
