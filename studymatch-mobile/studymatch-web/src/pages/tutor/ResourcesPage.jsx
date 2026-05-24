import { useState, useEffect, useRef } from 'react'
import { getResources, uploadResource, downloadResource } from '../../api/library'
import {
  Upload, FolderPlus, MoreVertical, Download,
  Users, Folder, BarChart2, ChevronDown,
  SlidersHorizontal, ChevronRight, Share2,
  FileText, BookOpen, ArrowRight, Star, Loader2, RefreshCw,
} from 'lucide-react'

const TABS      = ['All Resources', 'My Resources', 'Shared Resources', 'Favorites']
const TYPE_OPTS = ['All Types', 'PDF', 'DOCX', 'PPT', 'XLSX', 'Video', 'Folder']
const SUBJ_OPTS = ['All Subjects', 'Calculus', 'Linear Algebra', 'Physics', 'Statistics', 'Computer Science']
const SORT_OPTS = ['Newest First', 'Oldest First', 'Most Downloads', 'Alphabetical']

const FILE_COLORS = {
  pdf:  { color: '#EF4444', bg: '#FEF2F2' },
  doc:  { color: '#6366F1', bg: '#EEF2FF' },
  docx: { color: '#6366F1', bg: '#EEF2FF' },
  ppt:  { color: '#F59E0B', bg: '#FFFBEB' },
  pptx: { color: '#F59E0B', bg: '#FFFBEB' },
  xls:  { color: '#10B981', bg: '#F0FDF4' },
  xlsx: { color: '#10B981', bg: '#F0FDF4' },
  mp4:  { color: '#7C3AED', bg: '#F3F0FF' },
}
const getFileStyle = (name = '') => FILE_COLORS[(name.split('.').pop() || '').toLowerCase()] || { color: '#6B7280', bg: '#F9FAFB' }
const getExt = (name = '') => (name.split('.').pop() || '').toUpperCase().slice(0, 4)

function Dropdown({ value, options, onChange, minWidth = 140 }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', minWidth }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#374151', userSelect: 'none' }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s', flexShrink: 0 }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '110%', left: 0, background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)', zIndex: 50, minWidth: '100%', overflow: 'hidden' }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }} style={{ padding: '9px 14px', fontSize: 13.5, color: opt === value ? '#7C3AED' : '#374151', fontWeight: opt === value ? 600 : 400, cursor: 'pointer', background: opt === value ? '#F3F0FF' : 'white' }}
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

