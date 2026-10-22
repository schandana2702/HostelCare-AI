import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, getDashboardPathForRole } from '../utils/constants';

import AppLayout from '../components/layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import SubmitComplaint from '../pages/student/SubmitComplaint';
import MyComplaints from '../pages/student/MyComplaints';
import ComplaintDetail from '../pages/student/ComplaintDetail';
import Profile from '../pages/student/Profile';

// Warden Pages
import WardenDashboard from '../pages/warden/WardenDashboard';
import WardenComplaints from '../pages/warden/WardenComplaints';
import MaintenanceCalendar from '../pages/warden/MaintenanceCalendar';
import RoomInspections from '../pages/warden/RoomInspections';
import Announcements from '../pages/warden/Announcements';
import WardenAnalytics from '../pages/warden/WardenAnalytics';

// Maintenance Pages
import MaintenanceDashboard from '../pages/maintenance/MaintenanceDashboard';
import AssignedComplaints from '../pages/maintenance/AssignedComplaints';
import WorkHistory from '../pages/maintenance/WorkHistory';
import InventoryPage from '../pages/maintenance/InventoryPage';
import SchedulePage from '../pages/maintenance/SchedulePage';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import AllComplaints from '../pages/admin/AllComplaints';
import CategorySettings from '../pages/admin/CategorySettings';
import AuditLogs from '../pages/admin/AuditLogs';
import HostelManagement from '../pages/admin/HostelManagement';

// Common Pages
import Unauthorized from '../pages/common/Unauthorized';
import NotFound from '../pages/common/NotFound';
import Notifications from '../pages/common/Notifications';

// Role-based redirect from "/"
function RoleBasedRedirect() {
  const { currentUser, loading } = useAuth();

  // Wait for auth session and profile to finish loading before deciding route
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-purple-300/70">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  const targetDashboard = getDashboardPathForRole(currentUser.role);
  if (targetDashboard) {
    return <Navigate to={targetDashboard} replace />;
  }

  // If role is unknown/unloaded, redirect to login rather than assuming student
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login"        element={<Login />} />
      <Route path="/register"     element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* All protected routes wrapped in AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Root redirector */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* ── Shared routes (all authenticated roles) ── */}
        <Route path="/complaint/:id"  element={<ComplaintDetail />} />
        <Route path="/announcements"  element={<Announcements />} />
        <Route path="/notifications"  element={<Notifications />} />
        <Route path="/profile"        element={<Profile />} />

        {/* ── Student Routes ── */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        {/* Canonical aliases used by SRS requirement doc */}
        <Route path="/dashboard"      element={<Navigate to="/student/dashboard" replace />} />

        <Route
          path="/student/submit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <SubmitComplaint />
            </ProtectedRoute>
          }
        />
        <Route path="/submit-complaint" element={<Navigate to="/student/submit" replace />} />

        <Route
          path="/student/complaints"
          element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <MyComplaints />
            </ProtectedRoute>
          }
        />
        <Route path="/my-complaints" element={<Navigate to="/student/complaints" replace />} />

        {/* ── Warden Routes ── */}
        <Route
          path="/warden/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN]}>
              <WardenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/complaints"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN]}>
              <WardenComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/calendar"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN, ROLES.MAINTENANCE, ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <MaintenanceCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/inspections"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN]}>
              <RoomInspections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/announcements"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN, ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warden/analytics"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WARDEN, ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <WardenAnalytics />
            </ProtectedRoute>
          }
        />

        {/* ── Maintenance Routes ── */}
        <Route
          path="/maintenance/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
              <MaintenanceDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/tasks"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
              <AssignedComplaints />
            </ProtectedRoute>
          }
        />
        {/* Canonical SRS alias */}
        <Route path="/maintenance/assigned" element={<Navigate to="/maintenance/tasks" replace />} />

        <Route
          path="/maintenance/history"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
              <WorkHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/inventory"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/schedule"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MAINTENANCE]}>
              <SchedulePage />
            </ProtectedRoute>
          }
        />

        {/* ── Admin Routes ── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/complaints"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <AllComplaints />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hostels"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <HostelManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <CategorySettings />
            </ProtectedRoute>
          }
        />
        {/* Canonical SRS alias */}
        <Route path="/admin/categories" element={<Navigate to="/admin/settings" replace />} />

        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.ADMINISTRATOR]}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        {/* Canonical SRS alias */}
        <Route path="/admin/logs" element={<Navigate to="/admin/audit" replace />} />

        {/* Seed page → 404 (removed from production) */}
        <Route path="/admin/seed" element={<NotFound />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
