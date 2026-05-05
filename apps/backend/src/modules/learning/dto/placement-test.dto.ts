import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

class PlacementAnswerDto {
  @IsString()
  questionId!: string;

  @IsString()
  answer!: string;
}

export class PlacementTestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlacementAnswerDto)
  answers!: PlacementAnswerDto[];
}
