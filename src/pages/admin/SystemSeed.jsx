import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, AlertTriangle } from 'lucide-react';

export default function SystemSeed() {
  const { isFirebaseConfigured } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1
          className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2"
          style={{ color: 'var(--hc-dark-sage)' }}
        >
          <Database className="w-6 h-6" style={{ color: 'var(--hc-pastel-blue)' }} />
          Database Information
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Cloud Firestore connection status and database configuration
        </p>
      </div>

      {/* Mode Status Card */}
      <div
        className="bg-white rounded-2xl p-6 shadow-xs"
        style={{ border: '1px solid var(--hc-pale-sage)' }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--hc-dark-sage)' }}>
          Active Database Connection
        </h3>

        <div
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'var(--hc-pale-mint)', border: '1px solid var(--hc-pale-sage)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isFirebaseConfigured
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--hc-dark-sage)' }}>
                {isFirebaseConfigured
                  ? 'Connected to Live Cloud Firestore'
                  : 'Firebase Setup Required'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isFirebaseConfigured
                  ? 'Data writes and reads sync directly to Google Cloud Firestore.'
                  : 'Connect Firebase credentials in your environment configuration.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Integrity Notice */}
      {isFirebaseConfigured && (
        <div
          className="rounded-2xl p-5 flex gap-3"
          style={{ background: 'var(--hc-warm-cream)', border: '1px solid var(--hc-pale-sage)' }}
        >
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Live Database Protection</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Automated database seeding and mock users are disabled. Real student queries filter strictly
              by authenticated UID, ensuring complete privacy, zero cross-tenant leakage, and full integrity.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


