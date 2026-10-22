import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../../utils/constants';
import NotificationBell from './NotificationBell';
import { Menu, Building2, LogOut, Sparkles, User, ChevronDown } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { currentUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const roleStyles = {
    [ROLES.STUDENT]: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30'
    },
    [ROLES.WARDEN]: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-300',
      border: 'border-purple-500/35'
    },
    [ROLES.MAINTENANCE]: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30'
    },
    [ROLES.ADMIN]: {
      bg: 'bg-fuchsia-500/20',
      text: 'text-fuchsia-300',
      border: 'border-fuchsia-500/35'
    },
    administrator: {
      bg: 'bg-fuchsia-500/20',
      text: 'text-fuchsia-300',
      border: 'border-fuchsia-500/35'
    }
  };

  const currentRoleStyle = currentUser
    ? roleStyles[currentUser.role] || roleStyles[ROLES.STUDENT]
    : null;
  const userInitial = currentUser?.displayName
    ? currentUser.displayName.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 px-3.5 sm:px-6 lg:px-8 py-2.5 border-b border-purple-500/15 bg-[#0e0921]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Mobile Sidebar Toggle + Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl lg:hidden text-purple-200/80 hover:text-white hover:bg-purple-500/15 border border-transparent hover:border-purple-500/20 transition-all focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 border border-purple-400/30 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-purple-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-purple-200 transition-colors">
                  HostelCare
                  <span className="text-purple-400 ml-1">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <Sparkles className="w-2.5 h-2.5 text-purple-300" /> AI
                </span>
              </div>
              <p className="text-[10px] font-medium text-purple-300/60 hidden sm:block -mt-0.5">
                Smart Hostel Management
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role badge + Notifications + User menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role badge */}
          {currentUser && currentRoleStyle && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-xs ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
            >
              <span className="hidden md:inline opacity-70 text-[11px]">Role:</span>
              <span className="font-bold tracking-wide">
                {ROLE_LABELS[currentUser.role] || currentUser.role}
              </span>
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />

          {/* User Avatar Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl text-purple-100 hover:bg-purple-500/15 border border-transparent hover:border-purple-500/25 transition-all focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-400/40 shadow-sm">
                {userInitial}
              </div>
              <span className="text-xs font-semibold hidden sm:inline-block max-w-[110px] truncate text-purple-100">
                {currentUser?.displayName || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-300/70 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border border-purple-500/25 py-2 z-50 bg-[#150f2e]/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-purple-500/15">
                  <p className="text-xs font-bold truncate text-white">
                    {currentUser?.displayName}
                  </p>
                  <p className="text-[11px] truncate text-purple-300/70 mt-0.5">
                    {currentUser?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2.5 text-purple-200 hover:text-white hover:bg-purple-600/20 transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-400" /> My Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-2.5 text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
