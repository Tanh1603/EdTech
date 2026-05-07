import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCourseDto {
  @IsUUID()
  teacherId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
