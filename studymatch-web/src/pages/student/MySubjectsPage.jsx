import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Trophy, BookOpen, Loader2, RefreshCw, Calendar,
  ChevronRight, Search, X,
} from 'lucide-react'
import { getUser } from '../../store/authStore'
import {
  getStudyOverview, getSubjects, addWeakSubject, removeWeakSubject,
} from '../../api/subjects'
import {
  DonutChart, InactiveAlerts, ProgressBar,
} from '../../components/student/StudyOverviewWidgets'
import {
  subjectColor, subjectBg, subjectInitials, formatOverviewDate,
} from '../../utils/studyOverviewUtils'

const REFRESH_MS = 45000

function AddSubjectModal({ catalog, onClose, onAdd, adding }) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')

  const filtered = (catalog || []).filter(s => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q)
  }).slice(0, 12)

  const handlePick = async (subject) => {
    setError('')
    try {
      await onAdd({
        subject_id: subject.id,
        difficulty_level: 'moderate',
      })
      onClose()
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not add subject. It may already be on your list.')
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 100 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'white', borderRadius: 20, padding: 28, zIndex: 101, width: 'min(440px, 92vw)',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1E1B4B' }}>Add Subject</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search subjects..."
            style={{
              width: '100%', padding: '10px 14px 10px 36px',
              border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13.5,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        {error && (
          <div style={{ fontSize: 12.5, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No matching subjects</div>
          ) : filtered.map(s => (
            <button
              key={s.id}
              type="button"
              disabled={adding}
              onClick={() => handlePick(s)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', border: '1px solid #F0F0F4', borderRadius: 10,
                background: 'white', cursor: adding ? 'wait' : 'pointer', fontFamily: 'inherit',
                textAlign: 'left', transition: 'background .12s',
              }}
              onMouseEnter={e => { if (!adding) e.currentTarget.style.background = '#F8F9FB' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{s.code}</div>
              </div>
              <Plus size={16} color="#7C3AED" />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function SubjectCard({ subject, index, onRemove, removing }) {
  const color = subjectColor(index)
  const bg = subjectBg(index)
  const next = subject.next_session

  return (
    <div style={{
      background: 'white', border: '1px solid #F0F0F4', borderRadius: 18,
      overflow: 'hidden', transition: 'box-shadow .18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,.08)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 16, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontWeight: 800, fontSize: 18, color,
        }}>
          {subjectInitials(subject.name)}
        </div>

        <div style={{ minWidth: 180, flex: '1 1 180px' }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#1E1B4B', marginBottom: 2 }}>{subject.name}</div>
          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 10 }}>{subject.category}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 5 }}>
            {subject.progress_percent}% Complete
          </div>
          <ProgressBar percent={subject.progress_percent} color={color} width={160} />
          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 11.5, color: '#6B7280' }}>
            <span>{subject.completed_sessions} completed</span>
            <span>{subject.upcoming_sessions} upcoming</span>
            {subject.ongoing_sessions > 0 && (
              <span style={{ color: '#7C3AED', fontWeight: 600 }}>{subject.ongoing_sessions} ongoing</span>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>
            Next Session
          </div>
          {next ? (
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1E1B4B' }}>
                {next.tutor_name ? `with ${next.tutor_name}` : 'Scheduled'}
              </div>
              <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} />
                {formatOverviewDate(next.scheduled_at)}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
              No sessions scheduled —{' '}
              <Link to="/student/find-tutors" style={{ color: '#7C3AED', fontWeight: 600 }}>find a tutor</Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link
            to="/student/study-sessions"
            style={{
              padding: '8px 16px', border: '1px solid #DDD6FE', borderRadius: 9,
              background: '#F3F0FF', color: '#7C3AED', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'inherit',
            }}
          >
            Sessions
          </Link>
          <button
            type="button"
            disabled={removing}
            onClick={() => onRemove(subject.id)}
            style={{
              padding: '8px 16px', border: '1px solid #FECACA', borderRadius: 9,
              background: '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 600,
              cursor: removing ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            Remove
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#FAFAFA', borderTop: '1px solid #F0F0F4' }}>
        {[
          { title: 'Completed', value: subject.completed_sessions },
          { title: 'Upcoming', value: subject.upcoming_sessions },
          { title: 'Progress', value: `${subject.progress_percent}%` },
        ].map(({ title, value }, i) => (
          <div key={title} style={{ padding: '16px 20px', borderRight: i < 2 ? '1px solid #F0F0F4' : 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1E1B4B', marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MySubjectsPage() {
  const user = getUser()
  const [overview, setOverview] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const [data, subjectsList] = await Promise.all([
        getStudyOverview(),
        getSubjects().catch(() => []),
      ])
      setOverview(data)
      const cat = Array.isArray(subjectsList) ? subjectsList : subjectsList?.data || []
      setCatalog(cat)
    } catch {
      setError('Failed to load study overview. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
    const interval = setInterval(() => loadOverview(true), REFRESH_MS)
    const onFocus = () => loadOverview(true)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadOverview])

  const handleAdd = async (payload) => {
    setAdding(true)
    try {
      await addWeakSubject(payload)
      await loadOverview(true)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id) => {
    setRemovingId(id)
    try {
      await removeWeakSubject(id)
      await loadOverview(true)
    } catch {
      setError('Could not remove subject.')
    } finally {
      setRemovingId(null)
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'Student'
  const subjects = overview?.subjects || []
  const analytics = overview?.analytics || {}
  const upcoming = overview?.upcoming_sessions || []
  const alerts = overview?.inactive_alerts || []
  const streak = overview?.streak || { current_days: 0, week_days: [] }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: '#6B7280', fontFamily: "'DM Sans', sans-serif", gap: 10 }}>
        <Loader2 size={22} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        Loading study overview...
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .ms-wrap * { box-sizing: border-box; }
        .ms-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .ms-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .ms-right { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .ms-add-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px;
          background: #7C3AED; color: white; border: none; border-radius: 10px;
          font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit;
          transition: background .15s, transform .15s;
        }
        .ms-add-btn:hover { background: #6D28D9; transform: translateY(-1px); }
        .ms-refresh-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px;
          background: white; color: #6B7280; border: 1px solid #E5E7EB; border-radius: 10px;
          font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
        }
        @media (max-width: 960px) {
          .ms-wrap { flex-direction: column; }
          .ms-right { width: 100%; }
        }
      `}</style>

      <div className="ms-wrap">
        <div className="ms-main">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Study Overview</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>
                Track subjects, session progress, and stay organized across StudyMatch.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="ms-refresh-btn" onClick={() => loadOverview(true)} disabled={refreshing}>
                <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
                Refresh
              </button>
              <button type="button" className="ms-add-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={15} /> Add Subject
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#B91C1C', fontSize: 13 }}>
              {error}
              <button type="button" onClick={() => loadOverview()} style={{ marginLeft: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED' }}>
                Retry
              </button>
            </div>
          )}

          <InactiveAlerts alerts={alerts} />

          {/* Analytics strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}>
            {[
              { label: 'Subjects', value: analytics.total_subjects ?? 0 },
              { label: 'Completed sessions', value: analytics.total_completed_sessions ?? 0 },
              { label: 'Upcoming', value: analytics.total_upcoming_sessions ?? 0 },
              { label: 'Overall progress', value: `${analytics.overall_progress_percent ?? 0}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED' }}>{value}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {subjects.length === 0 ? (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BookOpen size={24} color="#7C3AED" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', marginBottom: 8 }}>No subjects added yet</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
                Add subjects you need help with to track progress, sessions, and study reminders.
              </div>
              <button type="button" className="ms-add-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={15} /> Add Your First Subject
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subjects.map((s, i) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  index={i}
                  onRemove={handleRemove}
                  removing={removingId === s.id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="ms-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 16 }}>Overall Study Progress</div>
            <DonutChart analytics={analytics} />
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 8 }}>Study Streak</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1E1B4B', marginBottom: 12 }}>
              {streak.current_days} <span style={{ fontSize: 14, fontWeight: 500, color: '#9CA3AF' }}>days</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(streak.week_days || []).map((d) => (
                <div key={d.date} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto',
                    background: d.active ? '#7C3AED' : '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {d.active && <span style={{ fontSize: 10, color: 'white' }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 9.5, color: '#9CA3AF', marginTop: 4 }}>{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Upcoming Sessions</span>
              <Link to="/student/schedule" style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>Schedule</Link>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>No upcoming sessions</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {upcoming.slice(0, 5).map(s => (
                  <Link
                    key={s.id}
                    to="/student/study-sessions"
                    style={{
                      padding: '10px 12px', borderRadius: 10, border: '1px solid #F0F0F4',
                      textDecoration: 'none', color: 'inherit', transition: 'background .12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1E1B4B' }}>{s.subject_name || 'Session'}</div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{s.tutor_name}</div>
                    <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 4 }}>{formatOverviewDate(s.scheduled_at)}</div>
                  </Link>
                ))}
              </div>
            )}
            <Link
              to="/student/study-sessions"
              style={{
                display: 'block', width: '100%', marginTop: 12, padding: '10px', textAlign: 'center',
                background: 'transparent', border: '1px solid #E5E7EB', borderRadius: 10,
                color: '#374151', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              View All Sessions
            </Link>
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={20} color="#F59E0B" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 4 }}>Keep it up, {firstName}!</div>
                <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.5 }}>
                  {analytics.overall_progress_percent >= 100
                    ? 'Amazing — you have subjects at full progress. Keep scheduling sessions!'
                    : 'Complete sessions to boost your progress across all subjects.'}
                </div>
              </div>
            </div>
            <Link
              to="/student/study-sessions"
              style={{
                display: 'block', width: '100%', padding: '10px', textAlign: 'center',
                background: '#F3F0FF', border: 'none', borderRadius: 10,
                color: '#7C3AED', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              View Study Sessions
            </Link>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddSubjectModal
          catalog={catalog}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          adding={adding}
        />
      )}
    </>
  )
}
