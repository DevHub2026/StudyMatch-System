import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications'
import { Bell, MessageSquare, Calendar, Megaphone, UserCheck, CheckCheck } from 'lucide-react'

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

function getIcon(notif) {
  const t = (notif.type || '').toLowerCase()
  if (t.includes('message'))      return { Icon: MessageSquare, color: '#7C3AED', bg: '#F3F0FF' }
  if (t.includes('session'))      return { Icon: Calendar,      color: '#10B981', bg: '#F0FDF4' }
  if (t.includes('announcement')) return { Icon: Megaphone,     color: '#F59E0B', bg: '#FFFBEB' }
  if (t.includes('match'))        return { Icon: UserCheck,     color: '#6366F1', bg: '#EEF2FF' }
  return { Icon: Bell, color: '#6B7280', bg: '#F9FAFB' }
}

/* ─── component ───────────────────────────────────────────── */

export default function NotificationDropdown() {
  const navigate   = useNavigate()
  const [open,     setOpen]     = useState(false)
  const [notifs,   setNotifs]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const ref = useRef(null)

  const unread = notifs.filter(n => !n.is_read && !n.read_at).length

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load on open
  useEffect(() => {
    if (!open) return
    const load = async () => {
      setLoading(true)
      try {
        const res  = await getNotifications()
        const data = res?.data || res || []
        setNotifs(Array.isArray(data) ? data.slice(0, 10) : [])
      } catch {}
      finally { setLoading(false) }
    }
    load()
  }, [open])

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      setNotifs(p => p.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  return (
    <>
      <style>{`
        .nd-wrap { position: relative; }
        .nd-btn {
          position: relative; width: 38px; height: 38px; border-radius: 10px;
          border: 1px solid #E5E7EB; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .15s;
        }
        .nd-btn:hover { background: #F3F0FF; border-color: #DDD6FE; }
        .nd-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 18px; height: 18px; border-radius: 10px;
          background: #7C3AED; color: white; font-size: 10px;
          font-weight: 800; display: flex; align-items: center;
          justify-content: center; padding: 0 4px; border: 2px solid white;
          font-family: 'DM Sans', sans-serif;
        }
        .nd-drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px; background: white;
          border: 1px solid #E5E7EB; border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.12); z-index: 200;
          overflow: hidden; animation: ndIn .15s ease;
          font-family: 'DM Sans', sans-serif;
        }
        @keyframes ndIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .nd-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; cursor: pointer;
          border-bottom: 1px solid #F8F9FB; transition: background .12s;
        }
        .nd-item:last-child { border-bottom: none; }
        .nd-item:hover { background: #F8F9FB; }
        .nd-item.unread { background: #FAFAFF; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="nd-wrap" ref={ref}>
        <button className="nd-btn" onClick={() => setOpen(o => !o)}>
          <Bell size={17} color={open ? '#7C3AED' : '#6B7280'} />
          {unread > 0 && (
            <span className="nd-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>

        {open && (
          <div className="nd-drop">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>Notifications</span>
              {unread > 0 && (
                <button onClick={handleMarkAll} style={{
                  background: 'none', border: 'none', color: '#7C3AED',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: 'inherit',
                }}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  Loading...
                </div>
              ) : notifs.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <Bell size={28} color="#DDD6FE" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>No notifications yet</div>
                </div>
              ) : notifs.map(n => {
                const { Icon, color, bg } = getIcon(n)
                const isUnread = !n.is_read && !n.read_at
                const msg = n.message || n.data?.message || n.title || 'New notification'
                return (
                  <div key={n.id} className={`nd-item${isUnread ? ' unread' : ''}`}
                    onClick={() => { isUnread && handleMarkRead(n.id) }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isUnread ? 700 : 500, color: '#1E1B4B', lineHeight: 1.4 }}>{msg}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                    </div>
                    {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #F0F0F4', padding: '10px 16px' }}>
              <button onClick={() => { setOpen(false); navigate('/student/notifications') }} style={{
                background: 'none', border: 'none', color: '#7C3AED',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'inherit',
              }}>
                View all notifications →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}