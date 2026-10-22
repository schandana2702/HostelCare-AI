import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import ComplaintFilter from '../../components/complaint/ComplaintFilter';
import ComplaintCard from '../../components/complaint/ComplaintCard';
import StatusUpdateModal from '../../components/complaint/StatusUpdateModal';
import { Wrench } from 'lucide-react';

export default function AssignedComplaints() {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

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
    try {
      const list = await complaintService.getComplaints({
        assignedToId: currentUser.uid,
        ...filters
      });
      // Filter only active tasks (ASSIGNED, IN_PROGRESS)
      const activeOnly = list.filter((c) =>
        ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(c.status)
      );
      setComplaints(activeOnly);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentUser, filters]);

  const handleStatusConfirm = async (compId, status, notes) => {
    await complaintService.updateStatus(compId, status, notes, {
      name: currentUser.displayName,
      role: 'maintenance'
    });
    setSelectedComplaint(null);
    loadComplaints();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Wrench className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                My Assigned Maintenance Jobs
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Review tickets assigned to you, inspect onsite issues, and log diagnostic status or completion notes.
            </p>
          </div>
        </div>
      </div>

      <ComplaintFilter
        filters={filters}
        onChange={(k, v) => setFilters((p) => ({ ...p, [k]: v }))}
        onReset={() =>
          setFilters({
            search: '',
            status: 'ALL',
            priority: 'ALL',
            category: 'ALL',
            hostelBlock: 'All Hostels'
          })
        }
        showBlockFilter={true}
      />

      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/50">Loading assigned jobs...</div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-purple-500/15">
          <p className="text-sm text-purple-300/60">No assigned tasks matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complaints.map((comp) => (
            <ComplaintCard
              key={comp.id}
              complaint={comp}
              currentUser={currentUser}
              onUpdateStatus={(c) => setSelectedComplaint(c)}
            />
          ))}
        </div>
      )}

      <StatusUpdateModal
        complaint={selectedComplaint}
        isOpen={Boolean(selectedComplaint)}
        onClose={() => setSelectedComplaint(null)}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}
