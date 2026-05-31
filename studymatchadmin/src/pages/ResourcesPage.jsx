import { useState, useEffect, useCallback } from 'react'
import api from '../api/axiosInstance'
import {
  Library, Search, Download, Trash2, Eye, FileText,
  Loader2, RefreshCw, X, Filter, ChevronDown, AlertTriangle,
  BookOpen, Users, TrendingDown,
} from 'lucide-react'

const TYPE_OPTS = ['All Types', 'PDF', 'DOCX', 'PPT', 'XLSX', 'Image', 'Video', 'Other']
const SORT_OPTS = ['Newest First', 'Oldest First', 'Most Downloads', 'Largest File', 'Alphabetical']
const SCOPE_OPTS = ['All Resources', 'Uploaded by Students', 'Uploaded by Tutors']

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileExt(name = '') {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : '?'
}

function getFileColor(name = '') {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const map = {
    pdf: { bg: '#FEF2F2', color: '#EF4444' },
    doc: { bg: '#EFF6FF', color: '#3B82F6' }, docx: { bg: '#EFF6FF', color: '#3B82F6' },
    ppt: { bg: '#FFF7ED', color: '#F97316' }, pptx: { bg: '#FFF7ED', color: '#F97316' },
    xls: { bg: '#F0FDF4', color: '#22C55E' }, xlsx: { bg: '#F0FDF4', color: '#22C55E' },
    jpg: { bg: '#F5F3FF', color: '#8B5CF6' }, jpeg: { bg: '#F5F3FF', color: '#8B5CF6' },
    png: { bg: '#F5F3FF', color: '#8B5CF6' }, gif: { bg: '#F5F3FF', color: '#8B5CF6' },
    mp4: { bg: '#FDF4FF', color: '#D946EF' }, mov: { bg: '#FDF4FF', color: '#D946EF' },
  }
  return map[ext] || { bg: '#F9FAFB', color: '#6B7280' }
}

