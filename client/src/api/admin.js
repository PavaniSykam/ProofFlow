import api from './client';

export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const createAdminUser = (data) => api.post('/admin/users', data);
export const updateAdminUser = (id, data) => api.patch(`/admin/users/${id}`, data);
export const deactivateAdminUser = (id) => api.post(`/admin/users/${id}/deactivate`, { confirmPendingReassignment: true });
export const resetAdminUserPassword = (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword });

export const getAdminDepartments = () => api.get('/admin/departments');
export const createAdminDepartment = (data) => api.post('/admin/departments', data);
export const updateAdminDepartment = (id, data) => api.patch(`/admin/departments/${id}`, data);

export const getAdminRoles = () => api.get('/admin/roles');
export const createAdminRole = (data) => api.post('/admin/roles', data);
export const updateAdminRole = (key, data) => api.patch(`/admin/roles/${key}`, data);

export const getAdminOrgChart = () => api.get('/admin/org-chart');
export const getAdminRequests = (params) => api.get('/admin/requests', { params });
export const reassignStageInstance = (id, newAssigneeId) =>
  api.post(`/admin/stage-instances/${id}/reassign`, { newAssigneeId });

export const userLookup = (params) => api.get('/admin/lookup', { params });
