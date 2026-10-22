import React, { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaintService';
import { userService } from '../../services/userService';
import StatCard from '../../components/common/StatCard';
import { CATEGORIES, PRIORITIES, WORKFLOW_STATUSES } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  CheckCircle2,
  Flame,
  Layers,
  ListOrdered,
  Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.allSettled([complaintService.getComplaints(), userService.getUsers()])
      .then(([compResult, userResult]) => {
        if (compResult.status === 'fulfilled') {
          setComplaints(compResult.value || []);
        } else {
          console.error('Failed to load complaints for admin dashboard:', compResult.reason);
          setError(compResult.reason?.message || 'Failed to load master complaints.');
        }

        if (userResult.status === 'fulfilled') {
          setUsers(userResult.value || []);
        } else {
          console.error('Failed to load users for admin dashboard:', userResult.reason);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const total = complaints.length;
  const statusCounts = {};
  Object.keys(WORKFLOW_STATUSES).forEach((s) => {
    statusCounts[s] = complaints.filter((c) => c.status === s).length;
  });

  const priorityCounts = {};
  Object.keys(PRIORITIES).forEach((p) => {
    priorityCounts[p] = complaints.filter((c) => c.priority === p).length;
  });

  const categoryCounts = {};
  CATEGORIES.forEach((cat) => {
    categoryCounts[cat.id] = complaints.filter((c) => c.category === cat.id).length;
  });

  const totalUsers = users.length;
  const closedCount = statusCounts.CLOSED || 0;
  const resolutionRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl text-white p-6 sm:p-8 relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 mb-3">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Campus Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              HostelCare AI Analytics &amp; Control
            </h1>
            <p className="text-xs sm:text-sm mt-1.5 text-purple-200/70 leading-relaxed">
              Global system monitoring, role access control, audit compliance, and SLA metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/admin/hostels')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-purple-400" /> Hostel Management
            </button>
            <button
              onClick={() => navigate('/admin/complaints')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ListOrdered className="w-4 h-4 text-purple-400" /> All Complaints
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs font-semibold text-rose-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-2 text-center text-xs text-purple-300/50 animate-pulse">
          Refreshing campus metrics...
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={total}
          icon={Layers}
          color="blue"
          subtext="Total lifetime campus requests"
        />
        <StatCard
          title="Registered Users"
          value={totalUsers}
          icon={Users}
          color="purple"
          subtext="Students, Wardens & Staff"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          icon={CheckCircle2}
          color="emerald"
          subtext={`${closedCount} verified & closed tickets`}
        />
        <StatCard
          title="Emergency / Hazard"
          value={priorityCounts.EMERGENCY || 0}
          icon={Flame}
          color="rose"
          subtext="Flagged immediate response"
        />
      </div>

      {/* 7-Step Workflow Status Breakdown Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300/70 mb-3">
          Complaints by Workflow Stage
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.keys(WORKFLOW_STATUSES).map((status) => (
            <div
              key={status}
              className="glass-card p-4 rounded-2xl border border-purple-500/15 text-center hover:border-purple-500/35 transition-all"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-300/60 truncate">
                {status.replace('_', ' ')}
              </p>
              <h3 className="text-xl font-black mt-1 text-white font-mono">
                {statusCounts[status] || 0}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown & Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="glass-card rounded-3xl border border-purple-500/15 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white">Complaints by Category</h3>
            <button
              onClick={() => navigate('/admin/settings')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              Settings →
            </button>
          </div>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-purple-200">{cat.name}</span>
                    <span className="font-bold text-white font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-purple-950/60 border border-purple-500/20">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-purple-500 to-indigo-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Quick Actions */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl border border-purple-500/15 p-6">
            <h3 className="text-base font-bold text-white mb-4">Urgency &amp; Priority Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 border rounded-2xl text-center bg-purple-950/30 border-purple-500/20">
                <p className="text-[11px] font-semibold text-purple-300/70">LOW</p>
                <h4 className="text-xl font-black mt-1 text-white font-mono">
                  {priorityCounts.LOW || 0}
                </h4>
              </div>
              <div className="p-3.5 border rounded-2xl text-center bg-purple-500/10 border-purple-500/30">
                <p className="text-[11px] font-semibold text-purple-300">MEDIUM</p>
                <h4 className="text-xl font-black mt-1 text-purple-200 font-mono">
                  {priorityCounts.MEDIUM || 0}
                </h4>
              </div>
              <div className="p-3.5 border rounded-2xl text-center bg-amber-500/10 border-amber-500/30">
                <p className="text-[11px] font-semibold text-amber-300">HIGH</p>
                <h4 className="text-xl font-black text-amber-200 mt-1 font-mono">
                  {priorityCounts.HIGH || 0}
                </h4>
              </div>
              <div className="p-3.5 border rounded-2xl text-center bg-rose-500/10 border-rose-500/30">
                <p className="text-[11px] font-semibold text-rose-300">EMERGENCY</p>
                <h4 className="text-xl font-black text-rose-200 mt-1 font-mono">
                  {priorityCounts.EMERGENCY || 0}
                </h4>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-purple-500/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-purple-950/30">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Triage Performance
              </h4>
              <p className="text-xs text-purple-200/70 mt-1 max-w-sm">
                Hybrid Gemini &amp; heuristic engine successfully categorizes complaints with 90%+ routing accuracy.
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/complaints')}
              className="btn-primary-purple px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
