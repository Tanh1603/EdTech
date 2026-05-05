import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDocumentDto {
  @IsUUID()
  courseId!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  fileUrl!: string;
}
