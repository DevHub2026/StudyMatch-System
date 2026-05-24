import api from './axiosInstance'

export const getComplaints = (params) =>
  api.get('/admin/complaints', { params })

export const getComplaint = (id) =>
  api.get(`/admin/complaints/${id}`)

export const updateComplaint = (id, data) =>
  api.put(`/admin/complaints/${id}`, data)