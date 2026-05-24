import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "./api/authStore";

import MainLayout from "./components/layout/MainLayout";
import NotificationsPage from './pages/NotificationsPage'
import SystemConfigPage from './pages/SystemConfigPage'
import MatchMonitoringPage from './pages/MatchMonitoringPage'
import ProfilePage from './pages/ProfilePage'


import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import SessionsPage from "./pages/SessionsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import FeedbackPage from "./pages/FeedbackPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportsPage from "./pages/ReportsPage";
import AuditLogPage from "./pages/AuditLogPage";
import RolesPage from "./pages/RolesPage";

/**
 * Protect routes properly (React Router v6 pattern)
 */
function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="help-center" element={<HelpCenterPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="system-config" element={<SystemConfigPage />} />
            <Route path="matches" element={<MatchMonitoringPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}