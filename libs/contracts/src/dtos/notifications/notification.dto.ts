import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBooleanString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../common';
import { UserSummaryDto } from '../users';

export const NotificationAudienceTypes = {
  userIds: 'user_ids',
  classId: 'class_id',
  role: 'role',
} as const;

export type NotificationAudienceType =
  (typeof NotificationAudienceTypes)[keyof typeof NotificationAudienceTypes];

export class NotificationAudienceDto {
  @ApiProperty({ enum: Object.values(NotificationAudienceTypes) })
  @IsIn(Object.values(NotificationAudienceTypes))
  type!: NotificationAudienceType;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  values!: string[];
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty({ type: NotificationAudienceDto })
  @ValidateNested()
  @Type(() => NotificationAudienceDto)
  audience!: NotificationAudienceDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  resourceId?: string;
}

export class NotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBooleanString()
  isRead?: string;
}

export class NotificationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  user?: UserSummaryDto;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  isRead!: boolean;

  @ApiProperty()
  createdAt!: string;
}

