import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../common';

export class CreateChatSessionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: 'Calculus Support', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;
}

export class UpdateChatSessionDto {
  @ApiProperty({ example: 'Updated Session', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;
}

export class ChatSessionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({ example: 'calculus' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class ChatMessagesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'cursor-message-id' })
  @IsOptional()
  @IsString()
  before?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'user', enum: ['user', 'assistant', 'system'] })
  @IsString()
  @IsIn(['user', 'assistant', 'system'])
  role!: string;

  @ApiProperty({ example: 'Explain derivatives in simple words', minLength: 1 })
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiPropertyOptional({ example: 'tutoring' })
  @IsOptional()
  @IsString()
  intent?: string;
}
