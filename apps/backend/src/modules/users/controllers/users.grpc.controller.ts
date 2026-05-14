import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  fromProtoStruct,
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toListResponse,
  toObjectResponse,
  toPageResponse,
  RolePermissions,
} from '@edtech/contracts';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { GrpcUserAuthGuard } from '../../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../../common/grpc/metadata.mapper';
import { UsersService } from '../services/users.service';

@Controller()
export class UsersGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcContractMethod(
    GrpcServices.users,
    GrpcMethods.users.syncClerkUserCreated,
  )
  syncClerkUserCreated(payload: any) {
    return this.usersService
      .syncClerkUserCreated(this.toSyncPayload(payload))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.users,
    GrpcMethods.users.syncClerkUserUpdated,
  )
  syncClerkUserUpdated(payload: any) {
    return this.usersService
      .syncClerkUserUpdated(this.toSyncPayload(payload))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(
    GrpcServices.users,
    GrpcMethods.users.syncClerkUserDeleted,
  )
  syncClerkUserDeleted(payload: any) {
    return this.usersService
      .syncClerkUserDeleted(payload.id)
      .then(toObjectResponse);
  }

  @UseGuards(GrpcUserAuthGuard)
  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.getMe)
  getMe(_payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.usersService.getMe(identity.userId).then(toObjectResponse);
  }

  @UseGuards(GrpcUserAuthGuard)
  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.updateMyProfile)
  updateMyProfile(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.usersService
      .updateMyProfile(identity.userId, this.toUpdateProfilePayload(payload))
      .then(toObjectResponse);
  }

  @UseGuards(GrpcUserAuthGuard)
  @Permissions(RolePermissions.usersManage)
  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.getUsers)
  getUsers(payload: any) {
    return this.usersService
      .getUsers({
        page: payload.page || undefined,
        limit: payload.limit || undefined,
        search: payload.search || undefined,
        role: payload.role || undefined,
      })
      .then((page) => toPageResponse(page as any));
  }

  @UseGuards(GrpcUserAuthGuard)
  @Permissions(RolePermissions.usersManage)
  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.assignUserRoles)
  assignUserRoles(payload: any) {
    return this.usersService
      .assignUserRoles(payload.userId, payload.roles ?? [])
      .then(toObjectResponse);
  }

  @UseGuards(GrpcUserAuthGuard)
  @Permissions(RolePermissions.rolesManage)
  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.getRoles)
  getRoles() {
    return this.usersService.getRoles().then(toListResponse);
  }

  @UseGuards(GrpcUserAuthGuard)
  @Permissions(RolePermissions.rolesManage)
  @GrpcContractMethod(GrpcServices.users, GrpcMethods.users.getPermissions)
  getPermissions() {
    return this.usersService.getPermissions().then(toListResponse);
  }

  private toSyncPayload(payload: any) {
    const body = payload.body ? fromProtoStruct(payload.body) : payload;

    return {
      id: body.id,
      email: body.email || null,
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      imageUrl: body.imageUrl || null,
      status: body.status || null,
    };
  }

  private toUpdateProfilePayload(payload: any) {
    const body = payload.body ? fromProtoStruct(payload.body) : payload;

    return {
      firstName: body.firstName || undefined,
      lastName: body.lastName || undefined,
      imageUrl: body.imageUrl || undefined,
    };
  }
}
