import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus,
  Filter, Calendar, Clock, Users, CheckCircle,
  RefreshCw, Settings, ArrowRight,
} from 'lucide-react'

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid #F0F0F4' }}>
              <button className="nav-btn" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft size={14} color="#6B7280" /></button>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', flex: 1 }}>{weekLabel}</span>
              <button className="nav-btn" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight size={14} color="#6B7280" /></button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Filter size={13} color="#7C3AED" /> Filter
              </button>
            </div>

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

            {/* Empty state */}
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Calendar size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No sessions this week</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Students can book sessions with you once you set your availability.</div>
              <Link to="/tutor/find-students" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#7C3AED', color: 'white', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                Find Students
              </Link>
            </div>

            <div style={{ borderTop: '1px solid #F0F0F4', padding: '14px 20px' }}>
              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Calendar size={15} color="#7C3AED" /> View Full Calendar
              </button>
            </div>
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
              {[
                { icon: Calendar,    color: '#7C3AED', bg: '#F3F0FF', value: 0, label: 'Sessions'        },
                { icon: Clock,       color: '#F59E0B', bg: '#FFFBEB', value: 0, label: 'Hours'           },
                { icon: Users,       color: '#6366F1', bg: '#EEF2FF', value: 0, label: 'Students'        },
                { icon: CheckCircle, color: '#10B981', bg: '#F0FDF4', value: '—', label: 'Completion Rate' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
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