import { Module } from '@nestjs/common';
import { AssessmentsSharedModule } from './shared/shared.module';

@Module({
  imports: [AssessmentsSharedModule],
})
export class AssessmentsModule {}
