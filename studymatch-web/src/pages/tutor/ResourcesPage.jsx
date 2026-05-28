import { useState, useEffect, useCallback } from 'react'
import {
  getResources, uploadResource, getLibraryStats, getFolders, createFolder,
  getShareTargets, shareResource, toggleFavorite, deleteResource, getResourcePreview,
} from '../../api/library'
import { getSubjects } from '../../api/subjects'
import {
  parseResourceList, resourceDisplayName, resourceSubjectName, formatFileSize,
  formatResourceDate, getFileStyle, getFileExt, canPreviewResource,
  scopeFromTab, sortParamFromLabel, typeParamFromLabel, triggerResourceDownload, toastStyle,
} from '../../utils/libraryUtils'
import {
  Upload, FolderPlus, Download, Users, Folder, FileText,
  ChevronDown, Share2, BookOpen, ArrowRight, Star, Loader2, RefreshCw,
  X, Eye, Trash2, Bookmark, Search,
} from 'lucide-react'

const TABS = ['All Resources', 'My Resources', 'Shared Resources', 'Favorites']
const TYPE_OPTS = ['All Types', 'PDF', 'DOCX', 'PPT', 'XLSX', 'Video']
const SORT_OPTS = ['Newest First', 'Oldest First', 'Most Downloads', 'Alphabetical']

function Dropdown({ value, options, onChange, minWidth = 140 }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', minWidth }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: 'white', border: '1px solid #E5E7EB', borderRadius: 10,
        cursor: 'pointer', fontSize: 13.5, fontWeight: 500, color: '#374151',
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0, background: 'white',
            border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
            zIndex: 50, minWidth: '100%', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  padding: '9px 14px', fontSize: 13.5, cursor: 'pointer',
                  color: opt === value ? '#7C3AED' : '#374151',
                  fontWeight: opt === value ? 600 : 400,
                  background: opt === value ? '#F3F0FF' : 'white',
                }}
              >{opt}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Toast({ message, type, onClose }) {
  if (!message) return null
  const s = toastStyle(type)
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 3000,
      padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxWidth: 360,
    }}>
      {message}
      <button type="button" onClick={onClose} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: s.color }}>×</button>
    </div>
  )
}

function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.65)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#FFFFFF', borderRadius: 18, padding: 26, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(15,23,42,.35)', border: '1px solid #E5E7EB',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, alignItems: 'center' }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: '#111827' }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ResourceRow({ resource, onDownload, onPreview, onShare, onFavorite, onDelete }) {
  const name = resourceDisplayName(resource)
  const ft = getFileStyle(name)
  const ext = getFileExt(name)
  const subject = resourceSubjectName(resource)
  const shared = resource.shared_students_count || 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
      borderBottom: '1px solid #F8F9FB', flexWrap: 'wrap',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
    >
      <button type="button" onClick={() => onPreview(resource)} style={{
        width: 40, height: 48, borderRadius: 8, background: ft.bg, border: `1px solid ${ft.color}22`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, flexShrink: 0, cursor: 'pointer', padding: 0,
      }}>
        <FileText size={16} color={ft.color} />
        {ext && <span style={{ fontSize: 8, fontWeight: 800, color: ft.color }}>{ext}</span>}
      </button>

      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {subject && <span style={{ color: '#7C3AED', fontWeight: 600, marginRight: 6 }}>{subject}</span>}
          {shared > 0 ? `Shared with ${shared} student${shared !== 1 ? 's' : ''}` : 'Not shared yet'}
          {resource.folder_name && ` · ${resource.folder_name}`}
        </div>
      </div>

      <div style={{ width: 100, flexShrink: 0, fontSize: 13, color: '#6B7280' }}>{formatResourceDate(resource.created_at)}</div>
      <div style={{ width: 70, flexShrink: 0, fontSize: 13, color: '#6B7280' }}>{formatFileSize(resource.file_size)}</div>
      <div style={{ width: 72, flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{resource.download_count || 0}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Downloads</div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {canPreviewResource(resource) && (
          <button type="button" title="Preview" onClick={() => onPreview(resource)} style={iconBtn}>
            <Eye size={15} color="#7C3AED" />
          </button>
        )}
        <button type="button" title="Download" onClick={() => onDownload(resource)} style={iconBtn}>
          <Download size={15} color="#7C3AED" />
        </button>
        <button type="button" title="Share" onClick={() => onShare(resource)} style={iconBtn}>
          <Share2 size={15} color="#10B981" />
        </button>
        <button type="button" title="Favorite" onClick={() => onFavorite(resource)} style={iconBtn}>
          <Bookmark size={15} color={resource.is_favorited ? '#7C3AED' : '#D1D5DB'} fill={resource.is_favorited ? '#7C3AED' : 'none'} />
        </button>
        <button type="button" title="Delete" onClick={() => onDelete(resource)} style={iconBtn}>
          <Trash2 size={15} color="#EF4444" />
        </button>
      </div>
    </div>
  )
}

