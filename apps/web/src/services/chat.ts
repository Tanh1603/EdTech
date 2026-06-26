import { apiClient } from '../lib/api-client';
import { Envelope } from './profile';

export interface ChatSession {
  id: string;
  classId?: string;
  title: string;
  userId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant';
  content: string;
  createdAt: string;
  role?: 'user' | 'assistant';
}

// -------------------------------------------------------------
// CHAT SESSION SERVICES
// -------------------------------------------------------------

export const createChatSession = async (data: { classId?: string; title: string }): Promise<Envelope<ChatSession>> => {
  return apiClient.post('/chat/sessions', data);
};

export const fetchChatSessions = async (): Promise<Envelope<ChatSession[]>> => {
  return apiClient.get('/chat/sessions');
};

export const updateChatSession = async (sessionId: string, data: { title: string }): Promise<Envelope<ChatSession>> => {
  return apiClient.patch(`/chat/sessions/${sessionId}`, data);
};

export const deleteChatSession = async (sessionId: string): Promise<Envelope<unknown>> => {
  return apiClient.delete(`/chat/sessions/${sessionId}`);
};

// -------------------------------------------------------------
// MESSAGE HISTORY SERVICES
// -------------------------------------------------------------

export const fetchChatMessages = async (
  sessionId: string, 
  params?: { page?: number; limit?: number }
): Promise<Envelope<ChatMessage[]>> => {
  return apiClient.get(`/chat/sessions/${sessionId}/messages`, { params });
};

// -------------------------------------------------------------
// AI ADVANCED SHORTCUT TOOLS
// -------------------------------------------------------------

export const explainTopic = async (data: { topic: string }): Promise<Envelope<{ explanation: string }>> => {
  return apiClient.post('/chat/ai/explain', data);
};

export const summarizeMaterial = async (data: { materialId: string }): Promise<Envelope<{ summary: string }>> => {
  return apiClient.post('/chat/ai/summarize', data);
};

export const generateQuiz = async (data: { 
  materialId: string; 
  difficulty: string; 
  count: number 
}): Promise<Envelope<{ quiz: unknown }>> => {
  return apiClient.post('/chat/ai/generate-quiz', data);
};
