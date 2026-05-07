import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ClassRole } from '../../../../generated/prisma/client';

export class CreateEnrollmentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsUUID()
  classId!: string;

  @ApiProperty({ example: 'user_123' })
  @IsString()
  userId!: string;

  @ApiProperty({ enum: ClassRole, example: ClassRole.student })
  @IsEnum(ClassRole)
  role!: ClassRole;
}
