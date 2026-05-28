import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axiosInstance'
import {
  getSessions, createSession, cancelSession, rescheduleSession,
} from '../../api/sessions'
import { getMatchRequests } from '../../api/matchRequests'
import {
  SessionCard, SessionDetailsModal, RescheduleModal,
} from '../../components/sessions/SessionShared'
import {
  isUpcomingTabSession, isCompletedTabSession, isCancelledTabSession,
  isSessionToday, effectiveStatus,
} from '../../utils/sessionUtils'
import {
  Search, Plus, X, Loader2, CheckCircle, BookOpen, RefreshCw, Calendar,
} from 'lucide-react'

function CreateModal({ acceptedTutors, subjects, onClose, onCreated }) {
  const [form, setForm] = useState({
    tutor_id: '', subject_id: '', scheduled_at: '', duration_minutes: '60',
    session_type: 'online', notes: '', session_link: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.tutor_id) { setError('Select a tutor.'); return }
    if (!form.scheduled_at) { setError('Pick a date and time.'); return }
    setSaving(true); setError('')
    try {
      const res = await createSession({
        tutor_user_id:    parseInt(form.tutor_id),
        subject_id:       form.subject_id ? parseInt(form.subject_id) : undefined,
        scheduled_at:     new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes) || 60,
        session_type:     form.session_type,
        notes:            form.notes || undefined,
        session_link:     form.session_link || undefined,
      })
      onCreated(res.session || res)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to book session.')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #D1D5DB',
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'inherit',
    color: '#111827',
    background: '#FFFFFF',
    WebkitTextFillColor: '#111827',
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    display: 'block',
    marginBottom: 6,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        className="book-session-modal"
        style={{
          background: '#FFFFFF',
          color: '#111827',
          borderRadius: 18,
          padding: 28,
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 48px rgba(0,0,0,.2)',
        }}
      >
        <style>{`
          .book-session-modal,
          .book-session-modal input,
          .book-session-modal select,
          .book-session-modal textarea,
          .book-session-modal option {
            color: #111827 !important;
            -webkit-text-fill-color: #111827;
          }
          .book-session-modal input::placeholder,
          .book-session-modal textarea::placeholder {
            color: #6B7280 !important;
            opacity: 1;
          }
          .book-session-modal select option {
            color: #111827;
            background: #fff;
          }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1E1B4B' }}>Book a Session</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Close"><X size={22} color="#6B7280" /></button>
        </div>
        {error && <div style={{ padding: 10, background: '#FEF2F2', color: '#EF4444', borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
        {acceptedTutors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ color: '#6B7280', marginBottom: 16 }}>You need an accepted tutor match first.</p>
            <Link to="/student/find-tutors" onClick={onClose} style={{ padding: '10px 20px', background: '#7C3AED', color: 'white', borderRadius: 10, fontWeight: 700, textDecoration: 'none' }}>Find Tutors</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Tutor</label>
              <select value={form.tutor_id} onChange={e => setForm(p => ({ ...p, tutor_id: e.target.value }))} style={fieldStyle} required>
                <option value="">Select tutor...</option>
                {acceptedTutors.map(t => <option key={t.tutor_id} value={t.tutor_id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subject</label>
              <select value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))} style={fieldStyle}>
                <option value="">Select subject (optional)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Session type</label>
              <select value={form.session_type} onChange={e => setForm(p => ({ ...p, session_type: e.target.value }))} style={fieldStyle}>
                <option value="online">Online</option>
                <option value="in_person">Face-to-face</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date & time</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} style={fieldStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Duration</label>
              <select value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} style={fieldStyle}>
                {[30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Meeting link</label>
              <input type="url" value={form.session_link} placeholder="https://meet.google.com/..." onChange={e => setForm(p => ({ ...p, session_link: e.target.value }))} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Notes / description</label>
              <textarea rows={3} value={form.notes} placeholder="What do you want to cover?" onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
            <button type="submit" disabled={saving} style={{
              padding: 12, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Booking...' : 'Book Session'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function EmptyState({ tab, onBook }) {
  const messages = {
    upcoming: {
      title: 'No upcoming sessions.',
      sub: 'Book your first study session.',
      showBook: true,
    },
    completed: {
      title: 'No completed sessions yet.',
      sub: 'Finished sessions will appear here after your tutor marks them complete.',
      showBook: false,
    },
    cancelled: {
      title: 'No cancelled sessions.',
      sub: 'Sessions you or your tutor cancelled will appear here.',
      showBook: false,
    },
  }

  const c = messages[tab] || messages.upcoming

  return (
    <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
      <BookOpen size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{c.title}</div>
      <div style={{ fontSize: 14, color: '#9CA3AF', marginBottom: c.showBook ? 20 : 0 }}>{c.sub}</div>
      {c.showBook && (
        <button type="button" onClick={onBook} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px',
          background: '#7C3AED', color: 'white', borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Plus size={15} /> Book a Session
        </button>
      )}
    </div>
  )
}

export default function StudySessionsPage() {
  const [sessions, setSessions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showModal, setShowModal] = useState(false)
  const [detailSession, setDetailSession] = useState(null)
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [rescheduleSaving, setRescheduleSaving] = useState(false)
  const [acceptedTutors, setAcceptedTutors] = useState([])
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [todayOnly, setTodayOnly] = useState(false)

  const loadSessions = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSessions()
      setSessions(Array.isArray(data?.data) ? data.data : [])
    } catch {
      setError('Failed to load sessions. Please try again.')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await api.get('/subjects')
        const list = res.data?.data || res.data || []
        setSubjects(Array.isArray(list) ? list : [])
      } catch { setSubjects([]) }
      try {
        const res = await getMatchRequests()
        const matched = res?.data?.data || res?.data || []
        setAcceptedTutors((Array.isArray(matched) ? matched : []).filter(u => u.role === 'tutor').map(u => ({
          tutor_id: u.id,
          name: u.fullName || u.name || `Tutor #${u.id}`,
        })))
      } catch {}
    }
    loadSessions()
    loadMeta()
  }, [])

  const showToastMsg = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this session?')) return
    try {
      await cancelSession(id)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s))
      showToastMsg('Session cancelled.')
    } catch { showToastMsg('Failed to cancel.') }
  }

  const handleReschedule = async (data) => {
    if (!rescheduleTarget) return
    setRescheduleSaving(true)
    try {
      const res = await rescheduleSession(rescheduleTarget.id, data)
      const updated = res.session || { ...rescheduleTarget, ...data }
      setSessions(prev => prev.map(s => s.id === rescheduleTarget.id ? { ...s, ...updated } : s))
      setRescheduleTarget(null)
      showToastMsg('Session rescheduled.')
    } catch {
      showToastMsg('Failed to reschedule.')
    } finally {
      setRescheduleSaving(false)
    }
  }

  const now = useMemo(() => new Date(), [sessions])
  const upcoming = useMemo(() => sessions.filter(s => isUpcomingTabSession(s, now)), [sessions, now])
  const completed = useMemo(() => sessions.filter(s => isCompletedTabSession(s)), [sessions])
  const cancelled = useMemo(() => sessions.filter(s => isCancelledTabSession(s)), [sessions])

  const tabSessions = useMemo(() => {
    if (activeTab === 'upcoming') return upcoming
    if (activeTab === 'completed') return completed
    if (activeTab === 'cancelled') return cancelled
    return []
  }, [activeTab, upcoming, completed, cancelled])

  const displayed = useMemo(() => {
    let list = tabSessions
    if (statusFilter) list = list.filter(s => effectiveStatus(s, now) === statusFilter || s.status === statusFilter)
    if (subjectFilter) list = list.filter(s => String(s.subject_id) === subjectFilter)
    if (todayOnly) list = list.filter(s => isSessionToday(s, now))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (s.tutor?.user?.name || '').toLowerCase().includes(q) ||
        (s.subject?.name || '').toLowerCase().includes(q) ||
        (s.notes || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [tabSessions, statusFilter, subjectFilter, todayOnly, search, now])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ss-wrap * { box-sizing: border-box; }
        .ss-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 16px; }
        .ss-wrap input, .ss-wrap select { color: #111827; background: #fff; }
        .ss-tab { padding: 10px 4px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: inherit; }
        .ss-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .ss-select { padding: 9px 12px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 13.5px; font-family: inherit; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {showModal && (
        <CreateModal acceptedTutors={acceptedTutors} subjects={subjects} onClose={() => setShowModal(false)}
          onCreated={s => { setSessions(p => [s, ...p]); setShowModal(false); setActiveTab('upcoming'); showToastMsg('Session booked! Tutor will be notified.') }} />
      )}
      {detailSession && (
        <SessionDetailsModal session={detailSession} role="student" messageBase="/student/messages" onClose={() => setDetailSession(null)} />
      )}
      {rescheduleTarget && (
        <RescheduleModal session={rescheduleTarget} saving={rescheduleSaving}
          onClose={() => setRescheduleTarget(null)} onSave={handleReschedule} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 2000, background: '#1E1B4B', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13.5, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <CheckCircle size={16} color="#10B981" /> {toast}
        </div>
      )}

      <div className="ss-wrap">
        {/* Header — matches Resources page */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Study Sessions</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>View and manage your study sessions.</p>
          </div>
          <button type="button" onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', background: '#7C3AED', color: 'white',
            border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
          }}>
            <Plus size={15} /> Book Session
          </button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #F0F0F4', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button type="button" className={`ss-tab${activeTab === 'upcoming' ? ' active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming ({upcoming.length})</button>
          <button type="button" className={`ss-tab${activeTab === 'completed' ? ' active' : ''}`} onClick={() => setActiveTab('completed')}>Completed ({completed.length})</button>
          <button type="button" className={`ss-tab${activeTab === 'cancelled' ? ' active' : ''}`} onClick={() => setActiveTab('cancelled')}>Cancelled ({cancelled.length})</button>
        </div>

        {/* Search — matches Resources page */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: 12, padding: '10px 16px',
        }}>
          <Search size={16} color="#9CA3AF" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions by tutor, subject, or notes..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#374151' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="ss-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Confirmed</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
          <select className="ss-select" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6B7280',
            cursor: 'pointer', padding: '9px 12px', background: 'white',
            border: '1.5px solid #E5E7EB', borderRadius: 10,
          }}>
            <input type="checkbox" checked={todayOnly} onChange={e => setTodayOnly(e.target.checked)} />
            Today only
          </label>
        </div>

        {/* Stats — matches Resources page */}
        {!loading && !error && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Sessions', value: sessions.length, color: '#7C3AED' },
              { label: 'Filtered Results', value: displayed.length, color: '#10B981' },
              { label: 'Upcoming', value: upcoming.length, color: '#6366F1' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 12, padding: '12px 18px' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Error — matches Resources page */}
        {error && !loading && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 13.5, color: '#EF4444', flex: 1 }}>{error}</span>
            <button type="button" onClick={loadSessions} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              background: 'white', border: '1px solid #FECACA', borderRadius: 8,
              color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && displayed.length === 0 && (
          sessions.length === 0 ? (
            <EmptyState tab="upcoming" onBook={() => setShowModal(true)} />
          ) : (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
              <Calendar size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No sessions found</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>
                Try a different tab, filter, or search term.
              </div>
              {activeTab === 'upcoming' && (
                <button type="button" onClick={() => setShowModal(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px',
                  background: '#7C3AED', color: 'white', borderRadius: 10, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <Plus size={15} /> Book Session
                </button>
              )}
            </div>
          )
        )}

        {/* Session list — matches Resources list container */}
        {!loading && !error && displayed.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
            {displayed.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                role="student"
                listMode
                onOpenDetails={setDetailSession}
                onCancel={handleCancel}
                onReschedule={setRescheduleTarget}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
