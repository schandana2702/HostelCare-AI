import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Sidebar from '../common/Sidebar';
import MobileBottomNav from '../common/MobileBottomNav';
import PwaInstallPrompt from '../common/PwaInstallPrompt';
import ErrorBoundary from '../common/ErrorBoundary';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0816] text-[#F3F0FA] ambient-glow relative overflow-x-hidden">
      {/* Decorative ambient top glow orb */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] z-0" 
        aria-hidden="true"
      />

      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full hc-enter">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <MobileBottomNav />
      <PwaInstallPrompt />
    </div>
  );
}
