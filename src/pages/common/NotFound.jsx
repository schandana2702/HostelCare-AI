import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20 shadow-lg shadow-purple-950/50">
        <HelpCircle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-black text-white tracking-tight">404 – Page Not Found</h1>
      <p className="text-xs sm:text-sm text-purple-300/70 mt-2 max-w-sm">
        The requested resource or page could not be located in HostelCare AI.
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 btn-primary-purple px-6 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </button>
    </div>
  );
}
