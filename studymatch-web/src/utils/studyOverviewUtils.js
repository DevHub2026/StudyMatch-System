export const SUBJECT_COLORS = ['#7C3AED', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899']
export const SUBJECT_BGS = ['#F3F0FF', '#EEF2FF', '#F0FDF4', '#FFFBEB', '#FEF2F2', '#FDF2F8']

export function subjectColor(index) {
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length]
}

export function subjectBg(index) {
  return SUBJECT_BGS[index % SUBJECT_BGS.length]
}

export function subjectInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export function findCatalogSubject(catalog, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q || !Array.isArray(catalog)) return null
  return catalog.find(s => {
    const name = (s.name || '').toLowerCase()
    const code = (s.code || '').toLowerCase()
    return name === q || code === q || name.includes(q) || q.includes(name)
  }) || null
}

export function formatOverviewDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function formatShortDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
