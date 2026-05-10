import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import {
  fromProtoStruct,
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toObjectResponse,
} from '@edtech/contracts';
import { runGrpc } from '../../common/grpc/error-to-rpc-exception';
import { assertServiceToken } from '../../common/grpc/service-token';
import { JobsService } from './jobs.service';

@Controller()
export class JobsGrpcController {
  constructor(private readonly jobsService: JobsService) {}

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.getJobStatus)
  getJobStatus(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.jobsService.getJobStatus(payload.jobId).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.createJob)
  createJob(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.jobsService
        .enqueue({
          type: payload.type,
          payload: fromProtoStruct(payload.payload),
          priority: payload.priority || undefined,
          maxAttempts: payload.maxAttempts || undefined,
          requestId: payload.requestId || undefined,
          correlationId: payload.correlationId || undefined,
          createdBy: payload.createdBy || undefined,
          resourceType: payload.resourceType || undefined,
          resourceId: payload.resourceId || undefined,
        })
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.updateJobStatus)
  updateJobStatus(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.jobsService
        .updateJobStatus(
          payload.jobId,
          payload.status,
          fromProtoStruct(payload.result),
          fromProtoStruct(payload.error),
        )
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.markJobRunning)
  markJobRunning(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.jobsService.markRunning(payload.jobId).then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.markJobSucceeded)
  markJobSucceeded(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.jobsService
        .markSucceeded(payload.jobId, fromProtoStruct(payload.result))
        .then(toObjectResponse),
    );
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.markJobFailed)
  markJobFailed(payload: any, metadata: Metadata) {
    return this.authenticated(metadata, () =>
      this.jobsService
        .markFailed(payload.jobId, fromProtoStruct(payload.error))
        .then(toObjectResponse),
    );
  }

  private authenticated<T>(metadata: Metadata, callback: () => Promise<T>) {
    assertServiceToken(metadata);
    return runGrpc(callback);
  }
}

