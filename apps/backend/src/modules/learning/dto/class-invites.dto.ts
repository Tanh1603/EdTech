import { IsArray, IsEmail } from 'class-validator';

export class ClassInvitesDto {
  @IsArray()
  @IsEmail({}, { each: true })
  emails!: string[];
}
