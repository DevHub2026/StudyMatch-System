import { useState, useEffect, useRef } from 'react'
import { getResources, uploadResource, downloadResource } from '../../api/library'
import {
  Search, Upload, Download, FileText, BookOpen,
  Loader2, RefreshCw, Filter, ChevronDown, Eye,
} from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────── */

const FILE_COLORS = {
  pdf:  { color: '#EF4444', bg: '#FEF2F2' },
  doc:  { color: '#6366F1', bg: '#EEF2FF' },
  docx: { color: '#6366F1', bg: '#EEF2FF' },
  ppt:  { color: '#F59E0B', bg: '#FFFBEB' },
  pptx: { color: '#F59E0B', bg: '#FFFBEB' },
  xls:  { color: '#10B981', bg: '#F0FDF4' },
  xlsx: { color: '#10B981', bg: '#F0FDF4' },
  mp4:  { color: '#7C3AED', bg: '#F3F0FF' },
  default: { color: '#6B7280', bg: '#F9FAFB' },
}

function getFileType(name = '') {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  return FILE_COLORS[ext] || FILE_COLORS.default
}

function getExt(name = '') {
  return (name.split('.').pop() || '').toUpperCase().slice(0, 4)
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ─── resource row ────────────────────────────────────────── */

function ResourceRow({ resource, onDownload }) {
  const name  = resource.title || resource.name || 'Untitled'
  const ft    = getFileType(name)
  const ext   = getExt(name)
  const size  = formatSize(resource.file_size || resource.size)
  const date  = formatDate(resource.created_at || resource.uploaded_at)
  const views = resource.views || resource.view_count || 0
  const downloads = resource.downloads || resource.download_count || 0
  const subject = resource.subject || resource.category || ''
  const uploader = resource.uploader?.name || resource.uploaded_by || ''

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 20px', borderBottom: '1px solid #F8F9FB',
      transition: 'background .12s', cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* File icon */}
      <div style={{
        width: 40, height: 48, borderRadius: 8,
        background: ft.bg, border: `1px solid ${ft.color}22`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2, flexShrink: 0,
      }}>
        <FileText size={16} color={ft.color} />
        <span style={{ fontSize: 8, fontWeight: 800, color: ft.color }}>{ext}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {subject && <span style={{ color: '#7C3AED', fontWeight: 600, marginRight: 6 }}>{subject}</span>}
          {uploader && `Uploaded by ${uploader}`}
          {date && ` · ${date}`}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {size && <span style={{ fontSize: 13, color: '#6B7280' }}>{size}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280' }}>
          <Eye size={13} color="#9CA3AF" /> {views}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280' }}>
          <Download size={13} color="#9CA3AF" /> {downloads}
        </div>
        <button onClick={() => onDownload(resource.id)} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', background: '#F3F0FF',
          color: '#7C3AED', border: '1px solid #DDD6FE',
          borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  )
}

/* ─── main page ───────────────────────────────────────────── */

export default function StudentResourcesPage() {
  const [resources,  setResources]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [search,     setSearch]     = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [uploadMsg,  setUploadMsg]  = useState('')
  const fileRef = useRef(null)

  const fetchResources = async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const res  = await getResources(params)
      const data = res?.data || res || []
      setResources(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load resources. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchResources() }, [])

  const handleDownload = async (id) => {
    try {
      const res  = await downloadResource(id)
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `resource-${id}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {}
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name)
    try {
      await uploadResource(fd)
      setUploadMsg('File uploaded successfully!')
      fetchResources()
    } catch {
      setUploadMsg('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const filtered = resources.filter(r => {
    const name = r.title || r.name || ''
    const subj = r.subject || r.category || ''
    return !search || name.toLowerCase().includes(search.toLowerCase()) || subj.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .rp-wrap * { box-sizing: border-box; }
        .rp-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="rp-wrap">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Resources</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Access and share study materials.</p>
          </div>
          <div>
            <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: '#7C3AED', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
              cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: uploading ? 0.7 : 1, transition: 'background .15s',
            }}>
              {uploading
                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                : <Upload size={15} />
              }
              {uploading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </div>
        </div>

        {/* Upload message */}
        {uploadMsg && (
          <div style={{
            padding: '10px 16px', borderRadius: 10,
            background: uploadMsg.includes('success') ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${uploadMsg.includes('success') ? '#BBF7D0' : '#FECACA'}`,
            fontSize: 13.5, color: uploadMsg.includes('success') ? '#10B981' : '#EF4444',
          }}>
            {uploadMsg}
          </div>
        )}

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: 12, padding: '10px 16px',
        }}>
          <Search size={16} color="#9CA3AF" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search resources by name or subject..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#374151' }} />
        </div>

        {/* Stats */}
        {!loading && (
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { label: 'Total Resources', value: resources.length, color: '#7C3AED' },
              { label: 'Filtered Results', value: filtered.length, color: '#10B981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 12, padding: '12px 18px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13.5, color: '#EF4444', flex: 1 }}>{error}</span>
            <button onClick={() => fetchResources()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <BookOpen size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No resources found</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>
              {resources.length === 0 ? 'No resources available yet.' : 'Try a different search term.'}
            </div>
          </div>
        )}

        {/* Resource list */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: '#F8F9FB', borderBottom: '1px solid #F0F0F4', display: 'flex', gap: 14 }}>
              {['Resource', 'Size', 'Views', 'Downloads', 'Action'].map(h => (
                <div key={h} style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px', flex: h === 'Resource' ? 1 : undefined, width: h === 'Resource' ? undefined : h === 'Action' ? 100 : 80 }}>
                  {h}
                </div>
              ))}
            </div>
            {filtered.map(r => (
              <ResourceRow key={r.id} resource={r} onDownload={handleDownload} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}