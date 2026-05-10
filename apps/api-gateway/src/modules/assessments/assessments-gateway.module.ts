import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import {
  AssessmentAnalyticsGatewayController,
  AssessmentExamsGatewayController,
  AssessmentsGatewayController,
} from './assessments.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [
    AssessmentExamsGatewayController,
    AssessmentsGatewayController,
    AssessmentAnalyticsGatewayController,
  ],
})
export class AssessmentsGatewayModule {}
