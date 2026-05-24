import api from './axiosInstance'

export const getTickets = (params) =>
  api.get('/admin/help-center', { params })

export const getTicket = (id) =>
  api.get(`/admin/help-center/${id}`)

export const respondToTicket = (id, admin_response) =>
  api.post(`/admin/help-center/${id}/respond`, { admin_response })