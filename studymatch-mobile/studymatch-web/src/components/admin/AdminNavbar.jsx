import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bell, ChevronDown, Settings, LogOut, User } from 'lucide-react'
import { getUser } from '../../store/authStore'
import NotificationDropdown from '../../pages/shared/NotificationDropDownPage'

/* ─── mock notifications ─────────────────────────────────────── */
const MOCK_NOTIFS = [
  { id: 1, text: 'New tutor verification request',   time: '2m ago',  unread: true  },
  { id: 2, text: '5 new reports submitted',          time: '1h ago',  unread: true  },
  { id: 3, text: 'Platform maintenance scheduled',   time: '3h ago',  unread: true  },
  { id: 4, text: 'New user registrations: 124 today',time: '5h ago',  unread: false },
  { id: 5, text: 'Weekly report is ready',           time: '1d ago',  unread: false },
]

export default function AdminNavbar() {
  const user        = getUser()
  const navigate    = useNavigate()
  const [notifOpen, setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifs, setNotifs]         = useState(MOCK_NOTIFS)
  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifs.filter(n => n.unread).length

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, unread: false })))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .an-bar * { box-sizing: border-box; }
        .an-bar {
          height: 60px; background: white;
          border-bottom: 1px solid #E5E7EB;
          display: flex; align-items: center;
          padding: 0 28px; justify-content: flex-end;
          gap: 16px; font-family: 'DM Sans', sans-serif;
          position: sticky; top: 0; z-index: 30;
        }

        .an-bell-btn {
          position: relative; width: 38px; height: 38px;
          border-radius: 10px; border: 1px solid #E5E7EB;
          background: white; display: flex; align-items: center;
          justify-content: center; cursor: pointer;
          transition: background .15s;
        }
        .an-bell-btn:hover { background: #F3F0FF; border-color: #DDD6FE; }

        .an-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 18px; height: 18px; border-radius: 10px;
          background: #7C3AED; color: white; font-size: 10px;
          font-weight: 800; display: flex; align-items: center;
          justify-content: center; padding: 0 4px;
          border: 2px solid white; font-family: 'DM Sans', sans-serif;
        }

        /* notification dropdown */
        .an-notif-drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 340px; background: white;
          border: 1px solid #E5E7EB; border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.12); z-index: 200;
          overflow: hidden;
          animation: anIn .15s ease;
        }
        .an-notif-drop::before {
          content: ''; position: absolute; top: -7px; right: 14px;
          width: 14px; height: 14px; background: white;
          border-left: 1px solid #E5E7EB; border-top: 1px solid #E5E7EB;
          transform: rotate(45deg); border-radius: 2px;
        }

        /* profile dropdown */
        .an-profile-drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 200px; background: white;
          border: 1px solid #E5E7EB; border-radius: 14px;
          box-shadow: 0 8px 28px rgba(0,0,0,.10); z-index: 200;
          overflow: hidden;
          animation: anIn .15s ease;
        }

        @keyframes anIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .an-notif-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; cursor: pointer;
          border-bottom: 1px solid #F8F9FB;
          transition: background .12s;
        }
        .an-notif-row:last-child { border-bottom: none; }
        .an-notif-row:hover { background: #F8F9FB; }
        .an-notif-row.unread { background: #FAFAFF; }

        .an-profile-row {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: #374151;
          transition: background .12s; text-decoration: none;
          border-bottom: 1px solid #F8F9FB;
        }
        .an-profile-row:last-child { border-bottom: none; }
        .an-profile-row:hover { background: #F8F9FB; }
      `}</style>

      <header className="an-bar">

        {/* Notification bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="an-bell-btn" onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}>
            <Bell size={17} color={notifOpen ? '#7C3AED' : '#6B7280'} />
            {unreadCount > 0 && (
              <span className="an-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="an-notif-drop">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifs.map(n => (
                  <div key={n.id} className={`an-notif-row${n.unread ? ' unread' : ''}`}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: n.unread ? '#7C3AED' : 'transparent',
                      flexShrink: 0, marginTop: 5,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: n.unread ? 700 : 500, color: '#1E1B4B', lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 10, transition: 'background .15s' }}
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
            onMouseEnter={e => e.currentTarget.style.background = '#F8F9FB'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1E1B4B', lineHeight: 1.2 }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>Super Administrator</div>
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: '#F3F4F6', border: '2px solid #E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#6B7280', flexShrink: 0,
            }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <ChevronDown size={14} color="#9CA3AF"
              style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </div>

          {profileOpen && (
            <div className="an-profile-drop">
              <Link to="/admin/settings" className="an-profile-row" onClick={() => setProfileOpen(false)}>
                <Settings size={15} color="#6B7280" /> Settings
              </Link>
              <button className="an-profile-row" onClick={handleLogout}
                style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', color: '#EF4444', fontFamily: 'inherit' }}>
                <LogOut size={15} color="#EF4444" /> Log Out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  )
}