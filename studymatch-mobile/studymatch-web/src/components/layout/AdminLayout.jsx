import { Outlet } from 'react-router-dom'
import AdminSidebar from '../../components/admin/AdminSidebar'
import AdminNavbar  from '../../components/admin/AdminNavbar'

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F3F4F6', overflow: 'hidden' }}>

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <AdminNavbar />

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '24px 28px',
        }}>
          <Outlet />
        </main>

      </div>
    </div>
  )
}