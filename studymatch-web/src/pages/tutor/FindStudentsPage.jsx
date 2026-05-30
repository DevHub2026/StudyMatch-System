import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getIncomingRequests,
  acceptMatchRequest,
  declineMatchRequest,
} from '../../api/matchRequests'
import { requestSessionWithStudent } from '../../api/sessions'
import { getSubjects } from '../../api/subjects'
import { getStudentHelpSubjects } from '../../utils/studentMatchUtils'
import {
  ChevronDown, Clock, SlidersHorizontal,
  Users, Check, X,
  GraduationCap, Loader2, RefreshCw, MessageSquare, BookOpen,
  CalendarPlus,
} from 'lucide-react'

/* ─── constants ──────────────────────────────────────────────── */

const SUBJECTS_OPTIONS = ['All Subjects', 'Calculus', 'Physics', 'Statistics', 'Linear Algebra', 'Biology', 'Chemistry', 'Data Structures', 'Algorithms']
const STATUS_OPTIONS   = ['All Requests', 'Pending', 'Accepted', 'Declined']
const COLORS           = ['#EC4899','#7C3AED','#10B981','#6366F1','#F59E0B','#EF4444']

const getColor    = (i) => COLORS[i % COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

/* ─── helpers ────────────────────────────────────────────────── */

function Avatar({ name = '', color = '#7C3AED', size = 56 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.32, color, fontFamily: 'inherit', flexShrink: 0,
    }}>
      {getInitials(name)}
    </div>
  )
}

function SubjectTag({ label }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      background: '#F3F0FF', color: '#7C3AED',
      fontSize: 12, fontWeight: 600, border: '1px solid #DDD6FE',
    }}>
      {label}
    </span>
  )
}

function StatusBadge({ status }) {
  const MAP = {
    pending:  { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    accepted: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    declined: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  }
  const s = MAP[status] || MAP.pending
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

function Dropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ flex: 1, minWidth: 140 }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        <div onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', background: 'white', border: '1px solid #E5E7EB',
          borderRadius: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
          color: '#374151', userSelect: 'none',
        }}>
          <span style={{ flex: 1 }}>{value}</span>
          <ChevronDown size={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '.2s', flexShrink: 0 }} />
        </div>
        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
            <div style={{
              position: 'absolute', top: '110%', left: 0, background: 'white',
              border: '1px solid #E5E7EB', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,.10)', zIndex: 50,
              minWidth: '100%', overflow: 'hidden',
            }}>
              {options.map(opt => (
                <div key={opt} onClick={() => { onChange(opt); setOpen(false) }}
                  style={{
                    padding: '9px 14px', fontSize: 13.5,
                    color: opt === value ? '#7C3AED' : '#374151',
                    fontWeight: opt === value ? 600 : 400,
                    cursor: 'pointer', background: opt === value ? '#F3F0FF' : 'white',
                  }}
                  onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = '#F8F9FB' }}
                  onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = 'white' }}
                >{opt}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── schedule session modal ─────────────────────────────────── */

