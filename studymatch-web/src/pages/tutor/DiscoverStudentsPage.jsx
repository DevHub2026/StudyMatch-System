import { useState, useEffect } from 'react'
import { sendMatchRequest } from '../../api/matchRequests'
import { getSubjects } from '../../api/subjects'
import {
  Search, UserPlus, BookOpen, Loader2, RefreshCw, X,
} from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

const COLORS = ['#7C3AED','#10B981','#6366F1','#F59E0B','#EC4899','#EF4444']
const getColor    = i => COLORS[i % COLORS.length]
const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

function Avatar({ name = '', color = '#7C3AED', size = 52 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.3, color, flexShrink: 0, fontFamily: 'inherit',
    }}>
      {getInitials(name)}
    </div>
  )
}

function StudentCard({ student, index, onRequest, requested, requesting }) {
  const color   = getColor(index)
  const name    = student.user?.name || student.name || 'Student'
  const program = student.program || student.user?.program || ''
  const year    = student.year_level || ''
  const subjects = (student.weak_subjects || student.student_weak_subjects || [])
    .map(s => s.subject?.name || '').filter(Boolean)

  return (
    <div style={{
      background: 'white', border: '1px solid #F0F0F4', borderRadius: 16,
      padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 18,
      fontFamily: "'DM Sans', sans-serif", transition: 'box-shadow .18s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <Avatar name={name} color={color} size={56} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 3 }}>{name}</div>
        {(program || year) && (
          <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 6 }}>
            {program}{program && year ? ' · ' : ''}{year ? `${year} Year` : ''}
          </div>
        )}
        {subjects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {subjects.slice(0, 5).map((s, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 20, background: '#F3F0FF',
                color: '#7C3AED', fontSize: 12, fontWeight: 600, border: '1px solid #DDD6FE',
              }}>
                {s}
              </span>
            ))}
            {subjects.length > 5 && (
              <span style={{ padding: '3px 10px', borderRadius: 20, background: '#F9FAFB', color: '#9CA3AF', fontSize: 12, fontWeight: 600, border: '1px solid #E5E7EB' }}>
                +{subjects.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        <button
          onClick={() => onRequest(String(student.user?.id || student.user_id || student.id))}
          disabled={requested || requesting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            background: requested ? '#F3F0FF' : '#7C3AED',
            color: requested ? '#7C3AED' : 'white',
            border: requested ? '1.5px solid #DDD6FE' : 'none',
            borderRadius: 9, fontSize: 13, fontWeight: 700,
            cursor: (requested || requesting) ? 'default' : 'pointer',
            fontFamily: 'inherit', opacity: requesting ? 0.7 : 1,
          }}
        >
          {requesting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={14} />}
          {requested ? 'Requested' : requesting ? 'Sending…' : 'Request'}
        </button>
      </div>
    </div>
  )
}

export default function DiscoverStudentsPage() {
  const [students,    setStudents]    = useState([])
  const [subjects,    setSubjects]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [requested,   setRequested]   = useState({})
  const [requesting,  setRequesting]  = useState({})

  const fetchStudents = async (filters = {}) => {
    setLoading(true); setError('')
    try {
      const params = {}
      if (filters.subject) params.subject = filters.subject
      if (filters.search)  params.search  = filters.search
      const res = await axiosInstance.get('/students/discover', { params }).catch(() => ({ data: [] }))
      const list = res?.data?.data || res?.data || []
      setStudents(Array.isArray(list) ? list : [])
    } catch {
      setError('Failed to load students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    getSubjects().then(res => {
      const list = res?.data || res || []
      setSubjects(Array.isArray(list) ? list : [])
    }).catch(() => {})
  }, [])

  const handleRequest = async (studentUserId) => {
    if (requested[studentUserId] || requesting[studentUserId]) return
    setRequesting(p => ({ ...p, [studentUserId]: true }))
    try {
      await sendMatchRequest(studentUserId)
      setRequested(p => ({ ...p, [studentUserId]: true }))
    } catch {}
    finally { setRequesting(p => ({ ...p, [studentUserId]: false })) }
  }

  const filtered = students.filter(s => {
    if (search) {
      const q    = search.toLowerCase()
      const name = (s.user?.name || s.name || '').toLowerCase()
      const prog = (s.program || '').toLowerCase()
      const subs = (s.weak_subjects || []).map(ws => (ws.subject?.name || '').toLowerCase()).filter(Boolean)
      if (!name.includes(q) && !prog.includes(q) && !subs.some(sub => sub.includes(q))) return false
    }
    if (subjectFilter) {
      const subs = (s.weak_subjects || []).map(ws => ws.subject?.name || '').filter(Boolean)
      if (!subs.some(sub => sub.toLowerCase() === subjectFilter.toLowerCase())) return false
    }
    return true
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ds-wrap * { box-sizing: border-box; }
        .ds-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .ds-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .ds-side { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ds-wrap">
        <div className="ds-main">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Find Students</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Discover students looking for tutoring help.</p>
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 16px' }}>
            <Search size={16} color="#9CA3AF" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, program…"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#374151' }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {subjectFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>Filtering by:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, background: '#F3F0FF', border: '1px solid #DDD6FE', color: '#7C3AED', fontSize: 13, fontWeight: 600 }}>
                {subjectFilter}
                <button onClick={() => setSubjectFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C3AED', display: 'flex', padding: 0 }}>
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          {!loading && (
            <div style={{ fontSize: 13.5, color: '#6B7280', fontWeight: 500 }}>
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {error && !loading && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 1, fontSize: 13.5, color: '#EF4444' }}>{error}</span>
              <button onClick={() => fetchStudents()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
              <BookOpen size={32} color="#DDD6FE" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No students found</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Try adjusting your filters or search terms.</div>
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((student, i) => (
                <StudentCard
                  key={student.id || i}
                  student={student} index={i}
                  onRequest={handleRequest}
                  requested={!!requested[String(student.user?.id || student.user_id || student.id)]}
                  requesting={!!requesting[String(student.user?.id || student.user_id || student.id)]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar filters */}
        <div className="ds-side">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Filter by Subject</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {subjects.map(s => {
                const active = subjectFilter === s.name
                return (
                  <button key={s.id} onClick={() => setSubjectFilter(active ? '' : s.name)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${active ? '#7C3AED' : '#E5E7EB'}`,
                      background: active ? '#F3F0FF' : 'white', color: active ? '#7C3AED' : '#374151',
                      fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                    {s.name}
                  </button>
                )
              })}
            </div>
            {subjectFilter && (
              <button onClick={() => setSubjectFilter('')} style={{ marginTop: 12, width: '100%', padding: '8px', background: 'white', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear Filter
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
