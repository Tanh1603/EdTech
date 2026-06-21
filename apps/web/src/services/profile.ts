import { apiClient } from '../lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  language: string;
  createdAt: string;
}

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  activeDays?: number;
}

export interface StudentAssessmentAnalytics {
  studentId: string;
  averageScore: number;
  completedExams: number;
  totalExamsTaken: number;
  passingRate?: number;
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta: unknown;
  error: unknown;
}

export const fetchProfile = async (): Promise<Envelope<UserProfile>> => {
  return apiClient.get('/auth/me');
};

export const fetchChatAnalytics = async (): Promise<Envelope<ChatAnalytics>> => {
  return apiClient.get('/chat/analytics/sessions/me');
};

export const fetchStudentAnalytics = async (studentId: string): Promise<Envelope<StudentAssessmentAnalytics>> => {
  return apiClient.get(`/assessments/analytics/students/${studentId}`);
};
