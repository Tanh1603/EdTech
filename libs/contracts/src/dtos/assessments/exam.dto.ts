import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateExamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  classId!: string;

  @ApiProperty({ example: 'Midterm Exam', minLength: 2 })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiPropertyOptional({ example: 'Calculus midterm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 90, minimum: 1 })
  @IsInt()
  @Min(1)
  duration!: number;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: 'Updated title', minLength: 2 })
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
