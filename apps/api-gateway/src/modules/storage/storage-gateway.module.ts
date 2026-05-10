import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { CloudinaryProvider } from './cloudinary.provider';
import { GatewayStorageService } from './gateway-storage.service';
import { StorageGatewayController } from './storage.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [StorageGatewayController],
  providers: [CloudinaryProvider, GatewayStorageService],
  exports: [GatewayStorageService],
})
export class StorageGatewayModule {}
