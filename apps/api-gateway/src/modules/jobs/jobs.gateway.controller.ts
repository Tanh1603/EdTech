import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { unwrapObjectResponse } from '@edtech/contracts';
import { lastValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { RequestWithContext } from '../common/types/request-with-context';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsGatewayController {
  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadata: GrpcMetadataBuilder,
  ) {}

  @Get(':jobId')
  @ApiOperation({ summary: 'Get async job status' })
  @ApiParam({ name: 'jobId', format: 'uuid' })
  async getJobStatus(@Param('jobId') jobId: string, @Req() req: RequestWithContext) {
    return unwrapObjectResponse(
      await lastValueFrom(
        this.grpc.jobs.getJobStatus({ jobId }, this.metadata.build(req)),
      ),
    );
  }
}

