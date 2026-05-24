import api from './axiosInstance'

export const getSessions = (params) =>
  api.get('/admin/sessions', { params })

export const getSession = (id) =>
  api.get(`/admin/sessions/${id}`)

export const cancelSession = (id) =>
  api.delete(`/admin/sessions/${id}`)