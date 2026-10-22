import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { formatDate } from '../../utils/dateUtils';
import { Calendar, Clock, MapPin, CheckCircle, Wrench } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const statusStyle = {
  ASSIGNED:     { bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30', label: 'Assigned' },
  IN_PROGRESS:  { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30', label: 'In Progress' },
  COMPLETED:    { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', label: 'Completed' },
  AWAITING_VERIFICATION: { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', label: 'Awaiting Verify' },
  CLOSED:       { bg: 'bg-purple-950/40 text-purple-300/60 border-purple-500/20', label: 'Closed' }
};

export default function SchedulePage() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [viewDate, setViewDate] = useState(today);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    complaintService.getComplaints({ assignedToId: currentUser.uid })
      .then((list) => setTasks(list))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = {};
  tasks.forEach((t) => {
    const d = t.scheduledDate || t.createdAt;
    if (!d) return;
    const key = new Date(d).toDateString();
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(t);
  });

  // Calendar grid for the viewed month
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const activeTasks = tasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const completed = tasks.filter((t) => ['COMPLETED', 'AWAITING_VERIFICATION', 'CLOSED'].includes(t.status));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                My Work Schedule
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Calendar view of your assigned maintenance appointments, scheduled visits, and active tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Tasks', value: activeTasks.length, color: 'text-purple-300', bg: 'bg-purple-500/10 border-purple-500/25' },
          { label: 'Completed', value: completed.length, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/25' },
          { label: 'Total Assigned', value: tasks.length, color: 'text-white', bg: 'bg-purple-950/40 border-purple-500/20' }
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl border p-5 text-center ${s.bg}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/70">{s.label}</p>
            <p className={`text-2xl font-black mt-1 font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-base font-bold"
            >
              ‹
            </button>
            <h3 className="text-base font-bold text-white tracking-wide">
              {MONTHS[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-base font-bold"
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-purple-300/60 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month, day);
              const key = dateObj.toDateString();
              const dayTasks = tasksByDate[key] || [];
              const isToday = dateObj.toDateString() === today.toDateString();

              return (
                <div
                  key={day}
                  className={`h-12 flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all cursor-default ${
                    isToday
                      ? 'bg-purple-600/25 border border-purple-400 text-white font-bold shadow-xs'
                      : 'hover:bg-purple-900/20 border border-transparent text-purple-200/80'
                  }`}
                >
                  <span className="text-xs">{day}</span>
                  {dayTasks.length > 0 && (
                    <span className="w-4 h-1.5 rounded-full mt-1 bg-purple-400 shadow-xs shadow-purple-400/50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Active Queue</h3>
          {loading ? (
            <div className="py-10 text-center text-xs text-purple-300/50">Loading schedule...</div>
          ) : activeTasks.length === 0 ? (
            <div className="glass-card rounded-3xl border border-purple-500/15 p-8 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
              <p className="text-sm font-bold text-white">No active tasks</p>
              <p className="text-xs mt-1 text-purple-300/60">Your schedule is completely clear!</p>
            </div>
          ) : (
            activeTasks.map((t) => {
              const st = statusStyle[t.status] || statusStyle.ASSIGNED;
              return (
                <div
                  key={t.id}
                  className="glass-card rounded-2xl border border-purple-500/15 p-4 space-y-2 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-purple-300/60">#{t.id.slice(0, 8)}</span>
                      <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5">{t.title}</h4>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${st.bg}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1 border-t border-purple-500/10">
                    <span className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                      <MapPin className="w-3.5 h-3.5 text-purple-400" />
                      {t.hostelBlock} — Room {t.roomNumber}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      {formatDate(t.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-purple-300/70">
                      <Wrench className="w-3.5 h-3.5 text-purple-400" />
                      {t.category || 'General'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
