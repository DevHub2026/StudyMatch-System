import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, Video, MessageCircle, Ban, Star,
  BookOpen, MapPin, X, Loader2, ExternalLink, RefreshCw,
  Monitor, User,
} from 'lucide-react'
import {
  STATUS_STYLES, formatSessionDate, sessionTypeLabel,
  effectiveStatus, getJoinState,
} from '../../utils/sessionUtils'

const AVATAR_COLORS = ['#7C3AED', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#EF4444']

const MODAL_FIELD_STYLE = {
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

const MODAL_LABEL_STYLE = {
  fontSize: 13,
  fontWeight: 700,
  color: '#374151',
  display: 'block',
  marginBottom: 6,
}

function ModalLightTextStyles() {
  return (
    <style>{`
      .session-modal-light,
      .session-modal-light input,
      .session-modal-light select,
      .session-modal-light textarea,
      .session-modal-light option {
        color: #111827 !important;
        -webkit-text-fill-color: #111827;
      }
      .session-modal-light input::placeholder,
      .session-modal-light textarea::placeholder {
        color: #6B7280 !important;
        opacity: 1;
      }
    `}</style>
  )
}

export function PersonAvatar({ user, name, size = 56 }) {
  const displayName = name || user?.name || 'User'
  const color = AVATAR_COLORS[(user?.id || 0) % AVATAR_COLORS.length]
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const avatarUrl = user?.avatar

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={displayName} title={displayName} style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        border: `2.5px solid ${color}44`, flexShrink: 0,
      }} />
    )
  }
  return (
    <div title={displayName} style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '18', border: `2.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.3, color, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export function StatusBadge({ session }) {
  const status = effectiveStatus(session)
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
      background: style.bg, color: style.text, border: `1px solid ${style.border}`,
    }}>
      {style.label}
    </span>
  )
}

export function JoinButton({ session }) {
  const join = getJoinState(session)
  if (join.canJoin) {
    return (
      <a href={session.session_link} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
        background: '#7C3AED', color: 'white', borderRadius: 9, fontSize: 13,
        fontWeight: 700, textDecoration: 'none',
      }}>
        <Video size={14} /> Join
      </a>
    )
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
      background: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB',
      borderRadius: 9, fontSize: 12.5, fontWeight: 600,
    }}>
      <Clock size={13} /> {join.message}
    </span>
  )
}

export function SessionMetaRow({ session }) {
  const subject = session.subject?.name
  const type = sessionTypeLabel(session.session_type)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
      {subject && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
          background: '#F3F0FF', color: '#7C3AED', borderRadius: 20, fontSize: 12, fontWeight: 700,
          border: '1px solid #DDD6FE',
        }}>
          <BookOpen size={12} /> {subject}
        </span>
      )}
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
        background: '#EFF6FF', color: '#2563EB', borderRadius: 20, fontSize: 12, fontWeight: 600,
      }}>
        {session.session_type === 'in_person' ? <MapPin size={12} /> : <Monitor size={12} />}
        {type}
      </span>
      {session.tutor?.average_rating > 0 && (
        <span style={{ fontSize: 12.5, color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Star size={12} fill="#F59E0B" color="#F59E0B" />
          {parseFloat(session.tutor.average_rating).toFixed(1)} Tutor Rating
        </span>
      )}
    </div>
  )
}

export function SessionDetailsModal({ session, role, onClose, messageBase }) {
  if (!session) return null
  const partner = role === 'student' ? session.tutor : session.student
  const partnerUser = partner?.user
  const partnerName = partnerUser?.name || (role === 'student' ? 'Tutor' : 'Student')
  const join = getJoinState(session)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div className="session-modal-light" style={{ background: '#FFFFFF', color: '#111827', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <ModalLightTextStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1E1B4B' }}>Session Details</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} color="#9CA3AF" /></button>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <PersonAvatar user={partnerUser} name={partnerName} size={52} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1B4B' }}>{session.subject?.name || 'Study Session'}</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>with {partnerName}</div>
            <div style={{ marginTop: 6 }}><StatusBadge session={session} /></div>
          </div>
        </div>

        <SessionMetaRow session={session} />

        <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <DetailRow icon={Calendar} label="Date & time" value={formatSessionDate(session.scheduled_at)} />
          <DetailRow icon={Clock} label="Duration" value={`${session.duration_minutes || 60} minutes`} />
          <DetailRow icon={session.session_type === 'in_person' ? MapPin : Monitor} label="Type" value={sessionTypeLabel(session.session_type)} />
        </div>

        {session.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 6 }}>NOTES</div>
            <div style={{ padding: 12, background: '#F9FAFB', borderRadius: 10, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{session.notes}</div>
          </div>
        )}

        {session.session_link ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 6 }}>MEETING LINK</div>
            <a href={session.session_link} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 8, color: '#7C3AED', fontWeight: 600, fontSize: 14, wordBreak: 'break-all',
            }}>
              <ExternalLink size={14} /> {session.session_link}
            </a>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>No meeting link added yet.</div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {join.canJoin && (
            <a href={session.session_link} target="_blank" rel="noopener noreferrer" style={{
              padding: '10px 18px', background: '#7C3AED', color: 'white', borderRadius: 10,
              fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <Video size={14} /> Join Session
            </a>
          )}
          {partnerUser?.id && (
            <Link to={`${messageBase}?partner=${partnerUser.id}`} style={{
              padding: '10px 18px', background: 'white', color: '#7C3AED', border: '1.5px solid #DDD6FE',
              borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <MessageCircle size={14} /> Message
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Icon size={16} color="#7C3AED" style={{ marginTop: 2, flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF' }}>{label}</div>
        <div style={{ fontSize: 14, color: '#1E1B4B', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}

export function RescheduleModal({ session, onClose, onSave, saving }) {
  const [scheduledAt, setScheduledAt] = useState('')
  const [sessionLink, setSessionLink] = useState(session?.session_link || '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.scheduled_at) {
      const d = new Date(session.scheduled_at)
      setScheduledAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
    }
    setSessionLink(session?.session_link || '')
  }, [session])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!scheduledAt) { setError('Pick a new date and time.'); return }
    setError('')
    onSave({
      scheduled_at: new Date(scheduledAt).toISOString(),
      session_link: sessionLink || undefined,
    })
  }

  if (!session) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="session-modal-light" style={{ background: '#FFFFFF', color: '#111827', borderRadius: 18, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 48px rgba(0,0,0,.2)' }}>
        <ModalLightTextStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#1E1B4B' }}>Reschedule Session</span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} color="#6B7280" /></button>
        </div>
        {error && <div style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={MODAL_LABEL_STYLE}>New date & time</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              style={MODAL_FIELD_STYLE} />
          </div>
          <div>
            <label style={MODAL_LABEL_STYLE}>Meeting link</label>
            <input type="url" value={sessionLink} onChange={e => setSessionLink(e.target.value)} placeholder="https://meet.google.com/..."
              style={MODAL_FIELD_STYLE} />
          </div>
          <button type="submit" disabled={saving} style={{
            padding: 12, background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>
            {saving ? 'Saving...' : 'Save new time'}
          </button>
        </form>
      </div>
    </div>
  )
}

export function SessionCard({
  session, role, onCancel, onReschedule, onAccept, onDecline, onComplete, onOpenDetails,
  listMode = false,
}) {
  const [hovered, setHovered] = useState(false)
  const partner = role === 'student' ? session.tutor : session.student
  const partnerUser = partner?.user
  const partnerName = partnerUser?.name || (role === 'student' ? 'Tutor' : 'Student')
  const messageBase = role === 'student' ? '/student/messages' : '/tutor/messages'
  const canCancel = ['pending', 'scheduled', 'ongoing', 'rescheduled'].includes(session.status)
  const canReschedule = canCancel
  const status = effectiveStatus(session)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails?.(session)}
      onKeyDown={e => e.key === 'Enter' && onOpenDetails?.(session)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: listMode ? (hovered ? '#FAFAFA' : 'white') : 'white',
        border: listMode ? 'none' : `1px solid ${hovered ? '#DDD6FE' : '#F0F0F4'}`,
        borderBottom: listMode ? '1px solid #F8F9FB' : undefined,
        borderRadius: listMode ? 0 : 16,
        padding: listMode ? '18px 20px' : '22px 24px',
        display: 'flex', gap: 18, alignItems: 'flex-start',
        boxShadow: listMode ? 'none' : (hovered ? '0 8px 24px rgba(124,58,237,.08)' : '0 1px 3px rgba(0,0,0,.04)'),
        transition: 'all .18s', cursor: 'pointer',
      }}
    >
      <PersonAvatar user={partnerUser} name={partnerName} size={56} />

      <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#1E1B4B' }}>
            {session.subject?.name || 'Study Session'}
          </span>
          <StatusBadge session={session} />
        </div>

        <SessionMetaRow session={session} />

        <div style={{ fontSize: 14, color: '#4B5563', marginBottom: 10 }}>
          with <span style={{ fontWeight: 700, color: '#1E1B4B' }}>{partnerName}</span>
        </div>

        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 12, fontSize: 13, color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={14} color="#7C3AED" /> {formatSessionDate(session.scheduled_at)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={14} color="#7C3AED" /> {session.duration_minutes || 60} min</span>
        </div>

        {session.session_link && (
          <div style={{ fontSize: 12.5, color: '#7C3AED', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Video size={13} /> Meeting link available
          </div>
        )}

        {session.notes && (
          <div style={{ fontSize: 13, color: '#6B7280', background: '#F9FAFB', padding: '8px 12px', borderRadius: 8, marginBottom: 12, lineHeight: 1.45 }}>
            {session.notes.length > 120 ? session.notes.slice(0, 120) + '…' : session.notes}
          </div>
        )}

        <div style={{ height: 3, borderRadius: 4, background: '#F3F4F6', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: status === 'ongoing' ? '70%' : status === 'scheduled' ? '50%' : '25%',
            background: STATUS_STYLES[status]?.text || '#7C3AED', borderRadius: 4, transition: 'width .3s',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <JoinButton session={session} />

          {partnerUser?.id && (
            <Link to={`${messageBase}?partner=${partnerUser.id}`} onClick={e => e.stopPropagation()} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'white', color: '#7C3AED', border: '1.5px solid #DDD6FE', borderRadius: 9,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              <MessageCircle size={14} /> Message
            </Link>
          )}

          {canReschedule && onReschedule && (
            <button type="button" onClick={() => onReschedule(session)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 9,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <RefreshCw size={14} /> Reschedule
            </button>
          )}

          {role === 'tutor' && session.status === 'pending' && onAccept && (
            <button type="button" onClick={() => onAccept(session.id)} style={{
              padding: '9px 16px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 9,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Accept</button>
          )}
          {role === 'tutor' && session.status === 'pending' && onDecline && (
            <button type="button" onClick={() => onDecline(session.id)} style={{
              padding: '9px 16px', background: 'white', color: '#DC2626', border: '1.5px solid #FECACA',
              borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Decline</button>
          )}
          {role === 'tutor' && ['scheduled', 'ongoing'].includes(status) && onComplete && (
            <button type="button" onClick={() => onComplete(session.id)} style={{
              padding: '9px 16px', background: '#F0FDF4', color: '#15803D', border: '1.5px solid #86EFAC',
              borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Mark completed</button>
          )}

          {canCancel && onCancel && (
            <button type="button" onClick={() => onCancel(session.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
              background: 'white', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 9,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Ban size={14} /> Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function InteractiveCalendar({ sessions, selectedDate, onSelectDate }) {
  const today = new Date()
  const year = selectedDate?.year ?? today.getFullYear()
  const month = selectedDate?.month ?? today.getMonth()

  const first = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = first - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - first + 2, cur: false })

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const sessionDays = new Set(
    sessions.filter(s => s.scheduled_at).map(s => {
      const d = new Date(s.scheduled_at)
      return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null
    }).filter(Boolean)
  )

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{monthLabel}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((c, i) => {
          if (!c.cur) return <div key={i} style={{ height: 32 }} />
          const isToday = c.day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasSession = sessionDays.has(c.day)
          const isSelected = selectedDate?.day === c.day
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate({ year, month, day: c.day })}
              style={{
                height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', position: 'relative',
                background: isSelected ? '#7C3AED' : isToday ? '#EDE9FE' : 'transparent',
                color: isSelected ? 'white' : isToday ? '#7C3AED' : '#374151',
                fontWeight: isSelected || isToday ? 700 : 500, fontSize: 12, fontFamily: 'inherit',
              }}
            >
              {c.day}
              {hasSession && (
                <span style={{
                  position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'white' : '#7C3AED',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
