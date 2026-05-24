import { useState, useEffect } from 'react'
import { getAnnouncements } from '../../api/announcements'
import { Megaphone, Loader2, RefreshCw, Calendar } from 'lucide-react'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff  = Date.now() - new Date(ts)
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor(diff / 60000)
  if (days  > 0)  return `${days}d ago`
  if (hours > 0)  return `${hours}h ago`
  if (mins  > 0)  return `${mins}m ago`
  return 'Just now'
}

const TYPE_MAP = {
  update:      { color: '#7C3AED', bg: '#F3F0FF', label: 'Update'      },
  maintenance: { color: '#F59E0B', bg: '#FFFBEB', label: 'Maintenance' },
  feature:     { color: '#10B981', bg: '#F0FDF4', label: 'New Feature' },
  important:   { color: '#EF4444', bg: '#FEF2F2', label: 'Important'   },
  general:     { color: '#6366F1', bg: '#EEF2FF', label: 'General'     },
}

function getType(ann) {
  const t = (ann.type || ann.category || 'general').toLowerCase()
  return TYPE_MAP[t] || TYPE_MAP.general
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')

  const fetchAnnouncements = async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await getAnnouncements()
      const data = res?.data || res || []
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const filtered = announcements.filter(a => {
    const title = a.title   || ''
    const msg   = a.message || a.content || ''
    return !search ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      msg.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ap-wrap * { box-sizing: border-box; }
        .ap-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; flex-direction: column; gap: 20px; max-width: 720px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="ap-wrap">
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Announcements</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Stay updated with the latest platform news.</p>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', border: '1.5px solid #E5E7EB',
          borderRadius: 12, padding: '10px 16px',
        }}>
          <Megaphone size={16} color="#9CA3AF" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search announcements..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#374151' }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={28} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13.5, color: '#EF4444', flex: 1 }}>{error}</span>
            <button onClick={fetchAnnouncements} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ background: '#F8F9FB', border: '1px dashed #DDD6FE', borderRadius: 14, padding: '48px 20px', textAlign: 'center' }}>
            <Megaphone size={32} color="#DDD6FE" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 6 }}>No announcements</div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>
              {announcements.length === 0 ? 'No announcements yet.' : 'No results match your search.'}
            </div>
          </div>
        )}

        {/* Announcement list */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((a, i) => {
              const { color, bg, label } = getType(a)
              const title   = a.title   || 'Announcement'
              const message = a.message || a.content || ''
              const date    = formatDate(a.created_at || a.published_at)
              const ago     = timeAgo(a.created_at || a.published_at)

              return (
                <div key={a.id || i} style={{
                  background: 'white', border: '1px solid #F0F0F4',
                  borderRadius: 16, padding: '20px 22px',
                  borderLeft: `4px solid ${color}`,
                  transition: 'box-shadow .18s',
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Megaphone size={16} color={color} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1E1B4B', marginBottom: 3 }}>{title}</div>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color, background: bg, borderRadius: 20, padding: '2px 9px' }}>
                          {label}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500 }}>{date}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{ago}</div>
                    </div>
                  </div>
                  {message && (
                    <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>{message}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}