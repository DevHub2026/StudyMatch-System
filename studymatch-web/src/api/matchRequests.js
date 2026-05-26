import api from './axiosInstance'

// Get all match requests (sent + received)
export const getMatchRequests = () =>
  api.get('/match-requests')

// Send match request with optional message
export const sendMatchRequest = (receiverId, message = '') =>
  api.post('/match-requests/send', {
    receiver_user_id: receiverId,
    message
  })

// Accept incoming match request
export const acceptMatchRequest = (id) =>
  api.post(`/match-requests/${id}/accept`)

// Decline incoming match request
export const declineMatchRequest = (id) =>
  api.post(`/match-requests/${id}/decline`)

// Cancel sent match request
export const cancelMatchRequest = (id) =>
  api.delete(`/match-requests/${id}/cancel`)

// Incoming requests directed at the current tutor (raw TutorRequest objects)
export const getIncomingRequests = () =>
  api.get('/match-requests/incoming')

// Pending requests sent by the current user (not yet accepted)
export const getPendingRequests = () =>
  api.get('/match-requests/pending')