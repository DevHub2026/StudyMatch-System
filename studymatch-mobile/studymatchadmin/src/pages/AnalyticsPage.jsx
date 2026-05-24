import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  getAnalyticsOverview,
  getSessionTrends,
  getSubjectDemand,
  getUserGrowth,
  getActivityTrends,
} from '../api/analytics'

const StatCard = ({ label, value, color }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
    <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>
      {value ?? <span className="text-gray-300 text-2xl">—</span>}
    </p>
  </div>
)

export default function AnalyticsPage() {
  const [overview, setOverview]           = useState(null)
  const [sessionTrends, setSessionTrends] = useState([])
  const [subjectDemand, setSubjectDemand] = useState([])
  const [userGrowth, setUserGrowth]       = useState([])
  const [activityTrends, setActivity]     = useState(null)
  const [days, setDays]                   = useState(30)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  const fetchAll = async (d = days) => {
    setLoading(true)
    setError('')
    try {
      const [ov, st, sd, ug, at] = await Promise.all([
        getAnalyticsOverview(),
        getSessionTrends(d),
        getSubjectDemand(),
        getUserGrowth(d),
        getActivityTrends(d),
      ])
      setOverview(ov.data)
      setSessionTrends(st.data.data || [])
      setSubjectDemand(st.data.data || [])
      setUserGrowth(st.data.data || [])
      setActivity(at.data)
    } catch {
      setError('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleDaysChange = (d) => {
    setDays(d)
    fetchAll(d)
  }

  // ── Chart options ──────────────────────────────────────────

  const sessionTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: sessionTrends.map(d => d.date),
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [{
      data: sessionTrends.map(d => d.total),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
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
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: userGrowth.map(d => d.date),
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [{
      data: userGrowth.map(d => d.total),
      type: 'bar',
      barMaxWidth: 32,
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#818cf8' },
            { offset: 1, color: '#c7d2fe' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
    }],
  }

  const subjectDemandOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 100, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    yAxis: {
      type: 'category',
      data: subjectDemand.map(d => d.subject),
      axisLabel: { fontSize: 11, color: '#475569' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    series: [{
      data: subjectDemand.map(d => d.total),
      type: 'bar',
      barMaxWidth: 24,
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#a5b4fc' },
          ],
        },
        borderRadius: [0, 4, 4, 0],
      },
    }],
  }

  const activityCompareOption = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['Sessions', 'New Users'],
      textStyle: { fontSize: 12, color: '#64748b' },
      top: 0,
    },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: activityTrends?.sessions?.map(d => d.date) ?? [],
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    series: [
      {
        name: 'Sessions',
        data: activityTrends?.sessions?.map(d => d.total) ?? [],
        type: 'line',
        smooth: true,
        lineStyle: { color: '#6366f1', width: 2 },
        itemStyle: { color: '#6366f1' },
        symbol: 'circle',
        symbolSize: 5,
      },
      {
        name: 'New Users',
        data: activityTrends?.users?.map(d => d.total) ?? [],
        type: 'line',
        smooth: true,
        lineStyle: { color: '#10b981', width: 2 },
        itemStyle: { color: '#10b981' },
        symbol: 'circle',
        symbolSize: 5,
      },
    ],
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Loading analytics...</div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Platform performance and usage insights
          </p>
        </div>

        {/* Days selector */}
        <div className="flex gap-2">
          {[7, 14, 30, 60].map(d => (
            <button
              key={d}
              onClick={() => handleDaysChange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                days === d
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview KPI cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Total Users"
          value={overview?.total_users}
          color="text-indigo-600"
        />
        <StatCard
          label="Total Sessions"
          value={overview?.total_sessions}
          color="text-indigo-600"
        />
        <StatCard
          label="Completed Sessions"
          value={overview?.completed_sessions}
          color="text-emerald-600"
        />
        <StatCard
          label="Accepted Matches"
          value={overview?.total_matches}
          color="text-blue-600"
        />
        <StatCard
          label="Total Complaints"
          value={overview?.total_complaints}
          color="text-red-500"
        />
      </div>

      {/* Session trends + User growth */}
      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Session Activity — last {days} days
          </h2>
          {sessionTrends.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
              No data for this period
            </div>
          ) : (
            <ReactECharts
              option={sessionTrendOption}
              style={{ height: 220 }}
            />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            User Growth — last {days} days
          </h2>
          {userGrowth.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
              No data for this period
            </div>
          ) : (
            <ReactECharts
              option={userGrowthOption}
              style={{ height: 220 }}
            />
          )}
        </div>

      </div>

      {/* Subject demand */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Subject Demand — top 10 most requested subjects
        </h2>
        {subjectDemand.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
            No subject data available
          </div>
        ) : (
          <ReactECharts
            option={subjectDemandOption}
            style={{ height: 280 }}
          />
        )}
      </div>

      {/* Activity comparison */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Sessions vs New Users — last {days} days
        </h2>
        {!activityTrends?.sessions?.length ? (
          <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
            No activity data for this period
          </div>
        ) : (
          <ReactECharts
            option={activityCompareOption}
            style={{ height: 240 }}
          />
        )}
      </div>

    </div>
  )
}