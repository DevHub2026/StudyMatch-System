import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getUser } from '../../../store/authStore'
import { getConversations } from '../../../api/chat'
import logo from '../../../assets/logo.png'
import {
  LayoutDashboard, Users, CalendarDays, MessageCircle,
  Library, UserCircle, Settings, HelpCircle,
  ChevronDown, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Trophy, Shield,
} from 'lucide-react'

/* ─── nav config ─────────────────────────────────────────────── */

const NAV_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/tutor/dashboard'      },
  { icon: Users,           label: 'Find Students', to: '/tutor/find-students'  },
  { icon: CalendarDays,    label: 'Study Sessions',to: '/tutor/study-sessions' },
  { icon: MessageCircle,   label: 'Messages',      to: '/tutor/messages', badge: true },
  { icon: Library,         label: 'Resources',     to: '/tutor/resources'      },
  { icon: CalendarDays,    label: 'My Schedule',   to: '/tutor/schedule'       },
  { icon: UserCircle,      label: 'My Profile',    to: '/tutor/profile'        },
]

const SETTINGS_LINKS = [
  { label: 'Account Settings',      to: '/tutor/settings'               },
  { label: 'Notification Settings', to: '/tutor/settings/notifications'  },
  { label: 'Privacy & Security',    to: '/tutor/settings/privacy'        },
  { label: 'Preferences',           to: '/tutor/settings/preferences'    },
  { label: 'Appearance',            to: '/tutor/settings/appearance'     },
]

/* ─── component ──────────────────────────────────────────────── */

