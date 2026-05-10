import {
  Controller,
  Get,
  Query
} from '@nestjs/common';
import { UserQueryDto } from '@edtech/contracts';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  getMe(@Query() query: UserQueryDto) {
    return this.usersService.getUsers(query);
  }


}
