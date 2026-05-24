import api from './axiosInstance'

export const generateReport = (type, from, to) =>
  api.get('/admin/reports/generate', { params: { type, from, to } })