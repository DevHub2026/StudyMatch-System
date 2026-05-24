export const getToken = () =>
  localStorage.getItem('user_token')

export const getUser = () => {
  const user = localStorage.getItem('user_data')
  return user ? JSON.parse(user) : null
}

export const saveAuth = (token, user) => {
  localStorage.setItem('user_token', token)
  localStorage.setItem('user_data', JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem('user_token')
  localStorage.removeItem('user_data')
}

export const isAuthenticated = () =>
  !!localStorage.getItem('user_token')