import api from './axiosInstance';

export const getSessions = async (params = {}) => {
  const query = typeof params === 'string' ? { status: params } : params
  const response = await api.get('/sessions', { params: query })
  return response.data
}

export const getSession = async (id) => {
  const response = await api.get(`/sessions/${id}`)
  return response.data
}

export const createSession = async (data) => {
  const response = await api.post('/sessions', data)
  return response.data
}

/** Tutor initiates a session request with a matched student */
export const requestSessionWithStudent = async (data) => {
  const response = await api.post('/sessions', {
    student_id:       data.student_id,
    student_user_id:  data.student_user_id,
    subject_id:       data.subject_id,
    scheduled_at:     data.scheduled_at,
    duration_minutes: data.duration_minutes ?? 60,
    session_type:     data.session_type ?? 'online',
    notes:            data.notes,
    session_link:     data.session_link,
  })
  return response.data
}

export const updateSession = async (id, data) => {
  const response = await api.put(`/sessions/${id}`, data)
  return response.data
}

export const cancelSession = async (id) => {
  const response = await api.delete(`/sessions/${id}`)
  return response.data
}

export const acceptSession = async (id) => {
  const response = await api.post(`/sessions/${id}/confirm`)
  return response.data
}

export const declineSession = async (id) => {
  const response = await api.put(`/sessions/${id}`, { status: 'cancelled' })
  return response.data
}

export const rescheduleSession = async (id, data) => {
  const response = await api.put(`/sessions/${id}`, data)
  return response.data
}

export const completeSession = async (id) => {
  const response = await api.put(`/sessions/${id}`, { status: 'completed' })
  return response.data
}
