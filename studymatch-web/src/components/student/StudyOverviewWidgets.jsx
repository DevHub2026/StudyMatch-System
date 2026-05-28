import { Link } from 'react-router-dom'
import { BookOpen, AlertTriangle, ArrowRight } from 'lucide-react'
import { subjectColor, subjectBg, subjectInitials } from '../../utils/studyOverviewUtils'

export function ProgressBar({ percent = 0, color = '#7C3AED', height = 7, width = '100%' }) {
  return (
    <div style={{ background: '#E5E7EB', borderRadius: 10, height, overflow: 'hidden', width }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, percent))}%`,
        height: '100%',
        background: color,
        borderRadius: 10,
        transition: 'width .35s ease',
      }} />
    </div>
  )
}

export function DonutChart({ analytics = {} }) {
  const overall = analytics.overall_progress_percent ?? 0
  const completed = analytics.subjects_completed ?? 0
  const inProgress = analytics.subjects_in_progress ?? 0
  const notStarted = analytics.subjects_not_started ?? 0
  const total = analytics.total_subjects ?? 0

  const r = 54
  const cx = 70
  const cy = 70
  const circ = 2 * Math.PI * r
  const offset = circ - (overall / 100) * circ

  const slices = total > 0
    ? [
        { label: 'Completed', count: completed, color: '#7C3AED' },
        { label: 'In Progress', count: inProgress, color: '#A78BFA' },
        { label: 'Not Started', count: notStarted, color: '#E5E7EB' },
      ]
    : [
        { label: 'Completed', count: 0, color: '#7C3AED' },
        { label: 'In Progress', count: 0, color: '#A78BFA' },
        { label: 'Not Started', count: 0, color: '#E5E7EB' },
      ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg width={140} height={140}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={14} />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#7C3AED"
          strokeWidth={14}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset .4s ease' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="#1E1B4B" fontFamily="DM Sans, sans-serif">
          {overall}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="DM Sans, sans-serif">
          Overall
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map(({ label, count, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B', marginLeft: 4 }}>
              {total > 0 ? count : '0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InactiveAlerts({ alerts = [], compact = false }) {
  if (!alerts.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: compact ? 0 : 16 }}>
      {alerts.slice(0, compact ? 2 : 5).map((a) => (
        <div
          key={a.subject_id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: compact ? '10px 12px' : '12px 14px',
            borderRadius: 10,
            background: a.severity === 'warning' ? '#FFFBEB' : '#EEF2FF',
            border: `1px solid ${a.severity === 'warning' ? '#FDE68A' : '#DDD6FE'}`,
          }}
        >
          <AlertTriangle size={16} color={a.severity === 'warning' ? '#D97706' : '#7C3AED'} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.45 }}>{a.message}</div>
        </div>
      ))}
    </div>
  )
}

/** Compact subjects list for dashboard sidebar */
export function SubjectsOverviewPanel({ subjects = [], analytics, linkTo = '/student/my-subjects' }) {
  if (!subjects.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: '#EEF2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BookOpen size={18} color="#7C3AED" />
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>No subjects added yet</div>
        <Link to={linkTo} style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
          + Add subjects
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {analytics && (
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
          Overall progress: <strong style={{ color: '#7C3AED' }}>{analytics.overall_progress_percent ?? 0}%</strong>
        </div>
      )}
      {subjects.slice(0, 4).map((s, i) => {
        const color = subjectColor(i)
        const bg = subjectBg(i)
        return (
          <Link
            key={s.id}
            to={linkTo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #F0F0F4',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background .15s, box-shadow .15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FAFAFA'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(124,58,237,.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 11, color, flexShrink: 0,
            }}>
              {subjectInitials(s.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{s.progress_percent}% · {s.completed_sessions} done</div>
              <ProgressBar percent={s.progress_percent} color={color} height={5} />
            </div>
            <ArrowRight size={14} color="#C4B5FD" style={{ flexShrink: 0 }} />
          </Link>
        )
      })}
      {subjects.length > 4 && (
        <Link to={linkTo} style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>
          +{subjects.length - 4} more subjects
        </Link>
      )}
    </div>
  )
}
