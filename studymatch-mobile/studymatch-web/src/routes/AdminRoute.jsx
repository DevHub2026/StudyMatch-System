import { Navigate } from 'react-router-dom'
import { getUser } from '../store/authStore'

export default function AdminRoute({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    if (user.role === 'tutor')   return <Navigate to="/tutor/dashboard"   replace />
    return <Navigate to="/login" replace />
  }
  return children
}