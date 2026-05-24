import { Navigate } from 'react-router-dom'
import TutorLayout from '../layouts/TutorLayout'
import { getUser } from '../store/authStore'

// Tutor pages
import DashboardPage      from '../pages/tutor/DashboardPage'
import FindStudentsPage   from '../pages/tutor/FindStudentsPage'
import StudySessionsPage  from '../pages/tutor/StudySessionsPage'
import MessagesPage       from '../pages/tutor/MessagesPage'
import ResourcesPage      from '../pages/tutor/ResourcesPage'
import SchedulePage       from '../pages/tutor/SchedulePage'
import ProfilePage        from '../pages/tutor/ProfilePage'

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

function TutorRoute({ children }) {
  const user = getUser()

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'tutor') {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
    if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />
    return <Navigate to="/login" replace />
  }

  return children
}

/* ─── route config (used in App.jsx / router.jsx) ───────────── */

export const tutorRouteConfig = [
  {
    path: '/tutor',
    element: (
      <TutorRoute>
        <TutorLayout />
      </TutorRoute>
    ),
    children: [
      // Default redirect
      { index: true, element: <Navigate to="dashboard" replace /> },

      // Core pages
      { path: 'dashboard',      element: <DashboardPage />     },
      { path: 'find-students',  element: <FindStudentsPage />  },
      { path: 'matches',        element: <PartnersPage />      },
      { path: 'study-sessions', element: <StudySessionsPage /> },
      { path: 'messages',       element: <MessagesPage />      },
      { path: 'resources',      element: <ResourcesPage />     },
      { path: 'schedule',       element: <SchedulePage />      },
      { path: 'profile',        element: <ProfilePage />       },

      // Settings sub-pages
      { path: 'settings',               element: <SettingsPage />      },
      { path: 'settings/notifications', element: <NotificationsPage /> },
      { path: 'settings/privacy',       element: <PrivacyPage />       },
      { path: 'settings/preferences',   element: <PreferencesPage />   },
      { path: 'settings/appearance',    element: <AppearancePage />    },

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