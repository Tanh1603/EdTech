import { Module } from '@nestjs/common';
import { UsersGrpcController } from './controllers/users.grpc.controller';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersGrpcController],
  providers: [UsersRepository, UsersService],
})
export class UsersModule {}
