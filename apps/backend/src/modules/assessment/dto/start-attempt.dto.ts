import { IsUUID } from 'class-validator';

export class StartAttemptDto {
  @IsUUID()
  studentId!: string;
}
