import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { announcementService } from '../../services/announcementService';
import StatCard from '../../components/common/StatCard';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import FeedbackModal from '../../components/complaint/FeedbackModal';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { getFriendlyComplaintId } from '../../utils/complaintUtils';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackComplaint, setFeedbackComplaint] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [compList, annList] = await Promise.all([
        complaintService.getComplaints({ studentId: currentUser.uid }),
        announcementService.getAnnouncements().catch((err) => {
          console.warn('Could not load announcements for student dashboard:', err?.message || err);
          return [];
        })
      ]);
      setComplaints(compList);
      setAnnouncements(annList.slice(0, 3));
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const [actionSuccess, setActionSuccess] = useState('');

  const handleFeedbackSubmit = async (complaintId, rating, feedback) => {
    try {
      await complaintService.submitFeedback(complaintId, rating, feedback, {
        uid: currentUser?.uid,
        name: currentUser?.displayName || 'Student',
        role: currentUser?.role || 'student'
      });
      setFeedbackComplaint(null);
      setActionSuccess('Resolution confirmed! Ticket #' + getFriendlyComplaintId(complaintId) + ' closed successfully.');
      await loadData();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  // Metrics
  const total = complaints.length;
  const active = complaints.filter(
    (c) => !['CLOSED', 'COMPLETED', 'AWAITING_VERIFICATION'].includes(c.status)
  ).length;
  const pendingConfirmation = complaints.filter(
    (c) => c.status === 'AWAITING_VERIFICATION'
  ).length;
  const resolved = complaints.filter((c) => c.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-[0_0_20px_rgba(168,85,247,0.2)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-300 hover:text-white text-xs font-bold p-1 rounded-md hover:bg-emerald-500/20"
          >
            ✕
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-br from-purple-900/80 via-purple-950/90 to-[#120a28] border border-purple-500/30">
        {/* Subtle decorative glow orb */}
        <div 
          className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[90px]" 
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-purple-400/30 bg-purple-500/20 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            HostelCare Resident Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome back, {currentUser?.displayName}!
          </h1>
          <p className="text-xs sm:text-sm mt-2 leading-relaxed text-purple-200/80">
            Registered for <span className="font-semibold text-white">{currentUser?.hostelBlock}</span>,
            Room <span className="font-semibold text-white">{currentUser?.roomNumber}</span>.
            Submit repairs or track maintenance staff updates in real time.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/student/submit')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] btn-primary-purple flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Submit New Complaint
            </button>
            <button
              onClick={() => navigate('/student/complaints')}
              className="px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 hover:text-white text-xs font-bold backdrop-blur-md transition-all flex items-center gap-2 border border-purple-500/30"
            >
              Track All ({total})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={total}
          icon={PlusCircle}
          color="purple"
          subtext="Submitted since registration"
        />
        <StatCard
          title="In Progress / Active"
          value={active}
          icon={Clock}
          color="amber"
          subtext="Being reviewed or repaired"
        />
        <StatCard
          title="Needs Your Confirmation"
          value={pendingConfirmation}
          icon={AlertCircle}
          color="peach"
          subtext="Repairs awaiting your rating"
        />
        <StatCard
          title="Resolved & Closed"
          value={resolved}
          icon={CheckCircle2}
          color="emerald"
          subtext="Successfully resolved tickets"
        />
      </div>

      {/* Announcements Bar */}
      {announcements.length > 0 && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-purple-200">
              <Megaphone className="w-4 h-4 text-purple-400" />
              <span>Hostel Notices &amp; Announcements</span>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="text-xs font-semibold text-purple-300 hover:text-white hover:underline transition-colors"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-purple-500/15">
            {announcements.map((ann) => (
              <div key={ann.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-white">{ann.title}</h4>
                  <span className="text-[10px] text-purple-300/60">{formatDate(ann.createdAt)}</span>
                </div>
                <p className="text-xs mt-0.5 line-clamp-1 text-purple-200/75">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Complaints Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Your Recent Complaints</h2>
            <p className="text-xs text-purple-300/70">Live timeline and technician status updates</p>
          </div>
          <button
            onClick={() => navigate('/student/complaints')}
            className="text-xs font-bold flex items-center gap-1 text-purple-300 hover:text-white transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-purple-300/60 animate-pulse">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-purple-500/20">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <PlusCircle className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-sm font-bold text-white">No Complaints Submitted</h3>
            <p className="text-xs mt-1 max-w-sm mx-auto text-purple-300/70">
              You haven&apos;t logged any hostel maintenance requests yet. Need a repair in your room?
            </p>
            <button
              onClick={() => navigate('/student/submit')}
              className="mt-4 px-4 py-2 text-white rounded-xl text-xs font-bold btn-primary-purple shadow-md"
            >
              Submit First Complaint
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.slice(0, 6).map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                currentUser={currentUser}
                onFeedback={(comp) => setFeedbackComplaint(comp)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal for rating completed work */}
      <FeedbackModal
        complaint={feedbackComplaint}
        isOpen={Boolean(feedbackComplaint)}
        onClose={() => setFeedbackComplaint(null)}
        onConfirm={handleFeedbackSubmit}
      />
    </div>
  );
}
