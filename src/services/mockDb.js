/**
 * HostelCare AI - Local Mock Database Engine
 * Provides persistent state via localStorage with realistic seed data
 * across all 4 roles and full complaint lifecycle stages.
 */

const STORAGE_KEYS = {
  USERS: 'hostelcare_users',
  COMPLAINTS: 'hostelcare_complaints',
  NOTIFICATIONS: 'hostelcare_notifications',
  ANNOUNCEMENTS: 'hostelcare_announcements',
  CALENDAR: 'hostelcare_calendar',
  INSPECTIONS: 'hostelcare_inspections',
  AUDIT_LOGS: 'hostelcare_audit_logs',
  SETTINGS: 'hostelcare_settings'
};

const INITIAL_USERS = [
  {
    uid: 'user_student_1',
    email: 'student@hostelcare.demo',
    displayName: 'Rohan Sharma',
    role: 'student',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    phone: '+91 98765 43210',
    rollNumber: 'CS2023-042',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    uid: 'user_warden_1',
    email: 'warden@hostelcare.demo',
    displayName: 'Dr. S. K. Verma',
    role: 'warden',
    hostelBlock: 'Block A (Boys)',
    roomNumber: 'Warden Office A-01',
    phone: '+91 98765 43211',
    designation: 'Chief Hostel Warden',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    uid: 'user_maint_1',
    email: 'maintenance@hostelcare.demo',
    displayName: 'Ramesh Kumar',
    role: 'maintenance',
    hostelBlock: 'Campus Facilities',
    specialization: 'Plumbing & Electrical',
    phone: '+91 98765 43212',
    activeTasks: 2,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    uid: 'user_maint_2',
    email: 'carpenter@hostelcare.demo',
    displayName: 'Anil Suthar',
    role: 'maintenance',
    hostelBlock: 'Campus Facilities',
    specialization: 'Carpentry & Furniture',
    phone: '+91 98765 43213',
    activeTasks: 1,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    uid: 'user_admin_1',
    email: 'admin@hostelcare.demo',
    displayName: 'Rajesh Administrator',
    role: 'admin',
    hostelBlock: 'Main Administrative Wing',
    phone: '+91 98765 43299',
    designation: 'System Administrator & IT Head',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_COMPLAINTS = [
  {
    id: 'HC-2026-001',
    title: 'Water leakage in washroom pipe',
    description: 'Continuous leaking under the main washroom sink tap causing water logging on the floor.',
    category: 'plumbing',
    priority: 'HIGH',
    status: 'SUBMITTED',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    studentPhone: '+91 98765 43210',
    assignedToId: null,
    assignedToName: null,
    assignedAt: null,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=60',
    slaHours: 12,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint submitted by student.'
      }
    ]
  },
  {
    id: 'HC-2026-002',
    title: 'Ceiling fan making screeching noise & vibrating',
    description: 'The ceiling fan regulator works but the motor emits a loud grinding metal sound and vibrates heavily.',
    category: 'electrical',
    priority: 'MEDIUM',
    status: 'PENDING',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: null,
    assignedToName: null,
    assignedAt: null,
    imageUrl: null,
    slaHours: 24,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint submitted.'
      },
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Acknowledged by Warden. Queued for electrical staff inspection.'
      }
    ]
  },
  {
    id: 'HC-2026-003',
    title: 'Window latch broken and glass rattling',
    description: 'The wooden frame latch is loose and the window blows open during strong winds.',
    category: 'carpentry',
    priority: 'LOW',
    status: 'ASSIGNED',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: 'user_maint_2',
    assignedToName: 'Anil Suthar (Carpentry)',
    assignedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=60',
    slaHours: 48,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint submitted.'
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Assigned to Anil Suthar for hardware replacement.'
      }
    ]
  },
  {
    id: 'HC-2026-004',
    title: 'Wi-Fi access point offline on 3rd Floor Corridor',
    description: 'The router LED is blinking red and no device is obtaining an IP address in rooms 301 to 312.',
    category: 'wifi',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    hostelBlock: 'Block A (Boys)',
    roomNumber: 'Corridor 3F',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: 'user_maint_1',
    assignedToName: 'Ramesh Kumar (Plumbing & Electrical)',
    assignedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    workNotes: 'Replaced patch cable at switch cabinet. Currently configuring DHCP gateway on Cisco AP.',
    imageUrl: null,
    slaHours: 12,
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint logged.'
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Assigned to Ramesh Kumar.'
      },
      {
        status: 'IN_PROGRESS',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        actorName: 'Ramesh Kumar',
        note: 'Diagnosing network switch port and POE injector.'
      }
    ]
  },
  {
    id: 'HC-2026-005',
    title: 'Geyser heating coil burnt out',
    description: 'Geyser tripping MCB when switched on. Water does not heat at all.',
    category: 'appliance',
    priority: 'HIGH',
    status: 'COMPLETED',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: 'user_maint_1',
    assignedToName: 'Ramesh Kumar',
    workNotes: 'Replaced 2000W heating element and safety thermostat. Tested with multimeter, operating normally.',
    slaHours: 24,
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint submitted.'
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Assigned to Ramesh Kumar.'
      },
      {
        status: 'IN_PROGRESS',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actorName: 'Ramesh Kumar',
        note: 'Procured 2000W element from stores.'
      },
      {
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        actorName: 'Ramesh Kumar',
        note: 'Element replaced and tested. Ready for verification.'
      }
    ]
  },
  {
    id: 'HC-2026-006',
    title: 'Room door cylindrical lock cylinder jammed',
    description: 'Key gets stuck inside cylinder and cannot rotate lock deadbolt.',
    category: 'security',
    priority: 'EMERGENCY',
    status: 'AWAITING_VERIFICATION',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: 'user_maint_2',
    assignedToName: 'Anil Suthar (Carpentry)',
    workNotes: 'Replaced brass lock cylinder and provided 3 new keys to student.',
    verifiedByWarden: true,
    verifiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    slaHours: 4,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Emergency ticket logged.'
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Assigned to Anil Suthar immediately.'
      },
      {
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        actorName: 'Anil Suthar',
        note: 'Fitted new cylinder lock.'
      },
      {
        status: 'AWAITING_VERIFICATION',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Warden inspected physical lock and approved. Awaiting student sign-off.'
      }
    ]
  },
  {
    id: 'HC-2026-007',
    title: 'Study table LED tube light flickering',
    description: 'Tubelight tube starter burnt out, flickering continuously.',
    category: 'electrical',
    priority: 'LOW',
    status: 'CLOSED',
    hostelBlock: 'Block A (Boys)',
    roomNumber: '304',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: 'user_maint_1',
    assignedToName: 'Ramesh Kumar',
    workNotes: 'Replaced electronic choke and LED batten.',
    feedback: 'Prompt resolution within 3 hours. Excellent service!',
    rating: 5,
    resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    slaHours: 48,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint submitted.'
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Assigned to Ramesh.'
      },
      {
        status: 'COMPLETED',
        timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
        actorName: 'Ramesh Kumar',
        note: 'Installed new LED batten.'
      },
      {
        status: 'CLOSED',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Student verified and rated 5 stars.'
      }
    ]
  },
  {
    id: 'HC-2026-008',
    title: 'Drinking water cooler compressor leaking refrigerant',
    description: 'Ground floor main water cooler has stopped cooling and emits an oily residue on the floor.',
    category: 'appliance',
    priority: 'EMERGENCY',
    status: 'PENDING',
    isEscalated: true,
    escalationReason: 'Overdue SLA deadline (> 36 hours without staff dispatch). High volume student amenity.',
    hostelBlock: 'Block A (Boys)',
    roomNumber: 'Ground Floor Common Area',
    studentId: 'user_student_1',
    studentName: 'Rohan Sharma',
    studentEmail: 'student@hostelcare.demo',
    assignedToId: null,
    assignedToName: null,
    slaHours: 4,
    createdAt: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        status: 'SUBMITTED',
        timestamp: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
        actorName: 'Rohan Sharma',
        note: 'Complaint registered.'
      },
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        actorName: 'Dr. S. K. Verma',
        note: 'Ticket queued.'
      },
      {
        status: 'PENDING',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        actorName: 'System Escalation Bot',
        note: 'SLA BREACH ALERT: Automatically escalated to Senior Warden and Campus Maintenance Officer.'
      }
    ]
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: 'ann_1',
    title: 'Routine Pest Control & Sanitization Drive',
    content: 'All resident rooms in Block A and Block B will undergo scheduled herbal pest control this Saturday starting 10:00 AM. Please keep food items securely covered.',
    priority: 'HIGH',
    authorName: 'Dr. S. K. Verma (Warden)',
    hostelBlock: 'Block A (Boys)',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ann_2',
    title: 'Overhead Water Tank Cleaning Notice',
    content: 'Water supply will be temporarily shut off between 1:00 PM to 4:30 PM on Thursday for bi-monthly overhead tank scrubbing and chlorine dosing.',
    priority: 'MEDIUM',
    authorName: 'Campus Maintenance Cell',
    hostelBlock: 'All Hostels',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ann_3',
    title: 'Upgraded Wi-Fi 6 Access Points Installed',
    content: 'New dual-band enterprise access points have been activated across all floors. Login using your student roll number credentials for seamless coverage.',
    priority: 'LOW',
    authorName: 'IT Infrastructure Team',
    hostelBlock: 'Block A (Boys)',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_CALENDAR = [
  {
    id: 'cal_1',
    title: 'Water Tank Sanitization',
    category: 'Plumbing',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hostelBlock: 'Block A (Boys)',
    assignedTo: 'Campus Facilities Team',
    status: 'Scheduled'
  },
  {
    id: 'cal_2',
    title: 'Fire Safety & Extinguisher Inspection',
    category: 'Safety',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hostelBlock: 'All Hostels',
    assignedTo: 'Safety Officer',
    status: 'Confirmed'
  },
  {
    id: 'cal_3',
    title: 'Elevator Maintenance & Cable Check',
    category: 'Electrical',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hostelBlock: 'Block A (Boys)',
    assignedTo: 'Otis Technicians',
    status: 'Scheduled'
  }
];

