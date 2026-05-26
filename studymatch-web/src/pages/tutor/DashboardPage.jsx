import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUser } from '../../store/authStore'
import { getIncomingRequests, acceptMatchRequest, declineMatchRequest } from '../../api/matchRequests'
import { browseStudents } from '../../api/students'
import { getProfile } from '../../api/profile'
import { requestSessionWithStudent } from '../../api/sessions'
import {
  getSavedStudentIds, setSavedStudentIds, normalizeStudentFromMatchRequest,
  filterStudentsBySearch,
} from '../../utils/studentMatchUtils'
import {
  TUTOR_SUBJECT_FILTERS as SUBJECTS_FILTER,
  TUTOR_AVAILABILITY_FILTERS as AVAIL_FILTER,
  TUTOR_GOAL_FILTERS as GOAL_FILTER,
  DISCOVERY_SUBJECTS,
  normalizeGoalValue,
  normalizeDayValue,
  normalizeTimeValue,
  normalizeSessionFormat,
} from '../../constants/studentDiscovery'
import {
  Search, ChevronDown, Bookmark, Check, X,
  ChevronRight, Clock, BookOpen, Target, MapPin,
  Users, MessageSquare, Calendar, Trophy, ArrowRight,
  Loader2, GraduationCap,
} from 'lucide-react'

/* ─── constants ──────────────────────────────────────────────── */
const COLORS          = ['#7C3AED','#EC4899','#10B981','#F59E0B','#6366F1','#EF4444']

