import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  getOverview,
  getSessionTrends,
  getUserGrowth,
  getSubjectDemand,
} from '../api/dashboard'

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
    <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>
      {value ?? <span className="text-gray-300 text-2xl">—</span>}
    </p>
  </div>
)

const AlertCard = ({ label, value, color, bg }) => (
  <div className={`${bg} rounded-xl p-5 border flex items-center justify-between`}>
    <p className={`text-sm font-medium ${color}`}>{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
  </div>
)

export default function DashboardPage() {
  const [stats, setStats]             = useState(null)
  const [sessionTrends, setSessionTrends] = useState([])
  const [userGrowth, setUserGrowth]   = useState([])
  const [subjectDemand, setSubjectDemand] = useState([])
  const [loading, setLoading]         = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [error, setError]             = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getOverview()
        setStats(res.data)
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    const fetchCharts = async () => {
  try {
    const [st, ug, sd] = await Promise.all([
      getSessionTrends(7),
      getUserGrowth(7),
      getSubjectDemand(),
    ])
    setSessionTrends(Array.isArray(st.data) ? st.data : [])
    setUserGrowth(Array.isArray(ug.data) ? ug.data : [])
    setSubjectDemand(Array.isArray(sd.data) ? sd.data : [])
  } catch {
    // charts are non-critical — page still loads without them
  } finally {
    setChartsLoading(false)
  }
}

    fetchStats()
    fetchCharts()
  }, [])

  // ── Chart options ──────────────────────────────

  const sessionTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: 36, right: 12, top: 12, bottom: 28 },
  xAxis: {
    type: 'category',
    data: (sessionTrends || []).map(d => d.date),
    axisLabel: { fontSize: 10, color: '#94a3b8' },
    axisLine: { lineStyle: { color: '#e2e8f0' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 10, color: '#94a3b8' },
    splitLine: { lineStyle: { color: '#f1f5f9' } },
  },
  series: [{
    data: (sessionTrends || []).map(d => d.total),
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    lineStyle: { color: '#6366f1', width: 2.5 },
    itemStyle: { color: '#6366f1' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(99,102,241,0.2)' },
          { offset: 1, color: 'rgba(99,102,241,0)' },
        ],
      },
    },
  }],
}

  const userGrowthOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 12, top: 12, bottom: 28 },
    xAxis: {
      type: 'category',
      data: userGrowth.map(d => d.date),
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [{
      data: userGrowth.map(d => d.total),
      type: 'bar',
      barMaxWidth: 28,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#818cf8' },
            { offset: 1, color: '#c7d2fe' },
          ],
        },
      },
    }],
  }

  const subjectDemandOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 90, right: 12, top: 12, bottom: 28 },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      data: subjectDemand.map(d => d.subject),
      axisLabel: { fontSize: 10, color: '#475569' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [{
      data: subjectDemand.map(d => d.total),
      type: 'bar',
      barMaxWidth: 20,
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a5b4fc' },
          ],
        },
      },
    }],
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Loading dashboard...</div>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
      {error}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back. Here is what is happening on StudyMatch today.
        </p>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={stats?.total_users}     color="text-indigo-600" />
        <StatCard label="Total Sessions"   value={stats?.total_sessions}  color="text-indigo-600" />
        <StatCard label="Active Sessions"  value={stats?.active_sessions} color="text-emerald-600" />
        <StatCard label="New Users Today"  value={stats?.new_users_today} color="text-indigo-600" />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Sessions Today"  value={stats?.sessions_today}   color="text-indigo-600" />
        <StatCard label="Unread Feedback" value={stats?.unread_feedback}  color="text-amber-600"  />
        <StatCard label="Open Complaints" value={stats?.open_complaints}  color="text-red-600"    />
        <StatCard label="Open Tickets"    value={stats?.open_help_tickets} color="text-orange-600" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Session trends */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Sessions — last 7 days
            </h2>
            <NavLink
              to="/analytics"
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Full analytics →
            </NavLink>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Loading...
            </div>
          ) : sessionTrends.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              No data yet
            </div>
          ) : (
            <ReactECharts option={sessionTrendOption} style={{ height: 180 }} />
          )}
        </div>

        {/* User growth */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              New users — last 7 days
            </h2>
            <NavLink
              to="/analytics"
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Full analytics →
            </NavLink>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Loading...
            </div>
          ) : userGrowth.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              No data yet
            </div>
          ) : (
            <ReactECharts option={userGrowthOption} style={{ height: 180 }} />
          )}
        </div>

        {/* Subject demand */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Top subjects
            </h2>
            <NavLink
              to="/analytics"
              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
            >
              Full analytics →
            </NavLink>
          </div>
          {chartsLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Loading...
            </div>
          ) : subjectDemand.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              No data yet
            </div>
          ) : (
            <ReactECharts option={subjectDemandOption} style={{ height: 180 }} />
          )}
        </div>

      </div>

      {/* Alerts row */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Items needing attention
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <AlertCard
            label="Open Complaints"
            value={stats?.open_complaints}
            color="text-red-600"
            bg="bg-red-50 border-red-100"
          />
          <AlertCard
            label="Open Help Tickets"
            value={stats?.open_help_tickets}
            color="text-orange-600"
            bg="bg-orange-50 border-orange-100"
          />
          <AlertCard
            label="Unread Feedback"
            value={stats?.unread_feedback}
            color="text-amber-600"
            bg="bg-amber-50 border-amber-100"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Manage Users',      path: '/users'         },
            { label: 'View Sessions',     path: '/sessions'      },
            { label: 'Review Complaints', path: '/complaints'    },
            { label: 'Help Center',       path: '/help-center'   },
            { label: 'Announcements',     path: '/announcements' },
            { label: 'View Feedback',     path: '/feedback'      },
            { label: 'Analytics',         path: '/analytics'     },
            { label: 'Generate Report',   path: '/reports'       },
          ].map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm text-center"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

    </div>
  )
}