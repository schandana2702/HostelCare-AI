import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Calendar,
  ClipboardCheck,
  Megaphone,
  CheckCircle,
  Users,
  Sliders,
  FileSpreadsheet,
  X,
  Building,
  Package,
  Bell
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const role = currentUser.role;

  let navItems = [];

  if (role === ROLES.STUDENT) {
    navItems = [
      { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/student/submit', label: 'Submit Complaint', icon: PlusCircle, highlight: true },
      { to: '/student/complaints', label: 'My Complaints', icon: ListOrdered },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/announcements', label: 'Announcements', icon: Megaphone }
    ];
  } else if (role === ROLES.WARDEN) {
    navItems = [
      { to: '/warden/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/warden/complaints', label: 'Hostel Complaints', icon: ListOrdered },
      { to: '/warden/calendar', label: 'Maintenance Calendar', icon: Calendar },
      { to: '/warden/inspections', label: 'Room Inspections', icon: ClipboardCheck },
      { to: '/warden/analytics', label: 'Analytics', icon: Sliders },
      { to: '/warden/announcements', label: 'Notices & Announcements', icon: Megaphone }
    ];
  } else if (role === ROLES.MAINTENANCE) {
    navItems = [
      { to: '/maintenance/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/maintenance/assigned', label: 'Assigned Work', icon: ListOrdered, highlight: true },
      { to: '/maintenance/inventory', label: 'Inventory', icon: Package },
      { to: '/maintenance/schedule', label: 'My Schedule', icon: Calendar },
      { to: '/maintenance/history', label: 'Completed Jobs', icon: CheckCircle }
    ];
  } else if (role === ROLES.ADMIN || role === 'administrator') {
    navItems = [
      { to: '/admin/dashboard', label: 'System Dashboard', icon: LayoutDashboard },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/complaints', label: 'All Complaints', icon: ListOrdered },
      { to: '/admin/hostels', label: 'Hostel Management', icon: Building },
      { to: '/admin/categories', label: 'Categories & SLA', icon: Sliders },
      { to: '/admin/logs', label: 'Audit Logs', icon: FileSpreadsheet }
    ];
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 lg:hidden bg-slate-950/70 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static bg-[#0d0920]/95 backdrop-blur-2xl border-r border-purple-500/15 ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-purple-950/50' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/15 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg text-white">HostelCare</span>
            <span className="text-purple-400 font-bold">AI</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3 mx-3 my-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-extrabold text-sm shadow-[0_0_15px_rgba(168,85,247,0.35)] bg-gradient-to-tr from-purple-700 to-indigo-600 border border-purple-400/30 shrink-0">
              {currentUser.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-white">
                {currentUser.displayName}
              </p>
              <p className="text-[11px] truncate capitalize font-medium text-purple-300/70 mt-0.5">
                {currentUser.role}
                {currentUser.roomNumber ? ` • Room ${currentUser.roomNumber}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/50">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] border border-purple-400/30'
                      : item.highlight
                      ? 'bg-purple-500/15 text-purple-200 border border-purple-500/25 hover:bg-purple-500/25 hover:text-white'
                      : 'text-purple-200/75 hover:text-white hover:bg-purple-500/10 border border-transparent hover:border-purple-500/15'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-purple-300'
                          : 'text-purple-400/70 group-hover:text-purple-300'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
