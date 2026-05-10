import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { unwrapPageResponse } from '../common/grpc-json/grpc-json.mapper';
import { RequestWithContext } from '../common/types/request-with-context';
import { CoreGrpcClientService } from '../grpc-clients/core-grpc-client.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersGatewayController {
  constructor(private readonly grpc: CoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get()
  @ApiOperation({ summary: 'Get users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUsers(@Query() query: any, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.users.getUsers({
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
    }, this.metadata.build(req))));
  }
}
