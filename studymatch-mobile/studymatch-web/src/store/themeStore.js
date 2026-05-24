export const getTheme = () =>
  localStorage.getItem('user_theme') ?? 'light'

export const saveTheme = (theme) =>
  localStorage.setItem('user_theme', theme)

export const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const initTheme = () => {
  const theme = getTheme()
  applyTheme(theme)
  return theme
}