export default function TutorSidebar() {
  const location = useLocation()
  const user     = getUser()

  const [collapsed,    setCollapsed]    = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(location.pathname.startsWith('/tutor/settings'))
  const [unreadCount,  setUnreadCount]  = useState(0)

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'TT'

  const isActive = (to) =>
    to === '/tutor/dashboard'
      ? location.pathname === to
      : location.pathname.startsWith(to)

  // Real unread count from API
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await getConversations()
        const data = res?.data || res || []
        const total = Array.isArray(data)
          ? data.reduce((s, c) => s + (c.unread_count || 0), 0)
          : 0
        setUnreadCount(total)
      } catch {}
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ts-bar * { box-sizing: border-box; }
        .ts-bar {
          flex-shrink: 0; background: white;
          border-right: 1px solid #F0F0F4;
          display: flex; flex-direction: column;
          height: 100vh; position: sticky; top: 0;
          overflow: hidden; font-family: 'DM Sans', sans-serif;
          transition: width .22s cubic-bezier(.4,0,.2,1);
        }
        .ts-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 8px; margin-bottom: 2px;
          cursor: pointer; text-decoration: none;
          font-size: 13.5px; font-weight: 500; color: #6B7280;
          transition: all .15s; white-space: nowrap; overflow: hidden;
          position: relative;
        }
        .ts-link:hover  { background: #F3F0FF; color: #7C3AED; }
        .ts-link.active { background: #F3F0FF; color: #7C3AED; font-weight: 600; }
        .ts-sub {
          padding: 7px 10px 7px 36px; font-size: 12.5px; color: #6B7280;
          cursor: pointer; border-radius: 6px; font-weight: 500;
          text-decoration: none; display: block; transition: all .15s;
          white-space: nowrap; overflow: hidden;
        }
        .ts-sub:hover  { background: #F3F0FF; color: #7C3AED; }
        .ts-sub.active { color: #7C3AED; font-weight: 600; }
        .ts-tooltip {
          position: fixed; left: 80px;
          background: #1E1B4B; color: white; font-size: 12px;
          font-weight: 600; padding: 5px 10px; border-radius: 7px;
          white-space: nowrap; pointer-events: none; opacity: 0;
          transition: opacity .15s; z-index: 9999;
        }
        .ts-link-wrap { position: relative; display: block; }
        .ts-link-wrap:hover .ts-tooltip { opacity: 1; }
      `}</style>

      <aside className="ts-bar" style={{ width: collapsed ? 64 : 220 }}>

        {/* ── Logo + collapse row ── */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: collapsed ? '0 12px' : '0 16px',
          borderBottom: '1px solid #F0F0F4', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <img src={logo} alt="StudyMatch" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontWeight: 800, fontSize: 17, color: '#1E1B4B', whiteSpace: 'nowrap' }}>
                Study<span style={{ color: '#7C3AED' }}>Match</span>
              </span>
            )}
          </div>
          <button onClick={() => setCollapsed(c => !c)}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F0FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'white'}
          >
            {collapsed ? <PanelLeftOpen size={14} color="#7C3AED" /> : <PanelLeftClose size={14} color="#7C3AED" />}
          </button>
        </div>

        {/* ── User card ── */}
        <div style={{
          padding: collapsed ? '12px 8px' : '14px 16px',
          margin: '8px 10px',
          background: '#F8F9FB', borderRadius: 12,
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE9FE', border: '2px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#7C3AED' }}>
              {initials}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#22C55E', border: '2px solid white' }} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                {user?.name || 'Tutor'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Shield size={11} color="#7C3AED" />
                <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>Verified Tutor</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Nav links ── */}
        <nav style={{ flex: 1, padding: '4px 10px', overflowY: 'auto' }}>
          {NAV_LINKS.map(({ icon: Icon, label, to, badge }) => (
            <div key={to} className="ts-link-wrap">
              <Link
                to={to}
                className={`ts-link${isActive(to) ? ' active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <Icon size={17} color={isActive(to) ? '#7C3AED' : '#9CA3AF'} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge && unreadCount > 0 && (
                      <span style={{ background: '#7C3AED', color: 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10.5, fontWeight: 800 }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge && unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#7C3AED' }} />
                )}
              </Link>
              {collapsed && (
                <span className="ts-tooltip">
                  {label}{badge && unreadCount > 0 ? ` (${unreadCount})` : ''}
                </span>
              )}
            </div>
          ))}

          {/* Settings expanded */}
          {!collapsed && (
            <div>
              <div
                className={`ts-link${location.pathname.startsWith('/tutor/settings') ? ' active' : ''}`}
                onClick={() => setSettingsOpen(o => !o)}
                style={{ userSelect: 'none' }}
              >
                <Settings size={17} color={location.pathname.startsWith('/tutor/settings') ? '#7C3AED' : '#9CA3AF'} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>Settings</span>
                <ChevronDown size={14} color="#9CA3AF" style={{ transform: settingsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </div>
              {settingsOpen && (
                <div>
                  {SETTINGS_LINKS.map(({ label, to }) => (
                    <Link key={to} to={to} className={`ts-sub${location.pathname === to ? ' active' : ''}`}>{label}</Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings icon collapsed */}
          {collapsed && (
            <div className="ts-link-wrap">
              <Link to="/tutor/settings" className={`ts-link${location.pathname.startsWith('/tutor/settings') ? ' active' : ''}`} style={{ justifyContent: 'center' }}>
                <Settings size={17} color={location.pathname.startsWith('/tutor/settings') ? '#7C3AED' : '#9CA3AF'} />
              </Link>
              <span className="ts-tooltip">Settings</span>
            </div>
          )}
        </nav>

        {/* ── Become a Top Tutor card ── */}
        {!collapsed ? (
          <div style={{ padding: '8px 10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Trophy size={15} color="white" />
                <span style={{ fontWeight: 700, fontSize: 12.5, color: 'white' }}>Become a Top Tutor</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 10 }}>
                Help more students, build connections, and grow your impact.
              </div>
              <button style={{ width: '100%', padding: '7px', background: 'white', color: '#7C3AED', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                View Progress →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '8px 0 4px', display: 'flex', justifyContent: 'center' }}>
            <div className="ts-link-wrap">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trophy size={17} color="white" />
              </div>
              <span className="ts-tooltip">Become a Top Tutor</span>
            </div>
          </div>
        )}

        {/* ── Help ── */}
        {!collapsed ? (
          <div style={{ padding: '8px 10px 16px' }}>
            <Link to="/tutor/help" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F3F0FF', borderRadius: 12, padding: '11px 14px', textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#EDE9FE'}
              onMouseLeave={e => e.currentTarget.style.background = '#F3F0FF'}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7C3AED22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={14} color="#7C3AED" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#1E1B4B' }}>Need Help?</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>Visit our Help Center</div>
              </div>
              <ChevronRight size={13} color="#7C3AED" />
            </Link>
          </div>
        ) : (
          <div style={{ padding: '8px 0 16px', display: 'flex', justifyContent: 'center' }}>
            <div className="ts-link-wrap">
              <Link to="/tutor/help" style={{ width: 40, height: 40, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={16} color="#7C3AED" />
              </Link>
              <span className="ts-tooltip">Need Help?</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}