export const getToken = () =>
  localStorage.getItem('admin_token')

export const getUser = () => {
  const user = localStorage.getItem('admin_user')
  return user ? JSON.parse(user) : null
}

export const saveAuth = (token, user) => {
  localStorage.setItem('admin_token', token)
  localStorage.setItem('admin_user', JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
}

export const isAuthenticated = () =>
  !!localStorage.getItem('admin_token')