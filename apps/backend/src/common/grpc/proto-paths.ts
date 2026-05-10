import { existsSync } from 'fs';
import { join } from 'path';

export function getProtoRoot(): string {
  const candidates = [
    join(process.cwd(), 'proto'),
    join(__dirname, '../../../../proto'),
    join(__dirname, '../../../../../proto'),
  ];

  const found = candidates.find((candidate) => existsSync(candidate));

  if (!found) {
    return candidates[0];
  }

  return found;
}

export function getAcademicProtoPaths(): string[] {
  const root = getProtoRoot();
  return [
    join(root, 'common/pagination.proto'),
    join(root, 'common/envelope.proto'),
    join(root, 'academic/courses.proto'),
    join(root, 'academic/classrooms.proto'),
    join(root, 'academic/lessons.proto'),
    join(root, 'academic/enrollments.proto'),
  ];
}
