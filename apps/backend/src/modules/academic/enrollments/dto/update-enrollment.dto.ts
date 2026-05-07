import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClassRole } from '../../../../generated/prisma/client';

export class UpdateEnrollmentDto {
  @ApiProperty({ enum: ClassRole, example: ClassRole.teacher })
  @IsEnum(ClassRole)
  role!: ClassRole;
}