const INITIAL_INSPECTIONS = [
  {
    id: 'insp_1',
    roomNumber: '304',
    hostelBlock: 'Block A (Boys)',
    inspectorName: 'Dr. S. K. Verma',
    cleanlinessRating: 4,
    furnitureCondition: 'Good',
    violationsFound: 'None',
    notes: 'Room maintained in clean order. Balcony clear of debris.',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'insp_2',
    roomNumber: '210',
    hostelBlock: 'Block A (Boys)',
    inspectorName: 'Dr. S. K. Verma',
    cleanlinessRating: 2,
    furnitureCondition: 'Study chair leg chipped',
    violationsFound: 'Electric heating coil used without permit',
    notes: 'Appliance confiscated as per hostel bylaws. Warning issued to room occupants.',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: 'aud_1',
    action: 'COMPLAINT_SUBMITTED',
    actorName: 'Rohan Sharma',
    actorRole: 'student',
    targetId: 'HC-2026-001',
    details: 'Submitted complaint for washroom water leakage.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'aud_2',
    action: 'TASK_ASSIGNED',
    actorName: 'Dr. S. K. Verma',
    actorRole: 'warden',
    targetId: 'HC-2026-003',
    details: 'Assigned window latch repair to Anil Suthar.',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'aud_3',
    action: 'WORK_COMPLETED',
    actorName: 'Ramesh Kumar',
    actorRole: 'maintenance',
    targetId: 'HC-2026-005',
    details: 'Replaced geyser heating coil and completed ticket.',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'aud_4',
    action: 'SLA_ESCALATION',
    actorName: 'System Monitor',
    actorRole: 'system',
    targetId: 'HC-2026-008',
    details: 'Overdue SLA deadline triggered ticket escalation to administration.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    userId: 'user_student_1',
    title: 'Work Completed on Geyser',
    message: 'Technician Ramesh Kumar has marked your geyser repair ticket #HC-2026-005 as completed.',
    complaintId: 'HC-2026-005',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notif_2',
    userId: 'user_student_1',
    title: 'Verification Approved',
    message: 'Warden Dr. Verma approved your lock repair #HC-2026-006. Please confirm resolution and leave your rating.',
    complaintId: 'HC-2026-006',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notif_3',
    userId: 'user_warden_1',
    title: 'SLA Breach: Water Cooler Overdue',
    message: 'Ticket #HC-2026-008 has breached its 4-hour SLA deadline and has been escalated.',
    complaintId: 'HC-2026-008',
    type: 'danger',
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'notif_4',
    userId: 'user_maint_1',
    title: 'New High Priority Ticket Assigned',
    message: 'You have been assigned to Wi-Fi issue #HC-2026-004 in Block A.',
    complaintId: 'HC-2026-004',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to load or initialize from localStorage
function getCollection(key, initialData) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(saved);
  } catch {
    return initialData;
  }
}

