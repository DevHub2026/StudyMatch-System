import { useEffect, useState } from 'react'
import { getFeedback, updateFeedback } from '../api/feedback'

const StatusBadge = ({ status }) => {
  const styles = {
    unread:  'bg-red-100 text-red-700',
    read:    'bg-gray-100 text-gray-600',
    flagged: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

const CategoryBadge = ({ category }) => {
  const styles = {
    general: 'bg-indigo-50 text-indigo-600',
    bug:     'bg-red-50 text-red-600',
    feature: 'bg-blue-50 text-blue-600',
    other:   'bg-gray-50 text-gray-500',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[category] ?? 'bg-gray-50 text-gray-500'}`}>
      {category}
    </span>
  )
}

const StarRating = ({ rating }) => {
  if (!rating) return <span className="text-gray-300 text-xs">No rating</span>
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks]   = useState([])
  const [meta, setMeta]             = useState(null)
  const [page, setPage]             = useState(1)
  const [statusFilter, setStatus]   = useState('')
  const [categoryFilter, setCategory] = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [actionMsg, setActionMsg]   = useState('')
  const [updating, setUpdating]     = useState(false)

  const fetchFeedback = async (p = page, s = statusFilter, c = categoryFilter) => {
    setLoading(true)
    setError('')
    try {
      const res = await getFeedback({
        page:     p,
        status:   s || undefined,
        category: c || undefined,
      })
      setFeedbacks(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load feedback.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeedback() }, [page])

  const handleStatusFilter = (val) => {
    setStatus(val)
    setPage(1)
    fetchFeedback(1, val, categoryFilter)
  }

  const handleCategoryFilter = (val) => {
    setCategory(val)
    setPage(1)
    fetchFeedback(1, statusFilter, val)
  }

  const handleUpdateStatus = async (id, status) => {
    setUpdating(true)
    try {
      await updateFeedback(id, { status })
      setActionMsg(`Feedback marked as ${status}.`)
      setSelected(null)
      fetchFeedback()
    } catch {
      setActionMsg('Failed to update feedback.')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : '—'

  // Summary counts
  const unreadCount  = feedbacks.filter(f => f.status === 'unread').length
  const flaggedCount = feedbacks.filter(f => f.status === 'flagged').length

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Feedback Review</h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and manage student feedback submissions
          </p>
        </div>
        {meta && (
          <div className="flex gap-3 text-sm">
            <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-lg">
              {unreadCount} unread
            </span>
            <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-lg">
              {flaggedCount} flagged
            </span>
            <span className="text-gray-500 self-center">
              {meta.total} total
            </span>
          </div>
        )}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4">

        {/* Status filter */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Status:</span>
          {['', 'unread', 'read', 'flagged'].map(s => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Category:</span>
          {['', 'general', 'bug', 'feature', 'other'].map(c => (
            <button
              key={c}
              onClick={() => handleCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                categoryFilter === c
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c === '' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Feedback table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Category</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Rating</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Message</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  Loading feedback...
                </td>
              </tr>
            ) : feedbacks.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  No feedback found.
                </td>
              </tr>
            ) : (
              feedbacks.map(f => (
                <tr
                  key={f.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    f.status === 'unread' ? 'bg-red-50/30' : ''
                  }`}
                >
                  <td className="px-5 py-3 text-gray-400">{f.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {f.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">
                        {f.user?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <CategoryBadge category={f.category} />
                  </td>
                  <td className="px-5 py-3">
                    <StarRating rating={f.rating} />
                  </td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                    {f.message}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(f.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelected(f)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View
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

      {/* Feedback detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Feedback Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Student info */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {selected.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">
                  {selected.user?.name ?? '—'}
                </p>
                <p className="text-gray-500 text-xs">
                  {selected.user?.email ?? '—'}
                </p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <StatusBadge status={selected.status} />
                <CategoryBadge category={selected.category} />
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-500">Rating</span>
              <StarRating rating={selected.rating} />
              {selected.rating && (
                <span className="text-sm font-medium text-amber-600">
                  {selected.rating}/5
                </span>
              )}
            </div>

            {/* Message */}
            <div className="mb-5">
              <p className="text-xs text-gray-400 font-medium mb-1.5">Message</p>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {selected.message}
              </div>
            </div>

            {/* Meta */}
            <div className="text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Submitted</span>
                <span className="text-gray-600">
                  {formatDate(selected.created_at)}
                </span>
              </div>
            </div>

            {/* Status actions */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Update Status
              </p>
              <div className="flex gap-2">
                {['read', 'flagged', 'unread'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selected.id, s)}
                    disabled={updating || selected.status === s}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 ${
                      selected.status === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className="w-full bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  )
}