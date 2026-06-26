import { apiClient } from '../lib/api-client';
import { Envelope } from './profile';

// -------------------------------------------------------------
// ENUMS & TYPES
// -------------------------------------------------------------

export type ExamStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'essay';
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// -------------------------------------------------------------
// INTERFACES
// -------------------------------------------------------------

export interface Exam {
  id: string;
  classId: string;
  title: string;
  description?: string;
  duration: number; // minutes
  status: ExamStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questionsCount?: number;
  creator?: {
    fullName?: string;
    email?: string;
    imageUrl?: string;
  };
  classroom?: {
    name: string;
    course?: { name: string };
  };
  submissions?: Submission[];
}

export interface Question {
  id: string;
  examId: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answerKey?: string | number | boolean | null;
  explanation?: string;
  points: number;
  orderNo: number;
}

export interface ExamAnalytics {
  examId: string;
  totalSubmissions: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  passRate: number;
}

export interface QuestionAnalytics {
  questionId: string;
  prompt: string;
  correctCount: number;
  incorrectCount: number;
  correctRate: number;
  averagePoints: number;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  status: SubmissionStatus;
  answers?: Record<string, unknown>;
  startAt: string;
  submittedAt?: string;
  result?: Result | null;
  exam?: Exam & { questions?: Question[] };
}

export interface Result {
  id: string;
  submissionId: string;
  score: number;
  feedback?: {
    comment?: string;
    perQuestionFeedback?: Record<string, { score: number; maxScore: number; comment: string }>;
  };
  gradedByAi: boolean;
  gradedAt?: string;
}

// -------------------------------------------------------------
// PAGING
// -------------------------------------------------------------

export interface PageEnvelope<T> {
  success: boolean;
  data: T[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// -------------------------------------------------------------
// EXAM SERVICES
// -------------------------------------------------------------

export const fetchExams = async (params?: {
  classId?: string;
  status?: ExamStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PageEnvelope<Exam>> => {
  return apiClient.get('/assessments/exams', { params });
};

export const createExam = async (data: {
  classId: string;
  title: string;
  description?: string;
  duration: number;
}): Promise<Envelope<Exam>> => {
  return apiClient.post('/assessments/exams', data);
};

export const generateExam = async (data: {
  classId: string;
  title: string;
  description?: string;
  duration: number;
  topic: string;
  difficulty: QuestionDifficulty;
  numberOfQuestions: number;
  questionTypes: QuestionType[];
  materialId?: string;
}): Promise<Envelope<Exam & { job?: { jobId: string; status: string; type: string } }>> => {
  return apiClient.post('/assessments/exams/generate', data);
};

export const getExamDetail = async (examId: string): Promise<Envelope<Exam>> => {
  return apiClient.get(`/assessments/exams/${examId}`);
};

export const updateExam = async (
  examId: string,
  data: { title?: string; description?: string; duration?: number },
): Promise<Envelope<Exam>> => {
  return apiClient.patch(`/assessments/exams/${examId}`, data);
};

export const deleteExam = async (examId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/assessments/exams/${examId}`);
};

export const publishExam = async (examId: string): Promise<Envelope<{ examId: string; status: ExamStatus }>> => {
  return apiClient.post(`/assessments/exams/${examId}/publish`);
};

export const closeExam = async (examId: string): Promise<Envelope<{ examId: string; status: string }>> => {
  return apiClient.post(`/assessments/exams/${examId}/close`);
};

// -------------------------------------------------------------
// QUESTION SERVICES
// -------------------------------------------------------------

export const fetchExamQuestions = async (examId: string): Promise<Envelope<Question[]>> => {
  return apiClient.get(`/assessments/exams/${examId}/questions`);
};

export const createQuestion = async (
  examId: string,
  data: {
    type: QuestionType;
    prompt: string;
    options?: string[];
    answerKey?: string | number | boolean | null;
    explanation?: string;
    points: number;
    orderNo?: number;
  },
): Promise<Envelope<Question>> => {
  return apiClient.post(`/assessments/exams/${examId}/questions`, data);
};

export const generateQuestions = async (
  examId: string,
  data: {
    topic: string;
    difficulty: QuestionDifficulty;
    numberOfQuestions: number;
    questionTypes: QuestionType[];
    materialId?: string;
  },
): Promise<Envelope<{ examId: string; job: { jobId: string; status: string; type: string } }>> => {
  return apiClient.post(`/assessments/exams/${examId}/questions/generate`, data);
};

export const updateQuestion = async (
  questionId: string,
  data: {
    prompt?: string;
    options?: string[];
    answerKey?: string | number | boolean | null;
    explanation?: string;
    points?: number;
  },
): Promise<Envelope<Question>> => {
  return apiClient.patch(`/assessments/questions/${questionId}`, data);
};

export const deleteQuestion = async (questionId: string): Promise<unknown> => {
  return apiClient.delete(`/assessments/questions/${questionId}`);
};

export const reorderQuestions = async (data: {
  examId: string;
  orderedIds: string[];
}): Promise<Envelope<unknown>> => {
  return apiClient.post('/assessments/questions/reorder', data);
};

// -------------------------------------------------------------
// ANALYTICS SERVICES
// -------------------------------------------------------------

export const getExamAnalytics = async (examId: string): Promise<Envelope<ExamAnalytics>> => {
  return apiClient.get(`/assessments/analytics/exams/${examId}`);
};

export const getQuestionAnalytics = async (examId: string): Promise<Envelope<QuestionAnalytics[]>> => {
  return apiClient.get(`/assessments/analytics/exams/${examId}/questions`);
};

// -------------------------------------------------------------
// SUBMISSION SERVICES (for students)
// -------------------------------------------------------------

export const startExam = async (
  examId: string,
): Promise<Envelope<{ submissionId: string; status: SubmissionStatus; startAt: string }>> => {
  return apiClient.post(`/assessments/exams/${examId}/start`);
};

export const getSubmissionDetail = async (submissionId: string): Promise<Envelope<Submission>> => {
  return apiClient.get(`/assessments/submissions/${submissionId}`);
};

export const autosaveAnswers = async (
  submissionId: string,
  data: { answers: unknown[] },
): Promise<Envelope<Submission>> => {
  return apiClient.patch(`/assessments/submissions/${submissionId}/answers`, data);
};

export const submitSubmission = async (submissionId: string): Promise<Envelope<Submission>> => {
  return apiClient.post(`/assessments/submissions/${submissionId}/submit`);
};

export const getResult = async (submissionId: string): Promise<Envelope<Result>> => {
  return apiClient.get(`/assessments/results/${submissionId}`);
};
