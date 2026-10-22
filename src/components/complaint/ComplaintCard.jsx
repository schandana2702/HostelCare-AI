import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import { timeAgo, isOverdue } from '../../utils/dateUtils';
import { getFriendlyComplaintId } from '../../utils/complaintUtils';
import {
  MapPin,
  Tag,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle,
  Wrench
} from 'lucide-react';

export default function ComplaintCard({
  complaint,
  currentUser,
  onAssign,
  onUpdateStatus,
  onVerify,
  onFeedback
}) {
  const navigate = useNavigate();

  const overdue = isOverdue(
    complaint.createdAt,
    complaint.slaHours || 24,
    complaint.status
  );

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group">
      <div>
        {/* Top bar: ID, Overdue alert, Status & Priority */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-950/70 text-purple-200 border border-purple-500/30 shadow-xs">
              #{getFriendlyComplaintId(complaint)}
            </span>
            {complaint.isEscalated && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-300" /> Escalated
              </span>
            )}
            {overdue && !complaint.isEscalated && (
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2 py-0.5 rounded-full">
                SLA Breached
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={complaint.priority} size="sm" />
            <StatusBadge status={complaint.status} size="sm" />
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => navigate(`/complaint/${complaint.id}`)}
          className="text-base font-bold text-white group-hover:text-purple-200 transition-colors cursor-pointer line-clamp-1"
        >
          {complaint.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed text-purple-200/75">
          {complaint.description}
        </p>

        {/* Image preview thumbnail if present */}
        {complaint.imageUrl && (
          <div
            onClick={() => navigate(`/complaint/${complaint.id}`)}
            className="mt-3 relative h-28 rounded-xl overflow-hidden border border-purple-500/20 bg-purple-950/30 cursor-pointer"
          >
            <img
              src={complaint.imageUrl}
              alt="Complaint attachment"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute bottom-2 right-2 bg-slate-950/80 text-purple-200 text-[10px] px-2 py-0.5 rounded-md font-medium backdrop-blur-xs border border-purple-500/30">
              Attached Photo
            </span>
          </div>
        )}

        {/* Metadata grid */}
        <div className="mt-4 pt-3 border-t border-purple-500/15 grid grid-cols-2 gap-2 text-[11px] text-purple-300/70">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span className="truncate">
              {complaint.hostelBlock} • Rm {complaint.roomNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Tag className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span className="capitalize truncate">{complaint.category}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Clock className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span>{timeAgo(complaint.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <User className="w-3.5 h-3.5 shrink-0 text-purple-400" />
            <span className="truncate">
              {complaint.assignedToName
                ? complaint.assignedToName.split(' ')[0]
                : 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-purple-500/15 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(`/complaint/${complaint.id}`)}
          className="text-xs font-bold flex items-center gap-1 text-purple-300 hover:text-white transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </button>

        <div className="flex items-center gap-2">
          {/* Warden: Assign / Reassign */}
          {currentUser?.role === 'warden' &&
            ['SUBMITTED', 'PENDING', 'ASSIGNED'].includes(complaint.status) && (
              <button
                onClick={() => onAssign?.(complaint)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-purple-500/30 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 transition-colors"
              >
                {complaint.assignedToId ? 'Reassign' : 'Assign'}
              </button>
            )}

          {/* Warden: Verify */}
          {currentUser?.role === 'warden' && complaint.status === 'COMPLETED' && (
            <button
              onClick={() => onVerify?.(complaint)}
              className="px-2.5 py-1 text-xs font-bold text-white rounded-lg btn-primary-purple transition-colors shadow-xs"
            >
              Verify Work
            </button>
          )}

          {/* Maintenance: Update Work / Complete */}
          {currentUser?.role === 'maintenance' &&
            ['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status) && (
              <button
                onClick={() => onUpdateStatus?.(complaint)}
                className="px-2.5 py-1 text-xs font-bold text-white rounded-lg btn-primary-purple flex items-center gap-1 transition-colors shadow-xs"
              >
                <Wrench className="w-3 h-3" /> Update Status
              </button>
            )}

          {/* Student: Confirm resolution & feedback (only after warden verification) */}
          {currentUser?.role === 'student' &&
            complaint.status === 'AWAITING_VERIFICATION' && (
              <button
                onClick={() => onFeedback?.(complaint)}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-1 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Rate &amp; Close
              </button>
            )}

          <button
            onClick={() => navigate(`/complaint/${complaint.id}`)}
            className="p-1 rounded-lg text-purple-400 hover:text-white hover:bg-purple-500/20 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
