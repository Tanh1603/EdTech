import { apiClient } from '../lib/api-client';
import { Envelope } from './profile';

export interface Course {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  teacherId: string;
  createdAt: string;
}

export interface Classroom {
  id: string;
  courseId: string;
  name: string;
  inviteCode: string;
  startAt?: string;
  endAt?: string;
  createdAt: string;
  course?: { name: string };
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderNo: number;
  createdAt: string;
}

export interface ClassroomLesson {
  classroomId?: string;
  lessonId: string;
  isPublished: boolean;
  title?: string;
  description?: string;
  orderNo?: number;
  publishedAt?: string;
  lesson?: Lesson; // Linked details
}

export interface Enrollment {
  id: string;
  classId: string;
  userId: string;
  role: string;
  createdAt: string;
  user?: {
    fullName?: string;
    email?: string;
    imageUrl?: string;
  };
}

// Pagination metadata
export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Services
// -------------------------------------------------------------

// Courses
export const fetchCourses = async (params?: { search?: string; page?: number; limit?: number; teacherId?: string }): Promise<Envelope<Course[]>> => {
  return apiClient.get('/courses', { params });
};

export const createCourse = async (data: { name: string; description?: string; thumbnailUrl?: string; teacherId?: string }): Promise<Envelope<Course>> => {
  return apiClient.post('/courses', data);
};

export const fetchCourseDetail = async (courseId: string): Promise<Envelope<Course>> => {
  return apiClient.get(`/courses/${courseId}`);
};

export const updateCourse = async (courseId: string, data: { name: string; description?: string; thumbnailUrl?: string }): Promise<Envelope<Course>> => {
  return apiClient.patch(`/courses/${courseId}`, data);
};

export const deleteCourse = async (courseId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/courses/${courseId}`);
};

// Classrooms
export const fetchClassrooms = async (params?: { courseId?: string; page?: number; limit?: number }): Promise<Envelope<Classroom[]>> => {
  return apiClient.get('/classes', { params });
};

export const createClassroom = async (data: { courseId: string; name: string; inviteCode?: string; startAt?: string; endAt?: string }): Promise<Envelope<Classroom>> => {
  return apiClient.post('/classes', data);
};

export const fetchClassroomDetail = async (classroomId: string): Promise<Envelope<Classroom>> => {
  return apiClient.get(`/classes/${classroomId}`);
};

export const updateClassroom = async (classroomId: string, data: { name: string; startAt?: string; endAt?: string }): Promise<Envelope<Classroom>> => {
  return apiClient.patch(`/classes/${classroomId}`, data);
};

export const deleteClassroom = async (classroomId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/classes/${classroomId}`);
};

export const regenerateInviteCode = async (classroomId: string): Promise<Envelope<Classroom>> => {
  return apiClient.post(`/classes/${classroomId}/regenerate-invite-code`);
};

// Enrollments
export const joinClassroom = async (inviteCode: string): Promise<Envelope<Enrollment>> => {
  return apiClient.post('/enrollments/join', { inviteCode });
};

export const fetchClassroomStudents = async (classroomId: string): Promise<Envelope<Enrollment[]>> => {
  // Returns raw array after unwrapListResponse in gateway
  return apiClient.get(`/classrooms/${classroomId}/students`);
};

export const removeEnrollment = async (enrollmentId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/enrollments/${enrollmentId}`);
};

// Lessons
export const createLesson = async (data: { courseId: string; title: string; description?: string; orderNo: number }): Promise<Envelope<Lesson>> => {
  return apiClient.post('/lessons', data);
};

export const fetchLessonsByCourse = async (courseId: string, params?: { page?: number; limit?: number }): Promise<Envelope<Lesson[]>> => {
  return apiClient.get(`/courses/${courseId}/lessons`, { params });
};

export const fetchLessonDetail = async (lessonId: string): Promise<Envelope<Lesson>> => {
  return apiClient.get(`/lessons/${lessonId}`);
};

export const updateLesson = async (lessonId: string, data: { title: string; description?: string; orderNo: number }): Promise<Envelope<Lesson>> => {
  return apiClient.patch(`/lessons/${lessonId}`, data);
};

export const deleteLesson = async (lessonId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/lessons/${lessonId}`);
};

// Classroom Lesson Publishing
export const publishLessonToClassroom = async (classroomId: string, data: { lessonId: string; isPublished: boolean }): Promise<Envelope<ClassroomLesson>> => {
  return apiClient.post(`/classes/${classroomId}/lessons`, data);
};

export const fetchClassroomLessons = async (classroomId: string, params?: { publishedOnly?: boolean }): Promise<Envelope<ClassroomLesson[]>> => {
  // Returns array directly after unwrapListResponse in gateway
  return apiClient.get(`/classes/${classroomId}/lessons`, { params });
};

export const updateClassroomLesson = async (classroomId: string, lessonId: string, isPublished: boolean): Promise<Envelope<ClassroomLesson>> => {
  return apiClient.patch(`/classes/${classroomId}/lessons/${lessonId}`, { isPublished });
};

export const removeLessonFromClassroom = async (classroomId: string, lessonId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/classes/${classroomId}/lessons/${lessonId}`);
};
