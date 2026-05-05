import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { ClerkClientProvider } from '../../common/providers/clerk-client.provider';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, ClerkClientProvider],
})
export class UsersModule {}
