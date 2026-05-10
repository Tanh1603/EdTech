import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ example: 'Chapter 1 PDF' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/file.pdf' })
  @IsUrl()
  storageUrl!: string;

  @ApiPropertyOptional({ example: 'edtech/materials/file' })
  @IsOptional()
  @IsString()
  publicId?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ example: 102400 })
  @IsOptional()
  @IsNumber()
  size?: number;
}
