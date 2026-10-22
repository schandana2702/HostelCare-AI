# HostelCare AI – Smart Hostel Complaint and Maintenance Management System

> A modern, responsive, installable PWA and Android-ready college Software Engineering project built with **React, Vite, Tailwind CSS, and Firebase**.

---

## 🌟 Key Highlights & Engineering Features

- **7-Stage Complaint Workflow Engine**:
  `SUBMITTED` → `PENDING` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` → `AWAITING_VERIFICATION` → `CLOSED`
- **4 Distinct Role Portals**:
  1. **Student / Resident**: Register, submit complaints with optional photo, track live 7-step timeline stepper, receive notifications, confirm resolution, rate service (1-5 stars).
  2. **Hostel Warden**: Hostel overview dashboard, assign & reassign complaints to technicians with instructions and priority overrides, monitor overdue SLA breaches, verify physical repair quality before sign-off, record room inspections, schedule preventive maintenance, post hostel notices.
  3. **Maintenance Staff**: Dedicated technician console, review assigned tickets, log diagnostic & work notes, record replacement parts used, signal completion.
  4. **System Administrator**: System-wide complaints master registry, CSV report export, user role management & account status toggling, category & SLA configuration, immutable system audit logs, 1-click cloud database seeder.
- **Zero-Cost Smart AI Assistant**:
  Client-side heuristic NLP triage classifier that analyzes complaints in real-time, predicts category, calculates an urgency score (1-100), recommends priority (`EMERGENCY`, `HIGH`, `MEDIUM`, `LOW`), and provides 1-click auto-fill. (Zero external paid APIs, 100% free tier compatible).
- **Dual-Mode Persistence Architecture**:
  - **Connected Mode**: Seamlessly syncs with Firebase Authentication, Cloud Firestore, and Firebase Storage when credentials are provided in `.env`.
  - **Demo / Standalone Mode**: Pre-populated with realistic students, wardens, maintenance staff, active tickets across all 7 stages, announcements, calendar items, and audit logs. Allows immediate offline testing and flawless college demonstrations!
- **PWA & Mobile Installable**:
  Web App Manifest (`manifest.json`), service worker (`sw.js`) offline caching shell, install prompt banner.
- **Capacitor Ready**:
  Configured with `@capacitor/core` and `@capacitor/cli` (`capacitor.config.json`) ready for one-command Android APK generation (`npx cap add android`).
- **Production Security Rules**:
  Role-Based Access Control enforced in `firestore.rules` and `storage.rules`.

---

## 🚀 Quick Start & How to Run

### 1. Install Dependencies (Already installed)
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 🧪 Testing Each User Role (Demo Accounts)

The login screen includes **1-Click Quick Demo Login buttons** so you can jump straight into any role:

| Role | Demo Account Email | Password | What to Test |
|---|---|---|---|
| **Student** | `student@hostelcare.demo` | `password123` | Submit complaint with AI helper, view complaint timeline, verify completed ticket, rate with 5 stars. |
| **Hostel Warden** | `warden@hostelcare.demo` | `password123` | Assign technician to ticket, review completed work and click "Verify Resolution", log room inspection, view maintenance calendar. |
| **Maintenance Staff** | `maintenance@hostelcare.demo` | `password123` | View assigned tickets, click "Update Status", add work notes, mark work as "Completed". |
| **System Administrator** | `admin@hostelcare.demo` | `password123` | View analytics, export master CSV report, manage user roles, review immutable audit trail, run Cloud DB Seeder. |

> **Pro Tip**: Use the **"Role Switcher"** dropdown in the top navigation bar at any time to instantly switch between roles without logging out!

---

## ☁️ Connecting Your Live Firebase Project (Optional)

If you wish to connect your live Google Firebase project:

1. Visit [Firebase Console](https://console.firebase.google.com/) and create a free project.
2. In the Firebase Console:
   - **Authentication**: Enable the **Email/Password** sign-in provider.
   - **Cloud Firestore**: Click **Create Database** (in test mode or deploy `firestore.rules`).
   - **Firebase Storage**: Click **Get Started** (deploy `storage.rules`).
3. Under **Project Settings > General > Your apps**, register a Web App (`</>`) and copy your configuration into your `.env` file:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:...
   VITE_FIREBASE_MEASUREMENT_ID=G-...
   VITE_ENABLE_DEMO_MODE=false
   ```
4. Log in as Administrator (`admin@hostelcare.demo`), navigate to **Cloud DB Seeder** in the menu, and click **Populate Sample Data** to automatically populate Firestore with initial users and tickets!

---

## 📱 Packaging as an Android APK (Capacitor)

1. Build the production web distribution:
   ```bash
   npm run build
   ```
2. Initialize Android platform:
   ```bash
   npx cap add android
   ```
3. Sync web assets to Android:
   ```bash
   npx cap sync
   ```
4. Open project in Android Studio to build APK:
   ```bash
   npx cap open android
   ```

---

## 📂 Project Architecture

```
src/
├── components/
│   ├── ai/
│   │   └── SmartAssistant.jsx        # Real-time AI categorization & urgency triage
│   ├── common/
│   │   ├── Navbar.jsx                # Top bar with demo role switcher & notifications
│   │   ├── Sidebar.jsx               # Responsive role-based sidebar + mobile drawer
│   │   ├── StatCard.jsx              # Reusable metric card
│   │   ├── StatusBadge.jsx           # Workflow status badges with semantic colors
│   │   ├── PriorityBadge.jsx         # Priority indicator (Emergency, High, etc.)
│   │   ├── NotificationBell.jsx      # In-app notifications popover
│   │   └── PwaInstallPrompt.jsx      # PWA install banner
│   └── complaint/
│       ├── ComplaintCard.jsx         # Interactive complaint card with actions
│       ├── ComplaintTimeline.jsx     # Visual 7-step progression stepper
│       ├── ComplaintFilter.jsx       # Multi-criteria search and filter
│       ├── AssignModal.jsx           # Warden dispatch modal
│       ├── StatusUpdateModal.jsx     # Technician progress & notes modal
│       ├── VerifyModal.jsx           # Warden quality inspection modal
│       └── FeedbackModal.jsx         # Student 1-5 star rating modal
├── context/
│   ├── AuthContext.jsx               # Firebase Auth + 1-click demo role switching
│   └── NotificationContext.jsx       # Real-time notifications & toasts
├── pages/
│   ├── auth/                         # Login & Register pages
│   ├── student/                      # Student dashboard, submit, list, detail
│   ├── warden/                       # Warden dashboard, complaints, calendar, inspections, notices
│   ├── maintenance/                  # Technician dashboard, tasks, work history
│   └── admin/                        # Admin dashboard, users, export, settings, audit, seed
├── services/
│   ├── firebase.js                   # Firebase SDK initialization with fallback check
│   ├── mockDb.js                     # Local storage fallback database
│   ├── complaintService.js           # Unified Firestore / mock complaints layer
│   ├── aiService.js                  # Zero-cost NLP heuristic classifier
│   └── seedService.js                # Cloud Firestore seeder
├── routes/
│   ├── AppRoutes.jsx                 # Route definitions and role guards
│   └── ProtectedRoute.jsx            # Guarded route wrapper
├── utils/
│   ├── constants.js                  # Statuses, categories, priorities, blocks
│   └── dateUtils.js                  # SLA calculation & date formatting
├── App.jsx                           # Root application entry
├── index.css                         # Tailwind v4 core styles
└── main.jsx                          # DOM bootstrap
```
