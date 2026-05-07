import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class ReindexMaterialDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({ example: 500, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  chunkSize?: number;

  @ApiPropertyOptional({ example: 100, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  chunkOverlap?: number;
}
