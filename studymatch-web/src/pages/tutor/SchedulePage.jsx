import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus,
  Calendar, Clock, Users, CheckCircle,
  RefreshCw, Settings, ArrowRight, Loader2,
} from 'lucide-react'
import { getSessions } from '../../api/sessions'

const HOUR_START = 9
const HOURS      = ['9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM']
const STATUS_COLORS = {
  scheduled: '#7C3AED',
  completed: '#10B981',
  cancelled: '#EF4444',
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

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

export default function TutorMySchedulePage() {
  const today = new Date()
  const [activeView, setView]       = useState('Week View')
  const [weekOffset, setWeekOffset] = useState(0)
  const [miniMonth,  setMiniMonth]  = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [sessions,   setSessions]   = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    getSessions()
      .then(data => setSessions(Array.isArray(data?.data) ? data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Real week dates
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + weekOffset * 7)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
  })
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const calCells   = buildCalendar(miniMonth.year, miniMonth.month)
  const monthLabel = new Date(miniMonth.year, miniMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => setMiniMonth(p => p.month === 0  ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })
  const nextMonth = () => setMiniMonth(p => p.month === 11 ? { year: p.year + 1, month: 0  } : { ...p, month: p.month + 1 })

  const isToday = (date) => date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()

  const QUICK_ACTIONS = [
    { icon: Calendar,  color: '#7C3AED', bg: '#F3F0FF', label: 'Set Availability'    },
    { icon: Clock,     color: '#6366F1', bg: '#EEF2FF', label: 'Manage Availability' },
    { icon: RefreshCw, color: '#10B981', bg: '#F0FDF4', label: 'Sync Calendar'       },
    { icon: Settings,  color: '#F59E0B', bg: '#FFFBEB', label: 'Session Preferences' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tms-wrap * { box-sizing: border-box; }
        .tms-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .tms-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .tms-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .view-tab { padding: 9px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; }
        .view-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .nav-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid #E5E7EB; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .12s; }
        .nav-btn:hover { background: #F3F0FF; }
        .day-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; padding: 8px 4px; border-radius: 10px; transition: background .12s; }
        .day-col:hover { background: #F8F9FB; }
        .mini-day { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; font-weight: 500; transition: background .12s; }
        .mini-day:hover { background: #F3F0FF; color: #7C3AED; }
        .mini-day.today { background: #7C3AED; color: white; font-weight: 700; }
        .mini-day.other { color: #D1D5DB; pointer-events: none; }
        .quick-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; color: #1E1B4B; }
        .quick-row:last-child { border-bottom: none; }
        .quick-row:hover { color: #7C3AED; }
      `}</style>

      <div className="tms-wrap">
        <div className="tms-main">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>My Schedule</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>View and manage your upcoming tutoring sessions and schedule.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F0F4' }}>
            <div style={{ display: 'flex', gap: 24, flex: 1 }}>
              {['Week View', 'Month View', 'Agenda View'].map(v => (
                <button key={v} className={`view-tab${activeView === v ? ' active' : ''}`} onClick={() => setView(v)}>{v}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, paddingBottom: 2 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 9, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Calendar size={14} color="#7C3AED" /> Today
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
              >
                <Plus size={15} /> New Session
              </button>
            </div>
          </div>

          {/* Calendar card */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
            {/* Nav header — only show week nav on Week View */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
              {activeView === 'Week View' && (
                <>
                  <button className="nav-btn" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={14} color="#6B7280" /></button>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>{weekLabel}</span>
                  <button className="nav-btn" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={14} color="#6B7280" /></button>
                </>
              )}
              {activeView === 'Month View' && (
                <>
                  <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={14} color="#6B7280" /></button>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>
                    {new Date(miniMonth.year, miniMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className="nav-btn" onClick={nextMonth}><ChevronRight size={14} color="#6B7280" /></button>
                </>
              )}
              {activeView === 'Agenda View' && (
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>Upcoming Sessions</span>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : activeView === 'Week View' ? (
              <>
                {/* Week strip */}
                <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid #F0F0F4' }}>
                  {weekDates.map((date, i) => (
                    <div key={i} className="day-col">
                      <span style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>{WEEK_DAYS[date.getDay()]}</span>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: isToday(date) ? '#7C3AED' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: isToday(date) ? 700 : 600, color: isToday(date) ? 'white' : '#1E1B4B' }}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Hour grid */}
                <div style={{ display: 'flex', overflowX: 'auto' }}>
                  <div style={{ width: 60, flexShrink: 0 }}>
                    <div style={{ height: 32, borderBottom: '1px solid #F0F0F4' }} />
                    {HOURS.map(h => (
                      <div key={h} style={{ height: 56, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 4, fontSize: 10.5, color: '#9CA3AF', borderBottom: '1px solid #F8F9FB' }}>{h}</div>
                    ))}
                  </div>
                  {weekDates.map((date, colIdx) => {
                    const daySessions = sessions.filter(s => s.scheduled_at && new Date(s.scheduled_at).toDateString() === date.toDateString())
                    return (
                      <div key={colIdx} style={{ flex: 1, minWidth: 90, borderLeft: '1px solid #F0F0F4' }}>
                        <div style={{ height: 32, borderBottom: '1px solid #F0F0F4' }} />
                        <div style={{ position: 'relative' }}>
                          {HOURS.map(h => <div key={h} style={{ height: 56, borderBottom: '1px solid #F8F9FB' }} />)}
                          {daySessions.map(s => {
                            const d = new Date(s.scheduled_at)
                            const off = d.getHours() - HOUR_START
                            if (off < 0 || off >= HOURS.length) return null
                            const top    = off * 56 + (d.getMinutes() / 60) * 56
                            const height = Math.max(((s.duration_minutes || 60) / 60) * 56, 22)
                            const label  = s.subject?.name || s.notes || 'Session'
                            const color  = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled
                            return (
                              <div key={s.id} title={label} style={{ position: 'absolute', top, left: 3, right: 3, height, background: color, borderRadius: 6, zIndex: 1, padding: '3px 6px', fontSize: 10.5, fontWeight: 700, color: 'white', overflow: 'hidden', cursor: 'default' }}>
                                {label}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : activeView === 'Month View' ? (
              /* ── Month View ── */
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 8 }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', padding: '4px 0' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                  {buildCalendar(miniMonth.year, miniMonth.month).map((c, i) => {
                    const cellDate = new Date(miniMonth.year, miniMonth.month, c.day)
                    const cellSessions = c.cur ? sessions.filter(s => s.scheduled_at && new Date(s.scheduled_at).toDateString() === cellDate.toDateString()) : []
                    const isTodayCell  = c.cur && c.day === today.getDate() && miniMonth.month === today.getMonth() && miniMonth.year === today.getFullYear()
                    return (
                      <div key={i} style={{ minHeight: 64, border: '1px solid #F0F0F4', borderRadius: 8, padding: '4px 6px', background: isTodayCell ? '#F3F0FF' : c.cur ? 'white' : '#FAFAFA', opacity: c.cur ? 1 : 0.4 }}>
                        <div style={{ fontSize: 12, fontWeight: isTodayCell ? 800 : 500, color: isTodayCell ? '#7C3AED' : '#374151', marginBottom: 4 }}>{c.day}</div>
                        {cellSessions.slice(0, 3).map(s => {
                          const color = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled
                          return (
                            <div key={s.id} title={s.subject?.name || 'Session'} style={{ fontSize: 10, fontWeight: 600, color: 'white', background: color, borderRadius: 4, padding: '2px 4px', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                              {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} {s.subject?.name || 'Session'}
                            </div>
                          )
                        })}
                        {cellSessions.length > 3 && <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>+{cellSessions.length - 3} more</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* ── Agenda View ── */
              <div style={{ padding: '8px 0' }}>
                {(() => {
                  const upcoming = sessions
                    .filter(s => s.scheduled_at && s.status !== 'cancelled')
                    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                  if (upcoming.length === 0) {
                    return (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                        <Calendar size={28} color="#DDD6FE" style={{ display: 'block', margin: '0 auto 10px' }} />
                        No upcoming sessions scheduled.
                      </div>
                    )
                  }
                  let lastDateLabel = ''
                  return upcoming.map(s => {
                    const d = new Date(s.scheduled_at)
                    const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                    const showLabel = dateLabel !== lastDateLabel
                    lastDateLabel = dateLabel
                    const color = STATUS_COLORS[s.status] || STATUS_COLORS.scheduled
                    return (
                      <div key={s.id}>
                        {showLabel && (
                          <div style={{ padding: '10px 20px 6px', fontSize: 12, fontWeight: 700, color: '#9CA3AF', background: '#F8F9FB', borderBottom: '1px solid #F0F0F4', borderTop: '1px solid #F0F0F4' }}>
                            {dateLabel}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid #F8F9FB' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 4, height: 44, borderRadius: 4, background: color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>
                              {s.subject?.name || 'Study Session'}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 3 }}>
                              {s.student?.user?.name || 'Student'} · {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {s.duration_minutes || 60} min
                            </div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: color + '22', color, textTransform: 'capitalize' }}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="tms-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 12 }}>{monthLabel}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {WEEK_DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, color: '#9CA3AF', fontWeight: 600 }}>{d}</div>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={12} color="#6B7280" /></button>
              <button className="nav-btn" onClick={nextMonth}><ChevronRight size={12} color="#6B7280" /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px 0' }}>
              {calCells.map((c, i) => {
                const isTodayCell = c.cur && c.day === today.getDate() && miniMonth.month === today.getMonth() && miniMonth.year === today.getFullYear()
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className={`mini-day${!c.cur ? ' other' : ''}${isTodayCell ? ' today' : ''}`}>{c.day}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Your Weekly Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {(() => {
                const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)
                const weekSess = sessions.filter(s => { const d = new Date(s.scheduled_at); return d >= weekStart && d < weekEnd })
                const totalMin = weekSess.reduce((a, s) => a + (s.duration_minutes || 60), 0)
                const uniqueStudents = new Set(weekSess.map(s => s.student_id)).size
                const completed = weekSess.filter(s => s.status === 'completed').length
                const rate = weekSess.length ? Math.round((completed / weekSess.length) * 100) + '%' : '—'
                return [
                  { icon: Calendar,    color: '#7C3AED', bg: '#F3F0FF', value: weekSess.length,              label: 'Sessions'        },
                  { icon: Clock,       color: '#F59E0B', bg: '#FFFBEB', value: (totalMin / 60).toFixed(1),   label: 'Hours'           },
                  { icon: Users,       color: '#6366F1', bg: '#EEF2FF', value: uniqueStudents,               label: 'Students'        },
                  { icon: CheckCircle, color: '#10B981', bg: '#F0FDF4', value: rate,                         label: 'Completion Rate' },
                ]
              })().map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}><Icon size={16} color={color} /></div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 10 }}>Quick Actions</div>
            {QUICK_ACTIONS.map(({ icon: Icon, color, bg, label }) => (
              <div key={label} className="quick-row">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={15} color={color} /></div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{label}</span>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>
            ))}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: 16, padding: '20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Calendar size={20} color="white" /></div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 8 }}>Stay Organized</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 16 }}>Manage your sessions, availability, and tasks all in one place.</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', color: '#7C3AED', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sync Calendar <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}