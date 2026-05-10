import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { JobStatuses, JobTypes } from './job.constants';

export class JobStatusDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: Object.values(JobTypes) })
  type!: string;

  @ApiProperty({ enum: Object.values(JobStatuses) })
  status!: string;

  @ApiProperty()
  attempts!: number;

  @ApiProperty()
  maxAttempts!: number;

  @ApiPropertyOptional()
  resourceType?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  resourceId?: string | null;

  @ApiPropertyOptional()
  requestId?: string | null;

  @ApiPropertyOptional()
  correlationId?: string | null;

  @ApiPropertyOptional()
  createdBy?: string | null;

  @ApiPropertyOptional({ type: Object })
  payload?: unknown;

  @ApiPropertyOptional({ type: Object })
  result?: unknown;

  @ApiPropertyOptional({ type: Object })
  error?: unknown;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional()
  availableAt?: string | null;

  @ApiPropertyOptional()
  startedAt?: string | null;

  @ApiPropertyOptional()
  finishedAt?: string | null;
}

export class CreateJobDto {
  @ApiProperty({ enum: Object.values(JobTypes) })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAttempts?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;
}