function ScheduleSessionModal({ studentName, studentUserId, onClose, onScheduled }) {
  const [subjects, setSubjects] = useState([])
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [form, setForm] = useState({
    scheduled_at: '', duration_minutes: 60, subject_id: '', session_type: 'online', notes: '',
  })

  useEffect(() => {
    getSubjects().then(res => {
      const list = res?.data || res || []
      setSubjects(Array.isArray(list) ? list : [])
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.scheduled_at) { setError('Please set a date and time.'); return }
    if (new Date(form.scheduled_at) <= new Date()) { setError('Scheduled time must be in the future.'); return }
    setSaving(true); setError('')
    try {
      await requestSessionWithStudent({
        student_user_id:  studentUserId,
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
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1E1B4B' }}>Schedule Session</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>with {studentName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#9CA3AF" /></button>
        </div>

        {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13, color: '#EF4444', marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

/* ─── request card ───────────────────────────────────────────── */

function RequestCard({ request, index, onAccept, onDecline, accepting, declining, onSchedule }) {
  const student = request.student || {}
  const name    = student.user?.name || student.user?.email || 'Student'
  const color   = getColor(index)
  const subjects = getStudentHelpSubjects(request)
  const message = request.message || ''
  const date    = request.created_at
    ? new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''
  const isPending  = request.status === 'pending'
  const isAccepted = request.status === 'accepted'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '18px 24px', borderBottom: '1px solid #F8F9FB',
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Avatar name={name} color={color} size={56} />

      {/* Name + subject */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 4 }}>{name}</div>
        {subjects.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 5 }}>
              <BookOpen size={11} color="#7C3AED" /> Needs help with
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {subjects.map(s => <SubjectTag key={s} label={s} />)}
            </div>
          </div>
        )}
        <StatusBadge status={request.status} />
      </div>

      {/* Message + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {message && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>
              <MessageSquare size={12} color="#7C3AED" /> Message
            </div>
            <div style={{
              fontSize: 13, color: '#374151', lineHeight: 1.5,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {message}
            </div>
          </>
        )}
        {date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
            <Clock size={11} /> {date}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {isPending ? (
          <>
            <button
              onClick={() => onAccept(request.id)}
              disabled={accepting === request.id || declining === request.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#F0FDF4',
                border: '1.5px solid #BBF7D0', borderRadius: 9,
                color: '#16A34A', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: accepting === request.id ? 0.6 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
              onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}
            >
              <Check size={14} strokeWidth={2.5} />
              {accepting === request.id ? 'Accepting…' : 'Accept'}
            </button>
            <button
              onClick={() => onDecline(request.id)}
              disabled={accepting === request.id || declining === request.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#FEF2F2',
                border: '1.5px solid #FECACA', borderRadius: 9,
                color: '#DC2626', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                opacity: declining === request.id ? 0.6 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
              onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
            >
              <X size={14} strokeWidth={2.5} />
              {declining === request.id ? 'Declining…' : 'Decline'}
            </button>
          </>
        ) : isAccepted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <button
              onClick={() => onSchedule(request)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', background: '#7C3AED',
                border: 'none', borderRadius: 9,
                color: 'white', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <CalendarPlus size={14} /> Schedule Session
            </button>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Accepted ✓</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>Declined</div>
        )}
      </div>
    </div>
  )
}

/* ─── main page ──────────────────────────────────────────────── */

export default function FindStudentsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('All Requests')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [requests,  setRequests]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [accepting, setAccepting] = useState(null)
  const [declining, setDeclining] = useState(null)
  const [stats,     setStats]     = useState({ total: 0, pending: 0, accepted: 0 })
  const [scheduleTarget, setScheduleTarget] = useState(null)

  const fetchRequests = async () => {
    setLoading(true); setError('')
    try {
      const res      = await getIncomingRequests()
      const received = res?.data?.data || res?.data || []
      setRequests(received)
      setStats({
        total:    received.length,
        pending:  received.filter(r => r.status === 'pending').length,
        accepted: received.filter(r => r.status === 'accepted').length,
      })
    } catch {
      setError('Failed to load student requests. Please try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAccept = async (id) => {
    setAccepting(id)
    try {
      await acceptMatchRequest(id)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: 'accepted' } : r))
      setStats(p => ({ ...p, pending: p.pending - 1, accepted: p.accepted + 1 }))
    } catch {} finally { setAccepting(null) }
  }

  const handleDecline = async (id) => {
    setDeclining(id)
    try {
      await declineMatchRequest(id)
      setRequests(p => p.map(r => r.id === id ? { ...r, status: 'declined' } : r))
      setStats(p => ({ ...p, pending: p.pending - 1 }))
    } catch {} finally { setDeclining(null) }
  }

  const filtered = requests.filter(r => {
    if (statusFilter !== 'All Requests' && r.status !== statusFilter.toLowerCase()) return false
    if (subjectFilter !== 'All Subjects' && !getStudentHelpSubjects(r).includes(subjectFilter)) return false
    return true
  })

  const QUICK_STATS = [
    { icon: Users,         color: '#7C3AED', bg: '#F3F0FF', value: stats.total,    label: 'Total Requests'  },
    { icon: Clock,         color: '#F59E0B', bg: '#FFFBEB', value: stats.pending,  label: 'Pending'         },
    { icon: GraduationCap, color: '#10B981', bg: '#F0FDF4', value: stats.accepted, label: 'Accepted'        },
  ]

  return (
    <>
      {scheduleTarget && (
        <ScheduleSessionModal
          studentName={scheduleTarget.student?.user?.name || 'Student'}
          studentUserId={scheduleTarget.student?.user?.id}
          onClose={() => setScheduleTarget(null)}
          onScheduled={() => navigate('/tutor/study-sessions')}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .fs-wrap * { box-sizing: border-box; }
        .fs-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .fs-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .fs-right { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .stat-row { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #F8F9FB; }
        .stat-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="fs-wrap">
        <div className="fs-main">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Student Requests</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage students who have requested your tutoring services.</p>
          </div>

          {/* Filters */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 14, padding: '16px 20px' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <Dropdown label="Status"   value={statusFilter}  options={STATUS_OPTIONS}   onChange={setStatusFilter}  />
              <Dropdown label="Subject"  value={subjectFilter} options={SUBJECTS_OPTIONS} onChange={setSubjectFilter} />
              <button
                onClick={() => { setStatusFilter('All Requests'); setSubjectFilter('All Subjects') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', border: '1px solid #E5E7EB',
                  borderRadius: 10, background: 'white', color: '#374151',
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', alignSelf: 'flex-end',
                }}
              >
                <SlidersHorizontal size={14} color="#7C3AED" /> Reset
              </button>
            </div>
          </div>

          {!loading && !error && (
            <div style={{ fontSize: 13.5, color: '#6B7280', fontWeight: 500 }}>
              {filtered.length} request{filtered.length !== 1 ? 's' : ''} found
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 13.5, color: '#EF4444', flex: 1 }}>{error}</span>
              <button onClick={fetchRequests} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', background: 'white',
                border: '1px solid #FECACA', borderRadius: 8,
                color: '#EF4444', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Request list */}
          {!loading && !error && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <Users size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>
                    No requests found
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {requests.length === 0
                      ? 'No students have sent you a request yet. Make sure your profile is complete!'
                      : 'Try adjusting your filters.'}
                  </div>
                </div>
              ) : (
                filtered.map((r, i) => (
                  <RequestCard
                    key={r.id || i}
                    request={r} index={i}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    accepting={accepting}
                    declining={declining}
                    onSchedule={setScheduleTarget}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="fs-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Overview</div>
            {QUICK_STATS.map(({ icon: Icon, color, bg, value, label }) => (
              <div key={label} className="stat-row">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={17} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: '#1E1B4B', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500, marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
