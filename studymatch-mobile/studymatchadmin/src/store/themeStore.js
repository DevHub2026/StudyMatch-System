export const getTheme = () =>
  localStorage.getItem('admin_theme') ?? 'light'

export const saveTheme = (theme) =>
  localStorage.setItem('admin_theme', theme)

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