const iconBtn = {
  background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 8,
  padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
}

const fieldStyle = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB',
  borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function TutorResourcesPage() {
  const [resources, setResources] = useState([])
  const [folders, setFolders] = useState([])
  const [subjects, setSubjects] = useState([])
  const [stats, setStats] = useState({ total_resources: 0, total_downloads: 0, students_reached: 0, folders: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [activeTab, setActiveTab] = useState('All Resources')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [subjFilter, setSubjFilter] = useState('All Subjects')
  const [sortBy, setSortBy] = useState('Newest First')
  const [search, setSearch] = useState('')
  const [folderFilter, setFolderFilter] = useState('')
  const [folderLabel, setFolderLabel] = useState('All Folders')

  const [uploadOpen, setUploadOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(null)

  const [uploadForm, setUploadForm] = useState({ title: '', subject_id: '', folder_id: '', file: null })
  const [folderForm, setFolderForm] = useState({ name: '', subject_id: '' })
  const [shareTargets, setShareTargets] = useState([])
  const [shareSelected, setShareSelected] = useState([])
  const [saving, setSaving] = useState(false)

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
        scope: scopeFromTab(activeTab),
        sort: sortParamFromLabel(sortBy),
        search: search.trim() || undefined,
        type: typeParamFromLabel(typeFilter) || undefined,
        subject_id: subjectId || undefined,
        folder_id: folderFilter || undefined,
        per_page: 50,
      }
      const [resData, statsData, foldersData] = await Promise.all([
        getResources(params),
        getLibraryStats(),
        getFolders(),
      ])
      setResources(parseResourceList(resData))
      setStats(statsData || {})
      setFolders(foldersData?.folders || [])
    } catch {
      setError('Failed to load resources. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, typeFilter, subjFilter, sortBy, search, folderFilter, subjects])

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
      showToast('Download failed.', 'error')
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) { showToast('Choose a file to upload.', 'error'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', uploadForm.file)
      fd.append('title', uploadForm.title || uploadForm.file.name)
      if (uploadForm.subject_id) fd.append('subject_id', uploadForm.subject_id)
      if (uploadForm.folder_id) fd.append('folder_id', uploadForm.folder_id)
      await uploadResource(fd)
      showToast('Resource uploaded successfully!')
      setUploadOpen(false)
      setUploadForm({ title: '', subject_id: '', folder_id: '', file: null })
      loadAll()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Upload failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!folderForm.name.trim()) { showToast('Enter a folder name.', 'error'); return }
    setSaving(true)
    try {
      await createFolder({
        name: folderForm.name.trim(),
        subject_id: folderForm.subject_id || undefined,
      })
      showToast('Folder created!')
      setFolderOpen(false)
      setFolderForm({ name: '', subject_id: '' })
      loadAll()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Could not create folder.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openShare = async (resource) => {
    setShareOpen(resource)
    setShareSelected([])
    try {
      const res = await getShareTargets()
      setShareTargets(res?.students || [])
    } catch {
      setShareTargets([])
      showToast('Could not load students.', 'error')
    }
  }

  const handleShare = async () => {
    if (!shareOpen || shareSelected.length === 0) {
      showToast('Select at least one student.', 'error')
      return
    }
    setSaving(true)
    try {
      await shareResource(shareOpen.id, shareSelected)
      showToast(`Shared with ${shareSelected.length} student(s).`)
      setShareOpen(null)
      loadAll()
    } catch {
      showToast('Share failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFavorite = async (resource) => {
    try {
      const res = await toggleFavorite(resource.id)
      setResources(prev => prev.map(r => r.id === resource.id ? { ...r, is_favorited: res.is_favorited } : r))
      showToast(res.is_favorited ? 'Added to favorites.' : 'Removed from favorites.')
    } catch {
      showToast('Could not update favorite.', 'error')
    }
  }

  const handleDelete = async (resource) => {
    if (!window.confirm(`Delete "${resourceDisplayName(resource)}"?`)) return
    try {
      await deleteResource(resource.id)
      showToast('Resource deleted.')
      loadAll()
    } catch {
      showToast('Delete failed.', 'error')
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

  const folderOptions = ['All Folders', ...folders.map(f => f.name)]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tr-wrap * { box-sizing: border-box; }
        .tr-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .tr-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .tr-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .tr-tab { padding: 9px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: inherit; white-space: nowrap; }
        .tr-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .tr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
        .action-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; border: none; background: none; width: 100%; text-align: left; font-family: inherit; }
        .action-row:last-child { border-bottom: none; }
        .action-row:hover span { color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .tr-wrap { flex-direction: column; }
          .tr-right { width: 100%; }
          .tr-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .tr-stats > div { border-right: none !important; padding: 0 !important; }
        }
      `}</style>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />

      {uploadOpen && (
        <Modal title="Upload Resource" onClose={() => setUploadOpen(false)}>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Title</label>
              <input style={fieldStyle} value={uploadForm.title} placeholder="Optional — uses file name"
                onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Subject</label>
              <select style={fieldStyle} value={uploadForm.subject_id} onChange={e => setUploadForm(p => ({ ...p, subject_id: e.target.value }))}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Folder</label>
              <select style={fieldStyle} value={uploadForm.folder_id} onChange={e => setUploadForm(p => ({ ...p, folder_id: e.target.value }))}>
                <option value="">No folder</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>File</label>
              <input type="file" required onChange={e => setUploadForm(p => ({ ...p, file: e.target.files?.[0] || null }))} style={fieldStyle} />
            </div>
            <button type="submit" disabled={saving} style={{
              padding: 12, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        </Modal>
      )}

      {folderOpen && (
        <Modal title="Create Folder" onClose={() => setFolderOpen(false)}>
          <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input style={fieldStyle} required placeholder="Folder name" value={folderForm.name}
              onChange={e => setFolderForm(p => ({ ...p, name: e.target.value }))} />
            <select style={fieldStyle} value={folderForm.subject_id} onChange={e => setFolderForm(p => ({ ...p, subject_id: e.target.value }))}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button type="submit" disabled={saving} style={{
              padding: 12, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Creating…' : 'Create Folder'}
            </button>
          </form>
        </Modal>
      )}

      {shareOpen && (
        <Modal title={`Share: ${resourceDisplayName(shareOpen)}`} onClose={() => setShareOpen(null)}>
          {shareTargets.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6B7280' }}>No matched students yet. Accept match requests first.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 240, overflowY: 'auto' }}>
              {shareTargets.map(s => (
                <label key={s.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={shareSelected.includes(s.user_id)}
                    onChange={e => {
                      setShareSelected(prev => e.target.checked
                        ? [...prev, s.user_id]
                        : prev.filter(id => id !== s.user_id))
                    }} />
                  {s.name}
                </label>
              ))}
            </div>
          )}
          <button type="button" disabled={saving || shareSelected.length === 0} onClick={handleShare} style={{
            padding: 12, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}>
            {saving ? 'Sharing…' : 'Share Resource'}
          </button>
        </Modal>
      )}

      {previewOpen && (
        <Modal title={resourceDisplayName(previewOpen)} onClose={() => setPreviewOpen(null)} width={720}>
          {previewOpen.is_image || previewOpen.preview_url?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
            <img src={previewOpen.preview_url} alt="" style={{ maxWidth: '100%', borderRadius: 12 }} />
          ) : previewOpen.is_pdf ? (
            <iframe title="preview" src={previewOpen.preview_url} style={{ width: '100%', height: 480, border: 'none', borderRadius: 12 }} />
          ) : (
            <p style={{ fontSize: 13, color: '#6B7280' }}>Preview not supported. Use download instead.</p>
          )}
        </Modal>
      )}

      <div className="tr-wrap">
        <div className="tr-main">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Resources</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Organize, upload, and share study materials with your students.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setFolderOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10,
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <FolderPlus size={15} color="#7C3AED" /> Create Folder
              </button>
              <button type="button" onClick={() => setUploadOpen(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
                fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <Upload size={15} /> Upload Resource
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #F0F0F4', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} type="button" className={`tr-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
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

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Dropdown value={typeFilter} options={TYPE_OPTS} onChange={setTypeFilter} />
            <Dropdown value={subjFilter} options={subjOptions} onChange={setSubjFilter} minWidth={160} />
            <Dropdown value={sortBy} options={SORT_OPTS} onChange={setSortBy} minWidth={160} />
            {folders.length > 0 && (
              <Dropdown value={folderLabel} options={folderOptions}
                onChange={name => {
                  setFolderLabel(name)
                  if (name === 'All Folders') setFolderFilter('')
                  else {
                    const f = folders.find(x => x.name === name)
                    setFolderFilter(f ? String(f.id) : '')
                  }
                }}
                minWidth={150}
              />
            )}
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px' }} className="tr-stats">
            {[
              { icon: FileText, color: '#7C3AED', bg: '#F3F0FF', value: stats.total_resources ?? 0, label: 'Total Resources' },
              { icon: Download, color: '#10B981', bg: '#F0FDF4', value: stats.total_downloads ?? 0, label: 'Total Downloads' },
              { icon: Users, color: '#6366F1', bg: '#EEF2FF', value: stats.students_reached ?? 0, label: 'Students Reached' },
              { icon: Folder, color: '#F59E0B', bg: '#FFFBEB', value: stats.folders ?? 0, label: 'Folders' },
            ].map(({ icon: Icon, color, bg, value, label }, i) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                borderRight: i < 3 ? '1px solid #F0F0F4' : 'none',
                padding: i === 0 ? '0 16px 0 0' : '0 16px',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {error && !loading && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
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

          {!loading && !error && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{activeTab} ({resources.length})</div>
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
                {resources.length === 0 ? (
                  <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <BookOpen size={36} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No resources yet</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Upload your first study material or create a folder to get organized.</div>
                    <button type="button" onClick={() => setUploadOpen(true)} style={{
                      padding: '10px 20px', background: '#7C3AED', color: 'white', border: 'none',
                      borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Upload Resource
                    </button>
                  </div>
                ) : (
                  resources.map(r => (
                    <ResourceRow key={r.id} resource={r}
                      onDownload={handleDownload}
                      onPreview={handlePreview}
                      onShare={openShare}
                      onFavorite={handleFavorite}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="tr-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>Tutor Actions</div>
            {[
              { icon: Upload, label: 'Upload Resource', action: () => setUploadOpen(true) },
              { icon: FolderPlus, label: 'Create New Folder', action: () => setFolderOpen(true) },
              { icon: Share2, label: 'Share a Resource', action: () => resources[0] ? openShare(resources[0]) : showToast('Upload a resource first.', 'error') },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} type="button" className="action-row" onClick={action}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color="#7C3AED" />
                </div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{label}</span>
                <ArrowRight size={14} color="#D1D5DB" />
              </button>
            ))}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: 16, padding: 20 }}>
            <Star size={20} color="white" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 8 }}>Grow Your Impact</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              Share quality resources with matched students to help them succeed.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
