import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc-clients/grpc-clients.module';
import {
  LearningMasteryGatewayController,
  LearningMaterialsGatewayController,
  LearningRoadmapsGatewayController,
} from './learning.gateway.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [
    LearningMaterialsGatewayController,
    LearningRoadmapsGatewayController,
    LearningMasteryGatewayController,
  ],
})
export class LearningGatewayModule {}
