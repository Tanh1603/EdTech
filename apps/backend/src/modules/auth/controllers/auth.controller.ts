import {
  Controller,
  Get,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../../../common/types/current-user.type';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getMe(@CurrentUser() user: CurrentUserType) {
    return user;
  }

}
