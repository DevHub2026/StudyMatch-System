import { useEffect, useState } from 'react'
import { getComplaints, updateComplaint } from '../api/complaints'

const StatusBadge = ({ status }) => {
  const styles = {
    open:       'bg-red-100 text-red-700',
    reviewing:  'bg-amber-100 text-amber-700',
    resolved:   'bg-emerald-100 text-emerald-700',
    dismissed:  'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

const PriorityBadge = ({ priority }) => {
  const styles = {
    high:   'bg-red-50 text-red-600 border border-red-200',
    medium: 'bg-amber-50 text-amber-600 border border-amber-200',
    low:    'bg-gray-50 text-gray-500 border border-gray-200',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] ?? ''}`}>
      {priority}
    </span>
  )
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [meta, setMeta]             = useState(null)
  const [page, setPage]             = useState(1)
  const [statusFilter, setStatus]   = useState('')
  const [priorityFilter, setPriority] = useState('')
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [selected, setSelected]     = useState(null)
  const [actionMsg, setActionMsg]   = useState('')
  const [updating, setUpdating]     = useState(false)

  const fetchComplaints = async (p = page, s = statusFilter, pr = priorityFilter) => {
    setLoading(true)
    setError('')
    try {
      const res = await getComplaints({
        page:     p,
        status:   s || undefined,
        priority: pr || undefined,
      })
      setComplaints(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load complaints.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComplaints() }, [page])

  const handleStatusFilter = (val) => {
    setStatus(val)
    setPage(1)
    fetchComplaints(1, val, priorityFilter)
  }

  const handlePriorityFilter = (val) => {
    setPriority(val)
    setPage(1)
    fetchComplaints(1, statusFilter, val)
  }

  const handleUpdate = async (id, data) => {
    setUpdating(true)
    try {
      await updateComplaint(id, data)
      setActionMsg('Complaint updated successfully.')
      setSelected(null)
      fetchComplaints()
    } catch {
      setActionMsg('Failed to update complaint.')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Complaints Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review and resolve user complaints
          </p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total} total complaints
          </span>
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
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 self-center mr-1">Status:</span>
          {['', 'open', 'reviewing', 'resolved', 'dismissed'].map(s => (
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

        {/* Priority filter */}
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 self-center mr-1">Priority:</span>
          {['', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => handlePriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                priorityFilter === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p === '' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Submitted By</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Reported User</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Priority</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  Loading complaints...
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  No complaints found.
                </td>
              </tr>
            ) : (
              complaints.map(c => (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400">{c.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800 max-w-48 truncate">
                    {c.subject}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {c.submitter?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {c.reported_user?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelected(c)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Review
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

      {/* Complaint detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Review Complaint
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Subject */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-gray-400 mb-1">Subject</p>
              <p className="font-semibold text-gray-800">{selected.subject}</p>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Complaint ID</span>
                <span className="font-medium">{selected.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Submitted by</span>
                <span className="font-medium">{selected.submitter?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Reported user</span>
                <span className="font-medium">{selected.reported_user?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Priority</span>
                <PriorityBadge priority={selected.priority} />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-600">
                  {formatDate(selected.created_at)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <p className="text-xs text-gray-400 mb-1.5">Description</p>
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {selected.description}
              </div>
            </div>

            {/* Resolution info */}
            {selected.resolved_at && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 mb-5 text-sm">
                <p className="text-emerald-700 font-medium">
                  Resolved on {formatDate(selected.resolved_at)}
                </p>
                {selected.resolver && (
                  <p className="text-emerald-600 text-xs mt-0.5">
                    by {selected.resolver.name}
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            {selected.status !== 'resolved' && selected.status !== 'dismissed' && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpdate(selected.id, { status: 'reviewing' })}
                    disabled={updating || selected.status === 'reviewing'}
                    className="px-4 py-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 disabled:opacity-40 transition-colors"
                  >
                    Mark Reviewing
                  </button>
                  <button
                    onClick={() => handleUpdate(selected.id, { status: 'resolved' })}
                    disabled={updating}
                    className="px-4 py-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => handleUpdate(selected.id, { status: 'dismissed' })}
                    disabled={updating}
                    className="px-4 py-2 text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Priority update */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Update Priority
              </p>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    onClick={() => handleUpdate(selected.id, { priority: p })}
                    disabled={updating || selected.priority === p}
                    className={`px-4 py-2 text-xs rounded-lg border transition-colors disabled:opacity-40 ${
                      selected.priority === p
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
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