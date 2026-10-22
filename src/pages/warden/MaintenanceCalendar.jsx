import React, { useState, useEffect } from 'react';
import { calendarService } from '../../services/calendarService';
import { HOSTEL_BLOCKS } from '../../utils/constants';
import { Calendar as CalendarIcon, Plus, CheckCircle2, Clock, MapPin, X } from 'lucide-react';

export default function MaintenanceCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    date: new Date().toISOString().split('T')[0],
    hostelBlock: HOSTEL_BLOCKS[0],
    assignedTo: 'Campus Facilities Team',
    status: 'Scheduled'
  });

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await calendarService.getCalendarEvents();
      setEvents(list);
    } catch (err) {
      setError(err?.message || 'Failed to load maintenance events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await calendarService.createCalendarEvent(formData);
      setShowModal(false);
      setFormData({
        title: '',
        category: 'General',
        date: new Date().toISOString().split('T')[0],
        hostelBlock: HOSTEL_BLOCKS[0],
        assignedTo: 'Campus Facilities Team',
        status: 'Scheduled'
      });
      loadEvents();
    } catch (err) {
      alert(err?.message || 'Failed to schedule event.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <CalendarIcon className="w-6 h-6 text-purple-400" />
            Hostel Maintenance Schedule
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
            Planned preventive maintenance, equipment audits, and utility shutdowns
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] btn-primary-purple flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" /> Schedule Service
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/60 animate-pulse">Loading schedule...</div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-rose-500/20 bg-rose-950/20">
          <p className="text-xs font-semibold text-rose-400">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/20">
          <p className="text-xs text-purple-300/70">No maintenance events scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="glass-card rounded-2xl p-5 border border-purple-500/20 hover:border-purple-400/40 transition-all"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {ev.category}
                </span>
                <span className="text-purple-300/70 font-medium flex items-center gap-1 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  {ev.date}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-1">{ev.title}</h3>

              <div className="mt-4 pt-3 border-t border-purple-500/15 text-xs text-purple-300/80 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>{ev.hostelBlock}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-300/60">Assigned: {ev.assignedTo}</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {ev.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#150f2e] w-full max-w-md rounded-3xl shadow-2xl border border-purple-500/25 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-950/40">
              <h3 className="text-sm font-bold text-white">Schedule Preventive Maintenance</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-purple-300/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Overhead Water Tank Scrubbing"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Plumbing, Safety..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                    Service Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Target Hostel / Area
                </label>
                <select
                  value={formData.hostelBlock}
                  onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
                >
                  <option value="All Hostels">All Hostels</option>
                  {HOSTEL_BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Assigned Team / Contractor
                </label>
                <input
                  type="text"
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Facilities Team or External Vendor"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-purple-300 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white rounded-xl btn-primary-purple shadow-md"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
