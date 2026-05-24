import { Navigate } from 'react-router-dom'
import StudentLayout from '../layouts/StudentLayout'
import { getUser } from '../store/authStore'

// Student pages
import DashboardPage      from '../pages/student/DashboardPage'
import FindTutorsPage     from '../pages/student/FindTutorsPage'
import StudySessionsPage  from '../pages/student/StudySessionsPage'
import MySubjectsPage     from '../pages/student/MySubjectsPage'
import MessagesPage       from '../pages/student/MessagesPage'
import ResourcesPage      from '../pages/student/ResourcesPage'
import SchedulePage       from '../pages/student/SchedulePage'
import ProfilePage        from '../pages/student/ProfilePage'

// Shared pages
import PartnersPage       from '../pages/shared/PartnersPage'
import SettingsPage       from '../pages/shared/SettingsPage'
import NotificationsPage  from '../pages/shared/NotificationsPage'
import PrivacyPage        from '../pages/shared/PrivacyPage'
import PreferencesPage    from '../pages/shared/PreferencesPage'
import AppearancePage     from '../pages/shared/AppearancePage'
import AnnouncementsPage  from '../pages/shared/AnnouncementsPage'
import HelpCenterPage     from '../pages/shared/HelpCenterPage'
import FeedbackPage       from '../pages/shared/FeedbackPage'
import ComplaintsPage     from '../pages/shared/ComplaintsPage'

/* ─── guard ──────────────────────────────────────────────────── */

function StudentRoute({ children }) {
  const user = getUser()

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'student') {
    if (user.role === 'tutor')  return <Navigate to="/tutor/dashboard"  replace />
    if (user.role === 'admin')  return <Navigate to="/admin/dashboard"  replace />
    return <Navigate to="/login" replace />
  }

  return children
}

/* ─── routes ─────────────────────────────────────────────────── */

export default function StudentRoutes() {
  return (
    <StudentRoute>
      <StudentLayout>
        {/* handled by react-router via Outlet in StudentLayout */}
      </StudentLayout>
    </StudentRoute>
  )
}

/* ─── route config (used in App.jsx / router.jsx) ───────────── */

export const studentRouteConfig = [
  {
    path: '/student',
    element: (
      <StudentRoute>
        <StudentLayout />
      </StudentRoute>
    ),
    children: [
      // Default redirect
      { index: true, element: <Navigate to="dashboard" replace /> },

      // Core pages
      { path: 'dashboard',      element: <DashboardPage />     },
      { path: 'find-tutors',    element: <FindTutorsPage />    },
      { path: 'matches',        element: <PartnersPage />      },
      { path: 'study-sessions', element: <StudySessionsPage /> },
      { path: 'my-subjects',    element: <MySubjectsPage />    },
      { path: 'messages',       element: <MessagesPage />      },
      { path: 'resources',      element: <ResourcesPage />     },
      { path: 'schedule',       element: <SchedulePage />      },
      { path: 'profile',        element: <ProfilePage />       },

      // Settings sub-pages
      { path: 'settings',             element: <SettingsPage />      },
      { path: 'settings/notifications', element: <NotificationsPage /> },
      { path: 'settings/privacy',     element: <PrivacyPage />       },
      { path: 'settings/preferences', element: <PreferencesPage />   },
      { path: 'settings/appearance',  element: <AppearancePage />    },

      // Shared pages
      { path: 'notifications',  element: <NotificationsPage />  },
      { path: 'announcements',  element: <AnnouncementsPage />  },
      { path: 'help',           element: <HelpCenterPage />     },
      { path: 'feedback',       element: <FeedbackPage />       },
      { path: 'complaints',     element: <ComplaintsPage />     },

      // Catch-all → dashboard
      { path: '*', element: <Navigate to="dashboard" replace /> },
    ],
  },
]