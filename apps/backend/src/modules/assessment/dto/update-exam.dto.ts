import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;
}
