import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEmail } from 'class-validator';

export class ClassInvitesDto {
  @ApiProperty({
    example: ['student@example.com', 'parent@example.com'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  emails!: string[];
}
