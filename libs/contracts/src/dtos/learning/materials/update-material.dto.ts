import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateMaterialDto {
  @ApiProperty({ example: 'Updated title', minLength: 2 })
  @IsString()
  @MinLength(2)
  title!: string;
}
