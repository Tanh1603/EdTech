import { Module } from '@nestjs/common';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { LessonsModule } from './lessons/lessons.module';

@Module({
  imports: [
    CoursesModule,
    ClassroomsModule,
    EnrollmentsModule,
    LessonsModule,
  ],
})
export class AcademicModule {}
