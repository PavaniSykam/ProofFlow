import api from './client';

export const getActiveWorkflows = () => api.get('/workflows');
export const getWorkflows = getActiveWorkflows;
export const getWorkflowById = (id) => api.get(`/workflows/${id}`);
export const getAdminWorkflows = () => api.get('/workflows/admin/all');
export const createWorkflow = (data) => api.post('/workflows/admin', data);
export const updateWorkflow = (id, data) => api.put(`/workflows/admin/${id}`, data);
export const toggleWorkflowActive = (id, isActive) => api.patch(`/workflows/admin/${id}/active`, { isActive });
export const getWorkflowVersions = (id) => api.get(`/workflows/admin/${id}/versions`);
