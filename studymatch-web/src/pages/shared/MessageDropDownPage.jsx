import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getConversations } from '../../api/chat'
import { getUser } from '../../store/authStore'
import { MessageSquare } from 'lucide-react'

/* ─── helpers ─────────────────────────────────────────────── */

function timeAgo(ts) {
  if (!ts) return ''
  const diff  = Date.now() - new Date(ts)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const COLORS = ['#7C3AED','#10B981','#6366F1','#F59E0B','#EC4899','#EF4444']
const getColor = (id) => COLORS[(id || 0) % COLORS.length]

function Avatar({ name = '', color = '#7C3AED', size = 36 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `2px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.32, color, flexShrink: 0,
      fontFamily: 'inherit',
    }}>
      {initials}
    </div>
  )
}

/* ─── component ───────────────────────────────────────────── */

export default function MessageDropdown() {
  const navigate  = useNavigate()
  const user      = getUser()
  const role      = user?.role || 'student'
  const msgPath   = role === 'tutor' ? '/tutor/messages' : '/student/messages'

  const [open,    setOpen]    = useState(false)
  const [convs,   setConvs]   = useState([])
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const totalUnread = convs.reduce((s, c) => s + (c.unread_count || 0), 0)

  const fetchConvs = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const res  = await getConversations()
      const data = res?.data || res || []
      setConvs(Array.isArray(data) ? data.slice(0, 6) : [])
    } catch {}
    finally { if (showLoader) setLoading(false) }
  }, [])

  // Load on mount so the badge shows immediately
  useEffect(() => { fetchConvs() }, [fetchConvs])

  // Background poll every 45s to keep badge fresh
  useEffect(() => {
    const id = setInterval(() => fetchConvs(), 45000)
    return () => clearInterval(id)
  }, [fetchConvs])

  // Reload with spinner when dropdown opens
  useEffect(() => {
    if (open) fetchConvs(true)
  }, [open, fetchConvs])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      <style>{`
        .md-wrap { position: relative; }
        .md-btn {
          position: relative; width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid #E5E7EB; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .15s;
        }
        .md-btn:hover { background: #F3F0FF; border-color: #DDD6FE; }
        .md-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 18px; height: 18px; border-radius: 10px;
          background: #7C3AED; color: white; font-size: 10px;
          font-weight: 800; display: flex; align-items: center;
          justify-content: center; padding: 0 4px; border: 2px solid white;
          font-family: 'DM Sans', sans-serif;
        }
        .md-drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 320px; background: white;
          border: 1px solid #E5E7EB; border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.12); z-index: 200;
          overflow: hidden; animation: mdIn .15s ease;
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes mdIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .md-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; cursor: pointer;
          border-bottom: 1px solid #F8F9FB; transition: background .12s;
        }
        .md-item:last-child { border-bottom: none; }
        .md-item:hover { background: #F8F9FB; }
      `}</style>

      <div className="md-wrap" ref={ref}>
        <button className="md-btn" onClick={() => setOpen(o => !o)}>
          <MessageSquare size={17} color={open ? '#7C3AED' : '#6B7280'} />
          {totalUnread > 0 && (
            <span className="md-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
          )}
        </button>

        {open && (
          <div className="md-drop">
            {/* Header */}
            <div style={{ padding: '14px 16px 10px', fontWeight: 800, fontSize: 15, color: '#1E1B4B', borderBottom: '1px solid #F0F0F4' }}>
              Messages
            </div>

            {/* Conversations */}
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading...</div>
              ) : convs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <MessageSquare size={28} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>No conversations yet</div>
                </div>
              ) : convs.map((c, i) => {
                const id     = c.partner_id || c.id || i
                const name   = c.partner_name || c.name || 'User'
                const last   = typeof (c.last_message || '') === 'string'
                  ? c.last_message
                  : c.last_message?.content || ''
                const unread = c.unread_count || 0
                const color  = getColor(id)
                return (
                  <div key={id} className="md-item"
                    onClick={() => { setOpen(false); navigate(msgPath) }}>
                    <Avatar name={name} color={color} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{name}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{timeAgo(c.last_message_at || c.updated_at)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{last || 'No messages yet'}</span>
                        {unread > 0 && (
                          <span style={{ background: '#7C3AED', color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #F0F0F4', padding: '10px 16px' }}>
              <button onClick={() => { setOpen(false); navigate(msgPath) }} style={{
                background: 'none', border: 'none', color: '#7C3AED',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                View all messages →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}