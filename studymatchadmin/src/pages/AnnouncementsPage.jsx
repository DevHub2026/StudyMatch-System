import { useEffect, useState } from 'react'
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../api/announcement'
import {
  Plus, Megaphone, X, CheckCircle,
  Users, GraduationCap, UserCheck,
} from 'lucide-react'

// ── Badges ────────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    draft:     'bg-amber-100 text-amber-700 border-amber-200',
    archived:  'bg-gray-100 text-gray-500 border-gray-200',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status}
    </span>
  )
}

const TargetBadge = ({ target }) => {
  const cfg = {
    all:      { cls: 'bg-indigo-50 text-indigo-600 border-indigo-200',      icon: Users         },
    students: { cls: 'bg-blue-50 text-blue-600 border-blue-200',            icon: GraduationCap  },
    tutors:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',   icon: UserCheck      },
  }
  const { cls, icon: Icon } = cfg[target] ?? { cls: 'bg-gray-100 text-gray-500 border-gray-200', icon: Users }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={10} /> {target}
    </span>
  )
}

// ── Audience picker (reused in form) ─────────────────────────────────────────

const AudiencePicker = ({ value, onChange }) => {
  const opts = [
    { val: 'all',      label: 'All Users',     icon: Users,        color: '#7C3AED', bg: '#F3F0FF' },
    { val: 'students', label: 'Students Only', icon: GraduationCap, color: '#3B82F6', bg: '#EFF6FF' },
    { val: 'tutors',   label: 'Tutors Only',   icon: UserCheck,    color: '#10B981', bg: '#F0FDF4' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
      {opts.map(({ val, label, icon: Icon, color, bg }) => (
        <button key={val} type="button" onClick={() => onChange(val)}
          style={{
            padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
            border: value === val ? `2px solid ${color}` : '1.5px solid #E5E7EB',
            background: value === val ? bg : '#FAFAFA',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            transition: 'all .15s', fontFamily: "'DM Sans', sans-serif",
          }}>
          <Icon size={17} color={value === val ? color : '#9CA3AF'} />
          <span style={{ fontSize: 12, fontWeight: 700, color: value === val ? color : '#6B7280' }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}

const emptyForm = { title: '', content: '', target: 'all', status: 'draft', is_pinned: false }

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [meta,          setMeta]          = useState(null)
  const [page,          setPage]          = useState(1)
  const [statusFilter,  setStatus]        = useState('')
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [selected,      setSelected]      = useState(null)
  const [showForm,      setShowForm]      = useState(false)
  const [form,          setForm]          = useState(emptyForm)
  const [editingId,     setEditingId]     = useState(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [actionMsg,     setActionMsg]     = useState('')

  const fetchAnnouncements = async (p = page, s = statusFilter) => {
    setLoading(true); setError('')
    try {
      const res = await getAnnouncements({ page: p, status: s || undefined })
      setAnnouncements(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [page])

  const handleStatusFilter = (val) => {
    setStatus(val); setPage(1); fetchAnnouncements(1, val)
  }

  const openCreate = () => {
    setForm(emptyForm); setEditingId(null); setShowForm(true)
  }

  const openEdit = (a) => {
    setForm({ title: a.title, content: a.content, target: a.target, status: a.status, is_pinned: a.is_pinned ?? false })
    setEditingId(a.id); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSubmitting(true)
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form)
        setActionMsg('Announcement updated.')
      } else {
        await createAnnouncement(form)
        setActionMsg('Announcement created.')
      }
      setShowForm(false); setForm(emptyForm); setEditingId(null)
      fetchAnnouncements()
    } catch { setActionMsg('Failed to save announcement.') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
      setActionMsg('Announcement deleted.')
      setSelected(null); fetchAnnouncements()
    } catch { setActionMsg('Failed to delete.') }
  }

  const handlePublish = async (a) => {
    try {
      await updateAnnouncement(a.id, { ...a, status: 'published' })
      setActionMsg('Published.'); fetchAnnouncements()
    } catch { setActionMsg('Failed to publish.') }
  }

  const handleArchive = async (a) => {
    try {
      await updateAnnouncement(a.id, { ...a, status: 'archived' })
      setActionMsg('Archived.'); fetchAnnouncements()
    } catch { setActionMsg('Failed to archive.') }
  }

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Publish formal platform-wide announcements — visible to users in their Announcements channel.
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {/* Toast */}
      {actionMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle size={14} /> {actionMsg}
          <button onClick={() => setActionMsg('')} className="ml-auto text-green-500 hover:text-green-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-0 border-b border-gray-100">
        {['', 'published', 'draft', 'archived'].map(s => (
          <button key={s} onClick={() => handleStatusFilter(s)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              statusFilter === s ? 'text-indigo-600 border-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium w-12">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Title</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Target</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Published</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Created By</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-14 text-gray-400">Loading announcements...</td></tr>
            ) : announcements.length === 0 ? (
              <tr><td colSpan={7} className="py-14 text-center text-gray-400">
                <Megaphone size={28} className="mx-auto mb-2 text-gray-300" />
                No announcements found.
              </td></tr>
            ) : announcements.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{a.id}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {a.is_pinned && <span className="text-xs font-bold text-amber-500">📌</span>}
                    <span className="font-semibold text-gray-800 truncate max-w-xs">{a.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5"><TargetBadge target={a.target} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(a.published_at)}</td>
                <td className="px-5 py-3.5 text-gray-600 text-sm">{a.author?.name ?? a.created_by_user?.name ?? '—'}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(a)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">View</button>
                    <button onClick={() => openEdit(a)} className="text-amber-600 hover:text-amber-800 font-semibold text-xs">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 font-semibold text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {meta.current_page} of {meta.last_page}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Previous</button>
            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* View Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Announcement Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <StatusBadge status={selected.status} />
                <TargetBadge target={selected.target} />
                {selected.is_pinned && <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">📌 Pinned</span>}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{selected.title}</h3>
              <div className="bg-gray-50 rounded-xl px-4 py-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap border border-gray-100">
                {selected.content}
              </div>
              <div className="space-y-0 text-sm">
                {[
                  { label: 'Created by', value: selected.author?.name ?? '—' },
                  { label: 'Created',    value: formatDate(selected.created_at) },
                  { label: 'Published',  value: formatDate(selected.published_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              {selected.status === 'draft' && (
                <button onClick={() => { handlePublish(selected); setSelected(null) }}
                  className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-100 transition-colors">Publish</button>
              )}
              {selected.status === 'published' && (
                <button onClick={() => { handleArchive(selected); setSelected(null) }}
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-100 transition-colors">Archive</button>
              )}
              <button onClick={() => { openEdit(selected); setSelected(null) }}
                className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-amber-100 transition-colors">Edit</button>
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Megaphone size={16} color="#7C3AED" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 flex-1">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Announcement title..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Content</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={5}
                  placeholder="Write the announcement content..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Target Audience</label>
                <AudiencePicker value={form.target} onChange={v => setForm(p => ({ ...p, target: v }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Status</label>
                <div className="flex gap-2">
                  {['draft', 'published'].map(s => (
                    <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: s }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        form.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div onClick={() => setForm(p => ({ ...p, is_pinned: !p.is_pinned }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  background: form.is_pinned ? '#FFFBEB' : '#F9FAFB',
                  border: `1.5px solid ${form.is_pinned ? '#FDE68A' : '#E5E7EB'}`, transition: 'all .15s',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: form.is_pinned ? '#F59E0B' : 'white',
                  border: `2px solid ${form.is_pinned ? '#F59E0B' : '#D1D5DB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                }}>
                  {form.is_pinned && <CheckCircle size={12} color="white" />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>📌 Pin this announcement</span>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={handleSubmit} disabled={submitting || !form.title.trim() || !form.content.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
