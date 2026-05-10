import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteFileDto {
  @ApiProperty({ example: 'edtech-ai/materials/sample-file' })
  @IsString()
  publicId!: string;
}
