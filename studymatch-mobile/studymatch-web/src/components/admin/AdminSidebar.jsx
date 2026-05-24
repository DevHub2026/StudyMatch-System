import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, ShieldCheck,
  Flag, FileText, Megaphone, BookOpen, Settings,
  LogOut, ChevronRight, ChevronDown,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { getUser, clearAuth } from '../../store/authStore'
import logo from '../../assets/logo.png'

/* ─── nav config ─────────────────────────────────────────────── */

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard',     to: '/admin/dashboard' },
  { icon: Users,           label: 'Users',          to: '/admin/users', arrow: true },
  {
    icon: GraduationCap, label: 'Tutors',
    children: [
      { label: 'All Tutors', to: '/admin/tutors'         },
      { label: 'Pending',    to: '/admin/tutors/pending'  },
    ],
  },
  { icon: ShieldCheck, label: 'Verification', to: '/admin/verification' },
  {
    icon: Flag, label: 'Reports',
    children: [
      { label: 'All Reports', to: '/admin/reports'          },
      { label: 'Pending',     to: '/admin/reports/pending'  },
      { label: 'Resolved',    to: '/admin/reports/resolved' },
    ],
  },
  {
    icon: FileText, label: 'Content',
    children: [
      { label: 'Resources',  to: '/admin/resources'  },
      { label: 'Moderation', to: '/admin/moderation' },
    ],
  },
  { icon: Megaphone, label: 'Announcements', to: '/admin/announcements' },
  { icon: BookOpen,  label: 'Resources',     to: '/admin/resources'     },
  { icon: Settings,  label: 'Settings',      to: '/admin/settings'      },
]

/* ─── component ──────────────────────────────────────────────── */

