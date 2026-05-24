import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getUser, clearAuth } from '../../store/authStore'
import {
  UserCircle, Settings, HelpCircle, LogOut,
  ChevronDown, Star, Shield,
} from 'lucide-react'

/* ─── component ───────────────────────────────────────────── */

export default function ProfileDropdown() {
  const navigate = useNavigate()
  const user     = getUser()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const isTutor  = user?.role === 'tutor'
  const isAdmin  = user?.role === 'admin'
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const basePath = isAdmin ? '/admin' : isTutor ? '/tutor' : '/student'

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const MENU_ITEMS = [
    ...(!isAdmin ? [{ icon: UserCircle, label: 'My Profile', to: `${basePath}/profile` }] : []),
    { icon: Settings,   label: 'Settings',     to: `${basePath}/settings`      },
    { icon: HelpCircle, label: 'Help Center',  to: `${basePath}/help`          },
  ]

  return (
    <>
      <style>{`
        .pd-wrap { position: relative; font-family: 'DM Sans', sans-serif; }
        .pd-trigger {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; padding: 4px 8px; border-radius: 10px;
          transition: background .15s; border: none; background: none;
        }
        .pd-trigger:hover { background: #F8F9FB; }
        .pd-drop {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 220px; background: white;
          border: 1px solid #E5E7EB; border-radius: 14px;
          box-shadow: 0 8px 28px rgba(0,0,0,.10); z-index: 200;
          overflow: hidden; animation: pdIn .15s ease;
        }
        @keyframes pdIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
        .pd-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: #374151;
          transition: background .12s; text-decoration: none;
          border-bottom: 1px solid #F8F9FB;
        }
        .pd-item:last-child { border-bottom: none; }
        .pd-item:hover { background: #F8F9FB; color: #7C3AED; }
        .pd-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 16px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: #EF4444;
          transition: background .12s; border: none; background: none;
          width: 100%; text-align: left; font-family: 'DM Sans', sans-serif;
        }
        .pd-logout:hover { background: #FEF2F2; }
      `}</style>

      <div className="pd-wrap" ref={ref}>
        <button className="pd-trigger" onClick={() => setOpen(o => !o)}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#EDE9FE', border: '2px solid #DDD6FE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#7C3AED', flexShrink: 0,
          }}>
            {initials}
          </div>
          <ChevronDown
            size={14} color="#9CA3AF"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
          />
        </button>

        {open && (
          <div className="pd-drop">
            {/* User info header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: '#EDE9FE', border: '2px solid #DDD6FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, color: '#7C3AED', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'capitalize', marginTop: 1 }}>
                    {user?.role || 'student'}
                  </div>
                </div>
              </div>

              {/* Verified badge for tutors */}
              {isTutor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, background: '#F3F0FF', border: '1px solid #DDD6FE', borderRadius: 20, padding: '3px 10px', width: 'fit-content' }}>
                  <Shield size={11} color="#7C3AED" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>Verified Tutor</span>
                </div>
              )}
            </div>

            {/* Menu items */}
            {MENU_ITEMS.map(({ icon: Icon, label, to }) => (
              <Link key={to} to={to} className="pd-item" onClick={() => setOpen(false)}>
                <Icon size={15} color="#9CA3AF" /> {label}
              </Link>
            ))}

            {/* Logout */}
            <button className="pd-logout" onClick={handleLogout}>
              <LogOut size={15} color="#EF4444" /> Log Out
            </button>
          </div>
        )}
      </div>
    </>
  )
}