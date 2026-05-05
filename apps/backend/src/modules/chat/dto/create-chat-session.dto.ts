import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChatSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  language?: string;
}
