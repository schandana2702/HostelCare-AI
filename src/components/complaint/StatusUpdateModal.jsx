import React, { useState } from 'react';
import { X, Wrench, CheckCircle2 } from 'lucide-react';

export default function StatusUpdateModal({ complaint, isOpen, onClose, onConfirm }) {
  const [targetStatus, setTargetStatus] = useState(
    complaint?.status === 'ASSIGNED' ? 'IN_PROGRESS' : 'COMPLETED'
  );
  const [workNotes, setWorkNotes] = useState(complaint?.workNotes || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(complaint.id, targetStatus, workNotes);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#150f2e] w-full max-w-lg rounded-3xl shadow-2xl border border-purple-500/25 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Wrench className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Update Work Progress</h3>
              <p className="text-xs text-purple-300/60">Ticket #{complaint.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-2">
              Select Updated Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetStatus('IN_PROGRESS')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  targetStatus === 'IN_PROGRESS'
                    ? 'border-purple-400 bg-purple-600/25 text-white ring-2 ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                    : 'border-purple-500/20 bg-purple-950/30 hover:bg-purple-900/30 text-purple-200/70'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                  <Wrench className="w-3.5 h-3.5 text-purple-400" /> In Progress
                </div>
                <p className="text-[11px] text-purple-300/60 mt-1">
                  Currently inspecting or actively repairing
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus('COMPLETED')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  targetStatus === 'COMPLETED'
                    ? 'border-emerald-400 bg-emerald-600/25 text-white ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : 'border-purple-500/20 bg-purple-950/30 hover:bg-purple-900/30 text-purple-200/70'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Work Completed
                </div>
                <p className="text-[11px] text-purple-300/60 mt-1">
                  Repair finished; submit for verification
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
              Work Notes / Materials Used
            </label>
            <textarea
              rows={4}
              required
              value={workNotes}
              onChange={(e) => setWorkNotes(e.target.value)}
              placeholder="e.g., Replaced 1/2-inch brass ball valve and sealed threads with Teflon tape. Checked water pressure, no leaks observed."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-500/15 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl btn-primary-purple disabled:opacity-50 transition-colors shadow-md"
            >
              {loading ? 'Saving...' : 'Save Work Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
