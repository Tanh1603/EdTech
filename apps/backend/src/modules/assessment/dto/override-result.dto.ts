import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class OverrideResultDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @IsString()
  @MinLength(3)
  reason!: string;
}
