import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import StatCard from '../../components/common/StatCard';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import StatusUpdateModal from '../../components/complaint/StatusUpdateModal';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { isOverdue } from '../../utils/dateUtils';

export default function MaintenanceDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const loadComplaints = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const list = await complaintService.getComplaints({
        assignedToId: currentUser.uid
      });
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load maintenance tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentUser]);

  const handleStatusConfirm = async (compId, status, notes) => {
    await complaintService.updateStatus(compId, status, notes, {
      name: currentUser.displayName,
      role: 'maintenance'
    });
    setSelectedComplaint(null);
    loadComplaints();
  };

  const total = complaints.length;
  const pendingAction = complaints.filter((c) => c.status === 'ASSIGNED').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const completed = complaints.filter((c) =>
    ['COMPLETED', 'AWAITING_VERIFICATION', 'CLOSED'].includes(c.status)
  ).length;

  const urgentTasks = complaints.filter(
    (c) =>
      ['ASSIGNED', 'IN_PROGRESS'].includes(c.status) &&
      (c.priority === 'EMERGENCY' || c.priority === 'HIGH' || isOverdue(c.createdAt, c.slaHours || 24, c.status))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl text-white p-6 sm:p-8 relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 mb-3">
            <Wrench className="w-3.5 h-3.5 text-purple-400" />
            <span>Technician Service Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome, {currentUser?.displayName}
          </h1>
          <p className="text-xs sm:text-sm mt-1.5 text-purple-200/70 leading-relaxed">
            Specialization: <span className="font-semibold text-purple-300">{currentUser?.specialization || 'Facilities Maintenance'}</span>.
            Review assigned repairs, record diagnostic notes, and signal completed work for warden sign-off.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/maintenance/tasks')}
              className="btn-primary-purple px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/30"
            >
              <Wrench className="w-4 h-4" /> View Assigned Work ({pendingAction + inProgress})
            </button>
            <button
              onClick={() => navigate('/maintenance/history')}
              className="px-4 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 text-xs font-semibold transition-all flex items-center gap-2 border border-purple-500/30 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Completed Jobs ({completed})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Tasks"
          value={total}
          icon={Wrench}
          color="blue"
          subtext="Total tasks routed to you"
        />
        <StatCard
          title="Pending Start"
          value={pendingAction}
          icon={Clock}
          color="amber"
          subtext="Newly assigned, needs inspection"
          onClick={() => navigate('/maintenance/tasks')}
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={Wrench}
          color="purple"
          subtext="Actively undergoing repairs"
        />
        <StatCard
          title="Successfully Completed"
          value={completed}
          icon={CheckCircle}
          color="emerald"
          subtext="Repairs closed or verified"
          onClick={() => navigate('/maintenance/history')}
        />
      </div>

      {/* Urgent Jobs Section */}
      {urgentTasks.length > 0 && (
        <div className="glass-card rounded-3xl p-6 border border-rose-500/30 bg-rose-950/15 relative overflow-hidden">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider mb-4">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>High Priority &amp; SLA Attention Jobs ({urgentTasks.length})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentTasks.map((t) => (
              <div
                key={t.id}
                className="glass-card p-4 rounded-2xl border border-rose-500/25 bg-purple-950/40 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-rose-400">#{t.id.slice(0, 8)}</span>
                  <h4 className="text-sm font-bold text-white line-clamp-1 mt-0.5">{t.title}</h4>
                  <p className="text-[11px] text-purple-300/70 mt-0.5">
                    Room {t.roomNumber} ({t.hostelBlock}) • Priority: <span className="text-rose-400 font-medium">{t.priority}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedComplaint(t)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-md shadow-rose-600/30"
                >
                  Update
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Tasks Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Active Work Queue</h2>
            <p className="text-xs text-purple-300/60">Tickets assigned to you for inspection and repair</p>
          </div>
          <button
            onClick={() => navigate('/maintenance/tasks')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>All tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-purple-300/50">Loading your tasks...</div>
        ) : complaints.filter((c) => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length === 0 ? (
          <div className="glass-card rounded-3xl border border-purple-500/15 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">All Caught Up!</h3>
            <p className="text-xs mt-1 text-purple-300/60 max-w-sm mx-auto">
              You have no pending maintenance tickets in your active queue right now.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {complaints
              .filter((c) => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status))
              .map((comp) => (
                <ComplaintCard
                  key={comp.id}
                  complaint={comp}
                  currentUser={currentUser}
                  onUpdateStatus={(c) => setSelectedComplaint(c)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        complaint={selectedComplaint}
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}
