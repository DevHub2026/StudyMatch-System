import { Outlet } from 'react-router-dom'
import StudentSidebar from '../student/StudentSidebar'
import StudentNavbar  from '../student/StudentNavbar'

export default function StudentLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <StudentSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StudentNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}