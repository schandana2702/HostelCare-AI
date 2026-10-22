export const ROLES = {
  STUDENT: 'student',
  WARDEN: 'warden',
  MAINTENANCE: 'maintenance',
  ADMIN: 'admin',
  ADMINISTRATOR: 'administrator'
};

export const ROLE_LABELS = {
  [ROLES.STUDENT]: 'Student',
  [ROLES.WARDEN]: 'Hostel Warden',
  [ROLES.MAINTENANCE]: 'Maintenance Staff',
  [ROLES.ADMIN]: 'System Administrator',
  [ROLES.ADMINISTRATOR]: 'System Administrator'
};

/**
 * Returns the destination dashboard path based on the authenticated user's role.
 * Accurately supports student, warden, maintenance, and both 'admin' and 'administrator'.
 */
export function getDashboardPathForRole(role) {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin' || r === 'administrator') {
    return '/admin/dashboard';
  }
  if (r === 'warden') {
    return '/warden/dashboard';
  }
  if (r === 'maintenance') {
    return '/maintenance/dashboard';
  }
  if (r === 'student') {
    return '/student/dashboard';
  }
  return null;
}

export const WORKFLOW_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  AWAITING_VERIFICATION: 'AWAITING_VERIFICATION',
  CLOSED: 'CLOSED'
};

export const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-400',
    step: 1,
    description: 'Complaint received and registered in the system.'
  },
  PENDING: {
    label: 'Pending Review',
    color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
    step: 2,
    description: 'Reviewed by warden and awaiting staff assignment.'
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'bg-purple-500/20 text-purple-200 border-purple-500/35',
    dotColor: 'bg-purple-400',
    step: 3,
    description: 'Assigned to a maintenance technician.'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/35',
    dotColor: 'bg-indigo-400',
    step: 4,
    description: 'Technician is actively working on resolution.'
  },
  COMPLETED: {
    label: 'Work Done',
    color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotColor: 'bg-cyan-400',
    step: 5,
    description: 'Work completed by technician; pending verification.'
  },
  AWAITING_VERIFICATION: {
    label: 'Awaiting Verification',
    color: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
    dotColor: 'bg-orange-400',
    step: 6,
    description: 'Awaiting student and warden confirmation & feedback.'
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    step: 7,
    description: 'Issue successfully verified, rated and closed.'
  }
};

export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  EMERGENCY: 'EMERGENCY'
};

export const PRIORITY_CONFIG = {
  LOW: {
    label: 'Low',
    color: 'bg-purple-950/50 text-purple-300 border-purple-500/25',
    badge: 'text-purple-400',
    slaHours: 48,
    description: 'Standard maintenance (within 48h)'
  },
  MEDIUM: {
    label: 'Medium',
    color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    badge: 'text-blue-400',
    slaHours: 24,
    description: 'Moderate impact issue (within 24h)'
  },
  HIGH: {
    label: 'High',
    color: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    badge: 'text-amber-400',
    slaHours: 12,
    description: 'Significant inconvenience (within 12h)'
  },
  EMERGENCY: {
    label: 'Emergency',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse',
    badge: 'text-rose-400',
    slaHours: 4,
    description: 'Urgent hazard/safety risk (within 4h)'
  }
};

export const CATEGORIES = [
  { id: 'plumbing', name: 'Plumbing & Water Supply', icon: 'Droplet', defaultSla: 12 },
  { id: 'electrical', name: 'Electrical & Power', icon: 'Zap', defaultSla: 8 },
  { id: 'carpentry', name: 'Carpentry & Furniture', icon: 'Hammer', defaultSla: 24 },
  { id: 'cleaning', name: 'Cleaning & Sanitation', icon: 'Sparkles', defaultSla: 8 },
  { id: 'wifi', name: 'Internet & Wi-Fi', icon: 'Wifi', defaultSla: 12 },
  { id: 'appliance', name: 'Appliance & AC/Geyser', icon: 'Tv', defaultSla: 24 },
  { id: 'pest', name: 'Pest Control', icon: 'Bug', defaultSla: 36 },
  { id: 'security', name: 'Doors, Windows & Locks', icon: 'Shield', defaultSla: 6 },
  { id: 'other', name: 'Other General Maintenance', icon: 'Wrench', defaultSla: 24 }
];

// Canonical hostel block identifiers — used on user profiles, complaints,
// inspections, announcements, and all block-selection dropdowns.
// Update this list whenever the campus hostel structure changes.
export const HOSTEL_BLOCKS = [
  'A Block',   // Men's hostel — one of the oldest blocks on campus
  'B Block',   // Girls' hostel — approx. 15 floors
  'C Block',   // Girls' hostel
  'D1 Block',  // Men's hostel — independent operation
  'D2 Block',  // Men's hostel — independent operation
  'E Block',   // Men's hostel — newer/recently expanded
  'F Block'    // Men's hostel — newer/recently expanded
];

// Per-block metadata used by HostelManagement and anywhere block details
// are displayed. Gender and any known floor counts are captured here;
// contact information (warden name, phone) is stored on the warden's
// Firestore user profile, not hardcoded here.
export const HOSTEL_BLOCK_META = {
  'A Block':  { gender: 'Men',   description: 'One of the oldest blocks on campus' },
  'B Block':  { gender: 'Women', description: 'Approx. 15 floors' },
  'C Block':  { gender: 'Women', description: '' },
  'D1 Block': { gender: 'Men',   description: 'Operates independently' },
  'D2 Block': { gender: 'Men',   description: 'Operates independently' },
  'E Block':  { gender: 'Men',   description: 'Newer / recently expanded accommodation' },
  'F Block':  { gender: 'Men',   description: 'Newer / recently expanded accommodation' }
};
