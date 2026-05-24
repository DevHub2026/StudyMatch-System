import { Outlet } from 'react-router-dom'
import TutorSidebar from './TutorSidebar'
import TutorNavbar  from './TutorNavbar'

export default function TutorLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8F9FB' }}>
      <TutorSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TutorNavbar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}