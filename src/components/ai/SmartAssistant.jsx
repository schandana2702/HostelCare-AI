import React, { useEffect, useState, useRef } from 'react';
import { analyzeComplaintText, triageComplaintAI } from '../../services/aiService';
import { Sparkles, Check, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import PriorityBadge from '../common/PriorityBadge';

export default function SmartAssistant({
  title = '',
  description = '',
  category = '',
  hostelBlock = '',
  roomNumber = '',
  onApplySuggestion,
  onTriageResult
}) {
  const [analysis, setAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const debounceTimerRef = useRef(null);
  const lastQueryRef = useRef('');

  useEffect(() => {
    const hasEnoughText = (title && title.trim().length >= 3) || (description && description.trim().length >= 3);

    if (!hasEnoughText) {
      setAnalysis(null);
      if (onTriageResult) onTriageResult(null);
      return;
    }

    const queryKey = `${title.trim()}:::${description.trim()}`;
    lastQueryRef.current = queryKey;

    // 1. Instant deterministic heuristic baseline (zero latency)
    const localBaseline = analyzeComplaintText(title, description);
    setAnalysis(localBaseline);
    if (onTriageResult) onTriageResult(localBaseline);

    // 2. Debounced server-side Gemini AI call
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoadingAI(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const liveResult = await triageComplaintAI({
          title: title.trim(),
          description: description.trim(),
          category,
          hostelBlock,
          roomNumber
        });

        // Only update if the query hasn't changed while awaiting response
        if (lastQueryRef.current === queryKey) {
          setAnalysis(liveResult);
          if (onTriageResult) onTriageResult(liveResult);
        }
      } catch (err) {
        console.warn('SmartAssistant: live AI triage fallback triggered:', err.message);
      } finally {
        if (lastQueryRef.current === queryKey) {
          setLoadingAI(false);
        }
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, description, category, hostelBlock, roomNumber]);

  if (!analysis) return null;

  const isLiveGemini = Boolean(analysis.available && analysis.provider === 'gemini');
  const safetyList = Array.isArray(analysis.safetyIndicators) ? analysis.safetyIndicators : [];

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/70 via-purple-900/30 to-indigo-950/60 p-4 my-4 shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.5)] shrink-0">
            {loadingAI ? (
              <Loader2 className="w-4 h-4 text-purple-200 animate-spin" />
            ) : isLiveGemini ? (
              <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-purple-200" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-white">
                HostelCare AI Triage Assistant
              </h4>

              {/* Clean Status Badge */}
              {isLiveGemini ? (
                <span className="text-[10px] bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 font-extrabold px-2 py-0.5 rounded-full border border-purple-400/40 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                  AI Suggestion Available
                </span>
              ) : (
                <span className="text-[10px] bg-purple-950/70 text-purple-300/80 font-bold px-2 py-0.5 rounded-full border border-purple-500/25 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />
                  Automated Assessment
                </span>
              )}

              {loadingAI && (
                <span className="text-[10px] text-purple-300/60 italic flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> analyzing...
                </span>
              )}
            </div>

            <p className="text-[11px] text-purple-300/70 mt-0.5">
              {isLiveGemini
                ? 'Suggested category and priority based on your complaint description.'
                : analysis?.category && analysis?.category !== 'other'
                ? 'Automated suggestion ready based on complaint details.'
                : 'Automatic analysis is temporarily unavailable. Please select the category and priority manually.'}
            </p>
          </div>
        </div>

        {onApplySuggestion && (
          <button
            type="button"
            onClick={() => onApplySuggestion(analysis)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(168,85,247,0.35)] flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Auto-Fill</span>
          </button>
        )}
      </div>

      {/* Safety Indicators Banner (if hazards detected) */}
      {safetyList.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-start gap-2 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-rose-300">Safety Hazard Detected: </span>
            <span>{safetyList.join(' • ')}</span>
          </div>
        </div>
      )}

      {/* Suggested values pill */}
      <div className="mt-3 pt-3 border-t border-purple-500/20 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-purple-300/60 font-medium">Suggested Category:</span>
          <span className="font-bold text-white capitalize bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-500/30">
            {analysis.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-purple-300/60 font-medium">Recommended Priority:</span>
          <PriorityBadge priority={analysis.priority} size="sm" />
        </div>

        <div className="text-[11px] text-purple-300/80 italic flex-1 min-w-[200px]">
          "{analysis.reasoning}"
        </div>
      </div>
    </div>
  );
}

