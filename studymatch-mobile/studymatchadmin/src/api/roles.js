import api from './axiosInstance'

export const getRoles = () =>
  api.get('/admin/roles')

export const assignRole = (userId, role) =>
  api.post(`/admin/users/${userId}/assign-role`, { role })

export const revokeRole = (userId, role) =>
  api.post(`/admin/users/${userId}/revoke-role`, { role })