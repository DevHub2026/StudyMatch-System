import api from './axiosInstance'

export const login = (email, password) =>
  api.post('/login', { email, password })

export const register = (data) =>
  api.post('/register', data)

export const logout = () =>
  api.post('/auth/logout')

export const getMe = () =>
  api.get('/auth/me')

export const verifyOtp = (otp) =>
  api.post('/auth/verify-email', { otp })

export const sendOtp = () =>
  api.post('/auth/resend-verification')

export const resendVerification = () =>
  api.post('/auth/resend-verification')

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email })

export const resetPassword = (data) =>
  api.post('/auth/reset-password', data)