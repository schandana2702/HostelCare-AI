import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import ComplaintFilter from '../../components/complaint/ComplaintFilter';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import FeedbackModal from '../../components/complaint/FeedbackModal';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ListOrdered } from 'lucide-react';

export default function MyComplaints() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [feedbackComplaint, setFeedbackComplaint] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    hostelBlock: 'All Hostels'
  });

  const loadComplaints = async () => {
    if (!currentUser) return;
    setLoading(true);
    setLoadError(null);
    try {
      const list = await complaintService.getComplaints({
        studentId: currentUser.uid,
        ...filters
      });
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setLoadError(err.message || 'Failed to load complaints from Firestore.');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentUser, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      category: 'ALL',
      hostelBlock: 'All Hostels'
    });
  };

  const [actionSuccess, setActionSuccess] = useState('');

  const handleFeedbackSubmit = async (complaintId, rating, feedback) => {
    try {
      await complaintService.submitFeedback(complaintId, rating, feedback, {
        uid: currentUser?.uid,
        name: currentUser?.displayName || 'Student',
        role: currentUser?.role || 'student'
      });
      setFeedbackComplaint(null);
      setActionSuccess('Resolution confirmed! Ticket #' + complaintId + ' closed successfully.');
      await loadComplaints();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <ListOrdered className="w-6 h-6 text-purple-400" />
            My Maintenance Complaints
          </h1>
          <p className="text-xs sm:text-sm mt-0.5 text-purple-300/70">
            Track status, assignment history, and submit verification feedback
          </p>
        </div>

        <button
          onClick={() => navigate('/student/submit')}
          className="px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] btn-primary-purple flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> New Complaint
        </button>
      </div>

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

      {/* Filter component */}
      <ComplaintFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        showBlockFilter={false}
      />

      {/* Complaints Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-purple-300/60 animate-pulse">
          Loading your complaints...
        </div>
      ) : loadError ? (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-rose-300">Could not load complaints</p>
          <p className="text-xs text-rose-400 mt-1">{loadError}</p>
          <button
            onClick={loadComplaints}
            className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/20">
          <h3 className="text-sm font-bold text-white">No complaints found</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto text-purple-300/70">
            No maintenance complaints matched your selected criteria.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-purple-200 hover:text-white border border-purple-500/25 bg-purple-950/40 hover:bg-purple-900/50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              currentUser={currentUser}
              onFeedback={(comp) => setFeedbackComplaint(comp)}
            />
          ))}
        </div>
      )}

      {/* Feedback modal */}
      <FeedbackModal
        complaint={feedbackComplaint}
        isOpen={Boolean(feedbackComplaint)}
        onClose={() => setFeedbackComplaint(null)}
        onConfirm={handleFeedbackSubmit}
      />
    </div>
  );
}
