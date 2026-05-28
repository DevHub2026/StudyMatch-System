import { Outlet } from 'react-router-dom'
import StudentSidebar from '../student/StudentSidebar'
import StudentNavbar  from '../student/StudentNavbar'

export default function StudentLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8F9FB' }}>
      <StudentSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <StudentNavbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
