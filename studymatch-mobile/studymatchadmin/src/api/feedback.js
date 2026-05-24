import api from './axiosInstance'

export const getFeedback = (params) =>
  api.get('/admin/feedback', { params })

export const updateFeedback = (id, data) =>
  api.put(`/admin/feedback/${id}`, data)