import React from 'react';
import { WORKFLOW_STATUSES, STATUS_CONFIG } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateUtils';
import { Check, Clock } from 'lucide-react';

const STEPS = [
  WORKFLOW_STATUSES.SUBMITTED,
  WORKFLOW_STATUSES.PENDING,
  WORKFLOW_STATUSES.ASSIGNED,
  WORKFLOW_STATUSES.IN_PROGRESS,
  WORKFLOW_STATUSES.COMPLETED,
  WORKFLOW_STATUSES.AWAITING_VERIFICATION,
  WORKFLOW_STATUSES.CLOSED
];

export function normalizeWorkflowStatus(status) {
  if (!status) return WORKFLOW_STATUSES.SUBMITTED;
  const s = String(status).toUpperCase().trim();
  if (s === 'RESOLVED') return WORKFLOW_STATUSES.CLOSED;
  if (s === 'IN_REVIEW') return WORKFLOW_STATUSES.PENDING;
  if (s === 'VERIFIED') return WORKFLOW_STATUSES.AWAITING_VERIFICATION;
  if (STEPS.includes(s)) return s;
  return WORKFLOW_STATUSES.SUBMITTED;
}

export default function ComplaintTimeline({ currentStatus, history = [] }) {
  const normalizedStatus = normalizeWorkflowStatus(currentStatus);
  const currentStepIndex = STEPS.indexOf(normalizedStatus);
  const isAllClosed = normalizedStatus === WORKFLOW_STATUSES.CLOSED;

  // Map history events by status
  const historyMap = {};
  if (Array.isArray(history)) {
    history.forEach((h) => {
      if (h?.status) {
        historyMap[normalizeWorkflowStatus(h.status)] = h;
      }
    });
  }

  // Progress bar percentage (0% at SUBMITTED, 100% at CLOSED)
  const progressPercent = isAllClosed
    ? 100
    : currentStepIndex >= 0
    ? (currentStepIndex / (STEPS.length - 1)) * 100
    : 0;

  return (
    <div className="w-full py-2">
      {/* Horizontal Stepper for Desktop */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-5 left-8 right-8 h-1 bg-purple-950/60 border border-purple-500/20 rounded-full z-0" />
        <div
          className="absolute top-5 left-8 h-1 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)] transition-all duration-300 z-0"
          style={{ width: `${progressPercent}%` }}
        />

        {STEPS.map((statusKey, index) => {
          const config = STATUS_CONFIG[statusKey] || { label: statusKey };
          // A step is completed if it's before current step OR the entire complaint is CLOSED
          const isCompleted = isAllClosed ? true : index < currentStepIndex;
          // A step is actively working if it's the current step AND not yet closed
          const isCurrent = !isAllClosed && index === currentStepIndex;
          const stepHistory = historyMap[statusKey];

          return (
            <div key={statusKey} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400/40'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white ring-4 ring-purple-500/30 scale-110 shadow-[0_0_20px_rgba(168,85,247,0.6)] border border-purple-300'
                    : 'bg-[#150f2e] border border-purple-500/25 text-purple-400/50'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" aria-label={`Completed: ${config.label}`} />
                ) : isCurrent ? (
                  <Clock className="w-4 h-4 text-purple-200 motion-safe:animate-spin" aria-label={`In progress: ${config.label}`} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="text-center mt-2.5 max-w-[100px]">
                <p
                  className={`text-[11px] font-bold leading-tight ${
                    isCurrent
                      ? 'text-white'
                      : isCompleted
                      ? 'text-purple-200'
                      : 'text-purple-300/40'
                  }`}
                >
                  {config.label}
                </p>
                {stepHistory?.timestamp && (
                  <p className="text-[10px] text-purple-300/60 mt-0.5">
                    {formatDateTime(stepHistory.timestamp).split(',')[0]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical Stepper for Mobile */}
      <div className="md:hidden space-y-3.5">
        {STEPS.map((statusKey, index) => {
          const config = STATUS_CONFIG[statusKey] || { label: statusKey };
          const isCompleted = isAllClosed ? true : index < currentStepIndex;
          const isCurrent = !isAllClosed && index === currentStepIndex;
          const stepHistory = historyMap[statusKey];

          return (
            <div key={statusKey} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] border border-purple-400/40'
                    : isCurrent
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white ring-4 ring-purple-500/30'
                    : 'bg-purple-950/40 text-purple-400/50 border border-purple-500/20'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : isCurrent ? (
                  <Clock className="w-3.5 h-3.5 text-purple-200 motion-safe:animate-spin" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-bold ${
                      isCurrent
                        ? 'text-white'
                        : isCompleted
                        ? 'text-purple-200'
                        : 'text-purple-300/50'
                    }`}
                  >
                    {config.label}
                  </h4>
                  {stepHistory?.timestamp && (
                    <span className="text-[10px] text-purple-300/60">
                      {formatDateTime(stepHistory.timestamp)}
                    </span>
                  )}
                </div>
                {stepHistory?.note && (
                  <p className="text-[11px] text-purple-200/70 mt-0.5 leading-relaxed">
                    {stepHistory.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
