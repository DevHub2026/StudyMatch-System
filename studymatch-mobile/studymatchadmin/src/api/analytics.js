import api from './axiosInstance'

export const getAnalyticsOverview = () =>
  api.get('/admin/analytics/overview')

export const getSessionTrends = (days = 30) =>
  api.get('/admin/analytics/session-trends', { params: { days } })

export const getSubjectDemand = () =>
  api.get('/admin/analytics/subject-demand')

export const getUserGrowth = (days = 30) =>
  api.get('/admin/analytics/user-growth', { params: { days } })

export const getActivityTrends = (days = 7) =>
  api.get('/admin/analytics/activity', { params: { days } })