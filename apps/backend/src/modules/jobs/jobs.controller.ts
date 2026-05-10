import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':jobId')
  @ApiOperation({ summary: 'Get async job status' })
  @ApiParam({ name: 'jobId', format: 'uuid' })
  getJobStatus(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.getJobStatus(jobId);
  }
}

