import api from './client';

export const getDelegations = () => api.get('/delegations');
export const createDelegation = (data) => api.post('/delegations', data);
export const revokeDelegation = (id) => api.post(`/delegations/${id}/revoke`);
