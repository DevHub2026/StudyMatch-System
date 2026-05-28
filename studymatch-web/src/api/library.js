import api from './axiosInstance'

export const getLibraryStats = () =>
  api.get('/library/stats').then(r => r.data)

export const getResources = (params = {}) =>
  api.get('/library', { params }).then(r => r.data)

export const uploadResource = (formData) =>
  api.post('/library', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const downloadResource = (id) =>
  api.get(`/library/${id}/download`, { responseType: 'blob' })

export const getResourcePreview = (id) =>
  api.get(`/library/${id}/preview`).then(r => r.data)

export const deleteResource = (id) =>
  api.delete(`/library/${id}`).then(r => r.data)

export const getFolders = () =>
  api.get('/library/folders').then(r => r.data)

export const createFolder = (data) =>
  api.post('/library/folders', data).then(r => r.data)

export const getShareTargets = () =>
  api.get('/library/share-targets').then(r => r.data)

export const shareResource = (id, userIds) =>
  api.post(`/library/${id}/share`, { user_ids: userIds }).then(r => r.data)

export const toggleFavorite = (id) =>
  api.post(`/library/${id}/favorite`).then(r => r.data)
