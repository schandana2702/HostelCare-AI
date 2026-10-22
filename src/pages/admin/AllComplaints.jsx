import React, { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaintService';
import ComplaintFilter from '../../components/complaint/ComplaintFilter';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import { Download, ListOrdered, Eye } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { getFriendlyComplaintId } from '../../utils/complaintUtils';
import { useNavigate } from 'react-router-dom';

export default function AllComplaints() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    category: 'ALL',
    hostelBlock: 'All Hostels'
  });

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await complaintService.getComplaints(filters);
      setComplaints(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load master complaints:', err);
      setError(err?.message || 'Failed to load master complaints.');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [filters]);

  const handleExportCSV = () => {
    if (!complaints || complaints.length === 0) return;

    const headers = [
      'Ticket ID',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Hostel Block',
      'Room Number',
      'Student Name',
      'Assigned Technician',
      'Logged Date',
      'Rating',
      'Feedback'
    ];

    const rows = complaints.map((c) => [
      getFriendlyComplaintId(c),
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.category || '',
      c.priority || '',
      c.status || '',
      `"${(c.hostelBlock || '').replace(/"/g, '""')}"`,
      c.roomNumber || '',
      `"${(c.studentName || '').replace(/"/g, '""')}"`,
      `"${(c.assignedToName || 'Unassigned').replace(/"/g, '""')}"`,
      formatDate(c.createdAt),
      c.rating || '-',
      `"${(c.feedback || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `HostelCare_Complaints_Report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <ListOrdered className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Master Complaints Registry
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              System-wide repository of all hostel maintenance tickets with institutional reporting export.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={complaints.length === 0}
            className="btn-primary-purple px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/30"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
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
        <div className="py-20 text-center text-xs text-purple-300/50">Loading master registry...</div>
      ) : error ? (
        <div className="glass-card rounded-3xl border border-rose-500/25 bg-rose-950/20 p-12 text-center text-rose-300 text-sm">
          {error}
        </div>
      ) : complaints.length === 0 ? (
        <div className="glass-card rounded-3xl border border-purple-500/15 p-12 text-center">
          <p className="text-sm text-purple-300/60">No complaints found matching filters.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-purple-500/15 overflow-hidden">
          {/* Mobile Card List View (< md) */}
          <div className="divide-y divide-purple-500/10 md:hidden">
            {complaints.map((c, idx) => (
              <div
                key={c.id || `complaint-mobile-${idx}`}
                onClick={() => navigate(`/complaint/${c.id}`)}
                className="p-4 space-y-2.5 hover:bg-purple-900/15 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-purple-300/60">#{getFriendlyComplaintId(c)}</span>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {c.title || 'Untitled Complaint'}
                    </h4>
                  </div>
                  <PriorityBadge priority={c.priority || 'MEDIUM'} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs text-purple-200/80">
                  <span>{c.hostelBlock || 'Hostel'} • Rm {c.roomNumber || '-'}</span>
                  <StatusBadge status={c.status || 'SUBMITTED'} size="sm" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-purple-300/50 pt-1 border-t border-purple-500/10">
                  <span>{c.studentName || 'Student'} • {c.assignedToName || 'Unassigned'}</span>
                  <span className="font-mono">{formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 border-b border-purple-500/20 text-[11px] font-bold uppercase tracking-wider text-purple-200">
                <tr>
                  <th className="px-5 py-3.5">ID &amp; Title</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Resident</th>
                  <th className="px-5 py-3.5">Technician</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {complaints.map((c, idx) => (
                  <tr key={c.id || `complaint-${idx}`} className="hover:bg-purple-900/15 transition-colors">
                    <td className="px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-400 text-xs font-semibold">#{getFriendlyComplaintId(c)}</span>
                        <span
                          onClick={() => navigate(`/complaint/${c.id}`)}
                          className="font-bold text-white hover:text-purple-300 cursor-pointer line-clamp-1 max-w-xs transition-colors"
                        >
                          {c.title || 'Untitled Complaint'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-200">
                      {c.hostelBlock || 'Hostel'} • Rm {c.roomNumber || '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <PriorityBadge priority={c.priority || 'MEDIUM'} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status || 'SUBMITTED'} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-200">{c.studentName || 'Student'}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {c.assignedToName ? (
                        <span className="text-purple-300 font-medium">{c.assignedToName}</span>
                      ) : (
                        <span className="text-purple-400/40 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-300/60 font-mono">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/complaint/${c.id}`)}
                        className="px-3 py-1 text-xs font-semibold text-purple-400 hover:text-white hover:bg-purple-500/20 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
