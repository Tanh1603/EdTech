import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class SubmitExamDto {
  @ApiProperty({ example: [{ questionId: 'uuid', answer: '2x' }] })
  @IsArray()
  answers!: unknown[];
}

export class AutoSaveAnswersDto {
  @ApiProperty({ example: [] })
  @IsArray()
  answers!: unknown[];
}

export class AiGradingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  submissionId!: string;
}

export class BulkAiGradingDto {
  @ApiProperty({ example: ['550e8400-e29b-41d4-a716-446655440000'] })
  submissionIds!: string[];
}

export class ProctoringEventDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  submissionId!: string;

  @ApiProperty({ example: 'tab_switch' })
  @IsString()
  type!: string;

  @ApiProperty({ example: {} })
  metadata!: unknown;
}
