import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus,
  Calendar, Users, User, Clock,
  Video, List, BookOpen, Loader2,
} from 'lucide-react'
import { getSessions } from '../../api/sessions'

/* ─── constants ─────────────────────────────────────────────── */

const WEEK_DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS      = ['9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM']
const HOUR_START = 9

function buildCalendar(year, month) {
  const first = new Date(year, month, 1).getDay()
  const days  = new Date(year, month + 1, 0).getDate()
  const prev  = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prev - i, cur: false })
  for (let d = 1; d <= days; d++)       cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0)        cells.push({ day: cells.length - days - first + 1, cur: false })
  return cells
}

function ChevronDown14() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/* ─── empty state ────────────────────────────────────────────── */

function EmptyState({ message = 'No sessions found.' }) {
  return (
    <div style={{
      background: '#F8F9FB', border: '1px dashed #DDD6FE',
      borderRadius: 14, padding: '40px 20px', textAlign: 'center',
    }}>
      <Calendar size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
      <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>{message}</div>
      <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
        Book a session with a tutor to get started.
      </div>
      <Link to="/student/find-tutors" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 20px', background: '#7C3AED', color: 'white',
        borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none',
      }}>
        <Plus size={14} /> Find a Tutor
      </Link>
    </div>
  )
}

/* ─── session card (list) ────────────────────────────────────── */

const STATUS_COLORS = {
  scheduled: { bg: '#EEF2FF', text: '#6366F1' },
  completed: { bg: '#F0FDF4', text: '#10B981' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
}

function SessionRow({ session }) {
  const sc = STATUS_COLORS[session.status] || STATUS_COLORS.scheduled
  const tutorName = session.tutor?.user?.name || 'Tutor'
  const subject   = session.subject?.name || session.notes || 'Study Session'
  const dt = session.scheduled_at
    ? new Date(session.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #F8F9FB' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <BookOpen size={16} color="#7C3AED" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: 6 }}>
          {subject}
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: sc.bg, color: sc.text, textTransform: 'capitalize' }}>{session.status}</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>
          with {tutorName} · {dt} · {session.duration_minutes || 60} min
        </div>
      </div>
      {session.session_link && (
        <a href={session.session_link} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#7C3AED', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
          <Video size={13} /> Join
        </a>
      )}
    </div>
  )
}

/* ─── list view ──────────────────────────────────────────────── */

const LIST_TABS = ['Upcoming', 'Completed', 'All Sessions']