export default function AdminSidebar() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const user       = getUser()

  const [collapsed,  setCollapsed]  = useState(false)
  const [openMenus,  setOpenMenus]  = useState({})

  const toggleMenu = (label) =>
    setOpenMenus(p => ({ ...p, [label]: !p[label] }))

  const isActive = (to) =>
    to === '/admin/dashboard'
      ? location.pathname === to
      : location.pathname.startsWith(to)

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .as-bar * { box-sizing: border-box; }
        .as-bar {
          flex-shrink: 0; background: white;
          border-right: 1px solid #E5E7EB;
          display: flex; flex-direction: column;
          height: 100vh; position: sticky; top: 0;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          transition: width .22s cubic-bezier(.4,0,.2,1);
        }
        .as-bar-inner { overflow-y: auto; flex: 1; display: flex; flex-direction: column; }
        .as-bar-inner::-webkit-scrollbar { width: 3px; }
        .as-bar-inner::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }
        .as-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; cursor: pointer;
          text-decoration: none; font-size: 14px;
          font-weight: 500; color: #374151;
          transition: all .15s; width: 100%;
          white-space: nowrap; position: relative;
        }
        .as-link:hover  { background: #F3F0FF; color: #7C3AED; }
        .as-link.active { background: #F3F0FF; color: #7C3AED; font-weight: 700; }
        .as-link.centered { justify-content: center; padding: 10px 0; }
        .as-sub {
          display: block; padding: 8px 16px 8px 44px;
          font-size: 13px; font-weight: 500; color: #6B7280;
          text-decoration: none; transition: all .15s;
          white-space: nowrap;
        }
        .as-sub:hover  { background: #F8F9FB; color: #7C3AED; }
        .as-sub.active { color: #7C3AED; font-weight: 600; background: #F8F9FB; }
        .as-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; cursor: pointer;
          font-size: 14px; font-weight: 500; color: #EF4444;
          transition: background .15s; border: none;
          background: none; width: 100%;
          font-family: 'DM Sans', sans-serif; text-align: left;
          white-space: nowrap;
        }
        .as-logout:hover { background: #FEF2F2; }
        .as-logout.centered { justify-content: center; padding: 10px 0; }
        .as-tooltip {
          position: fixed; left: 72px;
          background: #1E1B4B; color: white; font-size: 12px;
          font-weight: 600; padding: 5px 10px; border-radius: 7px;
          white-space: nowrap; pointer-events: none; opacity: 0;
          transition: opacity .15s; z-index: 9999;
        }
        .as-tip-wrap { position: relative; display: block; }
        .as-tip-wrap:hover .as-tooltip { opacity: 1; }
      `}</style>

      <aside className="as-bar" style={{ width: collapsed ? 56 : 200 }}>
        <div className="as-bar-inner">

          {/* ── Logo + collapse ── */}
          <div style={{
            height: 60, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
            padding: collapsed ? '0 12px' : '0 14px 0 16px',
            borderBottom: '1px solid #F0F0F4',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <img src={logo} alt="StudyMatch" style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B', whiteSpace: 'nowrap' }}>
                  Study<span style={{ color: '#7C3AED' }}>Match</span>
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = '#F3F0FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {collapsed ? <PanelLeftOpen size={13} color="#7C3AED" /> : <PanelLeftClose size={13} color="#7C3AED" />}
            </button>
          </div>

          {/* ── Nav ── */}
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {NAV.map(item => {
              if (item.children) {
                const open      = openMenus[item.label]
                const anyActive = item.children.some(c => location.pathname.startsWith(c.to))

                if (collapsed) {
                  return (
                    <div key={item.label} className="as-tip-wrap">
                      <div className={`as-link centered${anyActive ? ' active' : ''}`} onClick={() => toggleMenu(item.label)}>
                        <item.icon size={17} color={anyActive ? '#7C3AED' : '#6B7280'} />
                      </div>
                      <span className="as-tooltip">{item.label}</span>
                    </div>
                  )
                }

                return (
                  <div key={item.label}>
                    <div className={`as-link${anyActive ? ' active' : ''}`}
                      onClick={() => toggleMenu(item.label)}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <item.icon size={17} color={anyActive ? '#7C3AED' : '#6B7280'} />
                        {item.label}
                      </div>
                      <ChevronDown size={14} color="#9CA3AF"
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                    </div>
                    {open && item.children.map(c => (
                      <Link key={c.to} to={c.to}
                        className={`as-sub${location.pathname === c.to ? ' active' : ''}`}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )
              }

              if (collapsed) {
                return (
                  <div key={item.to} className="as-tip-wrap">
                    <Link to={item.to} className={`as-link centered${isActive(item.to) ? ' active' : ''}`}>
                      <item.icon size={17} color={isActive(item.to) ? '#7C3AED' : '#6B7280'} />
                    </Link>
                    <span className="as-tooltip">{item.label}</span>
                  </div>
                )
              }

              return (
                <Link key={item.to} to={item.to}
                  className={`as-link${isActive(item.to) ? ' active' : ''}`}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <item.icon size={17} color={isActive(item.to) ? '#7C3AED' : '#6B7280'} />
                    {item.label}
                  </div>
                  {item.arrow && <ChevronRight size={14} color="#9CA3AF" />}
                </Link>
              )
            })}
          </nav>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: '#F0F0F4', margin: collapsed ? '0 8px' : '0 16px' }} />

          {/* ── User + Logout ── */}
          <div style={{ padding: '12px 0 8px', flexShrink: 0 }}>
            {!collapsed ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', marginBottom: 4 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F3F4F6', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#6B7280', flexShrink: 0 }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name || 'Admin'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>Super Administrator</div>
                  </div>
                  <ChevronDown size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />
                </div>
                <button className="as-logout" onClick={handleLogout}>
                  <LogOut size={17} color="#EF4444" /> Log Out
                </button>
              </>
            ) : (
              <>
                <div className="as-tip-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#F3F4F6', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#6B7280', cursor: 'default' }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <span className="as-tooltip">{user?.name || 'Admin'}</span>
                </div>
                <div className="as-tip-wrap">
                  <button className="as-logout centered" onClick={handleLogout}>
                    <LogOut size={17} color="#EF4444" />
                  </button>
                  <span className="as-tooltip">Log Out</span>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}