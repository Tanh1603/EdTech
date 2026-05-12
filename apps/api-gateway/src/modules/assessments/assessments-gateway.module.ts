import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import { RealtimeModule } from '../realtime/realtime.module';
import {
  AssessmentAnalyticsGatewayController,
  AssessmentExamsGatewayController,
  AssessmentsGatewayController,
} from './assessments.gateway.controller';

@Module({
  imports: [GrpcClientsModule, RealtimeModule],
  controllers: [
    AssessmentExamsGatewayController,
    AssessmentsGatewayController,
    AssessmentAnalyticsGatewayController,
  ],
})
export class AssessmentsGatewayModule {}
