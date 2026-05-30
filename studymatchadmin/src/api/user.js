import api from './axiosInstance'

export const getUsers = (params) =>
  api.get('/admin/users', { params })

export const createUser = (data) =>
  api.post('/admin/users', data)

export const getUser = (id) =>
  api.get(`/admin/users/${id}`)

export const updateUser = (id, data) =>
  api.put(`/admin/users/${id}`, data)

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`)

export const suspendUser = (id) =>
  api.post(`/admin/users/${id}/suspend`)

export const unsuspendUser = (id) =>
  api.post(`/admin/users/${id}/unsuspend`)

export const verifyUserEmail = (id) =>
  api.post(`/admin/users/${id}/verify-email`)

export const getPendingTutors = (params) =>
  api.get('/admin/tutors/pending', { params })

export const approveTutor = (id) =>
  api.post(`/admin/tutors/${id}/approve`)

export const rejectTutor = (id, data) =>
  api.post(`/admin/tutors/${id}/reject`, data)