import { useState } from 'react'
import {
  Plus, Filter, ChevronLeft, ChevronRight,
  Calendar, Clock, Video, Users, Star,
  BookOpen, ArrowRight, ChevronRight as CR,
} from 'lucide-react'

const TABS     = ['Upcoming', 'Completed', 'Cancelled', 'All Sessions', 'Assignments']
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

export default function TutorStudySessionsPage() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState('Upcoming')
  const [miniMonth, setMiniMonth] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const calCells   = buildCalendar(miniMonth.year, miniMonth.month)
  const monthLabel = new Date(miniMonth.year, miniMonth.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => setMiniMonth(p => p.month === 0  ? { year: p.year - 1, month: 11 } : { ...p, month: p.month - 1 })
  const nextMonth = () => setMiniMonth(p => p.month === 11 ? { year: p.year + 1, month: 0  } : { ...p, month: p.month + 1 })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tss-wrap * { box-sizing: border-box; }
        .tss-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .tss-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .tss-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .tss-tab { padding: 10px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; white-space: nowrap; }
        .tss-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .tss-tab:hover { color: #7C3AED; }
        .nav-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #E5E7EB; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .nav-btn:hover { background: #F3F0FF; }
        .mini-day { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; font-weight: 500; }
        .mini-day:hover { background: #F3F0FF; color: #7C3AED; }
        .mini-day.today { background: #7C3AED; color: white; font-weight: 700; }
        .mini-day.other { color: #D1D5DB; pointer-events: none; }
        .qa-row { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F8F9FB; cursor: pointer; color: #1E1B4B; }
        .qa-row:last-child { border-bottom: none; }
        .qa-row:hover { color: #7C3AED; }
      `}</style>

      <div className="tss-wrap">
        <div className="tss-main">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Study Sessions</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage your upcoming tutoring sessions and session history.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F0F4' }}>
            <div style={{ display: 'flex', gap: 20, flex: 1, overflowX: 'auto' }}>
              {TABS.map(t => (
                <button key={t} className={`tss-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, paddingBottom: 2 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #E5E7EB', borderRadius: 9, background: 'white', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Filter size={14} color="#7C3AED" /> Filter
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
                onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
              >
                <Plus size={15} /> New Session
              </button>
            </div>
          </div>

          {/* Assignments summary */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={20} color="#7C3AED" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 2 }}>Assignments</div>
              <div style={{ fontSize: 12.5, color: '#9CA3AF' }}>All session assignments in one place.</div>
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              {[{ value: 0, label: 'To Review', color: '#7C3AED' }, { value: 0, label: 'Graded', color: '#10B981' }, { value: 0, label: 'Late', color: '#F59E0B' }, { value: 0, label: 'Returned', color: '#6B7280' }].map(({ value, label, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'white', border: '1.5px solid #7C3AED', borderRadius: 9, color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          {/* Empty state */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>
              {activeTab === 'Upcoming' ? 'Upcoming Sessions' : activeTab === 'Completed' ? 'Completed Sessions' : 'Sessions'}
            </div>
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
              <Calendar size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
                {activeTab === 'Upcoming' ? 'No upcoming sessions' : activeTab === 'Completed' ? 'No completed sessions yet' : 'No sessions found'}
              </div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
                {activeTab === 'Upcoming' ? 'Match with students to start booking sessions.' : 'Sessions will appear here once completed.'}
              </div>
              {activeTab === 'Upcoming' && (
                <a href="/tutor/find-students" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#7C3AED', color: 'white', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  Find Students
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="tss-right">
          {/* Mini calendar */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 10 }}>Calendar</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>{monthLabel}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={12} color="#6B7280" /></button>
                <button className="nav-btn" onClick={nextMonth}><ChevronRight size={12} color="#6B7280" /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {WEEK_DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10.5, color: '#9CA3AF', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
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

          {/* Today's Schedule */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Today's Schedule</div>
            <div style={{ padding: '12px 0', textAlign: 'center' }}>
              <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No sessions today</div>
            </div>
          </div>

          {/* This Week Overview */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>This Week Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: Calendar, color: '#7C3AED', bg: '#F3F0FF', value: 0,   label: 'Sessions'    },
                { icon: Users,    color: '#6366F1', bg: '#EEF2FF', value: 0,   label: 'Students'    },
                { icon: Clock,    color: '#F59E0B', bg: '#FFFBEB', value: 0,   label: 'Hours'       },
                { icon: Star,     color: '#10B981', bg: '#F0FDF4', value: '—', label: 'Avg. Rating' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}><Icon size={16} color={color} /></div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 10 }}>Quick Actions</div>
            {[
              { icon: Calendar, color: '#7C3AED', bg: '#F3F0FF', label: 'Schedule a Session'  },
              { icon: Clock,    color: '#6366F1', bg: '#EEF2FF', label: 'Manage Availability' },
              { icon: BookOpen, color: '#F59E0B', bg: '#FFFBEB', label: 'Check Assignments'   },
              { icon: BookOpen, color: '#10B981', bg: '#F0FDF4', label: 'Session Resources'   },
            ].map(({ icon: Icon, color, bg, label }) => (
              <div key={label} className="qa-row">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={15} color={color} /></div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{label}</span>
                <CR size={14} color="#D1D5DB" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}