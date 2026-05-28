export function parseResourceList(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  return []
}

export function resourceDisplayName(r) {
  return r?.title || r?.file_name || 'Untitled'
}

export function resourceSubjectName(r) {
  if (!r) return ''
  if (typeof r.subject === 'string') return r.subject
  return r.subject?.name || r.subject_name || r.category || ''
}

export function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatResourceDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getFileStyle(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const MAP = {
    pdf:  { color: '#EF4444', bg: '#FEF2F2' },
    doc:  { color: '#6366F1', bg: '#EEF2FF' },
    docx: { color: '#6366F1', bg: '#EEF2FF' },
    ppt:  { color: '#F59E0B', bg: '#FFFBEB' },
    pptx: { color: '#F59E0B', bg: '#FFFBEB' },
    xls:  { color: '#10B981', bg: '#F0FDF4' },
    xlsx: { color: '#10B981', bg: '#F0FDF4' },
    mp4:  { color: '#7C3AED', bg: '#F3F0FF' },
    jpg:  { color: '#EC4899', bg: '#FDF2F8' },
    jpeg: { color: '#EC4899', bg: '#FDF2F8' },
    png:  { color: '#EC4899', bg: '#FDF2F8' },
  }
  return MAP[ext] || { color: '#6B7280', bg: '#F9FAFB' }
}

export function getFileExt(name = '') {
  return (name.split('.').pop() || '').toUpperCase().slice(0, 4)
}

export function canPreviewResource(r) {
  const type = r?.file_type || ''
  const name = (r?.file_name || r?.title || '').toLowerCase()
  return type.startsWith('image/') || type === 'application/pdf' || /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(name)
}

export function scopeFromTab(tab) {
  const MAP = {
    'All Resources': 'all',
    'My Resources': 'mine',
    'Shared Resources': 'shared',
    'Favorites': 'favorites',
  }
  return MAP[tab] || 'all'
}

export function sortParamFromLabel(label) {
  const MAP = {
    'Newest First': 'newest',
    'Oldest First': 'oldest',
    'Most Downloads': 'downloads',
    'Alphabetical': 'alphabetical',
  }
  return MAP[label] || 'newest'
}

export function typeParamFromLabel(label) {
  if (!label || label === 'All Types' || label === 'Folder') return ''
  const MAP = {
    PDF: 'pdf',
    DOCX: 'docx',
    PPT: 'ppt',
    XLSX: 'xlsx',
    Video: 'video',
  }
  return MAP[label] || label.toLowerCase()
}

export async function triggerResourceDownload(id, fallbackName = 'download') {
  const { downloadResource } = await import('../api/library')
  const res = await downloadResource(id)
  const disposition = res.headers?.['content-disposition'] || ''
  let filename = fallbackName
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (match?.[1]) {
    filename = match[1].replace(/['"]/g, '')
  }
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export function toastStyle(type) {
  if (type === 'success') {
    return { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' }
  }
  return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' }
}
