import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Wrench,
  Flame,
  Info
} from 'lucide-react';
import PriorityBadge from '../common/PriorityBadge';
import { formatDateTime } from '../../utils/dateUtils';
import { PRIORITIES } from '../../utils/constants';

export default function PriorityRecommendationModal({
  complaint,
  recommendation,
  isOpen,
  onClose,
  onOverridePriority
}) {
  const [isOverriding, setIsOverriding] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(complaint?.priority || 'HIGH');
  const [overrideReason, setOverrideReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !complaint || !recommendation) return null;

  const {
    totalScore,
    recommendedPriority,
    currentPriority,
    scoreMeaning,
    isOverridden,
    overrideInfo,
    factors,
    uncertainties,
    disclaimer
  } = recommendation;

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError('Please provide a documented justification for overriding the recommended priority.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onOverridePriority(complaint.id, selectedPriority, overrideReason.trim(), {
        score: totalScore,
        recommendedPriority,
        factors,
        calculatedAt: new Date().toISOString()
      });
      setIsOverriding(false);
      onClose();
    } catch (err) {
      console.error('Failed to override priority:', err);
      setError(err?.message || 'Failed to save priority override.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#150f2e] w-full max-w-2xl rounded-3xl shadow-2xl border border-purple-500/25 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-[#657166] border border-[#99CDD8]/40 shadow-xs"
              style={{ backgroundColor: '#DAEBE3' }}
            >
              <ShieldCheck className="w-5 h-5 text-[#657166]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Explainable Priority Recommendation</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-200 border border-purple-500/30">
                  #{complaint.id}
                </span>
              </div>
              <p className="text-xs text-purple-300/60">
                Transparent multi-factor decision support based on actual ticket metrics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-500/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Header & Recommendation Overview */}
          <div
            className="rounded-2xl p-4 sm:p-5 border"
            style={{
              backgroundColor: 'rgba(218, 235, 227, 0.08)',
              borderColor: 'rgba(153, 205, 216, 0.35)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-purple-300/70">Complaint Title</p>
                <h4 className="text-base font-bold text-white">{complaint.title}</h4>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  {complaint.hostelBlock} • Room {complaint.roomNumber || 'N/A'} • Category: {complaint.category}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-purple-300/70 block">
                    Calculated Score
                  </span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-black text-white">{totalScore}</span>
                    <span className="text-xs text-purple-300/60">/ 100</span>
                  </div>
                </div>

                <div className="pl-3 border-l border-purple-500/20">
                  <span className="text-[10px] uppercase tracking-wider text-purple-300/70 block mb-1">
                    Suggested Priority
                  </span>
                  <PriorityBadge priority={recommendedPriority} />
                </div>

                <div className="pl-3 border-l border-purple-500/20">
                  <span className="text-[10px] uppercase tracking-wider text-purple-300/70 block mb-1">
                    Operational Priority
                  </span>
                  <PriorityBadge priority={complaint.priority} />
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs text-purple-200/90 leading-relaxed">
              <span className="font-semibold text-[#99CDD8]">Score Meaning: </span>
              {scoreMeaning}
            </div>

            {/* Overridden status notice if applicable */}
            {isOverridden && overrideInfo && (
              <div
                className="mt-3 p-3 rounded-xl border text-xs"
                style={{
                  backgroundColor: 'rgba(253, 232, 211, 0.12)',
                  borderColor: 'rgba(243, 195, 178, 0.4)',
                  color: '#FDE8D3'
                }}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F3C3B2]" />
                  <span>Warden Override Active (Priority: {complaint.priority})</span>
                </div>
                <p className="italic">"{overrideInfo.reason}"</p>
                <p className="text-[10px] opacity-75 mt-1">
                  Overridden by {overrideInfo.overriddenByName || 'Warden'} on {formatDateTime(overrideInfo.overriddenAt)}
                </p>
              </div>
            )}
          </div>

          {/* 4 Factor Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300/80 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#99CDD8]" />
              Factor Contribution Breakdown
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Factor 1: Severity */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-400" /> Issue Severity
                  </span>
                  <span className="font-bold text-[#99CDD8] font-mono">
                    {factors.severity.points} / {factors.severity.max} pts
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/75 leading-relaxed">
                  {factors.severity.detail}
                </p>
                <div className="w-full bg-purple-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                    style={{ width: `${(factors.severity.points / factors.severity.max) * 100}%` }}
                  />
                </div>
              </div>

              {/* Factor 2: Recurrence */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Recurrence Evidence
                  </span>
                  <span className="font-bold text-[#99CDD8] font-mono">
                    {factors.recurrence.points} / {factors.recurrence.max} pts
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/75 leading-relaxed">
                  {factors.recurrence.detail}
                </p>
                {factors.recurrence.supportingComplaintIds?.length > 0 && (
                  <div className="text-[10px] text-purple-300/60 flex items-center gap-1 flex-wrap">
                    <span>Supporting tickets:</span>
                    {factors.recurrence.supportingComplaintIds.map((sid) => (
                      <span key={sid} className="px-1.5 py-0.2 rounded-md bg-purple-900/60 text-purple-200 font-mono">
                        #{sid}
                      </span>
                    ))}
                  </div>
                )}
                <div className="w-full bg-purple-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
                    style={{ width: `${(factors.recurrence.points / factors.recurrence.max) * 100}%` }}
                  />
                </div>
              </div>

              {/* Factor 3: Age & SLA */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" /> Age &amp; SLA Status
                  </span>
                  <span className="font-bold text-[#99CDD8] font-mono">
                    {factors.ageSla.points} / {factors.ageSla.max} pts
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/75 leading-relaxed">
                  {factors.ageSla.detail}
                </p>
                <div className="w-full bg-purple-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${(factors.ageSla.points / factors.ageSla.max) * 100}%` }}
                  />
                </div>
              </div>

              {/* Factor 4: Documented Impact */}
              <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400" /> Documented Impact
                  </span>
                  <span className="font-bold text-[#99CDD8] font-mono">
                    {factors.impact.points} / {factors.impact.max} pts
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/75 leading-relaxed">
                  {factors.impact.detail}
                </p>
                <div className="w-full bg-purple-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${(factors.impact.points / factors.impact.max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Missing Fields / Uncertainty Notice */}
          {uncertainties && uncertainties.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Info className="w-3.5 h-3.5" />
                <span>Data Completeness Limitations</span>
              </div>
              <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-purple-200/80">
                {uncertainties.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Authority Disclaimer */}
          <p className="text-[11px] text-purple-300/60 italic border-l-2 border-[#99CDD8] pl-3 py-0.5">
            {disclaimer}
          </p>

          {/* Warden Override Drawer / Form */}
          {isOverriding ? (
            <form onSubmit={handleSaveOverride} className="p-4 rounded-2xl bg-purple-950/60 border border-purple-500/30 space-y-3">
              <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Override Recommended Priority
              </h5>

              <div>
                <label className="block text-[11px] text-purple-300/80 mb-1">
                  Select New Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(PRIORITIES).map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedPriority === p
                          ? 'border-purple-400 bg-purple-600 text-white shadow-xs'
                          : 'border-purple-500/20 bg-purple-950/40 text-purple-200 hover:bg-purple-900/40'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-purple-300/80 mb-1">
                  Documented Justification (Required)
                </label>
                <textarea
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Physical inspection confirmed critical leak impacting two adjacent rooms. Escalated."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-500/25 bg-purple-950/70 text-white placeholder-purple-300/40 focus:border-purple-400 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOverriding(false)}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs text-purple-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-bold text-white rounded-xl btn-primary-purple disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
              <span className="text-xs text-purple-300/70">
                Current Ticket Priority: <strong className="text-white">{complaint.priority}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPriority(complaint.priority || recommendedPriority);
                  setIsOverriding(true);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:text-white text-xs font-bold transition-colors"
              >
                Override Priority
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-purple-500/20 bg-purple-950/30 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl btn-primary-purple shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
