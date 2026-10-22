import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS, getDashboardPathForRole } from '../../utils/constants';

export default function AccessDenied({ targetRole = null }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Determine target section name based on requested roles
  let sectionName = 'this section';
  if (targetRole) {
    if (Array.isArray(targetRole)) {
      if ((targetRole.includes(ROLES.ADMIN) || targetRole.includes('administrator')) && targetRole.length === 1) {
        sectionName = 'the Administrator Console';
      } else if (targetRole.includes(ROLES.WARDEN)) {
        sectionName = 'the Warden Dashboard';
      } else if (targetRole.includes(ROLES.MAINTENANCE)) {
        sectionName = 'the Maintenance Dashboard';
      } else if (targetRole.includes(ROLES.STUDENT)) {
        sectionName = 'the Student Dashboard';
      }
    } else if (typeof targetRole === 'string') {
      sectionName = `the ${ROLE_LABELS[targetRole] || targetRole} section`;
    }
  }

  const handleReturnToDashboard = () => {
    const dest = getDashboardPathForRole(currentUser?.role);
    if (dest) {
      navigate(dest);
    } else {
      navigate('/login');
    }
  };

  const roleLabel = currentUser ? ROLE_LABELS[currentUser.role] || currentUser.role : 'Guest';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-18 h-18 rounded-3xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-5 border border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-in zoom-in-95 duration-200">
        <ShieldAlert className="w-9 h-9 text-rose-400" />
      </div>

      <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-300 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full mb-3 shadow-xs">
        403 Forbidden Access
      </span>

      <h1 className="text-3xl font-black text-white tracking-tight">
        ACCESS DENIED
      </h1>

      <p className="text-sm sm:text-base text-purple-200/80 mt-2 max-w-md">
        You are not authorized to access {sectionName}.
      </p>

      <div className="mt-4 p-3.5 bg-purple-950/40 border border-purple-500/25 rounded-2xl text-xs text-purple-300/80 max-w-sm">
        Signed in as <span className="font-bold text-white">{currentUser?.displayName || 'User'}</span> ({roleLabel}).
        Institutional permissions for this route are restricted.
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleReturnToDashboard}
          className="px-6 py-3 btn-primary-purple text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentUser?.role === ROLES.STUDENT
            ? 'Return to Student Dashboard'
            : currentUser?.role === ROLES.WARDEN
            ? 'Return to Warden Dashboard'
            : currentUser?.role === ROLES.MAINTENANCE
            ? 'Return to Maintenance Dashboard'
            : (currentUser?.role === ROLES.ADMIN || currentUser?.role === 'administrator')
            ? 'Return to Admin Dashboard'
            : 'Return to Login'}
        </button>
      </div>
    </div>
  );
}
