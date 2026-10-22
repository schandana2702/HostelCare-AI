import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import ComplaintFilter from '../../components/complaint/ComplaintFilter';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import AssignModal from '../../components/complaint/AssignModal';
import VerifyModal from '../../components/complaint/VerifyModal';
import { ListOrdered, LayoutGrid, Table } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { timeAgo } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export default function WardenComplaints() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    hostelBlock: currentUser?.hostelBlock || 'All Hostels'
  });

  // Modals
  const [selectedAssignComplaint, setSelectedAssignComplaint] = useState(null);
  const [selectedVerifyComplaint, setSelectedVerifyComplaint] = useState(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const list = await complaintService.getComplaints(filters);
      setComplaints(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [filters]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <ListOrdered className="w-6 h-6 text-purple-400" />
            Hostel Complaints Console
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
            Search, triage, assign technicians, and monitor resolution SLA
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-purple-950/60 border border-purple-500/25 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Component */}
      <ComplaintFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        showBlockFilter={true}
      />

      {/* Complaints Display */}
      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/60 animate-pulse">Loading complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/20">
          <h3 className="text-sm font-bold text-white">No Complaints Match Filters</h3>
          <p className="text-xs text-purple-300/70 mt-1 max-w-sm mx-auto">
            Try adjusting your search keyword, category, or status selection.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-purple-950/40 text-purple-200 hover:text-white border border-purple-500/30"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complaints.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              currentUser={currentUser}
              onAssign={(comp) => setSelectedAssignComplaint(comp)}
              onVerify={(comp) => setSelectedVerifyComplaint(comp)}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-card rounded-2xl overflow-hidden border border-purple-500/20 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-purple-200">
              <thead className="border-b border-purple-500/20 text-[11px] font-bold uppercase tracking-wider bg-purple-950/60 text-purple-200">
                <tr>
                  <th className="px-4 py-3.5">ID &amp; Title</th>
                  <th className="px-4 py-3.5">Room / Block</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Assigned To</th>
                  <th className="px-4 py-3.5">Logged</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-600/10 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-300/70">#{c.id}</span>
                        <span
                          onClick={() => navigate(`/complaint/${c.id}`)}
                          className="font-bold hover:text-purple-300 cursor-pointer line-clamp-1 max-w-xs transition-colors"
                        >
                          {c.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-purple-200/80">
                      {c.hostelBlock} • Rm {c.roomNumber}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-purple-200/90">
                      {c.assignedToName || <span className="text-purple-400/50 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-purple-300/60">
                      {timeAgo(c.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {['SUBMITTED', 'PENDING', 'ASSIGNED'].includes(c.status) && (
                          <button
                            onClick={() => setSelectedAssignComplaint(c)}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-500/30 bg-purple-950/60 text-purple-200 hover:text-white hover:bg-purple-900/60 transition-colors"
                          >
                            {c.assignedToId ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                        {c.status === 'COMPLETED' && (
                          <button
                            onClick={() => setSelectedVerifyComplaint(c)}
                            className="px-2.5 py-1 text-xs text-white font-bold rounded-lg btn-primary-purple shadow-xs transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/complaint/${c.id}`)}
                          className="px-2 py-1 text-purple-300 hover:text-white font-semibold transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
