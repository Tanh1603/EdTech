import { apiClient } from '../lib/api-client';
import { Envelope } from './profile';

export interface Material {
  id: string;
  lessonId: string;
  title: string;
  storageUrl: string;
  publicId: string;
  mimeType: string;
  size: number;
  status: 'uploaded' | 'indexing' | 'ready' | 'failed';
  createdAt: string;
}

export interface MaterialChunk {
  id: string;
  materialId: string;
  content: string;
  chunkIndex: number;
}

export interface Roadmap {
  id: string;
  title: string;
  targetGoal: string;
  userId: string;
  createdAt: string;
  items?: RoadmapItem[];
}

export interface RoadmapProgress {
  totalItems: number;
  completedItems: number;
  progressPercent: number;
}

export interface RoadmapItem {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  orderNo: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface TopicMastery {
  topic: string;
  masteryScore: number;
}

export interface MasteryAnalytics {
  averageMastery: number;
  strongestTopics: string[];
  weakestTopics: string[];
}

export interface RiskStudent {
  userId: string;
  fullName: string;
  email: string;
  averageMastery: number;
  weakestTopic: string;
}

// -------------------------------------------------------------
// STORAGE & MATERIALS SERVICES
// -------------------------------------------------------------

export const uploadFile = async (formData: FormData): Promise<Envelope<{
  storageUrl: string;
  publicId: string;
  mimeType: string;
  size: number;
}>> => {
  return apiClient.post('/storage/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const createMaterial = async (data: {
  lessonId: string;
  title: string;
  storageUrl: string;
  publicId: string;
  mimeType: string;
  size: number;
}): Promise<Envelope<Material>> => {
  return apiClient.post('/learning/materials', data);
};

export const fetchMaterials = async (params: { lessonId: string }): Promise<Envelope<Material[]>> => {
  return apiClient.get('/learning/materials', { params });
};

export const fetchMaterialChunks = async (materialId: string): Promise<Envelope<MaterialChunk[]>> => {
  return apiClient.get(`/learning/materials/${materialId}/chunks`);
};

// -------------------------------------------------------------
// ADAPTIVE ROADMAP SERVICES
// -------------------------------------------------------------

export const createRoadmap = async (data: { title: string; targetGoal: string }): Promise<Envelope<Roadmap>> => {
  return apiClient.post('/learning/roadmaps', data);
};

export const fetchRoadmaps = async (): Promise<Envelope<Roadmap[]>> => {
  return apiClient.get('/learning/roadmaps');
};

export const fetchRoadmapDetail = async (roadmapId: string): Promise<Envelope<Roadmap>> => {
  return apiClient.get(`/learning/roadmaps/${roadmapId}`);
};

export const fetchRoadmapProgress = async (roadmapId: string): Promise<Envelope<RoadmapProgress>> => {
  return apiClient.get(`/learning/roadmaps/${roadmapId}/progress`);
};

export const completeRoadmapItem = async (itemId: string): Promise<Envelope<unknown>> => {
  return apiClient.post(`/learning/roadmaps/items/${itemId}/complete`);
};

export const uncompleteRoadmapItem = async (itemId: string): Promise<Envelope<unknown>> => {
  return apiClient.post(`/learning/roadmaps/items/${itemId}/uncomplete`);
};

export const fetchNextRecommendedLesson = async (): Promise<Envelope<{
  lessonId?: string;
  title: string;
  reason?: string;
}>> => {
  return apiClient.get('/learning/roadmaps/next');
};

// -------------------------------------------------------------
// TOPIC MASTERY SERVICES
// -------------------------------------------------------------

export const fetchMyMastery = async (): Promise<Envelope<TopicMastery[]>> => {
  return apiClient.get('/learning/mastery/me');
};

export const fetchMyMasteryAnalytics = async (): Promise<Envelope<MasteryAnalytics>> => {
  return apiClient.get('/learning/mastery/analytics');
};

export const fetchClassMastery = async (classId: string): Promise<Envelope<TopicMastery[]>> => {
  return apiClient.get(`/learning/mastery/classes/${classId}`);
};

export const fetchRiskStudents = async (): Promise<Envelope<RiskStudent[]>> => {
  return apiClient.get('/learning/mastery/risk-students');
};
