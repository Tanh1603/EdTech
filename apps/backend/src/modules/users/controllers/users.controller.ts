import {
  Controller,
  Get,
  Query
} from '@nestjs/common';
import { UserQueryDto, UserRole } from '@edtech/contracts';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Roles(UserRole.admin)
  getMe(@Query() query: UserQueryDto) {
    return this.usersService.getUsers(query);
  }


}
