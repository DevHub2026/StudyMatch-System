import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPotentialPartners } from '../../api/partners'
import { sendMatchRequest } from '../../api/matchRequests'
import {
  Search, SlidersHorizontal, Star, MapPin,
  Clock, BookOpen, ChevronDown, UserPlus,
  Loader2, RefreshCw,
} from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────── */

function Avatar({ name = '', color = '#7C3AED', size = 52 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.3, color, flexShrink: 0,
      fontFamily: 'inherit',
    }}>
      {initials}
    </div>
  )
}

const AVATAR_COLORS = ['#7C3AED','#10B981','#6366F1','#F59E0B','#EC4899','#EF4444']
const getColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length]

function Stars({ rating = 0 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} color="#F59E0B" fill={i <= Math.round(rating) ? '#F59E0B' : 'none'} />
      ))}
    </div>
  )
}

/* ─── tutor card ──────────────────────────────────────────── */

function TutorCard({ tutor, index, onRequest, requested }) {
  const color = getColor(index)
  const name  = tutor.user?.name || tutor.name || 'Unknown'
  const dept  = tutor.department || tutor.course || tutor.user?.department || ''
  const rating = parseFloat(tutor.average_rating || tutor.rating || 0)
  const reviews = tutor.reviews_count || tutor.total_reviews || 0
  const subjects = tutor.strong_subjects
    ? tutor.strong_subjects.map(s => s.subject?.name || '').filter(Boolean)
    : (tutor.subjects || [])
  const availability = tutor.availability || ''
  const bio   = tutor.bio || tutor.about || tutor.user?.bio || ''
  const price = tutor.price_per_session || tutor.hourly_rate || ''

  return (
    <div style={{
      background: 'white', border: '1px solid #F0F0F4',
      borderRadius: 16, padding: '20px 22px',
      display: 'flex', alignItems: 'center', gap: 18,
      transition: 'box-shadow .18s',
      fontFamily: "'DM Sans', sans-serif",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Avatar */}
      <Avatar name={name} color={color} size={56} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 3 }}>{name}</div>
        {dept && <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 6 }}>{dept}</div>}

        {/* Rating */}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Stars rating={rating} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1E1B4B' }}>{rating.toFixed(1)}</span>
            {reviews > 0 && <span style={{ fontSize: 12, color: '#9CA3AF' }}>({reviews} reviews)</span>}
          </div>
        )}

        {/* Subjects */}
        {subjects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {subjects.slice(0, 4).map((s, i) => (
              <span key={i} style={{
                padding: '3px 10px', borderRadius: 20,
                background: '#F3F0FF', color: '#7C3AED',
                fontSize: 12, fontWeight: 600, border: '1px solid #DDD6FE',
              }}>
                {typeof s === 'object' ? s.name || s.subject : s}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>
            {bio}
          </div>
        )}
      </div>

      {/* Right: price + availability + action */}
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        {price && (
          <div style={{ fontSize: 15, fontWeight: 800, color: '#7C3AED' }}>
            ₱{price}<span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}>/session</span>
          </div>
        )}
        {availability && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#6B7280' }}>
            <Clock size={12} color="#7C3AED" /> {availability}
          </div>
        )}
        <button
          onClick={() => onRequest(tutor.user?.id || tutor.user_id)}
          disabled={requested}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px',
            background: requested ? '#F3F0FF' : '#7C3AED',
            color: requested ? '#7C3AED' : 'white',
            border: requested ? '1.5px solid #DDD6FE' : 'none',
            borderRadius: 9, fontSize: 13, fontWeight: 700,
            cursor: requested ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'all .15s',
          }}
        >
          <UserPlus size={14} />
          {requested ? 'Requested' : 'Send Request'}
        </button>
      </div>
    </div>
  )
}

/* ─── main page ───────────────────────────────────────────── */

