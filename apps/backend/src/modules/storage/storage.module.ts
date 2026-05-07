import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { CloudinaryProvider } from '../../common/providers/cloudinary.provider';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [CloudinaryProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule { }
