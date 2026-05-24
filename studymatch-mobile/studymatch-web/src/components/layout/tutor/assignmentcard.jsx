import { Link } from 'react-router-dom'
import { FileText, Calendar, Clock, ChevronRight } from 'lucide-react'

/**
 * AssignmentCard — reusable for Assignments sections
 *
 * Props:
 *  assignment: {
 *    id, name, subject, subjectColor, subjectBg,
 *    dueDate, daysLeft, status ('pending'|'submitted'|'graded'|'late'),
 *    grade?,
 *  }
 *  viewPath?: string
 */
export default function AssignmentCard({ assignment, viewPath }) {
  const {
    id, name, subject,
    subjectColor = '#7C3AED', subjectBg = '#F3F0FF',
    dueDate, daysLeft,
    status = 'pending', grade,
  } = assignment

  const statusMap = {
    pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    submitted: { label: 'Submitted', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
    graded:    { label: 'Graded',    color: '#10B981', bg: '#F0FDF4', border: '#BBF7D0' },
    late:      { label: 'Late',      color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  }

  const urgencyColor = daysLeft <= 1 ? '#EF4444'
    : daysLeft <= 3 ? '#F59E0B'
    : '#6B7280'

  const s = statusMap[status] || statusMap.pending

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px',
      background: 'white', border: '1px solid #F0F0F4',
      borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
      transition: 'box-shadow .18s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 14px rgba(124,58,237,.07)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: subjectBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <FileText size={17} color={subjectColor} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11.5, fontWeight: 600, color: subjectColor,
            background: subjectBg, borderRadius: 20, padding: '1px 8px',
          }}>
            {subject}
          </span>
          {dueDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
              <Calendar size={11} color="#9CA3AF" /> Due {dueDate}
            </div>
          )}
        </div>
      </div>

      {/* Days left */}
      {daysLeft !== undefined && (
        <span style={{
          fontSize: 12, fontWeight: 700, color: urgencyColor,
          background: urgencyColor + '15', borderRadius: 20,
          padding: '3px 10px', flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {daysLeft === 0 ? 'Due today' : daysLeft < 0 ? 'Overdue' : `${daysLeft} days left`}
        </span>
      )}

      {/* Status */}
      <span style={{
        fontSize: 12, fontWeight: 700, color: s.color,
        background: s.bg, border: `1px solid ${s.border}`,
        borderRadius: 20, padding: '3px 10px', flexShrink: 0,
      }}>
        {grade ? `${s.label} · ${grade}` : s.label}
      </span>

      {/* Arrow */}
      {viewPath && (
        <Link to={`${viewPath}/${id}`} style={{ color: '#D1D5DB', flexShrink: 0 }}>
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  )
}