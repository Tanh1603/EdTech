import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpsertMasteryDto {
  @ApiProperty({ example: 'student_123' })
  @IsString()
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  classId!: string;

  @ApiProperty({ example: 'Integral' })
  @IsString()
  topic!: string;

  @ApiProperty({ example: 0.75, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  masteryScore!: number;
}
