import { useEffect, useState } from 'react'
import api from '../api/axiosInstance'

const StatusBadge = ({ status }) => {
  const styles = {
    pending:  'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    declined: 'bg-red-100 text-red-600',
    cancelled:'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
    <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>
      {value ?? <span className="text-gray-300 text-2xl">—</span>}
    </p>
  </div>
)

export default function MatchMonitoringPage() {
  const [matches, setMatches]         = useState([])
  const [meta, setMeta]               = useState(null)
  const [page, setPage]               = useState(1)
  const [statusFilter, setStatus]     = useState('')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [selected, setSelected]       = useState(null)
  const [stats, setStats]             = useState(null)

  const fetchMatches = async (p = page, s = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/matches', {
        params: {
          page:   p,
          status: s || undefined,
        }
      })
      setMatches(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load match requests.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/analytics/overview')
      setStats(res.data)
    } catch {
      // stats are non-critical
    }
  }

  useEffect(() => {
    fetchMatches()
    fetchStats()
  }, [page])

  const handleStatusFilter = (val) => {
    setStatus(val)
    setPage(1)
    fetchMatches(1, val)
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString() : '—'

  // Compute local stats from loaded matches
  const pendingCount  = matches.filter(m => m.status === 'pending').length
  const acceptedCount = matches.filter(m => m.status === 'accepted').length
  const declinedCount = matches.filter(m => m.status === 'declined').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Match System Monitoring
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor all peer-to-peer match requests on the platform
          </p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total} total match requests
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Matches"
          value={stats?.total_matches}
          color="text-indigo-600"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          color="text-amber-600"
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          color="text-emerald-600"
        />
        <StatCard
          label="Declined"
          value={declinedCount}
          color="text-red-500"
        />
      </div>

      {/* Status filters */}
      <div className="flex gap-2">
        {['', 'pending', 'accepted', 'declined', 'cancelled'].map(s => (
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

      {/* Matches table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Requester</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Receiver</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Requested</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  Loading match requests...
                </td>
              </tr>
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No match requests found.
                </td>
              </tr>
            ) : (
              matches.map(match => (
                <tr
                  key={match.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400">
                    {match.id}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {match.requester?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">
                        {match.requester?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">
                        {match.receiver?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">
                        {match.receiver?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-medium">
                      {match.subject}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={match.status} />
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDate(match.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelected(match)}
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

      {/* Match detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Match Request #{selected.id}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Subject banner */}
            <div className="bg-indigo-50 rounded-xl px-4 py-3 mb-5 text-center">
              <p className="text-xs text-indigo-400 font-medium mb-0.5">
                Subject
              </p>
              <p className="text-indigo-700 font-bold text-lg">
                {selected.subject}
              </p>
            </div>

            {/* Users */}
            <div className="grid grid-cols-2 gap-3 mb-5">

              {/* Requester */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mx-auto mb-2">
                  {selected.requester?.name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-gray-400 mb-0.5">Requester</p>
                <p className="text-sm font-semibold text-gray-800">
                  {selected.requester?.name ?? '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.requester?.email ?? '—'}
                </p>
              </div>

              {/* Receiver */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold mx-auto mb-2">
                  {selected.receiver?.name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-gray-400 mb-0.5">Receiver</p>
                <p className="text-sm font-semibold text-gray-800">
                  {selected.receiver?.name ?? '—'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selected.receiver?.email ?? '—'}
                </p>
              </div>

            </div>

            {/* Details */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Requested</span>
                <span className="text-gray-600 text-xs">
                  {formatDate(selected.created_at)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Last updated</span>
                <span className="text-gray-600 text-xs">
                  {formatDate(selected.updated_at)}
                </span>
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