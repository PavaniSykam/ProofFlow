import api from './client';

export const getMyRequests = (params) => api.get('/requests/mine', { params });
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const getRequestAudit = (id) => api.get(`/requests/${id}/audit`);
export const createDraft = (workflowId, formData) => api.post('/requests', { workflowId, formData });
export const updateDraft = (id, formData) => api.put(`/requests/${id}`, { formData });
export const submitRequest = (id) => api.post(`/requests/${id}/submit`);
export const resubmitRequest = (id, formData) => api.post(`/requests/${id}/resubmit`, { formData });
export const cancelRequest = (id) => api.post(`/requests/${id}/cancel`);
export const deleteDraft = (id) => api.delete(`/requests/${id}`);

export const uploadAttachment = (requestId, file, fieldKey) => {
  const data = new FormData();
  data.append('file', file);
  if (fieldKey) data.append('fieldKey', fieldKey);
  return api.post(`/requests/${requestId}/attachments`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAttachment = (id) => api.delete(`/attachments/${id}`);
