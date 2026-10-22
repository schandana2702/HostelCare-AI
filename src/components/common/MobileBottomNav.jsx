import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Bell,
  Calendar,
  ClipboardCheck,
  CheckCircle,
  Users
} from 'lucide-react';

export default function MobileBottomNav() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const role = currentUser.role;

  let items = [];

  if (role === ROLES.STUDENT) {
    items = [
      { to: '/student/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/student/submit', label: 'New Ticket', icon: PlusCircle, isAction: true },
      { to: '/student/complaints', label: 'Tickets', icon: ListOrdered },
      { to: '/notifications', label: 'Alerts', icon: Bell }
    ];
  } else if (role === ROLES.WARDEN) {
    items = [
      { to: '/warden/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/warden/complaints', label: 'Tickets', icon: ListOrdered },
      { to: '/warden/calendar', label: 'Schedule', icon: Calendar },
      { to: '/warden/inspections', label: 'Inspect', icon: ClipboardCheck }
    ];
  } else if (role === ROLES.MAINTENANCE) {
    items = [
      { to: '/maintenance/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/maintenance/assigned', label: 'Assigned', icon: ListOrdered },
      { to: '/maintenance/schedule', label: 'Schedule', icon: Calendar },
      { to: '/maintenance/history', label: 'Resolved', icon: CheckCircle }
    ];
  } else if (role === ROLES.ADMIN || role === 'administrator') {
    items = [
      { to: '/admin/dashboard', label: 'Home', icon: LayoutDashboard },
      { to: '/admin/complaints', label: 'Tickets', icon: ListOrdered },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/notifications', label: 'Alerts', icon: Bell }
    ];
  }

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0a22]/90 backdrop-blur-2xl border-t border-purple-500/20 px-3 py-1.5 shadow-[0_-8px_30px_rgba(5,3,10,0.7)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isAction) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-5 py-2 px-3.5 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.55)] transition-all active:scale-95 bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 text-white border border-purple-400/40 ${
                    isActive ? 'ring-2 ring-purple-300 ring-offset-2 ring-offset-[#0B0816]' : ''
                  }`
                }
              >
                <Icon className="w-5 h-5 text-white" />
                <span className="text-[10px] font-bold mt-0.5 tracking-tight text-white">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[58px] ${
                  isActive
                    ? 'font-bold text-white bg-purple-500/20 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                    : 'text-purple-300/60 hover:text-purple-200 border border-transparent'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
