import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, CalendarClock, GitMerge,
  Flag, HelpCircle, Megaphone, MessageCircle, BarChart2,
  FileText, ScrollText, Shield, Bell, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, BookOpen, Library,
} from 'lucide-react'
import { logout } from '../../api/auth'
import { clearAuth, getUser } from '../../api/authStore'

const NAV = [
  { path: '/dashboard',     label: 'Dashboard',         icon: LayoutDashboard },
  { path: '/users',         label: 'Users',             icon: Users           },
  { path: '/tutors',        label: 'Tutor Verification',icon: GraduationCap   },
  { path: '/subjects',      label: 'Subjects',          icon: BookOpen        },
  { path: '/resources',     label: 'Resources',         icon: Library         },
  { path: '/sessions',      label: 'Sessions',          icon: CalendarClock   },
  { path: '/matches',       label: 'Matches',           icon: GitMerge        },
  { path: '/complaints',    label: 'Complaints',        icon: Flag            },
  { path: '/help-center',   label: 'Help Center',       icon: HelpCircle      },
  { path: '/announcements', label: 'Announcements',     icon: Megaphone       },
  { path: '/feedback',      label: 'Feedback',          icon: MessageCircle   },
  { path: '/analytics',     label: 'Analytics',         icon: BarChart2       },
  { path: '/reports',       label: 'Reports',           icon: FileText        },
  { path: '/audit-logs',    label: 'Audit Logs',        icon: ScrollText      },
  { path: '/roles',         label: 'Roles',             icon: Shield          },
  { path: '/notifications', label: 'Notifications',     icon: Bell            },
  { path: '/system-config', label: 'System Config',     icon: Settings        },
]

export default function Sidebar() {
  const navigate    = useNavigate()
  const user        = getUser()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    try { await logout() } catch {}
    clearAuth()
    navigate('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .sm-sidebar * { box-sizing: border-box; }
        .sm-sidebar {
          flex-shrink: 0; background: white;
          border-right: 1px solid #E5E7EB;
          display: flex; flex-direction: column;
          height: 100vh; position: sticky; top: 0;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          transition: width .22s cubic-bezier(.4,0,.2,1);
        }
        .sm-inner { overflow-y: auto; flex: 1; display: flex; flex-direction: column; }
        .sm-inner::-webkit-scrollbar { width: 3px; }
        .sm-inner::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 3px; }

        .sm-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; margin: 1px 8px; border-radius: 10px;
          text-decoration: none; font-size: 13.5px; font-weight: 500;
          color: #374151; transition: all .15s; white-space: nowrap;
          cursor: pointer;
        }
        .sm-link:hover  { background: #F3F0FF; color: #7C3AED; }
        .sm-link.active { background: #F3F0FF; color: #7C3AED; font-weight: 700; }
        .sm-link.centered { justify-content: center; padding: 9px 0; margin: 1px 8px; }

        .sm-tooltip {
          position: fixed; left: 64px;
          background: #1E1B4B; color: white; font-size: 12px;
          font-weight: 600; padding: 5px 10px; border-radius: 7px;
          white-space: nowrap; pointer-events: none; opacity: 0;
          transition: opacity .15s; z-index: 9999;
        }
        .sm-tip { position: relative; display: block; }
        .sm-tip:hover .sm-tooltip { opacity: 1; }

        .sm-logout {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; margin: 1px 8px; border-radius: 10px;
          font-size: 13.5px; font-weight: 500; color: #EF4444;
          cursor: pointer; border: none; background: none;
          width: calc(100% - 16px); text-align: left;
          font-family: 'DM Sans', sans-serif; white-space: nowrap;
          transition: background .15s;
        }
        .sm-logout:hover { background: #FEF2F2; }
        .sm-logout.centered { justify-content: center; padding: 9px 0; }
      `}</style>

      <aside className="sm-sidebar" style={{ width: collapsed ? 56 : 220 }}>
        <div className="sm-inner">

          {/* Logo + collapse toggle */}
          <div style={{
            height: 60, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
            padding: collapsed ? '0 11px' : '0 12px 0 16px',
            borderBottom: '1px solid #F0F0F4',
          }}>
            {!collapsed && (
              <span style={{ fontWeight: 800, fontSize: 15, color: '#1E1B4B', whiteSpace: 'nowrap' }}>
                Study<span style={{ color: '#7C3AED' }}>Match</span>
                <span style={{ display: 'block', fontWeight: 500, fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                  Admin Console
                </span>
              </span>
            )}
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                width: 26, height: 26, borderRadius: 7,
                border: '1px solid #E5E7EB', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, marginLeft: collapsed ? 'auto' : 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F3F0FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {collapsed
                ? <PanelLeftOpen  size={13} color="#7C3AED" />
                : <PanelLeftClose size={13} color="#7C3AED" />}
            </button>
          </div>

          {/* Nav links */}
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {NAV.map(item => {
              const Icon = item.icon
              if (collapsed) {
                return (
                  <div key={item.path} className="sm-tip">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `sm-link centered${isActive ? ' active' : ''}`
                      }
                    >
                      {({ isActive }) => (
                        <Icon size={17} color={isActive ? '#7C3AED' : '#6B7280'} />
                      )}
                    </NavLink>
                    <span className="sm-tooltip">{item.label}</span>
                  </div>
                )
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sm-link${isActive ? ' active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} color={isActive ? '#7C3AED' : '#6B7280'} />
                      {item.label}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Divider */}
          <div style={{ height: 1, background: '#F0F0F4', margin: collapsed ? '0 8px' : '0 16px' }} />

          {/* User + logout */}
          <div style={{ padding: '10px 0 8px', flexShrink: 0 }}>
            {!collapsed ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px', marginBottom: 2 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#F3F4F6', border: '2px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: '#6B7280', flexShrink: 0,
                  }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.name || 'Admin'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {user?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                    </div>
                  </div>
                </div>
                <button className="sm-logout" onClick={handleLogout}>
                  <LogOut size={16} color="#EF4444" /> Log Out
                </button>
              </>
            ) : (
              <>
                <div className="sm-tip" style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6',
                    border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#6B7280',
                  }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <span className="sm-tooltip">{user?.name || 'Admin'}</span>
                </div>
                <div className="sm-tip">
                  <button className="sm-logout centered" style={{ width: '100%' }} onClick={handleLogout}>
                    <LogOut size={16} color="#EF4444" />
                  </button>
                  <span className="sm-tooltip">Log Out</span>
                </div>
              </>
            )}
          </div>

        </div>
      </aside>
    </>
  )
}
