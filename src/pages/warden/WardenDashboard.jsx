import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import StatCard from '../../components/common/StatCard';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import AssignModal from '../../components/complaint/AssignModal';
import VerifyModal from '../../components/complaint/VerifyModal';
import MaintenanceIntelligencePanel from '../../components/intelligence/MaintenanceIntelligencePanel';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  UserCheck,
  AlertTriangle,
  Flame,
  Calendar,
  ClipboardCheck,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { isOverdue } from '../../utils/dateUtils';

export default function WardenDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedAssignComplaint, setSelectedAssignComplaint] = useState(null);
  const [selectedVerifyComplaint, setSelectedVerifyComplaint] = useState(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const list = await complaintService.getComplaints();
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleAssignConfirm = async (compId, staff, notes, newPriority, overrideReason = '') => {
    await complaintService.assignComplaint(
      compId,
      staff,
      notes,
      newPriority,
      {
        uid: currentUser?.uid,
        name: currentUser?.displayName || 'Warden',
        role: 'warden'
      },
      overrideReason
    );
    setSelectedAssignComplaint(null);
    loadComplaints();
  };

  const handleVerifyConfirm = async (compId, isApproved, comments) => {
    await complaintService.verifyComplaint(compId, isApproved, comments, {
      uid: currentUser?.uid,
      name: currentUser?.displayName || 'Warden',
      role: 'warden'
    });
    setSelectedVerifyComplaint(null);
    loadComplaints();
  };

  const handleRecurrenceDecision = async (compId, decision, notes) => {
    await complaintService.updateRecurrenceDecision(compId, decision, notes, {
      uid: currentUser?.uid,
      name: currentUser?.displayName || 'Warden',
      role: 'warden'
    });
    await loadComplaints();
  };

  const handlePriorityOverride = async (compId, newPriority, reason, originalRecommendation) => {
    await complaintService.updateComplaintPriority(compId, newPriority, reason, originalRecommendation, {
      uid: currentUser?.uid,
      name: currentUser?.displayName || 'Warden',
      role: 'warden'
    });
    await loadComplaints();
  };

  // Metrics
  const total = complaints.length;
  const pendingAssignment = complaints.filter((c) =>
    ['SUBMITTED', 'PENDING'].includes(c.status)
  ).length;
  const inProgress = complaints.filter((c) =>
    ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)
  ).length;
  const awaitingVerification = complaints.filter(
    (c) => c.status === 'COMPLETED'
  ).length;
  const escalated = complaints.filter(
    (c) =>
      c.isEscalated ||
      isOverdue(c.createdAt, c.slaHours || 24, c.status)
  ).length;

  const urgentQueue = complaints.filter(
    (c) =>
      c.isEscalated ||
      c.priority === 'EMERGENCY' ||
      isOverdue(c.createdAt, c.slaHours || 24, c.status)
  );

  const verificationQueue = complaints.filter((c) => c.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/15 text-purple-300">
            Hostel Warden Control Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 text-white">
            Warden Oversight Dashboard
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-purple-300/70">
            Managing maintenance dispatch and resident satisfaction for {currentUser?.hostelBlock}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/warden/inspections')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/25 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ClipboardCheck className="w-4 h-4 text-purple-400" /> Log Inspection
          </button>
          <button
            onClick={() => navigate('/warden/calendar')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/25 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4 text-purple-400" /> Calendar
          </button>
          <button
            onClick={() => navigate('/warden/announcements')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 btn-primary-purple shadow-md transition-colors"
          >
            <Megaphone className="w-4 h-4" /> Post Notice
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Complaints"
          value={total}
          icon={Clock}
          color="purple"
          subtext="Total hostel tickets logged"
        />
        <StatCard
          title="Pending Dispatch"
          value={pendingAssignment}
          icon={UserCheck}
          color="amber"
          subtext="Requires technician assignment"
          onClick={() => navigate('/warden/complaints')}
        />
        <StatCard
          title="Active Repairs"
          value={inProgress}
          icon={Wrench}
          color="blue"
          subtext="Assigned or in progress"
        />
        <StatCard
          title="Needs Sign-off"
          value={awaitingVerification}
          icon={ShieldCheck}
          color="mint"
          subtext="Technician finished; awaiting signoff"
        />
        <StatCard
          title="SLA Risk / Escalated"
          value={escalated}
          icon={Flame}
          color="rose"
          subtext="Exceeded target resolution hours"
        />
      </div>

      {/* SLA Breach / Overdue Alert Banner */}
      {urgentQueue.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Urgent Attention / SLA Breached Tickets ({urgentQueue.length})</span>
            </div>
            <button
              onClick={() => navigate('/warden/complaints')}
              className="text-xs text-rose-300 hover:text-white font-bold transition-colors"
            >
              View in complaints table →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {urgentQueue.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="bg-[#181135]/90 p-3.5 rounded-xl border border-rose-500/30 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-rose-400">
                      #{item.id}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/70 mt-0.5 truncate">
                    Room {item.roomNumber} • {item.hostelBlock} • {item.priority}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssignComplaint(item)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs transition-colors"
                >
                  {item.assignedToId ? 'Reassign' : 'Assign Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Intelligence Panel (Recurrence Detection & Explainable Prioritization) */}
      <MaintenanceIntelligencePanel
        complaints={complaints}
        currentBlock={currentUser?.hostelBlock || 'All Hostels'}
        currentUser={currentUser}
        onRecurrenceDecision={handleRecurrenceDecision}
        onPriorityOverride={handlePriorityOverride}
      />

      {/* Pending Quality Verification Queue */}
      {verificationQueue.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-200">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Quality Verification Queue (Repairs Finished by Staff)</span>
            </div>
            <span className="text-xs font-bold text-purple-300">
              {verificationQueue.length} pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verificationQueue.map((comp) => (
              <div
                key={comp.id}
                className="bg-[#150f2e] p-4 rounded-xl border border-purple-500/25 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-purple-300/60">#{comp.id}</span>
                    <span className="font-bold text-purple-200">Room {comp.roomNumber}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{comp.title}</h4>
                  <p className="text-[11px] text-purple-300/70 mt-1 italic line-clamp-2">
                    Work notes: "{comp.workNotes || 'Technician completed repairs.'}"
                  </p>
                  <p className="text-[10px] text-purple-400 mt-1">
                    Technician: {comp.assignedToName || 'Assigned Staff'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVerifyComplaint(comp)}
                  className="mt-3.5 w-full py-1.5 text-white rounded-lg text-xs font-bold btn-primary-purple shadow-sm transition-colors"
                >
                  Inspect &amp; Verify
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Hostel Complaints */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">All Hostel Complaints</h2>
            <p className="text-xs text-purple-300/70">Live feed across all rooms in your hostel block</p>
          </div>
          <button
            onClick={() => navigate('/warden/complaints')}
            className="text-xs font-bold flex items-center gap-1 text-purple-300 hover:text-white transition-colors"
          >
            <span>Open complaints console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-purple-300/60 animate-pulse">Loading complaints...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.slice(0, 6).map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                currentUser={currentUser}
                onAssign={(comp) => setSelectedAssignComplaint(comp)}
                onVerify={(comp) => setSelectedVerifyComplaint(comp)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AssignModal
        complaint={selectedAssignComplaint}
        isOpen={Boolean(selectedAssignComplaint)}
        onClose={() => setSelectedAssignComplaint(null)}
        onConfirm={handleAssignConfirm}
      />

      <VerifyModal
        complaint={selectedVerifyComplaint}
        isOpen={Boolean(selectedVerifyComplaint)}
        onClose={() => setSelectedVerifyComplaint(null)}
        onConfirm={handleVerifyConfirm}
      />
    </div>
  );
}
