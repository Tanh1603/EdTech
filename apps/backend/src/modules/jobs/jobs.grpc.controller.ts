import { Metadata } from '@grpc/grpc-js';
import { Controller, UseGuards } from '@nestjs/common';
import {
  fromProtoStruct,
  GrpcContractMethod,
  GrpcMethods,
  GrpcServices,
  toObjectResponse,
} from '@edtech/contracts';
import { GrpcUserAuthGuard } from '../../common/guards/grpc-user-auth.guard';
import { getGrpcIdentity } from '../../common/grpc/metadata.mapper';
import { JobsService } from './jobs.service';

@Controller()
export class JobsGrpcController {
  constructor(private readonly jobsService: JobsService) {}

  @UseGuards(GrpcUserAuthGuard)
  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.getJobStatus)
  getJobStatus(payload: any, metadata: Metadata) {
    const identity = getGrpcIdentity(metadata);
    return this.jobsService
      .getJobStatusForUser(payload.jobId, identity.userId, identity.roles)
      .then(toObjectResponse);
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.createJob)
  createJob(payload: any) {
    return this.jobsService
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
      .then(toObjectResponse);
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.updateJobStatus)
  updateJobStatus(payload: any) {
    return this.jobsService
      .updateJobStatus(
        payload.jobId,
        payload.status,
        fromProtoStruct(payload.result),
        fromProtoStruct(payload.error),
      )
      .then(toObjectResponse);
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.markJobRunning)
  markJobRunning(payload: any) {
    return this.jobsService.markRunning(payload.jobId).then(toObjectResponse);
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.markJobSucceeded)
  markJobSucceeded(payload: any) {
    return this.jobsService
      .markSucceeded(payload.jobId, fromProtoStruct(payload.result))
      .then(toObjectResponse);
  }

  @GrpcContractMethod(GrpcServices.jobs, GrpcMethods.jobs.markJobFailed)
  markJobFailed(payload: any) {
    return this.jobsService
      .markFailed(payload.jobId, fromProtoStruct(payload.error))
      .then(toObjectResponse);
  }
}
