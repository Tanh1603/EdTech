import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateClassroomDto {
  @ApiProperty({ example: 'Math 12A1', minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  courseId!: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  inviteCode?: string;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
