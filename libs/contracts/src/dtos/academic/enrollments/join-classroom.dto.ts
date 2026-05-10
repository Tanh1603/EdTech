import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class JoinClassroomDto {
  @ApiProperty({ example: 'ABC123', minLength: 4 })
  @IsString()
  @MinLength(4)
  inviteCode!: string;
}
