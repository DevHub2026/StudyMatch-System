import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../api/auth'
import { clearAuth } from '../../api/authStore'

const navItems = [
  { path: '/dashboard',     label: 'Dashboard' },
  { path: '/users',         label: 'Users' },
  { path: '/sessions',      label: 'Sessions' },
  { path: '/matches',       label: 'Matches'        },
  { path: '/complaints',    label: 'Complaints' },
  { path: '/help-center',   label: 'Help Center' },
  { path: '/announcements', label: 'Announcements' },
  { path: '/feedback',      label: 'Feedback' },
  { path: '/analytics',     label: 'Analytics' },
  { path: '/reports',       label: 'Reports' },
  { path: '/audit-logs',    label: 'Audit Logs' },
  { path: '/roles',         label: 'Roles' },
  { path: '/notifications', label: 'Notifications' },
  { path: '/system-config', label: 'System Config'  },
  
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (e) {
      // token may already be invalid
    }
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="w-64 h-screen bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-white text-xl font-bold">StudyMatch</h1>
        <p className="text-slate-400 text-xs mt-1">Admin Console</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Profile link */}
<NavLink
  to="/profile"
  className={({ isActive }) =>
    `flex items-center px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white font-medium'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`
  }
>
  Profile
</NavLink>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}