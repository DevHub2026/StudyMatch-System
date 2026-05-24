import api from './axiosInstance'

export const getUsers = (params) =>
  api.get('/admin/users', { params })

export const getUser = (id) =>
  api.get(`/admin/users/${id}`)

export const updateUser = (id, data) =>
  api.put(`/admin/users/${id}`, data)

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`)

export const suspendUser = (id) =>
  api.post(`/admin/users/${id}/suspend`)