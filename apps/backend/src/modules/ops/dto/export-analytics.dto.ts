import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class ExportAnalyticsDto {
  @IsIn(['student', 'class', 'system'])
  scope!: 'student' | 'class' | 'system';

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsIn(['pdf', 'xlsx'])
  format!: 'pdf' | 'xlsx';
}
