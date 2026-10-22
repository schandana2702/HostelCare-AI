import React from 'react';
import { STATUS_CONFIG } from '../../utils/constants';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Wrench,
  CheckCheck,
  FileText
} from 'lucide-react';

const STATUS_ICONS = {
  SUBMITTED: FileText,
  PENDING: Clock,
  ASSIGNED: UserCheck,
  IN_PROGRESS: Wrench,
  COMPLETED: CheckCircle2,
  AWAITING_VERIFICATION: AlertCircle,
  CLOSED: CheckCheck
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    description: ''
  };

  const Icon = STATUS_ICONS[status] || Clock;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2'
      : 'px-2.5 py-1 text-xs font-semibold gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs font-medium ${config.color} ${sizeClasses}`}
      title={config.description}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
