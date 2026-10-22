import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/dateUtils';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckCheck,
  MessageSquare
} from 'lucide-react';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const navigate = useNavigate();

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'STATUS_CHANGE':
      case 'RESOLVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'URGENT':
      case 'ESCALATED':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'COMMENT':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-purple-300" />;
    }
  };

  const handleClickNotification = (n) => {
    if (!n.read) markAsRead(n.id);
    if (n.complaintId) {
      navigate(`/complaint/${n.complaintId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Bell className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Notifications &amp; System Alerts
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Real-time updates on your complaint status changes, assignments, and campus circulars.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-500/30 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-purple-400" />
              Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-500/15 pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-purple-300/70 hover:text-white hover:bg-white/5'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-purple-300/70 hover:text-white hover:bg-white/5'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-purple-500/15">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3 text-purple-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Notifications</h3>
          <p className="text-xs text-purple-300/60 mt-1">
            {filter === 'UNREAD'
              ? 'You have read all your notifications.'
              : 'You have no alerts or messages at this time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickNotification(n)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                n.read
                  ? 'glass-card border-purple-500/10 hover:border-purple-500/30 opacity-75 hover:opacity-100'
                  : 'glass-card border-purple-500/35 bg-purple-950/30 shadow-lg shadow-purple-950/50'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-500/20 shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {n.title}
                  </h4>
                  <span className="text-[11px] font-mono text-purple-300/50 whitespace-nowrap">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-purple-200/70 mt-1 leading-relaxed line-clamp-2">
                  {n.message}
                </p>
              </div>

              {!n.read && (
                <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-2 bg-purple-400 shadow-xs shadow-purple-400/80 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
