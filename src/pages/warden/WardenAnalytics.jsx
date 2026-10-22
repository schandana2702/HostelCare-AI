import React, { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaintService';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, STATUS_CONFIG } from '../../utils/constants';
import { BarChart2, TrendingUp, CheckCircle2, Clock, AlertTriangle, Flame } from 'lucide-react';

function StatBar({ label, count, total, colorClass = 'bg-gradient-to-r from-purple-500 to-indigo-500' }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-purple-200">{label}</span>
        <span className="font-bold text-white">{count} ({pct}%)</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden bg-purple-950/60 border border-purple-500/20">
        <div
          className={`h-full rounded-full transition-all duration-700 shadow-xs ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function WardenAnalytics() {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintService.getComplaints().then((list) => {
      setComplaints(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = complaints.length;
  const closed = complaints.filter((c) => c.status === 'CLOSED').length;
  const open = complaints.filter((c) => !['CLOSED', 'AWAITING_VERIFICATION'].includes(c.status)).length;
  const escalated = complaints.filter((c) => c.isEscalated).length;
  const emergency = complaints.filter((c) => c.priority === 'EMERGENCY').length;
  const resolutionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

  const categoryCounts = {};
  CATEGORIES.forEach((cat) => {
    categoryCounts[cat.id] = complaints.filter((c) => c.category === cat.id).length;
  });

  const statusBreakdown = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    count: complaints.filter((c) => c.status === key).length
  }));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-bold border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300">
          Hostel Analytics
        </span>
        <h1 className="text-2xl font-black tracking-tight mt-1.5 flex items-center gap-2.5 text-white">
          <BarChart2 className="w-6 h-6 text-purple-400" />
          Hostel Complaint Analytics
        </h1>
        <p className="text-xs sm:text-sm mt-0.5 text-purple-300/70">
          Performance metrics, SLA compliance, and resolution trends for {currentUser?.hostelBlock || 'your block'}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 text-center">
          <div className="w-10 h-10 border border-purple-500/30 rounded-xl flex items-center justify-center mx-auto mb-2 bg-purple-500/20 text-purple-300">
            <TrendingUp className="w-5 h-5 text-purple-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{total}</p>
          <p className="text-xs font-semibold mt-0.5 text-purple-300/70">Total Complaints</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 text-center">
          <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/35 rounded-xl flex items-center justify-center mx-auto mb-2 text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-300">{resolutionRate}%</p>
          <p className="text-xs font-semibold mt-0.5 text-purple-300/70">Resolution Rate</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 text-center">
          <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/35 rounded-xl flex items-center justify-center mx-auto mb-2 text-amber-300">
            <Clock className="w-5 h-5 text-amber-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300">{open}</p>
          <p className="text-xs font-semibold mt-0.5 text-purple-300/70">Open / Active</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 text-center">
          <div className="w-10 h-10 bg-rose-500/20 border border-rose-500/35 rounded-xl flex items-center justify-center mx-auto mb-2 text-rose-300">
            <Flame className="w-5 h-5 text-rose-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-300">{emergency}</p>
          <p className="text-xs font-semibold mt-0.5 text-purple-300/70">Emergency Priority</p>
        </div>
      </div>

      {/* Category Breakdown + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/25">
          <h2 className="text-sm font-bold mb-4 text-white">Complaints by Category</h2>
          <div className="space-y-3.5">
            {CATEGORIES.map((cat) => (
              <StatBar
                key={cat.id}
                label={cat.name}
                count={categoryCounts[cat.id] || 0}
                total={total}
                colorClass="bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              />
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-purple-500/25">
          <h2 className="text-sm font-bold mb-4 text-white">Workflow Status Distribution</h2>
          <div className="space-y-3.5">
            {statusBreakdown.map(({ key, label, count }) => (
              <StatBar
                key={key}
                label={label}
                count={count}
                total={total}
                colorClass={
                  key === 'CLOSED'
                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : key === 'SUBMITTED'
                    ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                    : key === 'IN_PROGRESS'
                    ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                    : key === 'COMPLETED'
                    ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : key === 'AWAITING_VERIFICATION'
                    ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                    : 'bg-purple-600'
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* Escalations Summary */}
      {escalated > 0 && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
          <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold text-rose-300">
              {escalated} complaint{escalated !== 1 ? 's' : ''} currently escalated or overdue
            </p>
            <p className="text-xs text-rose-400/90 mt-0.5">
              Review your complaints list immediately to prioritize overdue resolution.
            </p>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/20">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 text-purple-400/50" />
          <h3 className="text-sm font-bold text-white">No Data to Analyze</h3>
          <p className="text-xs mt-1 text-purple-300/70">
            Analytics will appear once complaints are submitted in the system.
          </p>
        </div>
      )}
    </div>
  );
}
