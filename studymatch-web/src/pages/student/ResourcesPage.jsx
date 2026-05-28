import { useState, useEffect, useCallback } from 'react'
import {
  getResources, uploadResource, getLibraryStats, toggleFavorite, getResourcePreview,
} from '../../api/library'
import { getSubjects } from '../../api/subjects'
import {
  parseResourceList, resourceDisplayName, resourceSubjectName, formatFileSize,
  formatResourceDate, getFileStyle, getFileExt, canPreviewResource,
  sortParamFromLabel, typeParamFromLabel, triggerResourceDownload, toastStyle,
} from '../../utils/libraryUtils'
import {
  Search, Upload, Download, FileText, BookOpen, Loader2, RefreshCw,
  Eye, Bookmark, X,
} from 'lucide-react'

const TYPE_OPTS = ['All Types', 'PDF', 'DOCX', 'PPT', 'XLSX', 'Video']
const SORT_OPTS = ['Newest First', 'Oldest First', 'Most Downloads', 'Alphabetical']

function Dropdown({ value, options, onChange, minWidth = 140 }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', minWidth }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
        cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
      }}>
        <span style={{ flex: 1 }}>{value}</span>
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, background: 'white',
            border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
            zIndex: 50, minWidth: '100%',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                style={{ padding: '9px 14px', fontSize: 13.5, cursor: 'pointer',
                  background: opt === value ? '#F3F0FF' : 'white', fontWeight: opt === value ? 600 : 400 }}
              >{opt}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ResourceRow({ resource, onDownload, onPreview, onFavorite }) {
  const name = resourceDisplayName(resource)
  const ft = getFileStyle(name)
  const ext = getFileExt(name)
  const subject = resourceSubjectName(resource)
  const uploader = resource.uploader_name || resource.uploader?.name || ''

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
      borderBottom: '1px solid #F8F9FB', flexWrap: 'wrap',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
    >
      <div style={{
        width: 40, height: 48, borderRadius: 8, background: ft.bg,
        border: `1px solid ${ft.color}22`, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0,
      }}>
        <FileText size={16} color={ft.color} />
        <span style={{ fontSize: 8, fontWeight: 800, color: ft.color }}>{ext}</span>
      </div>
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {subject && <span style={{ color: '#7C3AED', fontWeight: 600, marginRight: 6 }}>{subject}</span>}
          {uploader && `From ${uploader}`}
          {resource.created_at && ` · ${formatResourceDate(resource.created_at)}`}
        </div>
      </div>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{formatFileSize(resource.file_size)}</span>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{resource.download_count || 0} downloads</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {canPreviewResource(resource) && (
          <button type="button" onClick={() => onPreview(resource)} style={actionBtn}>
            <Eye size={14} /> Preview
          </button>
        )}
        <button type="button" onClick={() => onFavorite(resource)} style={actionBtn}>
          <Bookmark size={14} color={resource.is_favorited ? '#7C3AED' : '#6B7280'} fill={resource.is_favorited ? '#7C3AED' : 'none'} />
        </button>
        <button type="button" onClick={() => onDownload(resource)} style={actionBtnPrimary}>
          <Download size={14} /> Download
        </button>
      </div>
    </div>
  )
}

const actionBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px',
  background: 'white', border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151',
}

const actionBtnPrimary = {
  ...actionBtn,
  background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE',
}