function saveCollection(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export const mockDb = {
  // Reset database to initial fresh seed data
  reset() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(INITIAL_CALENDAR));
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(INITIAL_INSPECTIONS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    return true;
  },

  // USERS
  getUsers() {
    return getCollection(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById(uid) {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid);
  },

  createUser(userData) {
    const users = this.getUsers();
    const newUser = {
      uid: userData.uid || `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      ...userData
    };
    users.push(newUser);
    saveCollection(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  updateUser(uid, updates) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.uid === uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      saveCollection(STORAGE_KEYS.USERS, users);
      return users[index];
    }
    return null;
  },

  // COMPLAINTS
  getComplaints() {
    return getCollection(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
  },

  getComplaintById(id) {
    const complaints = this.getComplaints();
    return complaints.find((c) => c.id === id);
  },

  createComplaint(complaintData) {
    const complaints = this.getComplaints();
    const id = `HC-${new Date().getFullYear()}-${String(complaints.length + 1).padStart(3, '0')}`;
    const newComplaint = {
      id,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          status: 'SUBMITTED',
          timestamp: new Date().toISOString(),
          actorName: complaintData.studentName || 'Student',
          note: 'Complaint registered in portal.'
        }
      ],
      ...complaintData
    };
    complaints.unshift(newComplaint);
    saveCollection(STORAGE_KEYS.COMPLAINTS, complaints);

    // Audit log
    this.createAuditLog({
      action: 'COMPLAINT_SUBMITTED',
      actorName: complaintData.studentName || 'Student',
      actorRole: 'student',
      targetId: id,
      details: `Created new complaint: "${newComplaint.title}" for Room ${newComplaint.roomNumber}`
    });

    // Notify Warden
    this.createNotification({
      userId: 'user_warden_1',
      title: 'New Complaint Submitted',
      message: `Room ${newComplaint.roomNumber}: ${newComplaint.title}`,
      complaintId: id,
      type: 'info'
    });

    return newComplaint;
  },

  updateComplaint(id, updates, actorInfo = {}) {
    const complaints = this.getComplaints();
    const index = complaints.findIndex((c) => c.id === id);
    if (index !== -1) {
      const current = complaints[index];
      const updatedHistory = [...(current.history || [])];

      if (updates.status && updates.status !== current.status) {
        updatedHistory.push({
          status: updates.status,
          timestamp: new Date().toISOString(),
          actorName: actorInfo.name || 'System',
          note: updates.statusNote || `Status changed to ${updates.status}`
        });
      }

      complaints[index] = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
        history: updatedHistory
      };
      saveCollection(STORAGE_KEYS.COMPLAINTS, complaints);

      // Audit log
      if (updates.status && updates.status !== current.status) {
        this.createAuditLog({
          action: `STATUS_${updates.status}`,
          actorName: actorInfo.name || 'User',
          actorRole: actorInfo.role || 'user',
          targetId: id,
          details: `Updated status from ${current.status} to ${updates.status}. ${updates.statusNote || ''}`
        });
      }

      return complaints[index];
    }
    return null;
  },

  // NOTIFICATIONS
  getNotifications(userId) {
    const all = getCollection(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!userId) return all;
    return all.filter((n) => n.userId === userId);
  },

  createNotification(notifData) {
    const all = this.getNotifications();
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notifData
    };
    all.unshift(newNotif);
    saveCollection(STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotif;
  },

  markNotificationAsRead(id) {
    const all = this.getNotifications();
    const index = all.findIndex((n) => n.id === id);
    if (index !== -1) {
      all[index].read = true;
      saveCollection(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  },

  markAllNotificationsAsRead(userId) {
    const all = this.getNotifications();
    const updated = all.map((n) => (n.userId === userId ? { ...n, read: true } : n));
    saveCollection(STORAGE_KEYS.NOTIFICATIONS, updated);
  },

  // ANNOUNCEMENTS
  getAnnouncements() {
    return getCollection(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  createAnnouncement(annData) {
    const all = this.getAnnouncements();
    const newAnn = {
      id: `ann_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...annData
    };
    all.unshift(newAnn);
    saveCollection(STORAGE_KEYS.ANNOUNCEMENTS, all);
    return newAnn;
  },

  deleteAnnouncement(id) {
    const all = this.getAnnouncements();
    const filtered = all.filter((a) => a.id !== id);
    saveCollection(STORAGE_KEYS.ANNOUNCEMENTS, filtered);
  },

  // CALENDAR
  getCalendarEvents() {
    return getCollection(STORAGE_KEYS.CALENDAR, INITIAL_CALENDAR);
  },

  createCalendarEvent(eventData) {
    const all = this.getCalendarEvents();
    const newEvent = {
      id: `cal_${Date.now()}`,
      ...eventData
    };
    all.push(newEvent);
    saveCollection(STORAGE_KEYS.CALENDAR, all);
    return newEvent;
  },

  // INSPECTIONS
  getInspections() {
    return getCollection(STORAGE_KEYS.INSPECTIONS, INITIAL_INSPECTIONS);
  },

  createInspection(inspData) {
    const all = this.getInspections();
    const newInsp = {
      id: `insp_${Date.now()}`,
      date: new Date().toISOString(),
      ...inspData
    };
    all.unshift(newInsp);
    saveCollection(STORAGE_KEYS.INSPECTIONS, all);
    return newInsp;
  },

  // AUDIT LOGS
  getAuditLogs() {
    return getCollection(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  createAuditLog(logData) {
    const all = this.getAuditLogs();
    const newLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...logData
    };
    all.unshift(newLog);
    // Keep last 200 logs
    if (all.length > 200) all.length = 200;
    saveCollection(STORAGE_KEYS.AUDIT_LOGS, all);
    return newLog;
  }
};
