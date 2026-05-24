import api from './axiosInstance'

export const getAnnouncements = (params) =>
  api.get('/admin/announcements', { params })

export const createAnnouncement = (data) =>
  api.post('/admin/announcements', data)

export const updateAnnouncement = (id, data) =>
  api.put(`/admin/announcements/${id}`, data)

export const deleteAnnouncement = (id) =>
  api.delete(`/admin/announcements/${id}`)