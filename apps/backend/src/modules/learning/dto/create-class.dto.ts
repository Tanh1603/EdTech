import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsUUID()
  courseId!: string;

  @IsOptional()
  @IsString()
  inviteCode?: string;
}
