import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';
import FirebaseSetupRequired from './pages/common/FirebaseSetupRequired';
import { isFirebaseConfigured } from './services/firebase';

/**
 * Gate component: if Firebase is not configured, show setup guide instead of the app.
 * This replaces the old "Demo Mode" fallback with a professional administrator notice.
 */
function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--hc-canvas, #FAFBF9)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#DAEBE3', borderTopColor: '#99CDD8' }}
        />
        <p className="text-xs font-semibold" style={{ color: '#657166' }}>
          Starting HostelCare AI...
        </p>
      </div>
    );
  }

  return <AppRoutes />;
}

function App() {
  // If Firebase is not configured, show the setup guide — no mock/demo fallback
  if (!isFirebaseConfigured) {
    return (
      <ErrorBoundary>
        <FirebaseSetupRequired />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
