import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

class NotificationAudienceDto {
  @IsIn(['user_ids', 'class_id', 'role'])
  type!: 'user_ids' | 'class_id' | 'role';

  @IsArray()
  @IsString({ each: true })
  values!: string[];
}

export class CreateNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  audience!: NotificationAudienceDto;

  @IsOptional()
  @IsString()
  sendAt?: string;
}
