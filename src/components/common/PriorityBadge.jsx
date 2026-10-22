import React from 'react';
import { PRIORITY_CONFIG } from '../../utils/constants';
import { AlertTriangle, AlertOctagon, Flame, ArrowDown } from 'lucide-react';

const PRIORITY_ICONS = {
  LOW: ArrowDown,
  MEDIUM: AlertTriangle,
  HIGH: AlertOctagon,
  EMERGENCY: Flame
};

export default function PriorityBadge({ priority, size = 'md' }) {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority,
    color: 'bg-purple-950/40 text-purple-300 border-purple-500/25',
    badge: 'text-purple-400',
    slaHours: 24
  };

  const Icon = PRIORITY_ICONS[priority] || AlertTriangle;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1 text-sm gap-2'
      : 'px-2.5 py-0.5 text-xs font-semibold gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs tracking-tight ${config.color} ${sizeClasses}`}
      title={`Target SLA: Resolve within ${config.slaHours} hours`}
    >
      <Icon className={`w-3 h-3 ${config.badge}`} />
      <span>{config.label}</span>
    </span>
  );
}
