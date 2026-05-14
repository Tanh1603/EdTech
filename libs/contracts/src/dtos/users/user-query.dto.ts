import { PaginationQueryDto } from '../common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../common';

export class UserQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;
}
