import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class AnswersDto {
  @ApiProperty({ example: [{ questionId: 'uuid', answer: '2x' }] })
  @IsArray()
  answers!: unknown[];
}

export class ManualGradeDto {
  @ApiProperty({ example: 9, minimum: 0 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiProperty({ example: { comment: 'Well done' } })
  @IsObject()
  feedback!: Record<string, any>;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  gradedByAi?: boolean;
}
