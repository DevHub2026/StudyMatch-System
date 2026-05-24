import api from './axiosInstance'

export const getResources = (params) =>
  api.get('/library', { params })

export const uploadResource = (formData) =>
  api.post('/library', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const downloadResource = (id) =>
  api.get(`/library/${id}/download`, { responseType: 'blob' })