import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
  CheckCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  detectRecurringIssues,
  calculatePriorityRecommendation
} from '../../services/intelligenceService';
import PriorityBadge from '../common/PriorityBadge';
import StatusBadge from '../common/StatusBadge';
import { timeAgo, formatDateTime } from '../../utils/dateUtils';
import PriorityRecommendationModal from './PriorityRecommendationModal';

export default function MaintenanceIntelligencePanel({
  complaints = [],
  currentBlock = 'All Hostels',
  currentUser = null,
  onRecurrenceDecision = null,
  onPriorityOverride = null
}) {
  const [timeWindowDays, setTimeWindowDays] = useState(30);
  const [activeTab, setActiveTab] = useState('recurrence'); // 'recurrence' | 'prioritization'
  const [expandedClusterId, setExpandedClusterId] = useState(null);
  const [selectedComplaintForModal, setSelectedComplaintForModal] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Recurrence analysis
  const recurrenceReport = useMemo(() => {
    return detectRecurringIssues(complaints, {
      timeWindowDays,
      blockFilter: currentBlock === 'All Hostels' ? null : currentBlock
    });
  }, [complaints, timeWindowDays, currentBlock]);

  // Priority scoring for active complaints
  const priorityScoredComplaints = useMemo(() => {
    const activeComplaints = complaints.filter(
      (c) => c && c.status !== 'CLOSED' && (currentBlock === 'All Hostels' || c.hostelBlock === currentBlock)
    );
    return activeComplaints
      .map((c) => ({
        complaint: c,
        recommendation: calculatePriorityRecommendation(c, complaints, { timeWindowDays })
      }))
      .sort((a, b) => (b.recommendation?.totalScore || 0) - (a.recommendation?.totalScore || 0));
  }, [complaints, timeWindowDays, currentBlock]);

  const handleConfirmRecurrence = async (cluster) => {
    if (!onRecurrenceDecision) return;
    setActionLoadingId(cluster.id);
    setActionError('');
    try {
      // Update each complaint in cluster with warden confirmation
      for (const comp of cluster.complaints) {
        await onRecurrenceDecision(
          comp.id,
          'confirmed',
          `Warden confirmed recurring root cause for cluster "${cluster.level}" (${cluster.hostelBlock}, ${cluster.roomNumber}).`
        );
      }
      setActionSuccess(`Confirmed recurring root cause for ${cluster.roomNumber} (${cluster.totalCount} complaints linked).`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to confirm recurrence:', err);
      setActionError(err.message || 'Failed to persist recurrence confirmation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissRecurrence = async (cluster) => {
    if (!onRecurrenceDecision) return;
    setActionLoadingId(cluster.id);
    setActionError('');
    try {
      for (const comp of cluster.complaints) {
        await onRecurrenceDecision(
          comp.id,
          'dismissed',
          `Warden dismissed recurrence flag: verified independent or coincidental complaints.`
        );
      }
      setActionSuccess(`Dismissed recurrence flag for ${cluster.roomNumber}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to dismiss recurrence:', err);
      setActionError(err.message || 'Failed to dismiss recurrence flag.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-purple-500/25 space-y-5">
      {/* Top Banner with Brand Pastel Accents */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(153,205,216,0.35)] shrink-0 border"
            style={{ backgroundColor: '#DAEBE3', borderColor: '#99CDD8' }}
          >
            <Activity className="w-5 h-5 text-[#657166]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                HostelCare Maintenance Intelligence
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-[#657166]"
                style={{ backgroundColor: '#CFD8C4', borderColor: '#99CDD8' }}
              >
                v1.0 Heuristic
              </span>
            </div>
            <p className="text-xs text-purple-300/70">
              Deterministic recurrence detection &amp; transparent multi-factor prioritization
            </p>
          </div>
        </div>

        {/* Configurable Time Window & Tab Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Window Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/25 text-xs">
            <Clock className="w-3.5 h-3.5 text-[#99CDD8]" />
            <span className="text-[11px] text-purple-300/70">Lookback:</span>
            <select
              value={timeWindowDays}
              onChange={(e) => setTimeWindowDays(Number(e.target.value))}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value={7} className="bg-[#150f2e] text-white">7 Days</option>
              <option value={14} className="bg-[#150f2e] text-white">14 Days</option>
              <option value={30} className="bg-[#150f2e] text-white">30 Days</option>
              <option value={60} className="bg-[#150f2e] text-white">60 Days</option>
              <option value={90} className="bg-[#150f2e] text-white">90 Days</option>
            </select>
          </div>

          {/* Navigation Pill Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-purple-950/70 border border-purple-500/25 text-xs">
            <button
              onClick={() => setActiveTab('recurrence')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'recurrence'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              Recurring Clusters ({recurrenceReport.activeClustersCount})
            </button>
            <button
              onClick={() => setActiveTab('prioritization')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'prioritization'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-300/70 hover:text-white'
              }`}
            >
              Priority Recommendations ({priorityScoredComplaints.length})
            </button>
          </div>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess('')} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-300 hover:text-white">✕</button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 1: RECURRING ISSUE DETECTION                         */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'recurrence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-purple-300/70">
            <span>
              Evaluated {recurrenceReport.totalEvaluated} complaints in the past{' '}
              <strong className="text-white">{timeWindowDays} days</strong>
              {currentBlock !== 'All Hostels' && ` for ${currentBlock}`}.
            </span>
            <span className="text-[11px] text-purple-300/50">
              Deterministic rule: Scope (Block/Room) + Category signature + Lookback window
            </span>
          </div>

          {recurrenceReport.clusters.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-purple-500/15 space-y-2">
              <ShieldCheck className="w-8 h-8 text-[#99CDD8] mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-white">No Recurring Issue Patterns Detected</h4>
              <p className="text-xs text-purple-300/70 max-w-md mx-auto">
                {recurrenceReport.insufficientDataReason ||
                  `All complaints logged in the last ${timeWindowDays} days appear to be isolated incidents without repeated room or systemic block-level clusters.`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recurrenceReport.clusters.map((cluster) => {
                const isExpanded = expandedClusterId === cluster.id;
                const isWorking = actionLoadingId === cluster.id;

                return (
                  <div
                    key={cluster.id}
                    className="rounded-2xl border transition-all duration-200 overflow-hidden"
                    style={{
                      backgroundColor:
                        cluster.status === 'confirmed'
                          ? 'rgba(253, 232, 211, 0.08)'
                          : cluster.status === 'dismissed'
                          ? 'rgba(30, 22, 56, 0.35)'
                          : 'rgba(22, 16, 42, 0.75)',
                      borderColor:
                        cluster.status === 'confirmed'
                          ? 'rgba(243, 195, 178, 0.45)'
                          : cluster.status === 'dismissed'
                          ? 'rgba(168, 85, 247, 0.15)'
                          : 'rgba(153, 205, 216, 0.3)'
                    }}
                  >
                    {/* Cluster Summary Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Type / Level Badge */}
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                            style={{
                              backgroundColor: 'rgba(153, 205, 216, 0.15)',
                              borderColor: '#99CDD8',
                              color: '#99CDD8'
                            }}
                          >
                            {cluster.level}
                          </span>

                          {/* Recurrence Status Badge */}
                          {cluster.status === 'confirmed' ? (
                            <span
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-xs"
                              style={{
                                backgroundColor: '#FDE8D3',
                                borderColor: '#F3C3B2',
                                color: '#657166'
                              }}
                            >
                              <ShieldCheck className="w-3 h-3 text-[#657166]" />
                              Warden-Confirmed Root Cause
                            </span>
                          ) : cluster.status === 'dismissed' ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-500/25 bg-purple-950/40 text-purple-300/60">
                              Dismissed by Warden
                            </span>
                          ) : (
                            <span
                              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                              style={{
                                backgroundColor: 'rgba(253, 232, 211, 0.2)',
                                borderColor: '#F3C3B2',
                                color: '#FDE8D3'
                              }}
                            >
                              <AlertTriangle className="w-3 h-3 text-[#F3C3B2]" />
                              Possible Recurring Issue
                            </span>
                          )}

                          <span className="text-xs font-mono font-bold text-purple-200">
                            {cluster.totalCount} tickets ({cluster.activeCount} active, {cluster.historicalCount} historical)
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{cluster.hostelBlock} • {cluster.roomNumber}</span>
                          <span className="text-purple-300/50">•</span>
                          <span className="capitalize text-[#99CDD8]">{cluster.category}</span>
                        </h4>

                        <p className="text-xs text-purple-200/80 leading-relaxed max-w-2xl">
                          {cluster.justification}
                        </p>
                      </div>

                      {/* Warden Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {cluster.status !== 'confirmed' && (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleConfirmRecurrence(cluster)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5"
                            style={{
                              backgroundColor: 'rgba(253, 232, 211, 0.15)',
                              borderColor: 'rgba(243, 195, 178, 0.5)',
                              color: '#FDE8D3'
                            }}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-[#F3C3B2]" />
                            {isWorking ? 'Saving...' : 'Confirm'}
                          </button>
                        )}

                        {cluster.status !== 'dismissed' && (
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleDismissRecurrence(cluster)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-500/25 bg-purple-950/40 text-purple-300 hover:text-white transition-colors"
                          >
                            Dismiss
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedClusterId(isExpanded ? null : cluster.id)
                          }
                          className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/20 transition-colors"
                          title="Toggle supporting complaint tickets"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Supporting Complaints Table */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-purple-500/15 bg-purple-950/40 space-y-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300/70">
                          Supporting Incident Evidence ({cluster.complaints.length} tickets)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cluster.complaints.map((c) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-950/50 flex items-center justify-between text-xs gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-purple-300">
                                    #{c.id}
                                  </span>
                                  <span className="font-bold text-white truncate">{c.title}</span>
                                </div>
                                <p className="text-[10px] text-purple-300/60 mt-0.5">
                                  Room {c.roomNumber || 'N/A'} • Logged {timeAgo(c.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <StatusBadge status={c.status} size="sm" />
                                <PriorityBadge priority={c.priority} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* TAB 2: EXPLAINABLE PRIORITY RECOMMENDATIONS              */}
      {/* ───────────────────────────────────────────────────────── */}
      {activeTab === 'prioritization' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-purple-300/70">
            <span>
              Scored <strong className="text-white">{priorityScoredComplaints.length} active complaints</strong>{' '}
              using provisional 4-factor scoring (Severity 40%, Recurrence 25%, SLA 20%, Impact 15%).
            </span>
            <span className="text-[11px] text-purple-300/50">
              Warden retains final override authority
            </span>
          </div>

          {priorityScoredComplaints.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-purple-950/20 border border-purple-500/15 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-white">No Active Complaints Pending Prioritization</h4>
              <p className="text-xs text-purple-300/70 max-w-sm mx-auto">
                All complaints in this scope are resolved or verified. Newly submitted complaints will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {priorityScoredComplaints.map(({ complaint, recommendation }) => {
                if (!recommendation) return null;
                const hasPriorityMismatch =
                  complaint.priority !== recommendation.recommendedPriority;

                return (
                  <div
                    key={complaint.id}
                    className="p-3.5 sm:p-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-purple-500/35 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-300 px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-500/30">
                          #{complaint.id}
                        </span>
                        <StatusBadge status={complaint.status} size="sm" />
                        <span className="text-xs text-purple-200/80">
                          {complaint.hostelBlock} • Room {complaint.roomNumber || 'N/A'}
                        </span>
                        {recommendation.isOverridden && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-[#657166]"
                            style={{ backgroundColor: '#FDE8D3', borderColor: '#F3C3B2' }}
                          >
                            Overridden by Warden
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{complaint.title}</h4>

                      <p className="text-xs text-purple-300/70 line-clamp-1">
                        {recommendation.scoreMeaning}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {/* Priority Comparison Pill */}
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/25">
                        <div className="text-right">
                          <span className="text-[10px] text-purple-300/60 block">Current</span>
                          <span className="text-xs font-bold text-white">{complaint.priority}</span>
                        </div>

                        {hasPriorityMismatch ? (
                          <span className="text-amber-400 font-bold text-xs">→</span>
                        ) : (
                          <span className="text-purple-400/40 text-xs">=</span>
                        )}

                        <div className="text-left">
                          <span className="text-[10px] text-[#99CDD8] block">Recommended</span>
                          <PriorityBadge priority={recommendation.recommendedPriority} size="sm" />
                        </div>

                        <div className="pl-2 border-l border-purple-500/20 text-center">
                          <span className="text-[10px] text-purple-300/60 block">Score</span>
                          <span className="text-xs font-black text-white font-mono">
                            {recommendation.totalScore}
                          </span>
                        </div>
                      </div>

                      {/* Explain / Inspect Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedComplaintForModal({ complaint, recommendation })}
                        className="px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Explain &amp; Override</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail / Override Modal */}
      {selectedComplaintForModal && (
        <PriorityRecommendationModal
          complaint={selectedComplaintForModal.complaint}
          recommendation={selectedComplaintForModal.recommendation}
          isOpen={Boolean(selectedComplaintForModal)}
          onClose={() => setSelectedComplaintForModal(null)}
          onOverridePriority={onPriorityOverride}
        />
      )}
    </div>
  );
}
