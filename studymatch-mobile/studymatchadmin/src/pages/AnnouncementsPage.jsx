import { useEffect, useState } from 'react'
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../api/announcement'

const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-emerald-100 text-emerald-700',
    draft:     'bg-amber-100 text-amber-700',
    archived:  'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

const TargetBadge = ({ target }) => {
  const styles = {
    all:      'bg-indigo-50 text-indigo-600',
    students: 'bg-blue-50 text-blue-600',
    admins:   'bg-purple-50 text-purple-600',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[target] ?? 'bg-gray-100 text-gray-600'}`}>
      {target}
    </span>
  )
}

const emptyForm = {
  title:   '',
  content: '',
  target:  'all',
  status:  'draft',
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [meta, setMeta]                   = useState(null)
  const [page, setPage]                   = useState(1)
  const [statusFilter, setStatus]         = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [selected, setSelected]           = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState(emptyForm)
  const [editingId, setEditingId]         = useState(null)
  const [actionMsg, setActionMsg]         = useState('')
  const [submitting, setSubmitting]       = useState(false)

  const fetchAnnouncements = async (p = page, s = statusFilter) => {
    setLoading(true)
    setError('')
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
    setStatus(val)
    setPage(1)
    fetchAnnouncements(1, val)
  }

  const handleOpenCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
  }

  const handleOpenEdit = (a) => {
    setForm({
      title:   a.title,
      content: a.content,
      target:  a.target,
      status:  a.status,
    })
    setEditingId(a.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return
    setSubmitting(true)
    try {
      if (editingId) {
        await updateAnnouncement(editingId, form)
        setActionMsg('Announcement updated successfully.')
      } else {
        await createAnnouncement(form)
        setActionMsg('Announcement created successfully.')
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      fetchAnnouncements()
    } catch {
      setActionMsg('Failed to save announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
      setActionMsg('Announcement deleted.')
      setSelected(null)
      fetchAnnouncements()
    } catch {
      setActionMsg('Failed to delete announcement.')
    }
  }

  const handlePublish = async (a) => {
    try {
      await updateAnnouncement(a.id, { ...a, status: 'published' })
      setActionMsg('Announcement published.')
      fetchAnnouncements()
    } catch {
      setActionMsg('Failed to publish announcement.')
    }
  }

  const handleArchive = async (a) => {
    try {
      await updateAnnouncement(a.id, { ...a, status: 'archived' })
      setActionMsg('Announcement archived.')
      fetchAnnouncements()
    } catch {
      setActionMsg('Failed to archive announcement.')
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage platform announcements
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Announcement
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {actionMsg}
          <button
            onClick={() => setActionMsg('')}
            className="ml-3 text-green-500 hover:text-green-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status filters */}
      <div className="flex gap-2">
        {['', 'published', 'draft', 'archived'].map(s => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Announcements table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
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
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  Loading announcements...
                </td>
              </tr>
            ) : announcements.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No announcements found.
                </td>
              </tr>
            ) : (
              announcements.map(a => (
                <tr
                  key={a.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400">{a.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800 max-w-xs truncate">
                    {a.title}
                  </td>
                  <td className="px-5 py-3">
                    <TargetBadge target={a.target} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(a.published_at)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {a.author?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 flex gap-2">
                    <button
                      onClick={() => setSelected(a)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenEdit(a)}
                      className="text-amber-600 hover:text-amber-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {meta.current_page} of {meta.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Announcement Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Badges row */}
            <div className="flex gap-2 mb-4">
              <StatusBadge status={selected.status} />
              <TargetBadge target={selected.target} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              {selected.title}
            </h3>

            {/* Content */}
            <div className="bg-gray-50 rounded-xl px-4 py-4 text-sm text-gray-700 leading-relaxed mb-5">
              {selected.content}
            </div>

            {/* Meta */}
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Created by</span>
                <span className="font-medium">{selected.author?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-600">{formatDate(selected.created_at)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Published</span>
                <span className="text-gray-600">{formatDate(selected.published_at)}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              {selected.status === 'draft' && (
                <button
                  onClick={() => { handlePublish(selected); setSelected(null) }}
                  className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium py-2 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Publish
                </button>
              )}
              {selected.status === 'published' && (
                <button
                  onClick={() => { handleArchive(selected); setSelected(null) }}
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Archive
                </button>
              )}
              <button
                onClick={() => { handleOpenEdit(selected); setSelected(null) }}
                className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium py-2 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Content
                </label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  placeholder="Write the announcement content..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={form.target}
                  onChange={e => setForm({ ...form, target: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <div className="flex gap-2">
                  {['draft', 'published'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.status === s
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Form actions */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim() || !form.content.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}