import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Plus,
  Calendar, Users, User, Clock,
  MapPin, Video, List,
} from 'lucide-react'

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

/* ─── list view ──────────────────────────────────────────────── */

const LIST_TABS = ['Upcoming', 'Completed', 'All Sessions']

function ListView() {
  const [listTab, setListTab] = useState('Upcoming')

  return (
    <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 20, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
        {LIST_TABS.map(t => (
          <button key={t} onClick={() => setListTab(t)} style={{
            padding: '6px 2px', fontSize: 13.5, fontWeight: 600,
            color: listTab === t ? '#7C3AED' : '#9CA3AF',
            border: 'none', borderBottom: `2px solid ${listTab === t ? '#7C3AED' : 'transparent'}`,
            background: 'none', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'color .15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* Content — always empty until API exists */}
      <div style={{ padding: '20px' }}>
        <EmptyState message={
          listTab === 'Upcoming'  ? 'No upcoming sessions' :
          listTab === 'Completed' ? 'No completed sessions yet' :
          'No sessions found'
        } />
      </div>
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────── */

export default function MySchedulePage() {
  const today = new Date()

  const [calView,    setCalView]    = useState('calendar')
  const [weekOffset, setWeekOffset] = useState(0)
  const [miniMonth,  setMiniMonth]  = useState({
    year:  today.getFullYear(),
    month: today.getMonth(),
  })

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
                  <button style={{ padding: '7px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setWeekOffset(0)}>
                    Today
                  </button>
                  <button className="nav-btn" onClick={() => setWeekOffset(w => w - 1)}>
                    <ChevronLeft size={14} color="#6B7280" />
                  </button>
                  <button className="nav-btn" onClick={() => setWeekOffset(w => w + 1)}>
                    <ChevronRight size={14} color="#6B7280" />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>{weekLabel}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                    Week <ChevronDown14 />
                  </div>
                </div>

                {/* Grid */}
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

                  {/* Day columns */}
                  {weekDates.map((date, colIdx) => {
                    const todayCol = isToday(date)
                    return (
                      <div key={colIdx} style={{ flex: 1, minWidth: 100, borderLeft: '1px solid #F0F0F4' }}>
                        <div style={{ height: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderBottom: '1px solid #F0F0F4' }}>
                          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{WEEK_DAYS[date.getDay()]}</div>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: todayCol ? '#7C3AED' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: todayCol ? 700 : 600,
                            color: todayCol ? 'white' : '#1E1B4B',
                          }}>
                            {date.getDate()}
                          </div>
                        </div>
                        <div style={{ height: 32, borderBottom: '1px solid #F0F0F4' }} />
                        <div style={{ position: 'relative' }}>
                          {HOURS.map(h => (
                            <div key={h} style={{ height: 56, borderBottom: '1px solid #F8F9FB' }} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Upcoming sessions */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B' }}>Upcoming Sessions</span>
                  <Link to="/student/study-sessions" style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>
                    View All Sessions
                  </Link>
                </div>
                <EmptyState message="No upcoming sessions" />
              </div>
            </>
          )}

          {/* ── List View ── */}
          {calView === 'list' && <ListView />}

        </div>

        {/* ── Right panel ── */}
        <div className="sch-right">

          {/* Upcoming This Week */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>Upcoming This Week</span>
              <Link to="/student/study-sessions" style={{ color: '#7C3AED', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No sessions this week</div>
            </div>
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
              { icon: Calendar, label: 'Total Sessions', value: 0, color: '#7C3AED' },
              { icon: Clock,    label: 'This Week',      value: 0, color: '#6366F1' },
              { icon: Users,    label: 'Study Groups',   value: 0, color: '#10B981' },
              { icon: User,     label: 'One-on-One',     value: 0, color: '#F59E0B' },
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