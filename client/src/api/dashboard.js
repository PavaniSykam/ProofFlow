import api from './client';

export const getEmployeeDashboard = () => api.get('/dashboard/employee');
export const getApproverDashboard = () => api.get('/dashboard/approver');