export default function StudentResourcesPage() {
  const [resources, setResources] = useState([])
  const [subjects, setSubjects] = useState([])
  const [stats, setStats] = useState({ total_resources: 0, total_downloads: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [subjFilter, setSubjFilter] = useState('All Subjects')
  const [sortBy, setSortBy] = useState('Newest First')
  const [activeTab, setActiveTab] = useState('all')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [previewOpen, setPreviewOpen] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type }), 4000)
  }

  const subjOptions = ['All Subjects', ...subjects.map(s => s.name)]

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const subjectId = subjects.find(s => s.name === subjFilter)?.id
      const params = {
        scope: activeTab === 'favorites' ? 'favorites' : activeTab === 'shared' ? 'shared' : 'all',
        sort: sortParamFromLabel(sortBy),
        search: search.trim() || undefined,
        type: typeParamFromLabel(typeFilter) || undefined,
        subject_id: subjectId || undefined,
        per_page: 50,
      }
      const [resData, statsData] = await Promise.all([
        getResources(params),
        getLibraryStats(),
      ])
      setResources(parseResourceList(resData))
      setStats(statsData || {})
    } catch {
      setError('Failed to load resources. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, typeFilter, subjFilter, sortBy, search, subjects])

  useEffect(() => {
    getSubjects().then(res => {
      const list = res?.data || res || []
      setSubjects(Array.isArray(list) ? list : [])
    }).catch(() => setSubjects([]))
  }, [])

  useEffect(() => {
    const t = setTimeout(loadAll, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadAll, search])

  const handleDownload = async (resource) => {
    try {
      await triggerResourceDownload(resource.id, resource.file_name || resourceDisplayName(resource))
      showToast('Download started.')
      loadAll()
    } catch {
      showToast('Download failed. Please try again.', 'error')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name)
    try {
      await uploadResource(fd)
      showToast('File uploaded successfully!')
      loadAll()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Upload failed.', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleFavorite = async (resource) => {
    try {
      const res = await toggleFavorite(resource.id)
      setResources(prev => prev.map(r => r.id === resource.id ? { ...r, is_favorited: res.is_favorited } : r))
    } catch {
      showToast('Could not update favorite.', 'error')
    }
  }

  const handlePreview = async (resource) => {
    try {
      const data = await getResourcePreview(resource.id)
      setPreviewOpen({ ...resource, ...data })
    } catch {
      showToast('Preview not available.', 'error')
    }
  }

  const t = toast.message ? toastStyle(toast.type) : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .rp-wrap * { box-sizing: border-box; }
        .rp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 16px; }
        .rp-tabs { display: flex; gap: 20px; border-bottom: 1px solid #F0F0F4; overflow-x: auto; }
        .rp-tab { padding: 9px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: inherit; white-space: nowrap; }
        .rp-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .rp-filters { flex-direction: column; align-items: stretch !important; }
        }
      `}</style>

      {toast.message && t && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          padding: '12px 18px', borderRadius: 12, fontWeight: 600, fontSize: 13.5,
          background: t.bg, border: `1px solid ${t.border}`, color: t.color,
        }}>
          {toast.message}
        </div>
      )}

      {previewOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setPreviewOpen(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 16, padding: 24, maxWidth: 720, width: '100%',
            maxHeight: '90vh', overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{resourceDisplayName(previewOpen)}</h3>
              <button type="button" onClick={() => setPreviewOpen(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {previewOpen.is_image || previewOpen.preview_url?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
              <img src={previewOpen.preview_url} alt="" style={{ maxWidth: '100%', borderRadius: 12 }} />
            ) : previewOpen.is_pdf ? (
              <iframe title="preview" src={previewOpen.preview_url} style={{ width: '100%', height: 480, border: 'none' }} />
            ) : (
              <p style={{ color: '#6B7280' }}>Use download to view this file.</p>
            )}
          </div>
        </div>
      )}

      <div className="rp-wrap">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Resources</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Access and download study materials from your tutors.</p>
          </div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            background: '#7C3AED', color: 'white', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
            cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1,
          }}>
            {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
            {uploading ? 'Uploading...' : 'Upload Resource'}
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="rp-tabs">
          {[
            { key: 'all', label: 'All Resources' },
            { key: 'shared', label: 'Shared with Me' },
            { key: 'favorites', label: 'Favorites' },
          ].map(({ key, label }) => (
            <button key={key} type="button" className={`rp-tab${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 16px',
        }}>
          <Search size={16} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search resources by name or subject..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit' }} />
        </div>

        <div className="rp-filters" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Dropdown value={typeFilter} options={TYPE_OPTS} onChange={setTypeFilter} />
          <Dropdown value={subjFilter} options={subjOptions} onChange={setSubjFilter} minWidth={160} />
          <Dropdown value={sortBy} options={SORT_OPTS} onChange={setSortBy} minWidth={160} />
        </div>

        {!loading && !error && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Available', value: stats.total_resources ?? resources.length, color: '#7C3AED' },
              { label: 'Total Downloads', value: stats.total_downloads ?? 0, color: '#10B981' },
              { label: 'Showing', value: resources.length, color: '#6366F1' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 12, padding: '12px 18px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ flex: 1, color: '#EF4444', fontSize: 13.5 }}>{error}</span>
            <button type="button" onClick={loadAll} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: 'white', border: '1px solid #FECACA', borderRadius: 8,
              color: '#EF4444', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && resources.length === 0 && (
          <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <BookOpen size={36} color="#DDD6FE" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No resources found</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 360, margin: '0 auto' }}>
              {activeTab === 'shared'
                ? 'Your tutors have not shared any materials yet. Connect with a tutor to receive resources.'
                : activeTab === 'favorites'
                  ? 'Bookmark resources to find them quickly here.'
                  : 'No study materials are available yet. Check back after your tutor shares files.'}
            </div>
          </div>
        )}

        {!loading && !error && resources.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
            {resources.map(r => (
              <ResourceRow key={r.id} resource={r}
                onDownload={handleDownload}
                onPreview={handlePreview}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
