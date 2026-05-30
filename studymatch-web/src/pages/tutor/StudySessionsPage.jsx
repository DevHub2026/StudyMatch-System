import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getSessions, acceptSession, declineSession, cancelSession,
  rescheduleSession, completeSession, requestSessionWithStudent,
} from '../../api/sessions'
import { getMatchRequests } from '../../api/matchRequests'
import { getSubjects } from '../../api/subjects'
import {
  SessionCard, SessionDetailsModal, RescheduleModal, InteractiveCalendar,
} from '../../components/sessions/SessionShared'
import {
  isUpcomingTabSession, isCompletedTabSession, isCancelledTabSession,
  isSessionToday, effectiveStatus, sessionsOnDate,
} from '../../utils/sessionUtils'
import {
  Calendar, Clock, Users, Star, Loader2, ChevronLeft, ChevronRight, Search,
  CalendarPlus, X,
} from 'lucide-react'

/* ─── new session modal ──────────────────────────────────────── */

function NewSessionModal({ onClose, onScheduled }) {
  const [matchedStudents, setMatchedStudents] = useState([])
  const [subjects, setSubjects]   = useState([])
  const [saving,   setSaving]     = useState(false)
  const [error,    setError]      = useState('')
  const [form, setForm] = useState({
    student_user_id: '', scheduled_at: '', duration_minutes: 60,
    subject_id: '', session_type: 'online', notes: '',
  })

  useEffect(() => {
    Promise.allSettled([getMatchRequests(), getSubjects()]).then(([mRes, sRes]) => {
      if (mRes.status === 'fulfilled') {
        const list = mRes.value?.data || mRes.value || []
        setMatchedStudents((Array.isArray(list) ? list : []).filter(u => u.role === 'student' || !u.role))
      }
      if (sRes.status === 'fulfilled') {
        const list = sRes.value?.data || sRes.value || []
        setSubjects(Array.isArray(list) ? list : [])
      }
    })
  }, [])

  const handleSubmit = async () => {
    if (!form.student_user_id) { setError('Please select a student.'); return }
    if (!form.scheduled_at)    { setError('Please set a date and time.'); return }
    if (new Date(form.scheduled_at) <= new Date()) { setError('Scheduled time must be in the future.'); return }
    setSaving(true); setError('')
    try {
      await requestSessionWithStudent({
        student_user_id:  form.student_user_id,
        subject_id:       form.subject_id || undefined,
        scheduled_at:     form.scheduled_at,
        duration_minutes: form.duration_minutes,
        session_type:     form.session_type,
        notes:            form.notes || undefined,
      })
      onScheduled?.()
      onClose()
    } catch {
      setError('Failed to schedule session. Please try again.')
    } finally { setSaving(false) }
  }

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 9, fontSize: 13.5, fontFamily: 'DM Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '28px 28px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,.15)', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1E1B4B' }}>Schedule New Session</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Book a session with one of your students</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#9CA3AF" /></button>
        </div>

        {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13, color: '#EF4444', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Student <span style={{ color: '#EF4444' }}>*</span></label>
            <select style={inp} value={form.student_user_id} onChange={e => setForm(p => ({ ...p, student_user_id: e.target.value }))}>
              <option value="">— Select a student —</option>
              {matchedStudents.map(s => <option key={s.id} value={s.id}>{s.fullName || s.name}</option>)}
            </select>
            {matchedStudents.length === 0 && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>No matched students yet. Accept a request first.</div>}
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Date & Time <span style={{ color: '#EF4444' }}>*</span></label>
            <input type="datetime-local" style={inp} value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Duration</label>
              <select style={inp} value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))}>
                {[30, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Type</label>
              <select style={inp} value={form.session_type} onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))}>
                <option value="online">Online</option>
                <option value="in_person">In Person</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Subject</label>
            <select style={inp} value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}>
              <option value="">— Any subject —</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
            <textarea style={{ ...inp, resize: 'vertical' }} rows={3} placeholder="Topics to cover, reminders…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: 10, background: '#7C3AED', color: 'white', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CalendarPlus size={15} />}
            {saving ? 'Scheduling…' : 'Schedule Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TutorStudySessionsPage() {
  const today = new Date()
  const [activeTab, setActiveTab] = useState('Upcoming')
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailSession, setDetailSession] = useState(null)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [rescheduleSaving, setRescheduleSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [todayOnly, setTodayOnly] = useState(false)
  const [calDate, setCalDate] = useState({ year: today.getFullYear(), month: today.getMonth(), day: today.getDate() })
  const [showNewSession, setShowNewSession] = useState(false)

  useEffect(() => {
    getSessions()
      .then(data => setSessions(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  const now = useMemo(() => new Date(), [sessions])

  const upcoming = useMemo(() => sessions.filter(s => isUpcomingTabSession(s, now)), [sessions, now])

  const filtered = useMemo(() => {
    let list = sessions
    if (activeTab === 'Upcoming') list = upcoming
    else if (activeTab === 'Completed') list = sessions.filter(s => isCompletedTabSession(s))
    else if (activeTab === 'Cancelled') list = sessions.filter(s => isCancelledTabSession(s))

    if (statusFilter) list = list.filter(s => effectiveStatus(s, now) === statusFilter || s.status === statusFilter)
    if (todayOnly) list = list.filter(s => isSessionToday(s, now))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (s.student?.user?.name || '').toLowerCase().includes(q) ||
        (s.subject?.name || '').toLowerCase().includes(q) ||
        (s.notes || '').toLowerCase().includes(q)
      )
    }
    if (calDate.day) {
      const onDay = sessionsOnDate(sessions, calDate.year, calDate.month, calDate.day)
      const ids = new Set(onDay.map(s => s.id))
      list = list.filter(s => ids.has(s.id))
    }
    return list
  }, [sessions, activeTab, upcoming, statusFilter, todayOnly, search, calDate, now])

  const todaySessions = useMemo(() => upcoming.filter(s => isSessionToday(s, now)), [upcoming, now])
  const weekEnd = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d }, [])
  const thisWeekSessions = useMemo(() => upcoming.filter(s => {
    if (!s.scheduled_at) return false
    const d = new Date(s.scheduled_at)
    return d >= now && d < weekEnd
  }), [upcoming, now, weekEnd])

  const totalHours = Math.round(thisWeekSessions.reduce((s, x) => s + (x.duration_minutes || 60), 0) / 60 * 10) / 10
  const uniqueStudents = new Set(thisWeekSessions.map(s => s.student_id)).size
  const totalEarnings = 0 // payment methods removed

  const handleAccept = async (id) => {
    try {
      const res = await acceptSession(id)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...(res.session || {}), status: 'scheduled' } : s))
    } catch {}
  }

  const handleDecline = async (id) => {
    if (!window.confirm('Decline this session request?')) return
    try {
      await declineSession(id)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s))
    } catch {}
  }

  const handleComplete = async (id) => {
    try {
      const res = await completeSession(id)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...(res.session || {}), status: 'completed' } : s))
    } catch {}
  }

  const handleReschedule = async (data) => {
    if (!rescheduleTarget) return
    setRescheduleSaving(true)
    try {
      const res = await rescheduleSession(rescheduleTarget.id, data)
      setSessions(prev => prev.map(s => s.id === rescheduleTarget.id ? { ...s, ...(res.session || {}), ...data } : s))
      setRescheduleTarget(null)
    } catch {} finally { setRescheduleSaving(false) }
  }

  const prevMonth = () => setCalDate(p => p.month === 0 ? { year: p.year - 1, month: 11, day: 1 } : { ...p, month: p.month - 1, day: 1 })
  const nextMonth = () => setCalDate(p => p.month === 11 ? { year: p.year + 1, month: 0, day: 1 } : { ...p, month: p.month + 1, day: 1 })

  const TABS = ['Upcoming', 'Completed', 'Cancelled', 'All Sessions']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .tss-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .tss-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px; max-width: 720px; }
        .tss-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 14px; }
        .tss-tab { padding: 10px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: inherit; }
        .tss-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {detailSession && (
        <SessionDetailsModal session={detailSession} role="tutor" messageBase="/tutor/messages" onClose={() => setDetailSession(null)} />
      )}
      {rescheduleTarget && (
        <RescheduleModal session={rescheduleTarget} saving={rescheduleSaving}
          onClose={() => setRescheduleTarget(null)} onSave={handleReschedule} />
      )}
      {showNewSession && (
        <NewSessionModal
          onClose={() => setShowNewSession(false)}
          onScheduled={() => {
            setShowNewSession(false)
            getSessions().then(data => setSessions(Array.isArray(data?.data) ? data.data : [])).catch(() => {})
          }}
        />
      )}

      <div className="tss-wrap">
        <div className="tss-main">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px' }}>Study Sessions</h1>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Manage your upcoming tutoring sessions and session history.</p>
            </div>
            <button onClick={() => setShowNewSession(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              <CalendarPlus size={15} /> New Session
            </button>
          </div>

          <div style={{ borderBottom: '1px solid #F0F0F4', display: 'flex', gap: 16, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} type="button" className={`tss-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 160px' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, subject..."
                style={{ width: '100%', padding: '9px 12px 9px 32px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: 9, border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Confirmed</option>
              <option value="ongoing">Ongoing</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280' }}>
              <input type="checkbox" checked={todayOnly} onChange={e => setTodayOnly(e.target.checked)} /> Today
            </label>
          </div>

          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {activeTab} Sessions{activeTab === 'Upcoming' ? ` (${upcoming.length})` : ''}
            {calDate.day && (
              <button type="button" onClick={() => setCalDate(p => ({ ...p, day: null }))}
                style={{ marginLeft: 10, fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear date filter ×
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#FAFAFF', border: '1px dashed #DDD6FE', borderRadius: 14, padding: 40, textAlign: 'center' }}>
              <Calendar size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, marginBottom: 8 }}>No sessions found</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Students will book sessions once you are matched.</div>
              <Link to="/tutor/find-students" style={{ padding: '9px 20px', background: '#7C3AED', color: 'white', borderRadius: 9, fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>Find Students</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(s => (
                <SessionCard key={s.id} session={s} role="tutor"
                  onOpenDetails={setDetailSession}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onComplete={handleComplete}
                  onReschedule={setRescheduleTarget}
                  onCancel={async (id) => {
                    if (!window.confirm('Cancel this session?')) return
                    await cancelSession(id)
                    setSessions(prev => prev.map(x => x.id === id ? { ...x, status: 'cancelled' } : x))
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="tss-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Calendar</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={prevMonth} style={{ border: '1px solid #E5E7EB', background: 'white', borderRadius: 6, padding: 4, cursor: 'pointer' }}><ChevronLeft size={12} /></button>
                <button type="button" onClick={nextMonth} style={{ border: '1px solid #E5E7EB', background: 'white', borderRadius: 6, padding: 4, cursor: 'pointer' }}><ChevronRight size={12} /></button>
              </div>
            </div>
            <InteractiveCalendar sessions={sessions} selectedDate={calDate} onSelectDate={setCalDate} />
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Today&apos;s Sessions</div>
            {todaySessions.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No sessions today</div>
            ) : (
              todaySessions.map(s => (
                <button key={s.id} type="button" onClick={() => setDetailSession(s)} style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px', background: '#F8F9FB', border: 'none',
                  borderRadius: 10, marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.subject?.name || 'Study Session'}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{s.student?.user?.name} · {new Date(s.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                </button>
              ))
            )}
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>This Week</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: Calendar, color: '#7C3AED', bg: '#F3F0FF', value: thisWeekSessions.length, label: 'Sessions' },
                { icon: Users, color: '#6366F1', bg: '#EEF2FF', value: uniqueStudents, label: 'Students' },
                { icon: Clock, color: '#F59E0B', bg: '#FFFBEB', value: `${totalHours}h`, label: 'Hours' },
                { icon: Star, color: '#10B981', bg: '#F0FDF4', value: totalEarnings > 0 ? `₱${Math.round(totalEarnings)}` : '—', label: 'Est. earnings' },
              ].map(({ icon: Icon, color, bg, value, label }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <Icon size={16} color={color} style={{ margin: '0 auto 4px' }} />
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
