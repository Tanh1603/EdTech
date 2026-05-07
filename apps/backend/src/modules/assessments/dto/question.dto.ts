import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'multiple_choice' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 'What is derivative of x^2?', minLength: 2 })
  @IsString()
  @MinLength(2)
  prompt!: string;

  @ApiPropertyOptional({ example: ['2x', 'x', 'x^2'] })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ example: { correct: '2x' } })
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
  @ApiPropertyOptional({ example: 'Updated question', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  prompt?: string;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ example: ['2x', 'x', 'x^2'] })
  @IsOptional()
  options?: unknown;

  @ApiPropertyOptional({ example: { correct: '2x' } })
  @IsOptional()
  answerKey?: unknown;

  @ApiPropertyOptional({ example: 'Power rule' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class ReorderQuestionsDto {
  @ApiProperty({ example: [{ questionId: '550e8400-e29b-41d4-a716-446655440000', orderNo: 1 }] })
  items!: { questionId: string; orderNo: number }[];
}