const getColor    = (i) => COLORS[i % COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

/* ─── helpers ────────────────────────────────────────────────── */

function Avatar({ name = '', color = '#7C3AED', size = 56, online }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: color + '22', border: `2.5px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: size * 0.32, color, fontFamily: 'inherit',
      }}>
        {getInitials(name)}
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 2, right: 2,
          width: size * 0.24, height: size * 0.24,
          borderRadius: '50%', background: '#22C55E', border: '2px solid white',
        }} />
      )}
    </div>
  )
}

function SubjectTag({ label }) {
  const MAP = {
    'Calculus':       { c: '#7C3AED', b: '#F3F0FF' },
    'Physics':        { c: '#6366F1', b: '#EEF2FF' },
    'Statistics':     { c: '#10B981', b: '#F0FDF4' },
    'Linear Algebra': { c: '#F59E0B', b: '#FFFBEB' },
    'Probability':    { c: '#EC4899', b: '#FDF2F8' },
  }
  const { c, b } = MAP[label] || { c: '#7C3AED', b: '#F3F0FF' }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, background: b, color: c,
      fontSize: 12, fontWeight: 600, border: `1px solid ${c}25`,
    }}>
      {label}
    </span>
  )
}

function FilterDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 16px', background: 'white',
        border: '1px solid #E5E7EB', borderRadius: 10,
        cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
        color: '#374151', userSelect: 'none', minWidth: 140,
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        <ChevronDown size={13} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
      </div>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '110%', left: 0,
            background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.10)',
            zIndex: 50, minWidth: '100%', overflow: 'hidden',
          }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                style={{
                  padding: '9px 16px', fontSize: 13.5,
                  color: opt === value ? '#7C3AED' : '#374151',
                  fontWeight: opt === value ? 600 : 400,
                  cursor: 'pointer', background: opt === value ? '#F3F0FF' : 'white',
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#F8F9FB' }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'white' }}
              >
                {opt}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: '#374151', marginBottom: 4 }}>
      <Icon size={13} color="#7C3AED" style={{ flexShrink: 0, marginTop: 2 }} />
      <span><span style={{ fontWeight: 600, color: '#6B7280' }}>{label}: </span>{value}</span>
    </div>
  )
}

function RequestSessionModal({ student, onClose, onSuccess }) {
  const [form, setForm] = useState({
    scheduled_at: '',
    duration_minutes: '60',
    session_type: 'online',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const name = student?.name || 'Student'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.scheduled_at) { setError('Pick a date and time.'); return }
    setSaving(true)
    setError('')
    try {
      await requestSessionWithStudent({
        student_id: student.id,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes, 10) || 60,
        session_type: form.session_type,
        notes: form.notes || `Session request for ${name}`,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send session request.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB',
    borderRadius: 10, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} style={{
        background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420,
        boxShadow: '0 20px 50px rgba(0,0,0,.15)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Request Session</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 18 }}>with {name}</p>
        {error && <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Date & time</label>
        <input type="datetime-local" required value={form.scheduled_at}
          onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 14 }} />
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Format</label>
        <select value={form.session_type} onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))}
          style={{ ...inputStyle, marginBottom: 14 }}>
          <option value="online">Online</option>
          <option value="in_person">Face-to-face</option>
        </select>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={2} style={{ ...inputStyle, marginBottom: 18, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 18px', background: 'white', border: '1px solid #E5E7EB',
            borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            padding: '10px 20px', background: '#7C3AED', color: 'white', border: 'none',
            borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {saving ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ─── student card ───────────────────────────────────────────── */

function StudentCard({ student, index, saved, onSave, onConnect, onRequestSession, compact }) {
  const color    = getColor(index)
  const name     = student.name || student.user?.name || 'Student'
  const field    = student.department || student.program || student.course || ''
  const year     = student.year_level || ''
  const subjects = student.subjects || student.help_subjects || []
  const goal     = student.study_goals || student.goal || ''
  const availRaw = student.availability
  const avail    = typeof availRaw === 'string'
    ? availRaw
    : availRaw && typeof availRaw === 'object' && !Array.isArray(availRaw) && Object.keys(availRaw).length > 0
      ? Object.keys(availRaw).slice(0, 3).join(', ')
      : [student.preferred_days, student.preferred_time].filter(Boolean).join(' · ')
  const matchPct = student.match_percentage
  const activity = student.activity_label
  const style    = student.study_style
  const sessionPref = student.session_preference

  return (
    <div style={{
      display: 'flex', alignItems: compact ? 'flex-start' : 'center', gap: 20,
      padding: compact ? '18px 20px' : '20px 24px', borderBottom: '1px solid #F8F9FB',
      transition: 'background .12s', flexWrap: compact ? 'wrap' : 'nowrap',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Avatar name={name} color={color} size={compact ? 52 : 60} online={student.is_online} />
        {matchPct != null && (
          <>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#10B981', background: '#F0FDF4', borderRadius: 20, padding: '2px 8px' }}>
              {matchPct}% Match
            </span>
          </>
        )}
        {activity && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: student.is_online ? '#059669' : '#9CA3AF',
          }}>
            {student.is_online ? '🟢 ' : ''}{activity}
          </span>
        )}
      </div>

      <div style={{ width: compact ? '100%' : 200, flex: compact ? '1 1 180px' : undefined, flexShrink: compact ? undefined : 0, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 3 }}>{name}</div>
        <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 8 }}>
          {field}{year ? ` · ${year}` : ''}
        </div>
        {subjects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {subjects.slice(0, 3).map((s, i) => (
              <SubjectTag key={i} label={typeof s === 'object' ? s.name || s.subject : s} />
            ))}
          </div>
        )}
        <DetailRow icon={Target} label="Goal" value={goal} />
        <DetailRow icon={Clock} label="Available" value={avail} />
        <DetailRow icon={BookOpen} label="Learning style" value={style} />
        <DetailRow icon={MapPin} label="Format" value={sessionPref} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end', marginLeft: compact ? 'auto' : 0 }}>
        <button type="button" onClick={() => onSave(student.id)} title={saved ? 'Remove bookmark' : 'Save student'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Bookmark size={16} color={saved ? '#7C3AED' : '#D1D5DB'} fill={saved ? '#7C3AED' : 'none'} />
        </button>
        {onRequestSession && (
          <button type="button" onClick={() => onRequestSession(student)} style={{
            padding: '8px 18px', background: '#7C3AED', border: 'none',
            borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Calendar size={14} /> Request Session
          </button>
        )}
        <button type="button" onClick={onConnect} style={{
          padding: '8px 18px', background: 'white',
          border: '1.5px solid #7C3AED', borderRadius: 9,
          color: '#7C3AED', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>
          Connect
        </button>
      </div>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────────── */

export default function TutorDashboardPage() {
  const user     = getUser()
  const navigate = useNavigate()

  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [availFilter,   setAvailFilter]   = useState('Availability')
  const [goalFilter,    setGoalFilter]    = useState('Learning Goals')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [savedIds,      setSavedIds]      = useState(() => getSavedStudentIds())
  const [showSavedOnly, setShowSavedOnly] = useState(false)

  const [requests,  setRequests]  = useState([])
  const [accepted,  setAccepted]  = useState([])
  const [weekStats, setWeekStats] = useState({ matches: 0, sessions: 0, messages: 0 })
  const [loading,   setLoading]   = useState(true)

  const [recommendations, setRecommendations] = useState([])
  const [searching,       setSearching]       = useState(false)
  const [hasSearched,     setHasSearched]     = useState(false)
  const [searchError,     setSearchError]     = useState('')
  const [sessionTarget,   setSessionTarget]   = useState(null)
  const [sessionSent,     setSessionSent]     = useState(null)
  const [tutorSubjects,   setTutorSubjects]   = useState([])

  const firstName = user?.name?.split(' ')[0] || 'Tutor'

  const handleFindStudents = async (overrides = {}) => {
    setSearching(true)
    setSearchError('')
    setHasSearched(true)
    try {
      const res = await browseStudents({
        matchAll: true,
        search: (overrides.search ?? searchQuery).trim() || undefined,
        subject: overrides.subject ?? subjectFilter,
        availability: overrides.availability ?? availFilter,
        goal: overrides.goal ?? goalFilter,
      })
      const list = res?.data || []
      setRecommendations(Array.isArray(list) ? list.filter(s => !s.already_matched) : [])
    } catch {
      setSearchError('Could not load student recommendations.')
      setRecommendations([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [matchRes, profileRes] = await Promise.all([
          getIncomingRequests(),
          getProfile().catch(() => null),
        ])
        // getIncomingRequests() returns raw TutorRequest objects (all statuses)
        const incoming = matchRes?.data?.data || matchRes?.data || []
        const pending  = incoming.filter(r => r.status === 'pending')
        const acc      = incoming.filter(r => r.status === 'accepted')
        setRequests(pending)
        setAccepted(acc)
        setWeekStats(p => ({ ...p, matches: acc.length }))

        const tutor = profileRes?.user?.tutor || profileRes?.tutor
        const names = (tutor?.strong_subjects || tutor?.strongSubjects || [])
          .map(ts => ts.subject?.name)
          .filter(Boolean)
        setTutorSubjects(names)

        const firstTutorSubject = names.find(n => DISCOVERY_SUBJECTS.includes(n)) || names[0]

        let nextSubject = 'All Subjects'
        if (firstTutorSubject) {
          nextSubject = firstTutorSubject
          setSubjectFilter(firstTutorSubject)
        }
        await handleFindStudents({ subject: nextSubject, goal: goalFilter })
      } catch {
        await handleFindStudents()
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const displayedRecommendations = useMemo(() => {
    let list = recommendations
    if (showSavedOnly) {
      list = list.filter(s => savedIds.includes(Number(s.id)))
    }
    return filterStudentsBySearch(list, searchQuery)
  }, [recommendations, searchQuery, showSavedOnly, savedIds])

  const topMatches = useMemo(
    () => displayedRecommendations.slice(0, 3),
    [displayedRecommendations],
  )

  const toggleSave = id => {
    const numId = Number(id)
    const next = savedIds.includes(numId) ? savedIds.filter(x => x !== numId) : [...savedIds, numId]
    setSavedIds(next)
    setSavedStudentIds(next)
  }

  const handleAccept  = async (id) => {
    try {
      await acceptMatchRequest(id)
      const req = requests.find(r => r.id === id)
      setRequests(p => p.filter(r => r.id !== id))
      if (req) setAccepted(p => [...p, { ...req, status: 'accepted' }])
      setWeekStats(p => ({ ...p, matches: p.matches + 1 }))
    } catch {}
  }
  const handleDecline = async (id) => {
    try { await declineMatchRequest(id); setRequests(p => p.filter(r => r.id !== id)) } catch {}
  }

  const visibleAccepted = accepted.slice(0, 3)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .td-wrap * { box-sizing: border-box; }
        .td-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .td-main { flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .td-right { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .req-action { width: 32px; height: 32px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; flex-shrink: 0; }
        .session-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #F8F9FB; }
        .session-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="td-wrap">
        <div className="td-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Good morning, {firstName}! 👋</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Let's help more students achieve their goals today.</p>
          </div>

          {/* Hero banner */}
          <div style={{
            background: 'linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%)',
            border: '1px solid #DDD6FE', borderRadius: 18,
            padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24,
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1E1B4B', marginBottom: 8, lineHeight: 1.2 }}>
                Find Students Who <span style={{ color: '#7C3AED' }}>Need Your Help</span>
              </h2>
              <p style={{ fontSize: 13.5, color: '#6B7280', marginBottom: 8 }}>
                Shows all students in StudyMatch, ranked by your tutor subjects and their profile preferences.
              </p>
              {tutorSubjects.length > 0 && (
                <p style={{ fontSize: 12.5, color: '#7C3AED', fontWeight: 600, marginBottom: 16 }}>
                  Your subjects: {tutorSubjects.join(', ')}
                </p>
              )}
              {!tutorSubjects.length && <div style={{ marginBottom: 16 }} />}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'white', border: '1.5px solid #DDD6FE', borderRadius: 12,
                padding: '10px 14px', marginBottom: 14, maxWidth: 480,
              }}>
                <Search size={16} color="#9CA3AF" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFindStudents()}
                  placeholder="Search students by name or subject..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#374151', background: 'transparent' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <FilterDropdown value={subjectFilter} options={SUBJECTS_FILTER} onChange={setSubjectFilter} />
                <FilterDropdown value={availFilter}   options={AVAIL_FILTER}    onChange={setAvailFilter} />
                <FilterDropdown value={goalFilter}    options={GOAL_FILTER}     onChange={setGoalFilter} />
                <button type="button" onClick={handleFindStudents} disabled={searching} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 20px', background: '#7C3AED', color: 'white',
                  border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                  cursor: searching ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: searching ? 0.85 : 1,
                }}
                  onMouseEnter={e => { if (!searching) e.currentTarget.style.background = '#6D28D9' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#7C3AED' }}
                >
                  {searching ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={15} />}
                  Find Students
                </button>
              </div>
              {savedIds.length > 0 && (
                <button type="button" onClick={() => setShowSavedOnly(s => !s)} style={{
                  marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12.5, fontWeight: 600, color: '#7C3AED', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Bookmark size={14} fill={showSavedOnly ? '#7C3AED' : 'none'} />
                  {showSavedOnly ? 'Show all results' : `View ${savedIds.length} saved student${savedIds.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
            <div style={{ flexShrink: 0, position: 'relative', width: 180, height: 120 }}>
              {[{ n: 'SR', c: '#EC4899', x: 10, y: 10 }, { n: 'JT', c: '#10B981', x: 110, y: 0 }].map((a, i) => (
                <div key={i} style={{ position: 'absolute', left: a.x, top: a.y, width: 52, height: 52, borderRadius: '50%', background: a.c + '22', border: `2.5px solid ${a.c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: a.c }}>
                  {a.n}
                </div>
              ))}
              <div style={{ position: 'absolute', left: 55, top: 40, width: 70, height: 70, borderRadius: '50%', background: '#F3F0FF', border: '2px dashed #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={28} color="#7C3AED" />
              </div>
            </div>
          </div>

          {sessionSent && (
            <div style={{
              background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12,
              padding: '12px 16px', fontSize: 13.5, color: '#166534', fontWeight: 600,
            }}>
              Session request sent to {sessionSent}. They will see it in Study Sessions.
            </div>
          )}

          {hasSearched && (
            <div>
              {!searching && !searchError && (
                <div style={{ fontSize: 13.5, color: '#6B7280', fontWeight: 500, marginBottom: 12 }}>
                  {displayedRecommendations.length} student{displayedRecommendations.length !== 1 ? 's' : ''} found
                  {subjectFilter !== 'All Subjects' || goalFilter !== 'Learning Goals' || availFilter !== 'Availability'
                    ? ' — ranked by match to your filters and profile'
                    : ' — ranked by your tutor profile'}
                </div>
              )}

              {searching && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
                  <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}

              {searchError && (
                <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{searchError}</div>
              )}

              {!searching && !searchError && displayedRecommendations.length === 0 && (
                <div style={{
                  background: 'white', border: '1px dashed #DDD6FE', borderRadius: 16,
                  padding: '36px 24px', textAlign: 'center',
                }}>
                  <GraduationCap size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
                    {showSavedOnly ? 'No saved students in these results.' : 'No matching students found.'}
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {showSavedOnly ? 'Bookmark students from search results to find them here.' : 'Try changing your filters or search terms.'}
                  </div>
                </div>
              )}

              {!searching && topMatches.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#1E1B4B', marginBottom: 4 }}>
                    Top Matches for You
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 12 }}>
                    Highest compatibility based on your subjects, availability, and goals.
                  </div>
                  <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
                    {topMatches.map((s, i) => (
                      <StudentCard
                        key={s.id || i}
                        student={s}
                        index={i}
                        compact
                        saved={savedIds.includes(Number(s.id))}
                        onSave={toggleSave}
                        onConnect={() => navigate(`/tutor/messages?partner=${s.user_id || s.user?.id}`)}
                        onRequestSession={setSessionTarget}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!searching && displayedRecommendations.length > 3 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B', margin: '20px 0 12px' }}>
                    More Students ({displayedRecommendations.length - 3})
                  </div>
                  <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
                    {displayedRecommendations.slice(3).map((s, i) => (
                      <StudentCard
                        key={s.id || i}
                        student={s}
                        index={i + 3}
                        saved={savedIds.includes(Number(s.id))}
                        onSave={toggleSave}
                        onConnect={() => navigate(`/tutor/messages?partner=${s.user_id || s.user?.id}`)}
                        onRequestSession={setSessionTarget}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Accepted Students */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1E1B4B' }}>Matched Students</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Students you have accepted for tutoring.</div>
              </div>
              <Link to="/tutor/find-students" style={{ fontSize: 13, color: '#7C3AED', fontWeight: 600, textDecoration: 'none' }}>View all matches</Link>
            </div>

            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden', marginTop: 14 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <Loader2 size={24} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              ) : accepted.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <Users size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No matched students yet</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 14 }}>
                    Accept student requests to start tutoring sessions.
                  </div>
                  <Link to="/tutor/find-students" style={{ color: '#7C3AED', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>View incoming requests →</Link>
                </div>
              ) : (
                visibleAccepted.map((r, i) => {
                  const base = normalizeStudentFromMatchRequest(r, i)
                  const subject = r.subject?.name
                  const rawGoal = base.study_goals || r.message || base.goal
                  const enriched = {
                    ...base,
                    subjects: subject ? [subject, ...base.subjects].filter((v, idx, arr) => arr.indexOf(v) === idx) : base.subjects,
                    goal: normalizeGoalValue(rawGoal) || rawGoal,
                    study_goals: normalizeGoalValue(rawGoal) || rawGoal,
                    preferred_days: normalizeDayValue(base.preferred_days) || base.preferred_days,
                    preferred_time: normalizeTimeValue(base.preferred_time) || base.preferred_time,
                    study_style: normalizeSessionFormat(base.study_style) || base.study_style,
                    session_preference: base.session_preference || normalizeSessionFormat(base.study_style),
                    availability: base.availability || [normalizeDayValue(base.preferred_days), normalizeTimeValue(base.preferred_time)].filter(Boolean).join(' · '),
                    match_percentage: recommendations.find(s => s.id === base.id)?.match_percentage ?? 88,
                  }
                  return (
                    <StudentCard
                      key={r.id || i}
                      student={enriched}
                      index={i}
                      saved={savedIds.includes(Number(base.id))}
                      onSave={toggleSave}
                      onConnect={() => navigate(`/tutor/messages?partner=${base.user_id}`)}
                      onRequestSession={setSessionTarget}
                    />
                  )
                })
              )}
            </div>

            {accepted.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <Link to="/tutor/find-students" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 24px', background: 'white', border: '1px solid #E5E7EB',
                  borderRadius: 10, color: '#374151', fontSize: 13.5, fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  View all matches <ChevronDown size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="td-right">

          {/* Match Requests */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Match Requests</span>
                {requests.length > 0 && (
                  <span style={{ background: '#7C3AED', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>
                    {requests.length}
                  </span>
                )}
              </div>
              <Link to="/tutor/find-students" style={{ color: '#7C3AED', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            </div>

            {requests.length === 0 ? (
              <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>No pending requests</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {requests.slice(0, 5).map((r, i) => {
                  const name  = r.student?.user?.name || r.student?.user?.email || 'Student'
                  const color = getColor(i)
                  const sub   = r.message || 'Wants to connect'
                  const time  = r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={name} color={color} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>{name}</div>
                        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{sub}</div>
                        {time && <div style={{ fontSize: 11, color: '#C4B5FD', marginTop: 1 }}>{time}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="req-action" onClick={() => handleAccept(r.id)} style={{ background: '#F0FDF4' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
                          onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}
                        >
                          <Check size={15} color="#10B981" strokeWidth={2.5} />
                        </button>
                        <button className="req-action" onClick={() => handleDecline(r.id)} style={{ background: '#FEF2F2' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                          onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                        >
                          <X size={15} color="#EF4444" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming Sessions — empty state */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Upcoming Sessions</span>
              <Link to="/tutor/study-sessions" style={{ color: '#7C3AED', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>View all</Link>
            </div>
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <Calendar size={24} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>No upcoming sessions</div>
            </div>
          </div>

          {/* This Week Overview */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>This Week Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { icon: Users,         color: '#7C3AED', bg: '#F3F0FF', value: weekStats.matches,  label: 'New Matches' },
                { icon: Calendar,      color: '#6366F1', bg: '#EEF2FF', value: weekStats.sessions, label: 'Sessions'    },
                { icon: MessageSquare, color: '#10B981', bg: '#F0FDF4', value: weekStats.messages, label: 'Messages'    },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Icon size={18} color={color} /></div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Become a Top Tutor */}
          <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: 16, padding: '20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Trophy size={20} color="white" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 8 }}>Become a Top Tutor</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 16 }}>
              Help more students, build connections, and grow your impact.
            </div>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', background: 'white', color: '#7C3AED',
              border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              View Progress <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {sessionTarget && (
        <RequestSessionModal
          student={sessionTarget}
          onClose={() => setSessionTarget(null)}
          onSuccess={() => setSessionSent(sessionTarget.name || 'student')}
        />
      )}
    </>
  )
}