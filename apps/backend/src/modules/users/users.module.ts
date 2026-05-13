import { Module } from '@nestjs/common';
import { UsersGrpcController } from './controllers/users.grpc.controller';
import { UsersService } from './services/users.service';
import { ClerkClientProvider } from '../../common/providers/clerk-client.provider';

@Module({
  controllers: [UsersGrpcController],
  providers: [UsersService, ClerkClientProvider],
})
export class UsersModule {}
