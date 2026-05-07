import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateExamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  classId!: string;

  @ApiProperty({ example: 'Calculus Midterm', minLength: 2 })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({ example: 'Chapter 1-5' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 90, minimum: 1 })
  @IsInt()
  @Min(1)
  duration!: number;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: 'Updated Midterm', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 120, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}
