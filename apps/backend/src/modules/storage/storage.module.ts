import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageGrpcController } from './storage.grpc.controller';
import { StorageService } from './storage.service';
import { CloudinaryProvider } from '../../common/providers/cloudinary.provider';

@Module({
  imports: [ConfigModule],
  controllers: [StorageGrpcController],
  providers: [CloudinaryProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule { }
