import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { Users, CalendarClock, ShieldCheck, Flag, AlertTriangle, ArrowRight } from 'lucide-react'
import {
  getOverview,
  getSessionTrends,
  getUserGrowth,
  getSubjectDemand,
} from '../api/dashboard'

const StatCard = ({ label, value, iconColor, icon: Icon }) => (
  <div style={{ background: '#fff', borderRadius: 20, padding: 22, border: '1px solid #E5E7EB' }}>
    <div style={{ width: 50, height: 50, borderRadius: 14, background: iconColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
      <Icon size={22} color={iconColor} />
    </div>
    <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', fontFamily: "'DM Sans', sans-serif" }}>
      {value ?? <span style={{ color: '#D1D5DB', fontSize: 22 }}>—</span>}
    </div>
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
        setSessionTrends(Array.isArray(st.data?.trends)   ? st.data.trends   : [])
        setUserGrowth(Array.isArray(ug.data?.growth)       ? ug.data.growth   : [])
        setSubjectDemand(Array.isArray(sd.data?.subjects)  ? sd.data.subjects : [])
      } catch {
        // charts are non-critical
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
      data: subjectDemand.map(d => d.name),
      axisLabel: { fontSize: 10, color: '#475569' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [{
      data: subjectDemand.map(d => d.student_demand),
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

      {/* Pending tutor approvals banner */}
      {stats?.users?.pending_tutor_approval > 0 && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="#F97316" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#92400E', fontFamily: "'DM Sans', sans-serif" }}>
              {stats.users.pending_tutor_approval} tutor application{stats.users.pending_tutor_approval !== 1 ? 's' : ''} awaiting review
            </div>
            <div style={{ fontSize: 12.5, color: '#B45309', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
              Review and approve or reject pending tutor verifications.
            </div>
          </div>
          <NavLink to="/tutors" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#F97316', color: 'white', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
            Review Now <ArrowRight size={13} />
          </NavLink>
        </div>
      )}

      {/* Primary KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users"             value={stats?.users?.total}                  iconColor="#7C3AED" icon={Users}        />
        <StatCard label="Total Sessions"          value={stats?.sessions?.total}               iconColor="#6366f1" icon={CalendarClock} />
        <StatCard label="Active Sessions"         value={stats?.sessions?.active}              iconColor="#22C55E" icon={CalendarClock} />
        <StatCard label="Pending Verifications"   value={stats?.users?.pending_tutor_approval} iconColor="#F59E0B" icon={ShieldCheck}   />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Completed Sessions" value={stats?.sessions?.completed}       iconColor="#6366f1" icon={CalendarClock} />
        <StatCard label="Total Tutors"       value={stats?.users?.tutors}             iconColor="#22C55E" icon={Users}         />
        <StatCard label="Open Complaints"    value={stats?.support?.open_complaints}  iconColor="#EF4444" icon={Flag}          />
        <StatCard label="Open Tickets"       value={stats?.support?.open_tickets}     iconColor="#F97316" icon={Flag}          />
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
            value={stats?.support?.open_complaints}
            color="text-red-600"
            bg="bg-red-50 border-red-100"
          />
          <AlertCard
            label="Open Help Tickets"
            value={stats?.support?.open_tickets}
            color="text-orange-600"
            bg="bg-orange-50 border-orange-100"
          />
          <AlertCard
            label="Pending Match Requests"
            value={stats?.requests?.pending}
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