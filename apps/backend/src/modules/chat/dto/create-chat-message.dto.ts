import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  content!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
