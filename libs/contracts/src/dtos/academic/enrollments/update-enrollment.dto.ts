import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClassRole } from '../../common';

export class UpdateEnrollmentDto {
  @ApiProperty({ enum: ClassRole, example: ClassRole.teacher })
  @IsEnum(ClassRole)
  role!: ClassRole;
}
