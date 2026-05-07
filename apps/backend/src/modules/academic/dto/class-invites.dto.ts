import { ArrayNotEmpty, IsArray, IsEmail } from 'class-validator';

export class ClassInvitesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  emails!: string[];
}
