import { useEffect, useState } from 'react'
import { getSessions, cancelSession } from '../api/session'
import { Search, Loader2, CalendarClock } from 'lucide-react'

const StatusBadge = ({ status }) => {
  const styles = {
    ongoing:   'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-600',
    pending:   'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default function SessionsPage() {
  const [sessions, setSessions]   = useState([])
  const [meta, setMeta]           = useState(null)
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState('')
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)
  const [actionMsg, setActionMsg] = useState('')

  const fetchSessions = async (p = page, s = statusFilter, q = search) => {
    setLoading(true); setError('')
    try {
      const res = await getSessions({ page: p, status: s || undefined, search: q || undefined })
      setSessions(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [page])

  const handleStatusFilter = (val) => {
    setStatus(val); setPage(1)
    fetchSessions(1, val, search)
  }

  const handleSearch = (e) => {
    e.preventDefault(); setPage(1)
    fetchSessions(1, statusFilter, search)
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancel this session?')) return
    try {
      await cancelSession(id)
      setActionMsg('Session cancelled successfully.')
      setSelected(null)
      fetchSessions()
    } catch {
      setActionMsg('Failed to cancel session.')
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString() : '—'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Study Session Monitoring
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor and manage all study sessions on the platform
          </p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total} total sessions
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

      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by tutor, student, or subject..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
          </div>
          <button type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1.5">
          {['', 'scheduled', 'ongoing', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => handleStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
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
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Tutor</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Duration</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Scheduled</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-14">
                  <Loader2 size={22} className="animate-spin text-indigo-400 mx-auto" />
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-14 text-gray-400">
                  <CalendarClock size={28} className="mx-auto mb-2 text-gray-300" />
                  No sessions found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            ) : (
              sessions.map(session => (
                <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{session.id}</td>
                  <td className="px-5 py-3.5 font-semibold text-gray-800">
                    {session.tutor?.user?.name ?? session.tutor?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {session.student?.user?.name ?? session.student?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-indigo-200">
                      {session.subject?.name ?? session.subject ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {session.duration_minutes ? `${session.duration_minutes} min` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {formatDate(session.scheduled_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(session)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">View</button>
                      {session.status !== 'cancelled' && session.status !== 'completed' && (
                        <button onClick={() => handleCancel(session.id)}
                          className="text-red-500 hover:text-red-700 font-semibold text-xs">Cancel</button>
                      )}
                    </div>
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
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Session detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Session Details</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Subject banner */}
            <div className="bg-indigo-50 rounded-xl px-4 py-3 mb-5 text-center">
              <p className="text-xs text-indigo-400 font-medium mb-0.5">Subject</p>
              <p className="text-indigo-700 font-bold text-lg">
                {selected.subject?.name ?? selected.subject ?? '—'}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Session ID</span>
                <span className="font-medium text-gray-700">{selected.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Tutor</span>
                <span className="font-medium text-gray-700">
                  {selected.tutor?.user?.name ?? selected.tutor?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Student</span>
                <span className="font-medium text-gray-700">
                  {selected.student?.user?.name ?? selected.student?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Scheduled</span>
                <span className="text-gray-600 text-xs">
                  {formatDate(selected.scheduled_at)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Completed</span>
                <span className="text-gray-600 text-xs">
                  {formatDate(selected.completed_at)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium text-gray-700">
                  {selected.duration_minutes ? `${selected.duration_minutes} min` : '—'}
                </span>
              </div>
              {selected.session_link && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Session Link</span>
                  <a
                    href={selected.session_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium truncate max-w-48"
                  >
                    {selected.session_link}
                  </a>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="flex gap-2">
              {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                <button
                  onClick={() => handleCancel(selected.id)}
                  className="flex-1 bg-red-50 border border-red-200 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Cancel Session
                </button>
              )}
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

    </div>
  )
}