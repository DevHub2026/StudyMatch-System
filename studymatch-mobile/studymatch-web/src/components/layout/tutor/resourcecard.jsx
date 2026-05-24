import { Eye, Download, Bookmark, MoreVertical, FileText } from 'lucide-react'

/**
 * ResourceCard — reusable for Resources/Library pages
 *
 * Props:
 *  resource: {
 *    id, name, type ('PDF'|'DOCX'|'PPT'|'XLSX'|'MP4'|'FOLDER'),
 *    subject, uploader, date, size,
 *    views, downloads, featured?,
 *    color, bg,
 *  }
 *  saved?: boolean
 *  onSave?: (id) => void
 */

const FILE_TYPES = {
  PDF:    { color: '#EF4444', bg: '#FEF2F2' },
  DOCX:   { color: '#6366F1', bg: '#EEF2FF' },
  XLSX:   { color: '#10B981', bg: '#F0FDF4' },
  PPT:    { color: '#F59E0B', bg: '#FFFBEB' },
  MP4:    { color: '#8B5CF6', bg: '#F5F3FF' },
  FOLDER: { color: '#F59E0B', bg: '#FFFBEB' },
}

const SUBJECT_COLORS = {
  Calculus:         { c: '#7C3AED', b: '#F3F0FF' },
  Physics:          { c: '#6366F1', b: '#EEF2FF' },
  Statistics:       { c: '#10B981', b: '#F0FDF4' },
  Chemistry:        { c: '#F59E0B', b: '#FFFBEB' },
  'Computer Science': { c: '#EF4444', b: '#FEF2F2' },
}

export default function ResourceCard({ resource, saved, onSave }) {
  const {
    id, name, type = 'PDF', subject, uploader,
    date, size, views = 0, downloads = 0, featured,
  } = resource

  const ft  = FILE_TYPES[type]  || FILE_TYPES.PDF
  const sub = SUBJECT_COLORS[subject] || { c: '#7C3AED', b: '#F3F0FF' }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 20px', borderBottom: '1px solid #F8F9FB',
      fontFamily: "'DM Sans', sans-serif",
      transition: 'background .12s', cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* File icon */}
      <div style={{
        width: 42, height: 50, borderRadius: 8,
        background: ft.bg, border: `1px solid ${ft.color}22`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2, flexShrink: 0,
      }}>
        <FileText size={18} color={ft.color} />
        <span style={{ fontSize: 8, fontWeight: 800, color: ft.color }}>{type}</span>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B' }}>{name}</span>
          {featured && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: '#7C3AED',
              background: '#F3F0FF', border: '1px solid #DDD6FE',
              borderRadius: 20, padding: '2px 8px',
            }}>Featured</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {subject && (
            <span style={{ color: sub.c, fontWeight: 600, marginRight: 6 }}>{subject}</span>
          )}
          {uploader && `Uploaded by ${uploader}`}
          {date && ` · ${date}`}
        </div>
      </div>

      {/* Size */}
      {size && (
        <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, flexShrink: 0, width: 70 }}>
          {size}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
          <Eye size={13} color="#9CA3AF" /> {views}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#6B7280' }}>
          <Download size={13} color="#9CA3AF" /> {downloads}
        </div>
        {onSave && (
          <button onClick={e => { e.stopPropagation(); onSave(id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Bookmark size={14} color={saved ? '#7C3AED' : '#D1D5DB'} fill={saved ? '#7C3AED' : 'none'} />
          </button>
        )}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <MoreVertical size={14} color="#D1D5DB" />
        </button>
      </div>
    </div>
  )
}