import { useState } from 'react'
import { generateReport } from '../api/reports'

const typeConfig = {
  users: {
    label:       'Users Report',
    description: 'All registered users within the selected date range',
    color:       'indigo',
    columns:     ['ID', 'Name', 'Email', 'Joined'],
    row: (item) => [
      item.id,
      item.name,
      item.email,
      new Date(item.created_at).toLocaleDateString(),
    ],
  },
  sessions: {
    label:       'Sessions Report',
    description: 'All study sessions within the selected date range',
    color:       'emerald',
    columns:     ['ID', 'Host', 'Partner', 'Subject', 'Status', 'Started'],
    row: (item) => [
      item.id,
      item.host?.name ?? '—',
      item.partner?.name ?? '—',
      item.subject,
      item.status,
      item.started_at
        ? new Date(item.started_at).toLocaleDateString()
        : '—',
    ],
  },
  complaints: {
    label:       'Complaints Report',
    description: 'All complaints filed within the selected date range',
    color:       'red',
    columns:     ['ID', 'Subject', 'Submitted By', 'Priority', 'Status', 'Date'],
    row: (item) => [
      item.id,
      item.subject,
      item.submitter?.name ?? '—',
      item.priority,
      item.status,
      new Date(item.created_at).toLocaleDateString(),
    ],
  },
}

const colorMap = {
  indigo:  { btn: 'bg-indigo-600 hover:bg-indigo-500', light: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  emerald: { btn: 'bg-emerald-600 hover:bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  red:     { btn: 'bg-red-600 hover:bg-red-500', light: 'bg-red-50 text-red-700 border-red-200' },
}

export default function ReportsPage() {
  const [type, setType]         = useState('users')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const config = typeConfig[type]
  const colors = colorMap[config.color]

  const handleGenerate = async () => {
    if (!from || !to) {
      setError('Please select both a start and end date.')
      return
    }
    if (new Date(from) > new Date(to)) {
      setError('Start date cannot be after end date.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await generateReport(type, from, to)
      setResult(res.data)
    } catch {
      setError('Failed to generate report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!result?.data?.length) return

    const headers = config.columns.join(',')
    const rows = result.data.map(item =>
      config.row(item).map(val =>
        `"${String(val).replace(/"/g, '""')}"`
      ).join(',')
    )
    const csv     = [headers, ...rows].join('\n')
    const blob    = new Blob([csv], { type: 'text/csv' })
    const url     = URL.createObjectURL(blob)
    const link    = document.createElement('a')
    link.href     = url
    link.download = `studymatch_${type}_${from}_to_${to}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const setQuickRange = (days) => {
    const end   = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    setFrom(start.toISOString().split('T')[0])
    setTo(end.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports Generator</h1>
        <p className="text-gray-500 text-sm mt-1">
          Generate and export platform data reports by date range
        </p>
      </div>

      {/* Config panel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Report Configuration
        </h2>

        {/* Report type selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => { setType(key); setResult(null); setError('') }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  type === key
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
              >
                <p className={`font-semibold text-sm ${
                  type === key ? 'text-indigo-700' : 'text-gray-700'
                }`}>
                  {cfg.label}
                </p>
                <p className={`text-xs mt-0.5 ${
                  type === key ? 'text-indigo-500' : 'text-gray-400'
                }`}>
                  {cfg.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Date Range
          </label>

          {/* Quick range buttons */}
          <div className="flex gap-2 mb-3">
            {[
              { label: 'Last 7 days',  days: 7  },
              { label: 'Last 30 days', days: 30 },
              { label: 'Last 90 days', days: 90 },
              { label: 'Last year',    days: 365 },
            ].map(q => (
              <button
                key={q.days}
                onClick={() => setQuickRange(q.days)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full ${colors.btn} disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors`}
        >
          {loading ? 'Generating report...' : `Generate ${config.label}`}
        </button>

      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4">
            <div>
              <p className="font-semibold text-gray-800">{config.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {result.from} — {result.to} ·{' '}
                <span className="font-medium text-gray-700">
                  {result.total} records found
                </span>
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={!result.data?.length}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Export CSV
            </button>
          </div>

          {/* Empty state */}
          {result.data?.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <p className="text-gray-400 text-sm">
                No {type} found in this date range.
              </p>
            </div>
          ) : (

            /* Data table */
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {config.columns.map(col => (
                      <th
                        key={col}
                        className="text-left px-5 py-3 text-gray-500 font-medium"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((item, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      {config.row(item).map((cell, j) => (
                        <td key={j} className="px-5 py-3 text-gray-700">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Table footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {result.data.length} of {result.total} records
                  · Report generated on{' '}
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}