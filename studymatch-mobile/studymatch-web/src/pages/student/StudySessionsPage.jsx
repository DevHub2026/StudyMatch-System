import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Calendar, Clock, Users,
  ChevronDown, SlidersHorizontal, Plus,
} from 'lucide-react'

const SUBJECTS      = ['All Subjects', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology']
const SESSION_TYPES = ['All Types', 'Group Study', 'Homework Help', 'Exam Preparation', 'Concept Review']
const SORT_OPTIONS  = ['Nearest', 'Most Participants', 'Recently Created']

function Dropdown({ placeholder, options, value, onChange, icon: Icon }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, cursor: 'pointer', fontSize: 13.5, color: value && value !== placeholder ? '#1E1B4B' : '#9CA3AF', userSelect: 'none', minWidth: 150 }}>
        {Icon && <Icon size={15} color="#9CA3AF" />}
        <span style={{ flex: 1 }}>{value || placeholder}</span>
        <ChevronDown size={14} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '110%', left: 0, background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)', zIndex: 50, minWidth: '100%', overflow: 'hidden' }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }} style={{ padding: '10px 16px', fontSize: 13.5, color: opt === value ? '#7C3AED' : '#374151', fontWeight: opt === value ? 600 : 400, cursor: 'pointer', background: opt === value ? '#F3F0FF' : 'white' }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#F8F9FB' }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'white' }}
              >{opt}</div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Radio({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151', fontWeight: checked ? 600 : 500, padding: '4px 0' }}>
      <div onClick={onChange} style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${checked ? '#7C3AED' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
        {checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED' }} />}
      </div>
      {label}
    </label>
  )
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: '#374151', fontWeight: checked ? 600 : 500, padding: '4px 0' }}>
      <div onClick={onChange} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? '#7C3AED' : '#D1D5DB'}`, background: checked ? '#7C3AED' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
      {label}
    </label>
  )
}

export default function StudySessionsPage() {
  const [activeTab,     setActiveTab]     = useState('upcoming')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [dateFilter,    setDateFilter]    = useState('')
  const [timeFilter,    setTimeFilter]    = useState('')
  const [typeFilter,    setTypeFilter]    = useState('Any type')
  const [sideTypes,     setSideTypes]     = useState(['All Types'])
  const [sortBy,        setSortBy]        = useState('Nearest')

  const toggleSideType = val => {
    if (val === 'All Types') { setSideTypes(['All Types']); return }
    setSideTypes(prev => {
      const without = prev.filter(x => x !== 'All Types')
      const next = without.includes(val) ? without.filter(x => x !== val) : [...without, val]
      return next.length ? next : ['All Types']
    })
  }

  const clearAll = () => {
    setSideTypes(['All Types']); setSortBy('Nearest')
    setSubjectFilter('All Subjects'); setDateFilter('')
    setTimeFilter(''); setTypeFilter('Any type')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ss-wrap * { box-sizing: border-box; }
        .ss-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .ss-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .ss-sidebar { width: 230px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .ss-tab { padding: 10px 4px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border-bottom: 2.5px solid transparent; background: none; border-top: none; border-left: none; border-right: none; font-family: 'DM Sans', sans-serif; transition: color .15s; }
        .ss-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .ss-tab:hover { color: #7C3AED; }
      `}</style>

      <div className="ss-wrap">
        <div className="ss-main">

          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Study Sessions</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Join or create study sessions and learn together.</p>
          </div>

          {/* Filter bar */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Dropdown placeholder="All Subjects" icon={Search}   options={SUBJECTS}    value={subjectFilter} onChange={setSubjectFilter} />
            <Dropdown placeholder="Select date"  icon={Calendar} options={['Today','Tomorrow','This Week','This Month']} value={dateFilter} onChange={setDateFilter} />
            <Dropdown placeholder="Select time"  icon={Clock}    options={['Morning (6AM-12PM)','Afternoon (12PM-5PM)','Evening (5PM-10PM)']} value={timeFilter} onChange={setTimeFilter} />
            <Dropdown placeholder="Any type"     icon={Users}    options={['Any type','Group Study','Homework Help','Exam Preparation','Concept Review']} value={typeFilter} onChange={setTypeFilter} />
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <SlidersHorizontal size={14} color="#7C3AED" /> More Filters
            </button>
          </div>

          {/* Tabs + Create */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F0F0F4' }}>
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              <button className={`ss-tab${activeTab === 'upcoming' ? ' active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming Sessions</button>
              <button className={`ss-tab${activeTab === 'my' ? ' active' : ''}`} onClick={() => setActiveTab('my')} style={{ marginLeft: 16 }}>My Sessions</button>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 1 }}
              onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
            >
              <Plus size={15} /> Create Session
            </button>
          </div>

          {/* Empty state */}
          <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <Calendar size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
              {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No sessions joined yet'}
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
              Sessions from your tutors will appear here.
            </div>
            <Link to="/student/find-tutors" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#7C3AED', color: 'white', borderRadius: 9, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={14} /> Find a Tutor
            </Link>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="ss-sidebar">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Filters</span>
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Clear All</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Session Type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SESSION_TYPES.map(t => <Checkbox key={t} label={t} checked={sideTypes.includes(t)} onChange={() => toggleSideType(t)} />)}
              </div>
            </div>
            <div style={{ borderTop: '1px solid #F0F0F4', paddingTop: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Sort By</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SORT_OPTIONS.map(o => <Radio key={o} label={o} checked={sortBy === o} onChange={() => setSortBy(o)} />)}
              </div>
            </div>
            <button style={{ width: '100%', padding: 12, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
            >Apply Filters</button>
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>My Upcoming Sessions</span>
              <Link to="/student/study-sessions" style={{ color: '#7C3AED', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ padding: '12px 0', textAlign: 'center' }}>
              <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No sessions yet</div>
            </div>
            <Link to="/student/schedule" style={{ display: 'block', marginTop: 12, padding: '10px', textAlign: 'center', border: '1.5px solid #7C3AED', borderRadius: 10, color: '#7C3AED', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Go to My Schedule
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}