function ResourceRow({ resource, onDownload }) {
  const name  = resource.title || resource.name || 'Untitled'
  const ft    = getFileStyle(name)
  const ext   = getExt(name)
  const date  = resource.created_at ? new Date(resource.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const size  = resource.file_size ? (resource.file_size > 1048576 ? `${(resource.file_size / 1048576).toFixed(1)} MB` : `${(resource.file_size / 1024).toFixed(0)} KB`) : ''
  const downloads = resource.downloads || resource.download_count || 0
  const subject = resource.subject || resource.category || ''
  const sharedWith = resource.shared_students_count ? `Shared with ${resource.shared_students_count} students` : ''

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: '1px solid #F8F9FB', transition: 'background .12s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 40, height: 48, borderRadius: 8, background: ft.bg, border: `1px solid ${ft.color}22`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, flexShrink: 0 }}>
        <FileText size={16} color={ft.color} />
        {ext && <span style={{ fontSize: 8, fontWeight: 800, color: ft.color }}>{ext}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {subject && <span style={{ color: '#7C3AED', fontWeight: 600, marginRight: 6 }}>{subject}</span>}
          {sharedWith}
        </div>
      </div>
      <div style={{ width: 110, flexShrink: 0, fontSize: 13, color: '#6B7280' }}>{date}</div>
      <div style={{ width: 70, flexShrink: 0, fontSize: 13, color: '#6B7280' }}>{size}</div>
      <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1B4B' }}>{downloads}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Downloads</div>
      </div>
      <button onClick={() => onDownload(resource.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
        <MoreVertical size={16} color="#D1D5DB" />
      </button>
    </div>
  )
}

export default function TutorResourcesPage() {
  const [resources,  setResources]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [uploadMsg,  setUploadMsg]  = useState('')
  const [activeTab,  setActiveTab]  = useState('All Resources')
  const [typeFilter, setType]       = useState('All Types')
  const [subjFilter, setSubj]       = useState('All Subjects')
  const [sortBy,     setSort]       = useState('Newest First')
  const [visible,    setVisible]    = useState(8)
  const fileRef = useRef(null)

  const fetchResources = async () => {
    setLoading(true); setError('')
    try {
      const res  = await getResources()
      const data = res?.data || res || []
      setResources(Array.isArray(data) ? data : [])
    } catch { setError('Failed to load resources.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchResources() }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadMsg('')
    const fd = new FormData(); fd.append('file', file); fd.append('title', file.name)
    try { await uploadResource(fd); setUploadMsg('Uploaded successfully!'); fetchResources() }
    catch { setUploadMsg('Upload failed.') }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleDownload = async (id) => {
    try {
      const res  = await downloadResource(id)
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a'); link.href = url; link.setAttribute('download', `resource-${id}`); document.body.appendChild(link); link.click(); link.remove()
    } catch {}
  }

  const filtered = resources.filter(r => {
    if (typeFilter !== 'All Types') {
      const ext = (r.title || r.name || '').split('.').pop()?.toUpperCase() || ''
      if (ext !== typeFilter) return false
    }
    if (subjFilter !== 'All Subjects' && r.subject !== subjFilter) return false
    return true
  })

  const totalDownloads = resources.reduce((s, r) => s + (r.downloads || r.download_count || 0), 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tr-wrap * { box-sizing: border-box; }
        .tr-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .tr-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .tr-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .tr-tab { padding: 9px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; white-space: nowrap; }
        .tr-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .action-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; }
        .action-row:last-child { border-bottom: none; }
        .action-row:hover { color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tr-wrap">
        <div className="tr-main">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Resources</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Organize, upload, and share study materials with your students.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={handleUpload} />
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <FolderPlus size={15} color="#7C3AED" /> Create Folder
              </button>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
                {uploading ? 'Uploading...' : 'Upload Resource'}
              </button>
            </div>
          </div>

          {uploadMsg && (
            <div style={{ padding: '10px 16px', borderRadius: 10, background: uploadMsg.includes('success') ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${uploadMsg.includes('success') ? '#BBF7D0' : '#FECACA'}`, fontSize: 13.5, color: uploadMsg.includes('success') ? '#10B981' : '#EF4444' }}>{uploadMsg}</div>
          )}

          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #F0F0F4' }}>
            {TABS.map(t => <button key={t} className={`tr-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>)}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Dropdown value={typeFilter} options={TYPE_OPTS} onChange={setType} minWidth={140} />
            <Dropdown value={subjFilter} options={SUBJ_OPTS} onChange={setSubj} minWidth={150} />
            <Dropdown value={sortBy}     options={SORT_OPTS} onChange={setSort}  minWidth={150} />
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <SlidersHorizontal size={14} color="#7C3AED" />
            </button>
          </div>

          {/* Stats banner */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 0 }}>
            {[
              { icon: FileText, color: '#7C3AED', bg: '#F3F0FF', value: resources.length, label: 'Total Resources'  },
              { icon: Download, color: '#10B981', bg: '#F0FDF4', value: totalDownloads > 999 ? `${(totalDownloads/1000).toFixed(1)}K` : totalDownloads, label: 'Total Downloads' },
              { icon: Users,    color: '#6366F1', bg: '#EEF2FF', value: 0, label: 'Students Reached' },
              { icon: Folder,   color: '#F59E0B', bg: '#FFFBEB', value: 0, label: 'Folders'          },
            ].map(({ icon: Icon, color, bg, value, label }, i) => (
              <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, borderRight: i < 3 ? '1px solid #F0F0F4' : 'none', padding: i === 0 ? '0 24px 0 0' : '0 24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={18} color={color} /></div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} /></div>}
          {error && !loading && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13.5, color: '#EF4444', flex: 1 }}>{error}</span>
              <button onClick={fetchResources} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 12 }}>All Resources ({filtered.length})</div>
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <FileText size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No resources yet</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Upload your first resource to get started.</div>
                  </div>
                ) : filtered.slice(0, visible).map(r => <ResourceRow key={r.id} resource={r} onDownload={handleDownload} />)}
              </div>
              {visible < filtered.length && (
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button onClick={() => setVisible(v => v + 4)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    View more <ChevronDown size={15} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tr-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 10 }}>Tutor Actions</div>
            {[
              { icon: Upload,    label: 'Upload Resource',    color: '#7C3AED', bg: '#F3F0FF' },
              { icon: FolderPlus,label: 'Create New Folder',  color: '#6366F1', bg: '#EEF2FF' },
              { icon: Share2,    label: 'Share a Resource',   color: '#10B981', bg: '#F0FDF4' },
              { icon: BookOpen,  label: 'Manage Resources',   color: '#F59E0B', bg: '#FFFBEB' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className="action-row">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={15} color={color} /></div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5, color: '#1E1B4B' }}>{label}</span>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>
            ))}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: 16, padding: '20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Star size={20} color="white" /></div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 8 }}>Grow Your Impact</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 16 }}>Upload quality resources and help more students succeed.</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', color: '#7C3AED', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              View Insights <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}