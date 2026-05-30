import { useEffect, useState } from 'react'
import api from '../api/axiosInstance'
import { getRequestStats } from '../api/analytics'
import {
  GitMerge, Clock, CheckCircle, XCircle, Ban,
  Loader2, Search, X,
} from 'lucide-react'

// ── Badges ────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:   { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Pending'   },
  accepted:  { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0', label: 'Accepted'  },
  declined:  { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', label: 'Declined'  },
  cancelled: { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB', label: 'Cancelled' },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB', label: status }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      textTransform: 'capitalize',
    }}>
      {cfg.label}
    </span>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, iconColor, iconBg, loading }) => (
  <div style={{
    background: 'white', border: '1px solid #E5E7EB', borderRadius: 16,
    padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
    fontFamily: "'DM Sans', sans-serif",
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={20} color={iconColor} />
    </div>
    <div>
      <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
        {loading
          ? <span style={{ color: '#D1D5DB', fontSize: 18 }}>—</span>
          : (value ?? <span style={{ color: '#D1D5DB', fontSize: 18 }}>—</span>)}
      </div>
    </div>
  </div>
)

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MatchMonitoringPage() {
  const [matches,     setMatches]     = useState([])
  const [meta,        setMeta]        = useState(null)
  const [page,        setPage]        = useState(1)
  const [statusFilter,setStatusFilter]= useState('')
  const [search,      setSearch]      = useState('')
  const [loading,     setLoading]     = useState(true)
  const [statsLoading,setStatsLoading]= useState(true)
  const [error,       setError]       = useState('')
  const [selected,    setSelected]    = useState(null)
  const [reqStats,    setReqStats]    = useState(null)   // { pending, accepted, declined, cancelled, total }

  const fetchMatches = async (p = page, s = statusFilter, q = search) => {
    setLoading(true); setError('')
    try {
      const res = await api.get('/admin/match-requests', {
        params: { page: p, status: s || undefined, search: q || undefined },
      })
      setMatches(res.data.data ?? [])
      setMeta(res.data)
    } catch {
      setError('Failed to load match requests.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await getRequestStats()
      // Response shape: { pending, accepted, declined, cancelled, total }
      setReqStats(res.data ?? null)
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
    fetchStats()
  }, [page])

  const handleStatusFilter = (val) => {
    setStatusFilter(val); setPage(1)
    fetchMatches(1, val, search)
  }

  const handleSearch = (e) => {
    e.preventDefault(); setPage(1)
    fetchMatches(1, statusFilter, search)
  }

  const clearSearch = () => {
    setSearch(''); setPage(1)
    fetchMatches(1, statusFilter, '')
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'

  const subjectName = (match) =>
    match.subject?.name ?? (typeof match.subject === 'string' ? match.subject : null)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#1E1B4B' }} className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Match System Monitoring</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor all tutor–student match requests on the platform.</p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm">
            {meta.total} total requests
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={reqStats?.total   ?? meta?.total} icon={GitMerge}    iconColor="#7C3AED" iconBg="#F3F0FF" loading={statsLoading} />
        <StatCard label="Pending"        value={reqStats?.pending}                icon={Clock}       iconColor="#D97706" iconBg="#FEF3C7" loading={statsLoading} />
        <StatCard label="Accepted"       value={reqStats?.accepted}               icon={CheckCircle} iconColor="#059669" iconBg="#D1FAE5" loading={statsLoading} />
        <StatCard label="Declined"       value={reqStats?.declined}               icon={XCircle}     iconColor="#DC2626" iconBg="#FEE2E2" loading={statsLoading} />
      </div>

      {/* Search + Status filters */}
      <div className="flex gap-3 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or subject..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
            {search && (
              <button type="button" onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <button type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Search
          </button>
        </form>
        <div className="flex gap-1.5">
          {[
            { val: '',          label: 'All'       },
            { val: 'pending',   label: 'Pending'   },
            { val: 'accepted',  label: 'Accepted'  },
            { val: 'declined',  label: 'Declined'  },
            { val: 'cancelled', label: 'Cancelled' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => handleStatusFilter(val)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                statusFilter === val
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {label}
              {val && reqStats?.[val] > 0 && (
                <span className="ml-1.5 text-xs opacity-75">({reqStats[val]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium w-12">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Student (Requester)</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Tutor (Receiver)</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Subject</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Requested</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium w-16">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" />
                </td>
              </tr>
            ) : matches.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-gray-400">
                  <GitMerge size={28} className="mx-auto mb-2 text-gray-300" />
                  No match requests found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                </td>
              </tr>
            ) : (
              matches.map(match => (
                <tr key={match.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{match.id}</td>

                  {/* Requester (student) */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {(match.requester?.name ?? match.student?.user?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {match.requester?.name ?? match.student?.user?.name ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.requester?.email ?? match.student?.user?.email ?? ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Receiver (tutor) */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                        {(match.receiver?.name ?? match.tutor?.user?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">
                          {match.receiver?.name ?? match.tutor?.user?.name ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {match.receiver?.email ?? match.tutor?.user?.email ?? ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="px-5 py-3.5">
                    {subjectName(match) ? (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                        background: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {subjectName(match)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={match.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                    {formatDate(match.created_at)}
                  </td>

                  {/* View */}
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelected(match)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">
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
            Page {meta.current_page} of {meta.last_page} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              ← Previous
            </button>
            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Match Request #{selected.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Requested {formatDate(selected.created_at)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Subject */}
              <div style={{
                background: '#EEF2FF', border: '1px solid #C7D2FE',
                borderRadius: 12, padding: '12px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 600, marginBottom: 4 }}>SUBJECT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#312E81' }}>
                  {subjectName(selected) || <span style={{ color: '#C7D2FE', fontStyle: 'italic' }}>No subject</span>}
                </div>
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">Status</span>
                <StatusBadge status={selected.status} />
              </div>

              {/* Participants */}
              <div className="grid grid-cols-2 gap-3">
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold text-lg mx-auto mb-2">
                    {(selected.requester?.name ?? selected.student?.user?.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 700, marginBottom: 3 }}>STUDENT</div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {selected.requester?.name ?? selected.student?.user?.name ?? '—'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {selected.requester?.email ?? selected.student?.user?.email ?? ''}
                  </div>
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-lg mx-auto mb-2">
                    {(selected.receiver?.name ?? selected.tutor?.user?.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 10, color: '#10B981', fontWeight: 700, marginBottom: 3 }}>TUTOR</div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {selected.receiver?.name ?? selected.tutor?.user?.name ?? '—'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {selected.receiver?.email ?? selected.tutor?.user?.email ?? ''}
                  </div>
                </div>
              </div>

              {/* Message if available */}
              {selected.message && (
                <div>
                  <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5">Message</div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                    {selected.message}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-0 text-sm">
                {[
                  { label: 'Requested',    value: formatDate(selected.created_at) },
                  { label: 'Accepted at',  value: selected.accepted_at ? formatDate(selected.accepted_at) : null },
                  { label: 'Declined at',  value: selected.declined_at ? formatDate(selected.declined_at) : null },
                  { label: 'Last updated', value: formatDate(selected.updated_at) },
                ].filter(r => r.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-600 text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pb-5">
              <button onClick={() => setSelected(null)}
                className="w-full bg-gray-100 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
