import api from './client';

export const generateSummary = (requestId) => api.post(`/ai/requests/${requestId}/summary`);
export const getSummary = (requestId) => api.get(`/ai/requests/${requestId}/summary`);
