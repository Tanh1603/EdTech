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
    join(root, 'common/json.proto'),
    join(root, 'academic/courses.proto'),
    join(root, 'academic/classrooms.proto'),
    join(root, 'academic/lessons.proto'),
    join(root, 'academic/enrollments.proto'),
  ];
}

export function getAllProtoPaths(): string[] {
  const root = getProtoRoot();
  return [
    join(root, 'common/pagination.proto'),
    join(root, 'common/envelope.proto'),
    join(root, 'common/json.proto'),
    join(root, 'academic/courses.proto'),
    join(root, 'academic/classrooms.proto'),
    join(root, 'academic/lessons.proto'),
    join(root, 'academic/enrollments.proto'),
    join(root, 'assessments/exams.proto'),
    join(root, 'assessments/questions.proto'),
    join(root, 'assessments/submissions.proto'),
    join(root, 'assessments/results.proto'),
    join(root, 'assessments/analytics.proto'),
    join(root, 'chat/sessions.proto'),
    join(root, 'chat/messages.proto'),
    join(root, 'chat/analytics.proto'),
    join(root, 'learning/materials.proto'),
    join(root, 'learning/roadmaps.proto'),
    join(root, 'learning/mastery.proto'),
    join(root, 'storage/storage.proto'),
    join(root, 'users/users.proto'),
  ];
}
