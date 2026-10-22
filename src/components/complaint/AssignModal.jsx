import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { PRIORITIES } from '../../utils/constants';
import { X, UserCheck } from 'lucide-react';

export default function AssignModal({ complaint, isOpen, onClose, onConfirm }) {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState(complaint?.priority || 'MEDIUM');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      userService.getMaintenanceStaff().then((list) => {
        setStaffList(list);
        if (complaint?.assignedToId) {
          setSelectedStaffId(complaint.assignedToId);
        } else if (list.length > 0) {
          setSelectedStaffId(list[0].uid);
        }
      }).catch((err) => console.error('Error loading staff for assignment:', err));
      setPriority(complaint?.priority || 'MEDIUM');
      setOverrideReason('');
      setNotes('');
    }
  }, [isOpen, complaint]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.uid === selectedStaffId);
    if (!staff) return;

    setLoading(true);
    try {
      await onConfirm(complaint.id, staff, notes, priority, overrideReason);
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
              <UserCheck className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {complaint.assignedToId ? 'Reassign Maintenance Staff' : 'Assign Complaint'}
              </h3>
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
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
              Select Maintenance Technician
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
            >
              {staffList.length === 0 ? (
                <option value="">No maintenance staff registered yet</option>
              ) : (
                staffList.map((staff) => (
                  <option key={staff.uid} value={staff.uid}>
                    {staff.displayName || staff.name} ({staff.specialization || 'General Maintenance'})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-300/80">
                Operational Priority
              </label>
              {complaint.priority && priority !== complaint.priority && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2 py-0.5 rounded-full">
                  Priority Override ({complaint.priority} → {priority})
                </span>
              )}
            </div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
            >
              {Object.keys(PRIORITIES).map((p) => (
                <option key={p} value={p}>
                  {p} {complaint.priority && p === complaint.priority ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* If priority is changed from current complaint priority, prompt for justification */}
          {complaint.priority && priority !== complaint.priority && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Reason for Priority Override *
              </label>
              <input
                type="text"
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Physical inspection showed higher urgency than reported; exam week"
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-500/30 bg-purple-950/60 text-white placeholder-amber-200/40 outline-none focus:border-amber-400"
              />
              <p className="text-[10px] text-amber-300/70">
                This override will be documented with your credentials and timestamp, keeping the objective AI severity score decoupled.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
              Assignment Instructions / Scope of Work
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Check pipe joints under sink; take replacement washer from storage."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 resize-none"
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
              disabled={loading || staffList.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white rounded-xl btn-primary-purple disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
