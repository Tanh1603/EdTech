import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

export interface AcademicCoursesGrpc {
  getCourses(payload: unknown, metadata?: Metadata): Observable<any>;
  createCourse(payload: unknown, metadata?: Metadata): Observable<any>;
  getCourseDetail(payload: unknown, metadata?: Metadata): Observable<any>;
  updateCourse(payload: unknown, metadata?: Metadata): Observable<any>;
  deleteCourse(payload: unknown, metadata?: Metadata): Observable<any>;
}

export interface AcademicClassroomsGrpc {
  getClassrooms(payload: unknown, metadata?: Metadata): Observable<any>;
  createClassroom(payload: unknown, metadata?: Metadata): Observable<any>;
  getClassroomDetail(payload: unknown, metadata?: Metadata): Observable<any>;
  updateClassroom(payload: unknown, metadata?: Metadata): Observable<any>;
  deleteClassroom(payload: unknown, metadata?: Metadata): Observable<any>;
  regenerateInviteCode(payload: unknown, metadata?: Metadata): Observable<any>;
  inviteClassMembers(payload: unknown, metadata?: Metadata): Observable<any>;
}

export interface AcademicLessonsGrpc {
  createLesson(payload: unknown, metadata?: Metadata): Observable<any>;
  getLessonsByCourse(payload: unknown, metadata?: Metadata): Observable<any>;
  getLessonDetail(payload: unknown, metadata?: Metadata): Observable<any>;
  updateLesson(payload: unknown, metadata?: Metadata): Observable<any>;
  deleteLesson(payload: unknown, metadata?: Metadata): Observable<any>;
  publishLessonToClassroom(payload: unknown, metadata?: Metadata): Observable<any>;
  getClassroomLessons(payload: unknown, metadata?: Metadata): Observable<any>;
  updateClassroomLesson(payload: unknown, metadata?: Metadata): Observable<any>;
  removeLessonFromClassroom(payload: unknown, metadata?: Metadata): Observable<any>;
}

export interface AcademicEnrollmentsGrpc {
  joinClassroom(payload: unknown, metadata?: Metadata): Observable<any>;
  createEnrollment(payload: unknown, metadata?: Metadata): Observable<any>;
  getClassroomStudents(payload: unknown, metadata?: Metadata): Observable<any>;
  updateEnrollmentRole(payload: unknown, metadata?: Metadata): Observable<any>;
  removeEnrollment(payload: unknown, metadata?: Metadata): Observable<any>;
}