export default function FindTutorsPage() {
  const [tutors,    setTutors]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [dept,      setDept]      = useState('')
  const [style,     setStyle]     = useState('')
  const [requested, setRequested] = useState({})
  const [requesting,setRequesting]= useState({})

  const fetchTutors = async (filters = {}) => {
    setLoading(true)
    setError('')
    try {
      const res  = await getPotentialPartners(filters)
      const list = res?.data?.data || res?.data || res || []
      setTutors(Array.isArray(list) ? list : [])
    } catch (err) {
      setError('Failed to load tutors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTutors() }, [])

  const handleFilter = () => {
    fetchTutors({ department: dept, studyStyle: style })
  }

  const handleRequest = async (tutorId) => {
    if (requested[tutorId] || requesting[tutorId]) return
    setRequesting(p => ({ ...p, [tutorId]: true }))
    try {
      await sendMatchRequest(tutorId)
      setRequested(p => ({ ...p, [tutorId]: true }))
    } catch {
      // silently fail — could show toast here
    } finally {
      setRequesting(p => ({ ...p, [tutorId]: false }))
    }
  }

  const filtered = tutors.filter(t => {
    const name = t.user?.name || t.name || ''
    const dept = t.department || t.course || t.user?.department || ''
    return !search || name.toLowerCase().includes(search.toLowerCase()) || dept.toLowerCase().includes(search.toLowerCase())
  })

  const DEPTS  = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology', 'Engineering']
  const STYLES = ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Group', 'Solo']

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ft-wrap * { box-sizing: border-box; }
        .ft-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .ft-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .ft-sidebar { width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .ft-select {
          width: 100%; padding: 9px 12px; border: 1.5px solid #E5E7EB;
          border-radius: 10px; font-size: 13.5px; color: #374151;
          outline: none; font-family: 'DM Sans', sans-serif;
          background: white; cursor: pointer; transition: border-color .15s;
          appearance: none;
        }
        .ft-select:focus { border-color: #7C3AED; }
      `}</style>

      <div className="ft-wrap">
        <div className="ft-main">

          {/* Header */}
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Find Tutors</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Discover and connect with qualified tutors.</p>
          </div>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', border: '1.5px solid #E5E7EB',
            borderRadius: 12, padding: '10px 16px',
          }}>
            <Search size={16} color="#9CA3AF" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, department..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#374151' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <div style={{ fontSize: 13.5, color: '#6B7280', fontWeight: 500 }}>
              {filtered.length} tutor{filtered.length !== 1 ? 's' : ''} found
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13.5, color: '#EF4444' }}>{error}</span>
              <button onClick={() => fetchTutors()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
              <BookOpen size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No tutors found</div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Try adjusting your filters or search terms.</div>
            </div>
          )}

          {/* Tutor list */}
          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((tutor, i) => (
                <TutorCard
                  key={tutor.id || tutor.user_id || i}
                  tutor={tutor} index={i}
                  onRequest={handleRequest}
                  requested={!!requested[tutor.user?.id || tutor.user_id]}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Sidebar filters ── */}
        <div className="ft-sidebar">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <SlidersHorizontal size={16} color="#7C3AED" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Filters</span>
            </div>

            {/* Department */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Department</label>
              <div style={{ position: 'relative' }}>
                <select className="ft-select" value={dept} onChange={e => setDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={13} color="#9CA3AF" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Study Style */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>Study Style</label>
              <div style={{ position: 'relative' }}>
                <select className="ft-select" value={style} onChange={e => setStyle(e.target.value)}>
                  <option value="">All Styles</option>
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={13} color="#9CA3AF" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>

            <button onClick={handleFilter} style={{
              width: '100%', padding: '11px', background: '#7C3AED',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
              onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
            >
              Apply Filters
            </button>

            {(dept || style) && (
              <button onClick={() => { setDept(''); setStyle(''); fetchTutors() }} style={{
                width: '100%', padding: '9px', marginTop: 8,
                background: 'white', color: '#6B7280',
                border: '1px solid #E5E7EB', borderRadius: 10,
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Clear Filters
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 14 }}>Quick Stats</div>
            {[
              { label: 'Total Tutors', value: tutors.length, color: '#7C3AED' },
              { label: 'Requests Sent', value: Object.keys(requested).length, color: '#10B981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8F9FB' }}>
                <span style={{ fontSize: 13.5, color: '#6B7280' }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}