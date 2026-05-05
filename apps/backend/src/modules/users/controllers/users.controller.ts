import {
  Controller,
  Get,
  Query
} from '@nestjs/common';
import { UserQueryDto } from '../dto/user-query.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  getMe(@Query() query: UserQueryDto) {
    return this.usersService.getUsers(query);
  }


}
