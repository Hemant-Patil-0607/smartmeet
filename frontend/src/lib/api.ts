import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
};

export const meetings = {
  list: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get('/meetings', { params }),
  get: (id: string) => api.get(`/meetings/${id}`),
  create: (data: { title?: string; meeting_date: string; source_type: string; participants?: string[] }) =>
    api.post('/meetings', data),
  delete: (id: string) => api.delete(`/meetings/${id}`),
  getTranscript: (id: string) => api.get(`/meetings/${id}/transcript`),
  getIntelligence: (id: string) => api.get(`/meetings/${id}/intelligence`),
  getProcessingStatus: (id: string) => api.get(`/meetings/${id}/processing-status`),
  getAudioUrl: (id: string) => api.get(`/meetings/${id}/audio-url`),
  startProcessing: (id: string) => api.post(`/meetings/${id}/process`),
  retryProcessing: (id: string) => api.post(`/meetings/${id}/retry`),
  getUploadUrl: (id: string, params: { filename: string; content_type: string; size: number }) =>
    api.post(`/meetings/${id}/upload-url`, null, { params }),
  confirmUpload: (id: string) => api.post(`/meetings/${id}/upload-complete`),
  submitTranscript: (id: string, text: string) =>
    api.post(`/meetings/${id}/transcript-text`, { text }),
};

export const ai = {
  chat: (meetingId: string, message: string, conversationId?: string) =>
    api.post(`/meetings/${meetingId}/chat`, { message, conversation_id: conversationId }),
  generateFollowUp: (meetingId: string, style?: string) =>
    api.post(`/meetings/${meetingId}/follow-up`, style ? { style } : undefined),
};

export const search = {
  meetings: (query: string, params?: { page?: number; limit?: number }) =>
    api.get('/search', { params: { q: query, ...params } }),
};
