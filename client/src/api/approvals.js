import api from './client';

export const getInbox = (params) => api.get('/approvals/inbox', { params });
export const approveStage = (stageInstanceId, comment) =>
  api.post(`/approvals/${stageInstanceId}/approve`, { comment });
export const rejectStage = (stageInstanceId, comment) =>
  api.post(`/approvals/${stageInstanceId}/reject`, { comment });
export const requestChanges = (stageInstanceId, comment) =>
  api.post(`/approvals/${stageInstanceId}/request-changes`, { comment });
