import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateClassroomLessonDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  isPublished!: boolean;
}
