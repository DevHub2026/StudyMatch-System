import { Link } from 'react-router-dom'
import { Calendar, Clock, Users, Video, MapPin } from 'lucide-react'

/**
 * SessionCard — reusable for both student and tutor session lists
 *
 * Props:
 *  session: {
 *    id, title, subject, subjectColor, subjectBg,
 *    date, time, duration, type ('Online'|'In-Person'),
 *    participants?, maxParticipants?,
 *    tutor?, student?,        // whichever is relevant
 *    location?,
 *    status ('upcoming'|'completed'|'cancelled'),
 *  }
 *  onJoin?: () => void
 *  viewPath?: string  — e.g. '/student/study-sessions'
 */
export default function SessionCard({ session, onJoin, viewPath }) {
  const {
    id, title, subject, subjectColor = '#7C3AED', subjectBg = '#F3F0FF',
    date, time, duration, type,
    participants, maxParticipants,
    tutor, student,
    location: loc,
    status = 'upcoming',
  } = session

  const statusMap = {
    upcoming:  { label: 'Upcoming',  color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
    completed: { label: 'Completed', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
    cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  }
  const s = statusMap[status] || statusMap.upcoming

  return (
    <div style={{
      background: 'white',
      border: '1px solid #F0F0F4',
      borderRadius: 14,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'box-shadow .18s',
      fontFamily: "'DM Sans', sans-serif",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Subject icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 13,
        background: subjectBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 18, fontWeight: 800, color: subjectColor,
      }}>
        {subject?.slice(0, 2) || '📚'}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>{title}</div>
        {(tutor || student) && (
          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 5 }}>
            {tutor ? `Tutor: ${tutor}` : `Student: ${student}`}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#6B7280' }}>
            <Calendar size={12} color="#7C3AED" /> {date}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#6B7280' }}>
            <Clock size={12} color="#7C3AED" /> {time} {duration && `(${duration})`}
          </div>
          {(participants !== undefined) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#6B7280' }}>
              <Users size={12} color="#7C3AED" /> {participants}{maxParticipants ? `/${maxParticipants}` : ''} participants
            </div>
          )}
          {loc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#6B7280' }}>
              <MapPin size={12} color="#7C3AED" /> {loc}
            </div>
          )}
        </div>
      </div>

      {/* Type badge */}
      <span style={{
        fontSize: 11.5, fontWeight: 600, color: '#10B981',
        background: '#F0FDF4', border: '1px solid #BBF7D0',
        borderRadius: 20, padding: '3px 10px', flexShrink: 0,
      }}>
        {type || 'Online'}
      </span>

      {/* Status badge */}
      <span style={{
        fontSize: 11.5, fontWeight: 700, color: s.color,
        background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: 20, padding: '3px 10px', flexShrink: 0,
      }}>
        {s.label}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {status === 'upcoming' && onJoin && (
          <button onClick={onJoin} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 14px', background: 'white',
            border: '1.5px solid #7C3AED', borderRadius: 9,
            color: '#7C3AED', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#7C3AED' }}
          >
            <Video size={13} /> Join
          </button>
        )}
        {viewPath && (
          <Link to={`${viewPath}/${id}`} style={{
            padding: '8px 14px', background: '#F8F9FB',
            border: '1px solid #E5E7EB', borderRadius: 9,
            color: '#374151', fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
          }}>
            Details
          </Link>
        )}
      </div>
    </div>
  )
}