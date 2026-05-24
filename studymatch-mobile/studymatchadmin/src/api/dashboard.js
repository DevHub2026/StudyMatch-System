import api from './axiosInstance'

export const getOverview    = () => api.get('/admin/dashboard/overview')
export const getSessionTrends = (days = 7) =>
  api.get('/admin/analytics/session-trends', { params: { days } })
export const getUserGrowth  = (days = 7) =>
  api.get('/admin/analytics/user-growth', { params: { days } })
export const getSubjectDemand = () =>
  api.get('/admin/analytics/subject-demand')