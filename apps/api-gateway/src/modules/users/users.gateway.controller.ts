import { Body, Controller, Get, Param, Patch, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import {
  AssignUserRolesDto,
  toObjectResponse,
  UpdateUserProfileDto,
  unwrapListResponse,
  unwrapObjectResponse,
  unwrapPageResponse,
  UserQueryDto,
} from '@edtech/contracts';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersGatewayController {
  constructor(private readonly grpc: BeCoreGrpcClientService, private readonly metadata: GrpcMetadataBuilder) {}

  @Get()
  @ApiOperation({ summary: 'Get users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  async getUsers(@Query() query: UserQueryDto, @Req() req: RequestWithContext) {
    return unwrapPageResponse(await lastValueFrom(this.grpc.users.getUsers({
      page: Number(query.page) || undefined,
      limit: Number(query.limit) || undefined,
      search: query.search || undefined,
      role: query.role || undefined,
    }, this.metadata.build(req))));
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update authenticated user profile' })
  async updateMyProfile(
    @Body() body: UpdateUserProfileDto,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.users.updateMyProfile(
          toObjectResponse(body),
          this.metadata.build(req),
        ),
      ),
    );
  }

  @Patch(':id/roles')
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiParam({ name: 'id', type: String })
  async assignUserRoles(
    @Param('id') userId: string,
    @Body() body: AssignUserRolesDto,
    @Req() req: RequestWithContext,
  ) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.users.assignUserRoles(
          {
            userId,
            roles: body.roles,
          },
          this.metadata.build(req),
        ),
      ),
    );
  }
}

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller()
export class RbacGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
  ) {}

  @Get('roles')
  @ApiOperation({ summary: 'Get roles' })
  async getRoles(@Req() req: RequestWithContext) {
    return unwrapListResponse(
      await lastValueFrom(this.grpc.users.getRoles({}, this.metadata.build(req))),
    ).items;
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get permissions' })
  async getPermissions(@Req() req: RequestWithContext) {
    return unwrapListResponse(
      await lastValueFrom(this.grpc.users.getPermissions({}, this.metadata.build(req))),
    ).items;
  }
}
