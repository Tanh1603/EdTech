import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class GenerateExamDto {
  @IsUUID()
  classId!: string;

  @IsString()
  title!: string;

  @IsInt()
  @Min(5)
  durationMinutes!: number;

  @IsOptional()
  @IsBoolean()
  personalized?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  questionTypes?: string[];
}
