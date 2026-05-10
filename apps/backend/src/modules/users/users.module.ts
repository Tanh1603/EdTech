import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './controllers/users.controller';
import { UsersGrpcController } from './controllers/users.grpc.controller';
import { UsersService } from './services/users.service';
import { ClerkClientProvider } from '../../common/providers/clerk-client.provider';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, UsersGrpcController],
  providers: [UsersService, ClerkClientProvider],
})
export class UsersModule {}
