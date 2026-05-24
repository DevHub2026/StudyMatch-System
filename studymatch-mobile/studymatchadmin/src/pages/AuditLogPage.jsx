import { useEffect, useState } from 'react'
import { getAuditLogs } from '../api/auditLogs'

const ModuleBadge = ({ module }) => {
  const styles = {
    auth:          'bg-indigo-50 text-indigo-600',
    users:         'bg-blue-50 text-blue-600',
    sessions:      'bg-emerald-50 text-emerald-600',
    complaints:    'bg-red-50 text-red-600',
    announcements: 'bg-purple-50 text-purple-600',
    feedback:      'bg-amber-50 text-amber-600',
    roles:         'bg-pink-50 text-pink-600',
    system:        'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[module] ?? 'bg-gray-100 text-gray-600'}`}>
      {module}
    </span>
  )
}

const ActionBadge = ({ action }) => {
  const styles = {
    login:   'bg-emerald-50 text-emerald-700',
    logout:  'bg-gray-100 text-gray-500',
    create:  'bg-blue-50 text-blue-600',
    update:  'bg-amber-50 text-amber-600',
    delete:  'bg-red-50 text-red-600',
    suspend: 'bg-orange-50 text-orange-600',
    assign:  'bg-purple-50 text-purple-600',
    revoke:  'bg-pink-50 text-pink-600',
    respond: 'bg-indigo-50 text-indigo-600',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[action] ?? 'bg-gray-100 text-gray-600'}`}>
      {action}
    </span>
  )
}

export default function AuditLogPage() {
  const [logs, setLogs]           = useState([])
  const [meta, setMeta]           = useState(null)
  const [page, setPage]           = useState(1)
  const [moduleFilter, setModule] = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)

  const fetchLogs = async (
    p = page,
    m = moduleFilter,
    f = fromDate,
    t = toDate
  ) => {
    setLoading(true)
    setError('')
    try {
      const res = await getAuditLogs({
        page:   p,
        module: m || undefined,
        from:   f || undefined,
        to:     t || undefined,
      })
      setLogs(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [page])

  const handleModuleFilter = (val) => {
    setModule(val)
    setPage(1)
    fetchLogs(1, val, fromDate, toDate)
  }

  const handleDateFilter = () => {
    setPage(1)
    fetchLogs(1, moduleFilter, fromDate, toDate)
  }

  const handleClearFilters = () => {
    setModule('')
    setFromDate('')
    setToDate('')
    setPage(1)
    fetchLogs(1, '', '', '')
  }

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString() : '—'

  const modules = [
    '', 'auth', 'users', 'sessions',
    'complaints', 'announcements',
    'feedback', 'roles', 'system',
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Admin Audit Trail
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete log of all administrative actions on the platform
          </p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total} total log entries
          </span>
        )}
      </div>

      {/* Filters panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">

        {/* Module filter */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Filter by Module
          </p>
          <div className="flex flex-wrap gap-2">
            {modules.map(m => (
              <button
                key={m}
                onClick={() => handleModuleFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  moduleFilter === m
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m === '' ? 'All Modules' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Date range filter */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <button
            onClick={handleDateFilter}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Apply
          </button>
          {(moduleFilter || fromDate || toDate) && (
            <button
              onClick={handleClearFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Logs table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Admin</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Action</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Module</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Description</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">IP Address</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Timestamp</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr
                  key={log.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400">{log.id}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {log.admin?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">
                        {log.admin?.name ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-5 py-3">
                    <ModuleBadge module={log.module} />
                  </td>
                  <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                    {log.description ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                    {log.ip_address ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    {log.metadata && (
                      <button
                        onClick={() => setSelected(log)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View
                      </button>
                    )}
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

      {/* Metadata detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Audit Log #{selected.id}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Log summary */}
            <div className="flex gap-2 mb-4">
              <ActionBadge action={selected.action} />
              <ModuleBadge module={selected.module} />
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Admin</span>
                <span className="font-medium text-gray-800">
                  {selected.admin?.name ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Description</span>
                <span className="text-gray-700 text-right max-w-xs">
                  {selected.description ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">IP Address</span>
                <span className="font-mono text-gray-700">
                  {selected.ip_address ?? '—'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Timestamp</span>
                <span className="text-gray-600">
                  {formatDateTime(selected.created_at)}
                </span>
              </div>
            </div>

            {/* Metadata JSON */}
            {selected.metadata && (
              <div className="mb-5">
                <p className="text-xs text-gray-400 font-medium mb-1.5">
                  Metadata
                </p>
                <pre className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}

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