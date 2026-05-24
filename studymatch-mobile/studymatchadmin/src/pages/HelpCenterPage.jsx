import { useEffect, useState } from 'react'
import { getTickets, respondToTicket } from '../api/helpCenter'

const StatusBadge = ({ status }) => {
  const styles = {
    open:        'bg-red-100 text-red-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved:    'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function HelpCenterPage() {
  const [tickets, setTickets]     = useState([])
  const [meta, setMeta]           = useState(null)
  const [page, setPage]           = useState(1)
  const [statusFilter, setStatus] = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)
  const [response, setResponse]   = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTickets = async (p = page, s = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const res = await getTickets({ page: p, status: s || undefined })
      setTickets(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load help center tickets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [page])

  const handleStatusFilter = (val) => {
    setStatus(val)
    setPage(1)
    fetchTickets(1, val)
  }

  const handleOpenModal = (ticket) => {
    setSelected(ticket)
    setResponse(ticket.admin_response ?? '')
  }

  const handleRespond = async () => {
    if (!response.trim()) return
    setSubmitting(true)
    try {
      await respondToTicket(selected.id, response)
      setActionMsg('Response sent successfully.')
      setSelected(null)
      setResponse('')
      fetchTickets()
    } catch {
      setActionMsg('Failed to send response.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Help Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and respond to student support requests
          </p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total} total tickets
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

      {/* Status filters */}
      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'resolved'].map(s => (
          <button
            key={s}
            onClick={() => handleStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              statusFilter === s
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === '' ? 'All' : s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Tickets table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Student</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Submitted</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Responded</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr
                  key={ticket.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400">{ticket.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800 max-w-48 truncate">
                    {ticket.subject}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {ticket.user?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(ticket.created_at)}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(ticket.responded_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleOpenModal(ticket)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {ticket.status === 'resolved' ? 'View' : 'Respond'}
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

      {/* Ticket detail and response modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Help Ticket #{selected.id}
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
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
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
              <div className="ml-auto">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* Ticket details */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Subject</span>
                <span className="font-medium text-gray-800 text-right max-w-xs">
                  {selected.subject}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Submitted</span>
                <span className="text-gray-600">
                  {formatDate(selected.created_at)}
                </span>
              </div>
              {selected.responded_at && (
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500">Responded</span>
                  <span className="text-gray-600">
                    {formatDate(selected.responded_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Student message */}
            <div className="mb-5">
              <p className="text-xs text-gray-400 font-medium mb-1.5">
                Student Message
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                {selected.message}
              </div>
            </div>

            {/* Previous admin response */}
            {selected.admin_response && selected.status === 'resolved' && (
              <div className="mb-5">
                <p className="text-xs text-gray-400 font-medium mb-1.5">
                  Admin Response
                </p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                  {selected.admin_response}
                </div>
                {selected.responder && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Responded by {selected.responder.name}
                  </p>
                )}
              </div>
            )}

            {/* Response form — only for unresolved tickets */}
            {selected.status !== 'resolved' && (
              <div className="mb-5">
                <p className="text-xs text-gray-400 font-medium mb-1.5">
                  Your Response
                </p>
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Type your response to the student..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>
            )}

            {/* Modal actions */}
            <div className="flex gap-2">
              {selected.status !== 'resolved' && (
                <button
                  onClick={handleRespond}
                  disabled={submitting || !response.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send Response'}
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
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