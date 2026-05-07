import { Module } from '@nestjs/common';
import { AcademicController } from './controllers/academic.controller';
import { AcademicService } from './services/academic.service';

@Module({
  controllers: [AcademicController],
  providers: [AcademicService],
})
export class AcademicModule {}
