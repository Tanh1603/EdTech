import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'multiple_choice' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 'What is derivative of x^2?', minLength: 2 })
  @IsString()
  @MinLength(2)
  prompt!: string;

  @ApiPropertyOptional({ example: ['x', '2x', 'x^2'] })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ example: { correctOption: 1 } })
  @IsOptional()
  answerKey?: unknown;

  @ApiPropertyOptional({ example: 'Power rule' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  points!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  orderNo!: number;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Updated prompt', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  prompt?: string;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ example: ['x', '2x', 'x^2'] })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ example: { correctOption: 1 } })
  @IsOptional()
  answerKey?: unknown;

  @ApiPropertyOptional({ example: 'Power rule' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class ReorderQuestionsDto {
  @ApiProperty({
    example: [{ questionId: '550e8400-e29b-41d4-a716-446655440000', orderNo: 1 }],
  })
  @IsArray()
  items!: { questionId: string; orderNo: number }[];
}

export class GenerateQuestionsDto {
  @ApiProperty({ example: 'Định luật bảo toàn động lượng' })
  @IsString()
  @MinLength(2)
  topic!: string;

  @ApiPropertyOptional({ example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 20 })
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
