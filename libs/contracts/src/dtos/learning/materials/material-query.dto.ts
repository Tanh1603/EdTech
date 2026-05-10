import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaterialStatus, PaginationQueryDto } from '../../common';

export class MaterialQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  lessonId?: string;

  @ApiPropertyOptional({ enum: MaterialStatus })
  @IsOptional()
  @IsEnum(MaterialStatus)
  status?: MaterialStatus;

  @ApiPropertyOptional({ example: 'chapter' })
  @IsOptional()
  @IsString()
  search?: string;
}
