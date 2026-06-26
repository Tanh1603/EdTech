import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

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

export class GenerateExamDto extends CreateExamDto {
  @ApiProperty({ example: 'Định luật bảo toàn động lượng' })
  @IsString()
  @MinLength(2)
  topic!: string;

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  numberOfQuestions?: number;

  @ApiPropertyOptional({ example: ['mcq', 'true_false'] })
  @IsOptional()
  @IsString({ each: true })
  questionTypes?: string[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  materialId?: string;
}
