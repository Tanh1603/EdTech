import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';
import { JobsModule } from '../../jobs/jobs.module';
import {
  MaterialsGrpcController,
  MaterialsInternalGrpcController,
} from './materials.grpc.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [PrismaModule, StorageModule, JobsModule],
  controllers: [MaterialsGrpcController, MaterialsInternalGrpcController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
