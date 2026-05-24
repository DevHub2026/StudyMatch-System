import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { getUser } from './store/authStore'

// Auth pages
import LoginPage          from './pages/auth/LoginPage'
import RegisterPage       from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from './pages/auth/ResetPasswordPage'
import VerifyEmailPage    from './pages/auth/VerifyEmailPage'
import ProfileSetupPage   from './pages/auth/ProfileSetupPage'

// Layouts
import StudentLayout from './components/layout/StudentLayout'
import TutorLayout   from './components/layout/tutor/TutorLayout'
import AdminLayout   from './components/layout/AdminLayout'

// Route guards
import AdminRoute from './routes/AdminRoute'

// ── Student pages ──
import StudentDashboard  from './pages/student/DashboardPage'
import FindTutorsPage    from './pages/student/FindTutorsPage'
import StudentMessages   from './pages/student/MessagesPage'
import MySubjectsPage    from './pages/student/MySubjectsPage'
import StudentProfile    from './pages/student/ProfilePage'
import StudentResources  from './pages/student/ResourcesPage'
import StudentSchedule   from './pages/student/SchedulePage'
import StudentSettings   from './pages/student/SettingsPage'
import StudentSessions   from './pages/student/StudySessionsPage'

// ── Tutor pages ──
import TutorDashboard    from './pages/tutor/DashboardPage'
import FindStudentsPage  from './pages/tutor/FindStudentsPage'
import TutorMessages     from './pages/tutor/MessagesPage'
import TutorProfile      from './pages/tutor/ProfilePage'
import TutorResources    from './pages/tutor/ResourcesPage'
import TutorSchedule     from './pages/tutor/SchedulePage'
import TutorSettings     from './pages/tutor/SettingsPage'
import TutorSessions     from './pages/tutor/StudySessionsPage'

// ── Shared pages (exact filenames) ──
import AnnouncementsPage     from './pages/shared/AnnouncementsPage'
import AppearancePage        from './pages/shared/AppearancePage'        // exact: ApperancePage.jsx
import ComplaintsPage        from './pages/shared/ComplaintsPage'
import FeedbackPage          from './pages/shared/FeedbackPage'
import HelpCenterPage        from './pages/shared/HelpCenterPage'
import NotificationsPage     from './pages/shared/NotificationsPage'
import PreferencesPage       from './pages/shared/PreferencesPage'
import PrivacyPage           from './pages/shared/PrivacyPage'

// ── Admin pages ──
import AdminDashboard      from './pages/admin/DashboardPage'
import ManageAnnouncements from './pages/admin/ManageAnnouncementsPage'
import ReportsPage         from './pages/admin/ReportsPage'
import AdminResources      from './pages/admin/ResourcesPage'
import AdminSettings       from './pages/admin/SettingsPage'
import TutorsPage          from './pages/admin/TutorsPage'
import UsersPage           from './pages/admin/UsersPage'

/* ─── root redirect ──────────────────────────────────────────── */

function RootRedirect() {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />
  if (user.role === 'tutor')   return <Navigate to="/tutor/dashboard"   replace />
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />
  return <Navigate to="/login" replace />
}

/* ─── guards ─────────────────────────────────────────────────── */

function StudentRoute({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'student') return <Navigate to="/" replace />
  return children
}

function TutorRoute({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'tutor') return <Navigate to="/" replace />
  return children
}

/* ─── router ─────────────────────────────────────────────────── */

const router = createBrowserRouter([

  /* root */
  { path: '/', element: <RootRedirect /> },

  /* ── Auth ── */
  { path: '/login',           element: <LoginPage />          },
  { path: '/register',        element: <RegisterPage />       },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password',  element: <ResetPasswordPage />  },
  { path: '/verify-email',    element: <VerifyEmailPage />    },
  { path: '/profile-setup',   element: <ProfileSetupPage />   },

  /* ── Student ── */
  {
    path: '/student',
    element: <StudentRoute><StudentLayout /></StudentRoute>,
    children: [
      { index: true,            element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',      element: <StudentDashboard />  },
      { path: 'find-tutors',    element: <FindTutorsPage />    },
      { path: 'study-sessions', element: <StudentSessions />   },
      { path: 'my-subjects',    element: <MySubjectsPage />    },
      { path: 'messages',       element: <StudentMessages />   },
      { path: 'resources',      element: <StudentResources />  },
      { path: 'schedule',       element: <StudentSchedule />   },
      { path: 'profile',        element: <StudentProfile />    },
      { path: 'notifications',  element: <NotificationsPage /> },
      { path: 'announcements',  element: <AnnouncementsPage /> },
      { path: 'help',           element: <HelpCenterPage />    },
      { path: 'feedback',       element: <FeedbackPage />      },
      { path: 'complaints',     element: <ComplaintsPage />    },
      {
        path: 'settings',
        element: <StudentSettings />,
        children: [
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'privacy',       element: <PrivacyPage />       },
          { path: 'preferences',   element: <PreferencesPage />   },
          { path: 'appearance',    element: <AppearancePage />    },
        ],
      },
      { path: '*', element: <Navigate to="dashboard" replace /> },
    ],
  },

  /* ── Tutor ── */
  {
    path: '/tutor',
    element: <TutorRoute><TutorLayout /></TutorRoute>,
    children: [
      { index: true,            element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',      element: <TutorDashboard />    },
      { path: 'find-students',  element: <FindStudentsPage />  },
      { path: 'study-sessions', element: <TutorSessions />     },
      { path: 'messages',       element: <TutorMessages />     },
      { path: 'resources',      element: <TutorResources />    },
      { path: 'schedule',       element: <TutorSchedule />     },
      { path: 'profile',        element: <TutorProfile />      },
      { path: 'notifications',  element: <NotificationsPage /> },
      { path: 'announcements',  element: <AnnouncementsPage /> },
      { path: 'help',           element: <HelpCenterPage />    },
      { path: 'feedback',       element: <FeedbackPage />      },
      { path: 'complaints',     element: <ComplaintsPage />    },
      {
        path: 'settings',
        element: <TutorSettings />,
        children: [
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'privacy',       element: <PrivacyPage />       },
          { path: 'preferences',   element: <PreferencesPage />   },
          { path: 'appearance',    element: <AppearancePage />    },
        ],
      },
      { path: '*', element: <Navigate to="dashboard" replace /> },
    ],
  },

  /* ── Admin ── */
  {
    path: '/admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { index: true,           element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard',     element: <AdminDashboard />      },
      { path: 'announcements', element: <ManageAnnouncements /> },
      { path: 'reports',       element: <ReportsPage />         },
      { path: 'resources',     element: <AdminResources />      },
      { path: 'settings',      element: <AdminSettings />       },
      { path: 'tutors',        element: <TutorsPage />          },
      { path: 'users',         element: <UsersPage />           },
      { path: '*',             element: <Navigate to="dashboard" replace /> },
    ],
  },

  /* catch-all */
  { path: '*', element: <RootRedirect /> },
])

export default function App() {
  return <RouterProvider router={router} />
}