function Dropdown({ value, options, onChange, minWidth = 140 }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', minWidth }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 8,
        cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151', userSelect: 'none',
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={12} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, background: 'white',
            border: '1px solid #E5E7EB', borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.10)', zIndex: 50, minWidth: '100%', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                  color: opt === value ? '#7C3AED' : '#374151',
                  fontWeight: opt === value ? 600 : 400,
                  background: opt === value ? '#F3F0FF' : 'white',
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#F8F9FB' }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'white' }}
              >{opt}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ConfirmDeleteModal({ resource, onConfirm, onCancel, deleting }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={22} color="#EF4444" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B' }}>Delete Resource</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>This action cannot be undone.</div>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: '#374151', marginBottom: 20, lineHeight: 1.5 }}>
          Are you sure you want to delete <strong>{resource?.title || resource?.file_name}</strong>? The file will be permanently removed.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: '10px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResourcesPage() {
  const [resources, setResources] = useState([])
  const [stats,     setStats]     = useState({ total: 0, totalSize: 0, totalDownloads: 0, uploaders: 0 })
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [typeFilter,  setTypeFilter]  = useState('All Types')
  const [sortBy,      setSortBy]      = useState('Newest First')
  const [scopeFilter, setScopeFilter] = useState('All Resources')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]    = useState(false)
  const [toast,  setToast]  = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/resources', {
        params: {
          search:    search.trim() || undefined,
          type:      typeFilter !== 'All Types' ? typeFilter.toLowerCase() : undefined,
          sort:      sortBy === 'Newest First' ? 'newest' : sortBy === 'Oldest First' ? 'oldest' : sortBy === 'Most Downloads' ? 'downloads' : sortBy === 'Largest File' ? 'size' : 'alpha',
          uploader:  scopeFilter === 'Uploaded by Students' ? 'student' : scopeFilter === 'Uploaded by Tutors' ? 'tutor' : undefined,
          per_page:  100,
        },
      })
      const list = res.data?.data || res.data?.resources || res.data || []
      const arr  = Array.isArray(list) ? list : []
      setResources(arr)
      setStats({
        total:          arr.length,
        totalSize:      arr.reduce((s, r) => s + (r.file_size || 0), 0),
        totalDownloads: arr.reduce((s, r) => s + (r.download_count || 0), 0),
        uploaders:      new Set(arr.map(r => r.uploader_id)).size,
      })
    } catch (err) {
      if (err?.response?.status === 404) {
        // Admin resources endpoint may not exist yet — fall back to regular endpoint
        try {
          const res2 = await api.get('/resources', { params: { per_page: 100 } })
          const arr2 = res2.data?.data || res2.data || []
          setResources(Array.isArray(arr2) ? arr2 : [])
          setStats({
            total:          Array.isArray(arr2) ? arr2.length : 0,
            totalSize:      Array.isArray(arr2) ? arr2.reduce((s, r) => s + (r.file_size || 0), 0) : 0,
            totalDownloads: Array.isArray(arr2) ? arr2.reduce((s, r) => s + (r.download_count || 0), 0) : 0,
            uploaders:      Array.isArray(arr2) ? new Set(arr2.map(r => r.uploader_id)).size : 0,
          })
        } catch {
          setError('Failed to load resources.')
        }
      } else {
        setError('Failed to load resources.')
      }
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, sortBy, scopeFilter])

  useEffect(() => {
    const t = setTimeout(load, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/resources/${deleteTarget.id}`)
      setResources(p => p.filter(r => r.id !== deleteTarget.id))
      setStats(p => ({ ...p, total: p.total - 1 }))
      showToast('Resource deleted successfully.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const STAT_CARDS = [
    { icon: Library,      color: '#7C3AED', bg: '#F3F0FF', value: stats.total,                        label: 'Total Resources'  },
    { icon: Download,     color: '#6366F1', bg: '#EEF2FF', value: stats.totalDownloads,               label: 'Total Downloads'  },
    { icon: TrendingDown, color: '#F59E0B', bg: '#FFFBEB', value: formatSize(stats.totalSize),         label: 'Storage Used'     },
    { icon: Users,        color: '#10B981', bg: '#F0FDF4', value: stats.uploaders,                    label: 'Active Uploaders' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .rp-wrap * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
        .rp-row { display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-bottom: 1px solid #F8F9FB; transition: background .12s; }
        .rp-row:last-child { border-bottom: none; }
        .rp-row:hover { background: #FAFAFA; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {deleteTarget && (
        <ConfirmDeleteModal resource={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 400, padding: '12px 18px', background: '#1E1B4B', color: 'white', borderRadius: 12, fontFamily: 'DM Sans, sans-serif', fontSize: 13.5, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ fontFamily: 'DM Sans, sans-serif', color: '#1E1B4B', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Resource Library</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage all uploaded study materials across the platform.</p>
          </div>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: 9, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
            <RefreshCw size={13} color="#7C3AED" /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {STAT_CARDS.map(({ icon: Icon, color, bg, value, label }) => (
            <div key={label} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8F9FB', border: '1px solid #E5E7EB', borderRadius: 9, padding: '8px 14px', flex: '1 1 220px' }}>
              <Search size={14} color="#9CA3AF" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by filename, title, uploader…"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#374151' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF', display: 'flex' }}><X size={13} /></button>}
            </div>
            <Dropdown value={typeFilter}  options={TYPE_OPTS}  onChange={setTypeFilter}  minWidth={130} />
            <Dropdown value={scopeFilter} options={SCOPE_OPTS} onChange={setScopeFilter} minWidth={180} />
            <Dropdown value={sortBy}      options={SORT_OPTS}  onChange={setSortBy}      minWidth={160} />
            {(typeFilter !== 'All Types' || scopeFilter !== 'All Resources' || search) && (
              <button onClick={() => { setTypeFilter('All Types'); setScopeFilter('All Resources'); setSearch('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                <X size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        {!loading && !error && (
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
            {resources.length} resource{resources.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>

          {/* Table header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', background: '#F8F9FB', borderBottom: '1px solid #F0F0F4', fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            <div style={{ flex: '0 0 36px' }} />
            <div style={{ flex: '1 1 240px' }}>File</div>
            <div style={{ flex: '0 0 140px' }}>Uploaded By</div>
            <div style={{ flex: '0 0 100px' }}>Subject</div>
            <div style={{ flex: '0 0 80px', textAlign: 'right' }}>Size</div>
            <div style={{ flex: '0 0 70px', textAlign: 'right' }}>Downloads</div>
            <div style={{ flex: '0 0 100px' }}>Date</div>
            <div style={{ flex: '0 0 90px', textAlign: 'right' }}>Actions</div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={18} color="#EF4444" />
              <span style={{ fontSize: 13.5, color: '#EF4444' }}>{error}</span>
              <button onClick={load} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : resources.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <BookOpen size={32} color="#DDD6FE" style={{ display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No resources found</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Try adjusting your filters or search terms.</div>
            </div>
          ) : resources.map(r => {
            const name   = r.title || r.file_name || 'Untitled'
            const ext    = getFileExt(r.file_name || name)
            const ft     = getFileColor(r.file_name || name)
            const uploader = r.uploader?.name || r.uploader_name || '—'
            const subject  = r.subject?.name || r.subject_name || '—'

            return (
              <div key={r.id} className="rp-row">
                {/* File type icon */}
                <div style={{ flex: '0 0 36px', width: 36, height: 44, borderRadius: 8, background: ft.bg, border: `1px solid ${ft.color}22`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
                  <FileText size={14} color={ft.color} />
                  <span style={{ fontSize: 7.5, fontWeight: 800, color: ft.color }}>{ext}</span>
                </div>

                {/* Title */}
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  {r.description && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>}
                </div>

                {/* Uploader */}
                <div style={{ flex: '0 0 140px', fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {uploader}
                  {r.uploader?.role && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: r.uploader.role === 'tutor' ? '#F3F0FF' : '#F0FDF4', color: r.uploader.role === 'tutor' ? '#7C3AED' : '#10B981', textTransform: 'capitalize' }}>
                      {r.uploader.role}
                    </span>
                  )}
                </div>

                {/* Subject */}
                <div style={{ flex: '0 0 100px', fontSize: 12.5, color: subject !== '—' ? '#7C3AED' : '#9CA3AF', fontWeight: subject !== '—' ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {subject}
                </div>

                {/* Size */}
                <div style={{ flex: '0 0 80px', fontSize: 12.5, color: '#6B7280', textAlign: 'right' }}>
                  {formatSize(r.file_size)}
                </div>

                {/* Downloads */}
                <div style={{ flex: '0 0 70px', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#6B7280' }}>
                    <Download size={11} color="#9CA3AF" /> {r.download_count || 0}
                  </span>
                </div>

                {/* Date */}
                <div style={{ flex: '0 0 100px', fontSize: 12.5, color: '#9CA3AF' }}>
                  {formatDate(r.created_at)}
                </div>

                {/* Actions */}
                <div style={{ flex: '0 0 90px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  {r.file_path && (
                    <a
                      href={`http://127.0.0.1:8000/storage/${r.file_path}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ width: 30, height: 30, borderRadius: 7, background: '#EEF2FF', border: '1px solid #E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                      title="Preview / Download"
                    >
                      <Eye size={13} color="#6366F1" />
                    </a>
                  )}
                  <button
                    onClick={() => setDeleteTarget(r)}
                    style={{ width: 30, height: 30, borderRadius: 7, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Delete resource"
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
