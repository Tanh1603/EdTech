import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpsertMasteryDto } from './upsert-mastery.dto';

export class BulkUpsertMasteryDto {
  @ApiProperty({ type: [UpsertMasteryDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpsertMasteryDto)
  items!: UpsertMasteryDto[];
}
