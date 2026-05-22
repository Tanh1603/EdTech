import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { GrpcServices } from '@edtech/contracts';
import { ClientGrpc } from '@nestjs/microservices';
import { AiOrchestratorGrpc } from './be-core-grpc.types';

export const AI_SERVICE_GRPC_CLIENT = 'AI_SERVICE_GRPC_CLIENT';

@Injectable()
export class AiGrpcClientService implements OnModuleInit {
  aiOrchestrator!: AiOrchestratorGrpc;

  constructor(@Inject(AI_SERVICE_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.aiOrchestrator = this.client.getService(GrpcServices.aiOrchestrator);
  }
}
