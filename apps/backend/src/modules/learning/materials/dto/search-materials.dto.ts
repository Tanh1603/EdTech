import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class SearchMaterialsDto {
  @ApiProperty({ example: 'integral formulas' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  topK?: number = 5;
}
