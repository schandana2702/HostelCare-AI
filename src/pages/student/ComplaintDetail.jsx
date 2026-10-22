import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import ComplaintTimeline from '../../components/complaint/ComplaintTimeline';
import AssignModal from '../../components/complaint/AssignModal';
import StatusUpdateModal from '../../components/complaint/StatusUpdateModal';
import VerifyModal from '../../components/complaint/VerifyModal';
import FeedbackModal from '../../components/complaint/FeedbackModal';
import PriorityRecommendationModal from '../../components/intelligence/PriorityRecommendationModal';
import { calculatePriorityRecommendation } from '../../services/intelligenceService';
import { formatDateTime, timeAgo, isOverdue } from '../../utils/dateUtils';
import { getFriendlyComplaintId } from '../../utils/complaintUtils';
import {
  ArrowLeft,
  MapPin,
  Tag,
  User,
  Clock,
  Wrench,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Star,
  ExternalLink,
  Flame,
  Sparkles
} from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [actionSuccess, setActionSuccess] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const recommendation = useMemo(() => {
    return complaint ? calculatePriorityRecommendation(complaint, [complaint]) : null;
  }, [complaint]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await complaintService.getComplaintById(id);
      setComplaint(data);
    } catch (err) {
      console.error('Failed to load complaint detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-purple-950/60 rounded-lg" />
        <div className="glass-card rounded-3xl p-8 space-y-6 border border-purple-500/20">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-purple-950/60 rounded-md" />
            <div className="h-8 w-3/4 bg-purple-950/60 rounded-xl" />
          </div>
          <div className="h-24 bg-purple-950/40 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-40 bg-purple-950/40 rounded-2xl" />
            <div className="h-40 bg-purple-950/40 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-white">Complaint Not Found</h3>
        <p className="text-xs sm:text-sm mt-1 max-w-sm mx-auto text-purple-300/70">
          Ticket #{getFriendlyComplaintId(id)} could not be located in the system. It may have been archived or the ID is incorrect.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-950/40 text-purple-200 hover:text-white transition-colors"
          >
            ← Go Back
          </button>
          <button
            onClick={() => {
              if (currentUser?.role === 'student') navigate('/student/complaints');
              else if (currentUser?.role === 'warden') navigate('/warden/complaints');
              else if (currentUser?.role === 'maintenance') navigate('/maintenance/tasks');
              else navigate('/admin/complaints');
            }}
            className="px-5 py-2.5 text-white rounded-xl text-xs font-bold btn-primary-purple shadow-md transition-colors"
          >
            Browse All Complaints
          </button>
        </div>
      </div>
    );
  }

  // Role authorization: Students can only view their own complaints
  if (
    currentUser?.role === 'student' &&
    complaint.studentId &&
    currentUser.uid &&
    complaint.studentId !== currentUser.uid
  ) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-rose-300">ACCESS RESTRICTED</h3>
        <p className="text-xs sm:text-sm mt-1 max-w-sm mx-auto text-purple-300/70">
          For student privacy and security, you are only authorized to view complaints submitted by your own student account.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/student/complaints')}
            className="px-5 py-2.5 text-white rounded-xl text-xs font-bold btn-primary-purple shadow-md"
          >
            Return to My Complaints
          </button>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-4 py-2.5 border border-purple-500/30 bg-purple-950/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-colors"
          >
            Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(
    complaint.createdAt,
    complaint.slaHours || 24,
    complaint.status
  );

  // Actions handlers
  const handleAssignConfirm = async (compId, staff, notes, newPriority, overrideReason = '') => {
    await complaintService.assignComplaint(
      compId,
      staff,
      notes,
      newPriority,
      {
        uid: currentUser?.uid,
        name: currentUser?.displayName || 'Warden',
        role: currentUser?.role || 'warden'
      },
      overrideReason
    );
    loadData();
  };

  const handleStatusConfirm = async (compId, targetStatus, notes) => {
    await complaintService.updateStatus(compId, targetStatus, notes, {
      name: currentUser.displayName,
      role: currentUser.role
    });
    loadData();
  };

  const handleVerifyConfirm = async (compId, isApproved, comments) => {
    await complaintService.verifyComplaint(compId, isApproved, comments, {
      name: currentUser.displayName,
      role: currentUser.role
    });
    loadData();
  };

  const handleFeedbackConfirm = async (compId, rating, feedback) => {
    try {
      await complaintService.submitFeedback(compId, rating, feedback, {
        uid: currentUser?.uid,
        name: currentUser?.displayName || 'Student',
        role: currentUser?.role || 'student'
      });
      // Do NOT synchronously force-close the modal here.
      // FeedbackModal will display its 1200ms confirmation animation and then trigger onClose cleanly.
      setActionSuccess('Resolution confirmed! Ticket #' + compId + ' is now officially closed.');
      await loadData();
    } catch (err) {
      console.error('Error submitting feedback from details:', err);
      throw err;
    }
  };

  const handlePriorityOverride = async (compId, newPriority, reason, origRec) => {
    await complaintService.updateComplaintPriority(compId, newPriority, reason, origRec, {
      uid: currentUser?.uid,
      name: currentUser?.displayName || 'Warden',
      role: currentUser?.role || 'warden'
    });
    setActionSuccess(`Priority updated to ${newPriority}. Documented override saved.`);
    await loadData();
  };

  const handleAcknowledge = async () => {
    await complaintService.acknowledgeComplaint(complaint.id, 'Reviewed and acknowledged by Warden. Queued for technician dispatch.', {
      name: currentUser.displayName,
      role: currentUser.role
    });
    loadData();
  };

  const handleEscalate = async () => {
    const reason = prompt('Please enter the reason for escalation:');
    if (!reason) return;
    await complaintService.escalateComplaint(complaint.id, reason, {
      name: currentUser.displayName,
      role: currentUser.role
    });
    loadData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Contextual Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warden / Admin: Priority Intelligence & Override */}
          {['warden', 'admin', 'administrator'].includes(currentUser?.role) && recommendation && (
            <button
              onClick={() => setShowPriorityModal(true)}
              className="px-3.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#99CDD8]" />
              <span>Priority Intelligence ({recommendation.totalScore} pts)</span>
            </button>
          )}

          {/* Warden: Acknowledge */}
          {['warden', 'admin', 'administrator'].includes(currentUser?.role) && complaint.status === 'SUBMITTED' && (
            <button
              onClick={handleAcknowledge}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/35 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Acknowledge Review
            </button>
          )}

          {/* Warden: Assign */}
          {['warden', 'admin', 'administrator'].includes(currentUser?.role) &&
            ['SUBMITTED', 'PENDING', 'ASSIGNED'].includes(complaint.status) && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold btn-primary-purple shadow-sm transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                {complaint.assignedToId ? 'Reassign Staff' : 'Assign Staff'}
              </button>
            )}

          {/* Warden: Escalate */}
          {['warden', 'admin', 'administrator'].includes(currentUser?.role) && !complaint.isEscalated && (
            <button
              onClick={handleEscalate}
              className="px-3.5 py-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Escalate Ticket
            </button>
          )}

          {/* Warden: Verify */}
          {['warden', 'admin', 'administrator'].includes(currentUser?.role) &&
            complaint.status === 'COMPLETED' && (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold btn-primary-purple shadow-sm transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Verify Resolution
              </button>
            )}

          {/* Maintenance: Update progress */}
          {currentUser?.role === 'maintenance' &&
            ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-white text-xs font-bold btn-primary-purple shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" /> Update Work Notes
              </button>
            )}

          {/* Student: Confirm and Rate (only after warden verification) */}
          {currentUser?.role === 'student' &&
            complaint.status === 'AWAITING_VERIFICATION' && (
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(16,185,129,0.45)] flex items-center gap-1.5 transition-all animate-pulse"
              >
                <CheckCircle className="w-4 h-4" /> Rate &amp; Close Complaint
              </button>
            )}
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-300 hover:text-white text-xs font-bold ml-4 p-1 rounded-md hover:bg-emerald-500/20 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Ticket Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/25">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-purple-500/20 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-950/70 text-purple-200 border border-purple-500/30">
                #{getFriendlyComplaintId(complaint)}
              </span>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />

              {complaint.isEscalated && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" /> Escalated
                </span>
              )}

              {overdue && (
                <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2.5 py-1 rounded-full">
                  SLA Breached
                </span>
              )}

              {Array.isArray(complaint.safetyIndicators) && complaint.safetyIndicators.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-200 bg-rose-500/25 border border-rose-500/50 px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.35)] animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Hazard Detected
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {complaint.title}
            </h1>
          </div>

          <div className="text-right text-xs text-purple-300/70">
            <p>Logged {timeAgo(complaint.createdAt)}</p>
            <p className="text-[11px] text-purple-300/50 mt-0.5">{formatDateTime(complaint.createdAt)}</p>
          </div>
        </div>

        {/* 7-Step Workflow Timeline */}
        <div className="my-6 py-4 px-4 sm:px-6 rounded-2xl bg-purple-950/30 border border-purple-500/20">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/70">
            Complaint Progress Stepper
          </h3>
          <ComplaintTimeline
            currentStatus={complaint.status}
            history={complaint.history}
          />
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Left 2 cols: Description & Work Notes */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/80">
                Problem Description
              </h3>
              <p className="text-sm leading-relaxed p-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 text-purple-100">
                {complaint.description}
              </p>
            </div>

            {/* Safety Hazard Indicators Alert */}
            {Array.isArray(complaint.safetyIndicators) && complaint.safetyIndicators.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-rose-300">Safety Hazard Flags Detected:</div>
                  <div className="mt-0.5 text-rose-200/90">{complaint.safetyIndicators.join(' • ')}</div>
                </div>
              </div>
            )}

            {/* AI Triage Recommendation Panel */}
            {complaint.aiTriage && (
              <div className="p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-indigo-950/50 space-y-2 text-xs shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span className="font-bold text-white">AI Triage Intelligence</span>
                    <span className="text-[10px] bg-purple-500/25 text-purple-200 font-extrabold px-2 py-0.5 rounded-full border border-purple-400/35">
                      {complaint.aiTriage.provider === 'gemini' ? 'AI Assisted Recommendation' : 'Automated Priority Assessment'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-purple-300/70">Suggested:</span>
                    <span className="capitalize font-bold text-purple-200">{complaint.aiTriage.category}</span>
                    <PriorityBadge priority={complaint.aiTriage.priority} size="sm" />
                  </div>
                </div>
                {complaint.aiTriage.explanation && (
                  <p className="text-[11px] text-purple-200/90 italic leading-relaxed pt-1.5 border-t border-purple-500/20">
                    "{complaint.aiTriage.explanation}"
                  </p>
                )}
              </div>
            )}

            {/* Attached Image */}
            {complaint.imageUrl && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/80">
                  Attached Photo Evidence
                </h3>
                <div
                  onClick={() => setShowImageModal(true)}
                  className="relative rounded-2xl overflow-hidden border border-purple-500/25 max-w-sm h-52 cursor-pointer group bg-purple-950/40"
                >
                  <img
                    src={complaint.imageUrl}
                    alt="Complaint photo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-xs">
                    <ExternalLink className="w-4 h-4" /> Click to view full image
                  </div>
                </div>
              </div>
            )}

            {/* Technician Work Notes */}
            {complaint.workNotes && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/80">
                  Technician Work Notes &amp; Diagnostics
                </h3>
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs sm:text-sm text-amber-200">
                  <div className="flex items-center gap-2 text-amber-300 font-bold mb-1">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Logged by {complaint.assignedToName || 'Technician'}</span>
                  </div>
                  <p className="leading-relaxed">{complaint.workNotes}</p>
                </div>
              </div>
            )}

            {/* Warden Verification Notes */}
            {complaint.wardenVerificationNotes && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/80">
                  Warden Inspection Review
                </h3>
                <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-950/40 text-xs sm:text-sm text-purple-100">
                  <div className="flex items-center gap-2 font-bold mb-1 text-purple-300">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Quality Verification Notes</span>
                  </div>
                  <p className="leading-relaxed">{complaint.wardenVerificationNotes}</p>
                </div>
              </div>
            )}

            {/* Warden Priority Override Record */}
            {complaint.wardenPriorityOverride && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/80">
                  Documented Priority Override
                </h3>
                <div
                  className="p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5"
                  style={{
                    backgroundColor: 'rgba(253, 232, 211, 0.1)',
                    borderColor: 'rgba(243, 195, 178, 0.45)',
                    color: '#FDE8D3'
                  }}
                >
                  <div className="flex items-center gap-2 font-bold text-[#F3C3B2]">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Priority Manually Overridden: {complaint.wardenPriorityOverride.previousPriority} → {complaint.wardenPriorityOverride.overriddenPriority}
                    </span>
                  </div>
                  <p className="italic text-purple-100 leading-relaxed">
                    "{complaint.wardenPriorityOverride.reason}"
                  </p>
                  <p className="text-[11px] text-purple-300/60 mt-1">
                    Documented by {complaint.wardenPriorityOverride.overriddenByName || 'Warden'} on {formatDateTime(complaint.wardenPriorityOverride.overriddenAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Student Feedback Rating */}
            {complaint.rating && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-purple-300/80">
                  Resident Feedback &amp; Closure Rating
                </h3>
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          complaint.rating >= s
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                            : 'text-purple-400/30'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-white ml-2">
                      {complaint.rating} / 5 Stars
                    </span>
                  </div>
                  {complaint.feedback && (
                    <p className="text-xs sm:text-sm text-purple-100 italic">
                      "{complaint.feedback}"
                    </p>
                  )}
                  {complaint.resolvedAt && (
                    <p className="text-[11px] text-purple-300/60 mt-2">
                      Confirmed resolution on {formatDateTime(complaint.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right col: Metadata & Actor cards */}
          <div className="space-y-4">
            {/* Location & Category Card */}
            <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-purple-300/80">
                Location &amp; Specs
              </h4>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 text-purple-400" />
                <div>
                  <p className="text-[10px] text-purple-300/60">Hostel &amp; Room</p>
                  <p className="font-bold text-white">
                    {complaint.hostelBlock}, Room {complaint.roomNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 shrink-0 text-purple-400" />
                <div>
                  <p className="text-[10px] text-purple-300/60">Category</p>
                  <p className="font-bold capitalize text-white">{complaint.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-purple-400" />
                <div>
                  <p className="text-[10px] text-purple-300/60">Target Resolution SLA</p>
                  <p className="font-bold text-white">
                    Within {complaint.slaHours || 24} hours
                  </p>
                </div>
              </div>
            </div>

            {/* Resident Information Card */}
            <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-purple-300/80">
                Submitted By
              </h4>
              <p className="font-bold text-white">{complaint.studentName}</p>
              <p className="text-[11px] text-purple-300/70">{complaint.studentEmail}</p>
              {complaint.studentPhone && (
                <p className="text-[11px] text-purple-300/70">Phone: {complaint.studentPhone}</p>
              )}
            </div>

            {/* Assigned Staff Card */}
            <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-[11px] text-purple-300/80">
                Assigned Technician
              </h4>
              {complaint.assignedToName ? (
                <div>
                  <p className="font-bold text-white">{complaint.assignedToName}</p>
                  <p className="text-[11px] text-purple-300/70">
                    Assigned {timeAgo(complaint.assignedAt)}
                  </p>
                </div>
              ) : (
                <div className="italic text-purple-300/60">No technician assigned yet.</div>
              )}
            </div>

            {/* Chronological History Log */}
            <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-[11px] mb-3 text-purple-300/80">
                Audit Timeline
              </h4>
              <div className="space-y-3">
                {complaint.history?.map((h, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-purple-500/30 pb-2">
                    <span className="absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full ring-2 ring-[#150f2e] bg-purple-400" />
                    <div className="flex items-center justify-between text-[10px] text-purple-300/60">
                      <span className="font-bold text-purple-200">{h.status}</span>
                      <span>{timeAgo(h.timestamp)}</span>
                    </div>
                    <p className="text-[11px] mt-0.5 text-purple-100">{h.note}</p>
                    <p className="text-[10px] mt-0.5 text-purple-300/60">— {h.actorName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        complaint={complaint}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignConfirm}
      />

      <StatusUpdateModal
        complaint={complaint}
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={handleStatusConfirm}
      />

      <VerifyModal
        complaint={complaint}
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onConfirm={handleVerifyConfirm}
      />

      <FeedbackModal
        complaint={complaint}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onConfirm={handleFeedbackConfirm}
      />

      <PriorityRecommendationModal
        complaint={complaint}
        recommendation={recommendation}
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        onOverridePriority={handlePriorityOverride}
      />

      {/* Image zoom modal */}
      {showImageModal && complaint.imageUrl && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 p-4 bg-slate-950/90 backdrop-blur-md flex items-center justify-center cursor-pointer animate-in fade-in duration-150"
        >
          <img
            src={complaint.imageUrl}
            alt="Expanded view"
            className="max-h-[90vh] max-w-[90vw] rounded-3xl object-contain shadow-2xl border border-purple-500/30"
          />
        </div>
      )}
    </div>
  );
}
