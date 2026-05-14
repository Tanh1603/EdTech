import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';
import { UserRole } from '../common';

export class AssignUserRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(Object.values(UserRole), { each: true })
  roles!: UserRole[];
}