function ListView({ sessions }) {
  const [listTab, setListTab] = useState('Upcoming')
  const now = new Date()

  const filtered = sessions.filter(s => {
    if (listTab === 'Upcoming')   return s.status === 'scheduled' && new Date(s.scheduled_at) >= now
    if (listTab === 'Completed')  return s.status === 'completed'
    return true
  })

  return (
    <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 20, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
        {LIST_TABS.map(t => (
          <button key={t} onClick={() => setListTab(t)} style={{
            padding: '6px 2px', fontSize: 13.5, fontWeight: 600,
            color: listTab === t ? '#7C3AED' : '#9CA3AF',
            border: 'none', borderBottom: `2px solid ${listTab === t ? '#7C3AED' : 'transparent'}`,
            background: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s',
          }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ padding: '0 20px 8px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '20px 0' }}>
            <EmptyState message={
              listTab === 'Upcoming'  ? 'No upcoming sessions' :
              listTab === 'Completed' ? 'No completed sessions yet' : 'No sessions found'
            } />
          </div>
        ) : (
          filtered.map(s => <SessionRow key={s.id} session={s} />)
        )}
      </div>
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────── */

export default function MySchedulePage() {
  const today = new Date()

  const [calView,     setCalView]     = useState('calendar')
  const [calSubView,  setCalSubView]  = useState('week') // 'week' | 'month'
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [miniMonth,  setMiniMonth]  = useState({
    year:  today.getFullYear(),
    month: today.getMonth(),
  })
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    getSessions()
      .then(data => setSessions(Array.isArray(data?.data) ? data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Week dates starting from Sunday
  const weekStart = new Date(today)
  const dayOfWeek = today.getDay()
  weekStart.setDate(today.getDate() - dayOfWeek + weekOffset * 7)

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const calCells   = buildCalendar(miniMonth.year, miniMonth.month)
  const monthLabel = new Date(miniMonth.year, miniMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => setMiniMonth(p => p.month === 0  ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })
  const nextMonth = () => setMiniMonth(p => p.month === 11 ? { year: p.year + 1, month: 0  } : { ...p, month: p.month + 1 })

  const isToday = (date) =>
    date.getDate()     === today.getDate()  &&
    date.getMonth()    === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const now = new Date()
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= now)
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
  const thisWeekSessions = sessions.filter(s => {
    const d = new Date(s.scheduled_at)
    return d >= weekStart && d < weekEnd
  })
  // days with sessions (for marking in week view)
  const sessionDays = new Set(sessions.map(s => new Date(s.scheduled_at).toDateString()))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .sch-wrap * { box-sizing: border-box; }
        .sch-wrap {
          font-family: 'DM Sans', sans-serif; color: #1E1B4B;
          display: flex; gap: 24px; align-items: flex-start;
        }
        .sch-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .sch-right { width: 256px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .view-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 2px; font-size: 14px; font-weight: 600;
          color: #9CA3AF; cursor: pointer; border: none;
          border-bottom: 2.5px solid transparent; background: none;
          font-family: 'DM Sans', sans-serif; transition: color .15s;
        }
        .view-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .view-tab:hover  { color: #7C3AED; }
        .nav-btn {
          width: 28px; height: 28px; border-radius: 7px;
          border: 1px solid #E5E7EB; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .12s;
        }
        .nav-btn:hover { background: #F3F0FF; }
        .mini-day {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12.5px; cursor: pointer; font-weight: 500;
          transition: background .12s;
        }
        .mini-day:hover  { background: #F3F0FF; color: #7C3AED; }
        .mini-day.today  { background: #7C3AED; color: white; font-weight: 700; }
        .mini-day.other  { color: #D1D5DB; pointer-events: none; }
        .sum-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 0; border-bottom: 1px solid #F8F9FB; font-size: 13.5px;
        }
        .sum-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="sch-wrap">
        <div className="sch-main">

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>My Schedule</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>View and manage your upcoming study sessions and events.</p>
            </div>
            <Link to="/student/find-tutors" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '11px 20px', background: '#7C3AED', color: 'white',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
            }}>
              <Plus size={16} /> Book a Session
            </Link>
          </div>

          {/* View tabs */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #F0F0F4' }}>
            <button className={`view-tab${calView === 'calendar' ? ' active' : ''}`} onClick={() => setCalView('calendar')}>
              <Calendar size={15} /> Calendar View
            </button>
            <button className={`view-tab${calView === 'list' ? ' active' : ''}`} onClick={() => setCalView('list')}>
              <List size={15} /> List View
            </button>
          </div>

          {/* ── Calendar View ── */}
          {calView === 'calendar' && (
            <>
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
                  <button style={{ padding: '7px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => { setWeekOffset(0); setMiniMonth({ year: today.getFullYear(), month: today.getMonth() }) }}>
                    Today
                  </button>
                  {calSubView === 'week' ? (
                    <>
                      <button className="nav-btn" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={14} color="#6B7280" /></button>
                      <button className="nav-btn" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={14} color="#6B7280" /></button>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>{weekLabel}</span>
                    </>
                  ) : (
                    <>
                      <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={14} color="#6B7280" /></button>
                      <button className="nav-btn" onClick={nextMonth}><ChevronRight size={14} color="#6B7280" /></button>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>{monthLabel}</span>
                    </>
                  )}
                  {/* View switcher */}
                  <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                    {['week', 'month'].map(v => (
                      <button key={v} onClick={() => setCalSubView(v)} style={{
                        padding: '6px 14px', fontSize: 12.5, fontWeight: 600,
                        background: calSubView === v ? '#7C3AED' : 'white',
                        color: calSubView === v ? 'white' : '#6B7280',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        textTransform: 'capitalize', transition: 'all .12s',
                      }}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Week Grid ── */}
                {calSubView === 'week' && (
                  <div style={{ display: 'flex', overflowX: 'auto' }}>
                    {/* Time gutter */}
                    <div style={{ width: 64, flexShrink: 0 }}>
                      <div style={{ height: 56, borderBottom: '1px solid #F0F0F4' }} />
                      <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10, fontSize: 11, color: '#9CA3AF', borderBottom: '1px solid #F0F0F4' }}>
                        All day
                      </div>
                      {HOURS.map(h => (
                        <div key={h} style={{ height: 56, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10, paddingTop: 4, fontSize: 11, color: '#9CA3AF', borderBottom: '1px solid #F8F9FB' }}>
                          {h}
                        </div>
                      ))}
                    </div>
                    {weekDates.map((date, colIdx) => {
                      const todayCol    = isToday(date)
                      const daySessions = sessions.filter(s => s.scheduled_at && new Date(s.scheduled_at).toDateString() === date.toDateString())
                      return (
                        <div key={colIdx} style={{ flex: 1, minWidth: 100, borderLeft: '1px solid #F0F0F4' }}>
                          <div style={{ height: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderBottom: '1px solid #F0F0F4' }}>
                            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{WEEK_DAYS[date.getDay()]}</div>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: todayCol ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: todayCol ? 700 : 600, color: todayCol ? 'white' : '#1E1B4B' }}>
                              {date.getDate()}
                            </div>
                          </div>
                          <div style={{ height: 32, borderBottom: '1px solid #F0F0F4' }} />
                          <div style={{ position: 'relative' }}>
                            {HOURS.map(h => <div key={h} style={{ height: 56, borderBottom: '1px solid #F8F9FB' }} />)}
                            {daySessions.map(s => {
                              const d   = new Date(s.scheduled_at)
                              const off = d.getHours() - HOUR_START
                              if (off < 0 || off >= HOURS.length) return null
                              const top    = off * 56 + (d.getMinutes() / 60) * 56
                              const height = Math.max(((s.duration_minutes || 60) / 60) * 56, 22)
                              const label  = s.subject?.name || s.notes || 'Session'
                              const SC     = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled
                              return (
                                <div key={s.id} title={label} style={{ position: 'absolute', top, left: 3, right: 3, height, background: SC.text, borderRadius: 6, padding: '3px 6px', fontSize: 10.5, fontWeight: 700, color: 'white', overflow: 'hidden', zIndex: 1, cursor: 'default' }}>
                                  {label}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── Month Grid ── */}
                {calSubView === 'month' && (
                  <div style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                      {WEEK_DAYS.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                      {calCells.map((cell, i) => {
                        const cellDate = new Date(miniMonth.year, cell.cur ? miniMonth.month : (i < 7 ? miniMonth.month - 1 : miniMonth.month + 1), cell.day)
                        const cellSessions = sessions.filter(s => s.scheduled_at && new Date(s.scheduled_at).toDateString() === cellDate.toDateString())
                        const isTd = cell.cur && isToday(cellDate)
                        return (
                          <div key={i} style={{ minHeight: 64, padding: '4px', borderRadius: 8, background: isTd ? '#F3F0FF' : 'transparent', border: isTd ? '1.5px solid #DDD6FE' : '1px solid transparent' }}>
                            <div style={{ fontSize: 12, fontWeight: isTd ? 700 : 500, color: cell.cur ? (isTd ? '#7C3AED' : '#1E1B4B') : '#D1D5DB', marginBottom: 4, textAlign: 'center' }}>
                              {cell.day}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {cellSessions.slice(0, 2).map(s => {
                                const SC = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled
                                return (
                                  <div key={s.id} title={s.subject?.name || 'Session'} style={{ fontSize: 9.5, fontWeight: 700, color: 'white', background: SC.text, borderRadius: 3, padding: '1px 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {s.subject?.name || s.notes || 'Session'}
                                  </div>
                                )
                              })}
                              {cellSessions.length > 2 && (
                                <div style={{ fontSize: 9, color: '#7C3AED', fontWeight: 600, textAlign: 'center' }}>+{cellSessions.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Upcoming sessions */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B' }}>Upcoming Sessions</span>
                  <Link to="/student/study-sessions" style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
                    View All Sessions
                  </Link>
                </div>
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                    <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : upcomingSessions.length === 0 ? (
                  <EmptyState message="No upcoming sessions" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {upcomingSessions.slice(0, 5).map(s => (
                      <div key={s.id} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookOpen size={17} color="#7C3AED" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B' }}>{s.subject?.name || s.notes || 'Study Session'}</div>
                          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>
                            with {s.tutor?.user?.name || 'Tutor'} · {new Date(s.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                        {s.session_link && (
                          <a href={s.session_link} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#7C3AED', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                            <Video size={13} /> Join
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── List View ── */}
          {calView === 'list' && <ListView sessions={sessions} />}

        </div>

        {/* ── Right panel ── */}
        <div className="sch-right">

          {/* Upcoming This Week */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>Upcoming This Week</span>
              <Link to="/student/study-sessions" style={{ color: '#7C3AED', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View All</Link>
            </div>
            {thisWeekSessions.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#9CA3AF' }}>No sessions this week</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thisWeekSessions.map(s => (
                  <div key={s.id} style={{ padding: '10px 12px', background: '#F8F9FB', borderRadius: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: '#1E1B4B' }}>{s.subject?.name || 'Study Session'}</div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>
                      {new Date(s.scheduled_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mini calendar */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{monthLabel}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={13} color="#6B7280" /></button>
                <button className="nav-btn" onClick={nextMonth}><ChevronRight size={13} color="#6B7280" /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {WEEK_DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', fontWeight: 600, padding: '2px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px 0' }}>
              {calCells.map((c, i) => {
                const isTodayCell = c.cur &&
                  c.day === today.getDate() &&
                  miniMonth.month === today.getMonth() &&
                  miniMonth.year  === today.getFullYear()
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className={`mini-day${!c.cur ? ' other' : ''}${isTodayCell ? ' today' : ''}`}>
                      {c.day}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Schedule Summary */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 12 }}>Schedule Summary</div>
            {[
              { icon: Calendar, label: 'Total Sessions', value: sessions.length,            color: '#7C3AED' },
              { icon: Clock,    label: 'This Week',      value: thisWeekSessions.length,    color: '#6366F1' },
              { icon: Users,    label: 'Upcoming',       value: upcomingSessions.length,    color: '#10B981' },
              { icon: User,     label: 'Completed',      value: sessions.filter(s => s.status === 'completed').length, color: '#F59E0B' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="sum-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={color} />
                  </div>
                  <span style={{ fontWeight: 500, color: '#374151' }}>{label}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}