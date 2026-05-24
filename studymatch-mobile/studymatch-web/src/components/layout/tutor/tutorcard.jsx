import { Link } from 'react-router-dom'
import { Star, Calendar, Clock, Bookmark, BadgeCheck } from 'lucide-react'

/**
 * TutorCard — reusable for FindTutors, Dashboard recommended, etc.
 *
 * Props:
 *  tutor: {
 *    id, name, department, rating, reviews, price,
 *    initials, color, online,
 *    teaches: string[],
 *    availability: string,
 *    hours: string,
 *    subjects: string[],
 *    sessionType: string,
 *  }
 *  saved?: boolean
 *  onSave?: (id) => void
 *  compact?: boolean  — smaller card for dashboard panel
 */
export default function TutorCard({ tutor, saved, onSave, compact = false }) {
  const {
    id, name, department, rating, reviews, price,
    initials, color = '#7C3AED', online,
    teaches = [], availability, hours,
  } = tutor

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: '#F8F9FB',
        borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: color + '22', border: `2px solid ${color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color,
          }}>
            {initials}
          </div>
          {online !== undefined && (
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 10, height: 10, borderRadius: '50%',
              background: online ? '#22C55E' : '#D1D5DB',
              border: '2px solid white',
            }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B' }}>{name}</div>
          <div style={{ fontSize: 11.5, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={10} color="#F59E0B" fill="#F59E0B" />
            {rating} · {department}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>
          ${price}/hr
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '18px 22px',
      borderBottom: '1px solid #F8F9FB',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'background .12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: color + '22', border: `2.5px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18, color,
        }}>
          {initials}
        </div>
        {online !== undefined && (
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 14, height: 14, borderRadius: '50%',
            background: online ? '#22C55E' : '#D1D5DB',
            border: '2px solid white',
          }} />
        )}
      </div>

      {/* Name + rating */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>{name}</span>
          <BadgeCheck size={15} color="#7C3AED" fill="#EEF2FF" />
        </div>
        <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 6 }}>{department}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
          <Star size={13} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontWeight: 700, color: '#1E1B4B' }}>{rating}</span>
          <span style={{ color: '#9CA3AF' }}>({reviews} reviews)</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', marginTop: 4 }}>
          ${price} / session
        </div>
      </div>

      {/* Teaches */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          Teaches
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {teaches.map(t => (
            <span key={t} style={{
              padding: '3px 10px', borderRadius: 20,
              background: '#F3F0FF', color: '#7C3AED',
              fontSize: 12, fontWeight: 600, border: '1px solid #DDD6FE',
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div style={{ width: 160, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          Availability
        </div>
        {availability && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', marginBottom: 4 }}>
            <Calendar size={12} color="#7C3AED" /> {availability}
          </div>
        )}
        {hours && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
            <Clock size={12} color="#7C3AED" /> {hours}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
        {onSave && (
          <button onClick={() => onSave(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Bookmark size={15} color={saved ? '#7C3AED' : '#D1D5DB'} fill={saved ? '#7C3AED' : 'none'} />
          </button>
        )}
        <Link to={`/student/find-tutors/${id}`} style={{
          padding: '8px 18px', background: 'white',
          border: '1.5px solid #7C3AED', borderRadius: 9,
          color: '#7C3AED', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#F3F0FF'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          View Profile
        </Link>
      </div>
    </div>
  )
}