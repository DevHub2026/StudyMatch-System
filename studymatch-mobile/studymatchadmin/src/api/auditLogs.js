import api from './axiosInstance'

export const getAuditLogs = (params) =>
  api.get('/admin/audit-logs', { params })