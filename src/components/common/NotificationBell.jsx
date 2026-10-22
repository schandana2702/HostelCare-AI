import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.complaintId) {
      navigate(`/complaint/${item.complaintId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 rounded-xl text-purple-200/80 hover:text-white hover:bg-purple-500/15 border border-transparent hover:border-purple-500/20 transition-all focus:outline-hidden"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#150f2e]/95 backdrop-blur-xl shadow-2xl border border-purple-500/25 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-950/40">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold flex items-center gap-1 text-purple-300 hover:text-white hover:underline transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-purple-500/10">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-purple-300/40 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-purple-600/15 ${
                    !item.read ? 'bg-purple-900/25 font-medium' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                    <span className="text-[10px] text-purple-300/60 whitespace-nowrap">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  {item.complaintId && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300">
                      <span>View Ticket #{item.complaintId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
