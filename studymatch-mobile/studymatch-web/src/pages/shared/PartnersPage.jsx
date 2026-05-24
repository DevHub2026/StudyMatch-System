import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMatchRequests } from '../../api/matchRequests'
import { getUser } from '../../store/authStore'
import {
  Search, SlidersHorizontal, ArrowRight, BookOpen,
  Calendar, Target, RefreshCw, Lightbulb,
  User, Activity, Clock, ChevronDown, MessageSquare,
} from 'lucide-react'

const Avatar = ({ name, size = 48 }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const colors   = ['#7c5cfa','#10B981','#EC4899','#F59E0B','#6366F1','#EF4444']
  const color    = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2.5px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

const DAY_LABELS = ['M','T','W','T','F','S','S']

export default function PartnersPage() {
  const user = getUser()
  const isTutor = user?.role === 'tutor'

  const [partners,  setPartners]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); setError('')
      try {
        const res      = await getMatchRequests()
        const sent     = res?.data?.sent     || []
        const received = res?.data?.received || []

        const fromSent = sent
          .filter(r => r.status === 'accepted')
          .map(r => ({
            id:       r.id,
            name:     r.tutor?.user?.name     || 'Tutor',
            role:     'tutor',
            subject:  r.subject?.name         || '',
            message:  r.message               || '',
            date:     r.accepted_at || r.created_at,
            userId:   r.tutor?.user?.id,
          }))

        const fromReceived = received
          .filter(r => r.status === 'accepted')
          .map(r => ({
            id:       r.id,
            name:     r.student?.user?.name   || 'Student',
            role:     'student',
            subject:  r.subject?.name         || '',
            message:  r.message               || '',
            date:     r.accepted_at || r.created_at,
            userId:   r.student?.user?.id,
          }))

        setPartners([...fromSent, ...fromReceived])
      } catch {
        setError('Failed to load matches. Please try again.')
      } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const filtered = partners.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subject.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || p.role === roleFilter
    return matchesSearch && matchesRole
  })

  const formattedDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .pm-root { font-family:'Poppins',sans-serif; color:#ddd8ff; display:flex; gap:24px; }
        .pm-main { flex:1; min-width:0; display:flex; flex-direction:column; gap:20px; }
        .pm-sidebar { width:260px; flex-shrink:0; display:flex; flex-direction:column; gap:16px; }
        .pm-card {
          background:rgba(255,255,255,0.03); border:1px solid rgba(120,90,240,0.14);
          border-radius:16px; padding:20px; display:flex; align-items:flex-start;
          gap:16px; transition:all 0.2s;
        }
        .pm-card:hover { border-color:rgba(124,92,250,0.3); background:rgba(124,92,250,0.04); }
        .pm-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:48px 20px; text-align:center; background:rgba(255,255,255,0.02); border:1px dashed rgba(120,90,240,0.15); border-radius:16px; }
        .pm-empty-icon { width:56px; height:56px; border-radius:16px; background:rgba(124,92,250,0.08); display:flex; align-items:center; justify-content:center; color:rgba(124,92,250,0.4); }
        .pm-sidebar-card { background:rgba(255,255,255,0.03); border:1px solid rgba(120,90,240,0.14); border-radius:16px; padding:18px; }
        .pm-sidebar-title { font-size:13px; font-weight:700; color:#eae6ff; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .pm-tip { display:flex; align-items:flex-start; gap:10px; padding:10px; border-radius:10px; transition:background 0.2s; }
        .pm-tip:hover { background:rgba(124,92,250,0.06); }
        .pm-tip-icon { width:32px; height:32px; border-radius:9px; background:rgba(124,92,250,0.12); display:flex; align-items:center; justify-content:center; color:#a78bfa; flex-shrink:0; }
        .pm-tip-title { font-size:12px; font-weight:600; color:#ddd8ff; margin-bottom:2px; }
        .pm-tip-sub { font-size:11px; color:rgba(255,255,255,0.28); line-height:1.4; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Page heading */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#eae6ff', marginBottom: 4 }}>My Matches</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Your accepted study connections</p>
      </div>

      <div className="pm-root">
        <div className="pm-main">

          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(124,92,250,0.35) 0%,rgba(87,56,208,0.2) 60%,rgba(124,92,250,0.05) 100%)',
            border: '1px solid rgba(124,92,250,0.25)', borderRadius: 20, padding: '28px 32px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                Your study connections
                <span style={{ color: '#a78bfa', display: 'block' }}>are growing!</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18, maxWidth: 300 }}>
                You have {partners.length} accepted match{partners.length !== 1 ? 'es' : ''} ready to collaborate with.
              </div>
              <Link to={isTutor ? '/tutor/find-students' : '/student/find-tutors'} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10, background: '#7c5cfa',
                color: '#fff', fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}>
                {isTutor ? 'View Student Requests' : 'Find More Tutors'} <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,250,0.25) 0%,transparent 70%)', pointerEvents: 'none' }} />
          </div>

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(120,90,240,0.18)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <Search size={15} color="rgba(255,255,255,0.3)" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or subject…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 13.5, color: '#ddd8ff', fontFamily: 'inherit',
                }}
              />
            </div>
            {['all','tutor','student'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                background: roleFilter === r ? '#7c5cfa' : 'rgba(255,255,255,0.05)',
                color:      roleFilter === r ? '#fff'    : 'rgba(255,255,255,0.4)',
              }}>
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
              </button>
            ))}
          </div>

          {/* Count */}
          {!loading && !error && (
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              {filtered.length} match{filtered.length !== 1 ? 'es' : ''} found
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(124,92,250,0.3)', borderTopColor: '#7c5cfa', animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 13, color: '#FCA5A5', flex: 1 }}>{error}</span>
              <button onClick={() => window.location.reload()} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                color: '#FCA5A5', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {/* Partners list */}
          {!loading && !error && (
            filtered.length === 0 ? (
              <div className="pm-empty">
                <div className="pm-empty-icon"><Search size={24} /></div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
                  {partners.length === 0 ? 'No matches yet' : 'No matches found'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
                  {partners.length === 0
                    ? (isTutor ? 'Accept student requests to see your matches here.' : 'Send a request to a tutor to get started.')
                    : 'Try adjusting your filters.'}
                </div>
                {partners.length === 0 && (
                  <Link to={isTutor ? '/tutor/find-students' : '/student/find-tutors'} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', background: '#7c5cfa', border: 'none',
                    borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', marginTop: 4,
                  }}>
                    {isTutor ? 'View Requests' : 'Find Tutors'} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map((p) => (
                  <div key={p.id} className="pm-card">
                    <Avatar name={p.name} size={52} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#eae6ff' }}>{p.name}</span>
                        <span style={{
                          padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: p.role === 'tutor' ? 'rgba(124,92,250,0.15)' : 'rgba(16,185,129,0.15)',
                          color:      p.role === 'tutor' ? '#a78bfa'               : '#34D399',
                          border:     `1px solid ${p.role === 'tutor' ? 'rgba(124,92,250,0.25)' : 'rgba(16,185,129,0.25)'}`,
                          textTransform: 'capitalize',
                        }}>
                          {p.role}
                        </span>
                      </div>

                      {p.subject && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                          <BookOpen size={12} /> {p.subject}
                        </div>
                      )}

                      {p.message && (
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 8,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          "{p.message}"
                        </div>
                      )}

                      {p.date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgba(255,255,255,0.2)' }}>
                          <Calendar size={11} /> Matched {formattedDate(p.date)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                      <Link
                        to={isTutor ? '/tutor/messages' : '/student/messages'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 16px', background: '#7c5cfa', border: 'none',
                          borderRadius: 9, color: '#fff', fontSize: 12.5, fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <MessageSquare size={13} /> Message
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="pm-sidebar">
          <div className="pm-sidebar-card">
            <div className="pm-sidebar-title">
              <SlidersHorizontal size={14} color="#7c5cfa" /> Summary
            </div>
            {[
              { label: 'Total Matches',  value: partners.length,                        color: '#7c5cfa' },
              { label: 'Tutors',         value: partners.filter(p=>p.role==='tutor').length,   color: '#a78bfa' },
              { label: 'Students',       value: partners.filter(p=>p.role==='student').length, color: '#34D399' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(120,90,240,0.1)' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="pm-sidebar-card">
            <div className="pm-sidebar-title">
              <Lightbulb size={14} color="#7c5cfa" /> Tips
            </div>
            {[
              { icon: User,     title: 'Complete your profile',  sub: 'A complete profile gets more matches' },
              { icon: Activity, title: 'Stay active',            sub: 'Respond to messages promptly'        },
              { icon: Clock,    title: 'Be consistent',          sub: 'Regular sessions build better results' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="pm-tip">
                <div className="pm-tip-icon"><Icon size={14} /></div>
                <div>
                  <div className="pm-tip-title">{title}</div>
                  <div className="pm-tip-sub">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
