import React from 'react';
import { Database, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';

/**
 * FirebaseSetupRequired
 * Shown when VITE_FIREBASE_API_KEY (and other credentials) are not configured.
 * This is a professional setup guide — NOT a demo mode fallback.
 */
export default function FirebaseSetupRequired() {
  const steps = [
    {
      n: 1,
      title: 'Create a Firebase Project',
      body: 'Go to console.firebase.google.com → Add project → follow the wizard.'
    },
    {
      n: 2,
      title: 'Enable Email/Password Authentication',
      body: 'Firebase Console → Authentication → Sign-in method → Email/Password → Enable.'
    },
    {
      n: 3,
      title: 'Create a Firestore Database',
      body: 'Firebase Console → Firestore Database → Create database → Deploy firestore.rules.'
    },
    {
      n: 4,
      title: 'Enable Firebase Storage',
      body: 'Firebase Console → Storage → Get Started → Deploy storage.rules.'
    },
    {
      n: 5,
      title: 'Copy Your Web App Credentials',
      body: 'Project Settings → General → Your apps → Web app (</>) → SDK setup → copy config values.'
    },
    {
      n: 6,
      title: 'Fill in .env',
      body: 'Edit the .env file in the project root with your Firebase project credentials. Set VITE_ENABLE_DEMO_MODE=false.',
      code: true
    },
    {
      n: 7,
      title: 'Bootstrap First Administrator',
      body: 'In Firebase Console → Authentication, add your Admin email. Then in Firestore /users collection, create a document with the same UID and set role: "admin", status: "active", displayName: "Administrator".'
    },
    {
      n: 8,
      title: 'Deploy Cloud Functions',
      body: 'Run: firebase deploy --only functions to enable secure staff and warden account creation from the Admin portal.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 bg-[#0B0816] text-[#D8D4EC] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center text-purple-300 bg-purple-500/15 border border-purple-500/30 shadow-xl shadow-purple-950/50 mb-5">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Firebase Setup Required
          </h1>
          <p className="mt-2 text-sm text-purple-300/70">
            HostelCare AI requires a configured Firebase project to operate.
          </p>
        </div>

        {/* Warning box */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 mb-6">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="text-xs font-bold text-amber-300">
              Firebase credentials are not configured
            </p>
            <p className="text-[11px] mt-0.5 text-amber-200/80 leading-relaxed">
              The application cannot authenticate users or store data until Firebase is set up.
              Follow the steps below to complete the configuration.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="glass-card rounded-3xl border border-purple-500/20 p-6 sm:p-8 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-200">
            Setup Instructions
          </h2>

          <div className="space-y-4">
            {steps.map((s) => (
              <div key={s.n} className="flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black bg-purple-600 shrink-0 mt-0.5 shadow-xs shadow-purple-600/50">
                  {s.n}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{s.title}</p>
                  <p className="text-[11px] mt-0.5 text-purple-300/70 leading-relaxed">{s.body}</p>
                  {s.code && (
                    <pre className="mt-2 p-3 rounded-xl text-[11px] font-mono border border-purple-500/20 bg-purple-950/60 text-purple-200 overflow-x-auto">{`VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ENABLE_DEMO_MODE=false`}</pre>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* After setup */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-purple-500/25 bg-purple-950/40 mt-3">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <p className="text-[11px] text-purple-200/80 leading-relaxed">
              After configuring Firebase credentials in .env, the login screen will appear and all services will sync directly to live Cloud Firestore.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
          >
            Open Firebase Console <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <p className="mt-8 text-center text-[11px] text-purple-300/50 font-mono">
          HostelCare AI — Smart Hostel Complaint &amp; Maintenance Management System
        </p>
      </div>
    </div>
  );
}
