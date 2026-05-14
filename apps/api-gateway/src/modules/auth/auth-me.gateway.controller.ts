import { Controller, Get, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { unwrapObjectResponse } from '@edtech/contracts';
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthMeGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated user profile and RBAC authority' })
  async getMe(@Req() req: RequestWithContext) {
    return unwrapObjectResponse(
      await lastValueFrom(this.grpc.users.getMe({}, this.metadata.build(req))),
    );
  }
}

