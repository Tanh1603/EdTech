import { existsSync } from 'fs';
import { dirname, join } from 'path';

function findUp(start: string, relativePath: string): string | undefined {
  let current = start;

  while (true) {
    const candidate = join(current, relativePath);

    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);

    if (parent === current) {
      return undefined;
    }

    current = parent;
  }
}

export function getProtoRoot(): string {
  const candidates = [
    findUp(process.cwd(), 'libs/contracts/proto'),
    findUp(__dirname, 'libs/contracts/proto'),
    findUp(process.cwd(), 'contracts/proto'),
    findUp(__dirname, 'contracts/proto'),
    join(process.cwd(), 'libs/contracts/proto'),
  ];

  return candidates.find((candidate): candidate is string => Boolean(candidate)) ?? candidates[candidates.length - 1]!;
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
