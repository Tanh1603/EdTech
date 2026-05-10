import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { StorageModule } from '../../storage/storage.module';
import { JobsModule } from '../../jobs/jobs.module';
import { MaterialsController } from './materials.controller';
import { MaterialsGrpcController } from './materials.grpc.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [PrismaModule, StorageModule, JobsModule],
  controllers: [MaterialsController, MaterialsGrpcController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
