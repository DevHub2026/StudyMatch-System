import api from './axiosInstance'

export const login = (email, password) =>
  api.post('/admin/login', { email, password })

export const logout = () =>
  api.post('/admin/logout')

export const getMe = () =>
  api.get('/admin/me')