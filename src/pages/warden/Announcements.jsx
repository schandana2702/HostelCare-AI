import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import { useAuth } from '../../context/AuthContext';
import { HOSTEL_BLOCKS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';

export default function Announcements() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    hostelBlock: currentUser?.hostelBlock || 'All Hostels'
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await announcementService.getAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      setError(err?.message || 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementService.createAnnouncement({
        ...formData,
        authorName: currentUser?.displayName || 'Hostel Administration'
      });
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        priority: 'MEDIUM',
        hostelBlock: currentUser?.hostelBlock || 'All Hostels'
      });
      loadAnnouncements();
    } catch (err) {
      alert(err?.message || 'Failed to post notice.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this notice?')) {
      try {
        await announcementService.deleteAnnouncement(id);
        loadAnnouncements();
      } catch (err) {
        alert(err?.message || 'Failed to delete notice.');
      }
    }
  };

  const canManage = ['warden', 'admin', 'administrator'].includes(currentUser?.role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Megaphone className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Hostel Notices & Announcements
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Broadcast emergency alerts, maintenance schedules, and administrative circulars directly to students.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary-purple px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Post New Notice
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/50">Loading notices...</div>
      ) : error ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-rose-500/20 bg-rose-950/20">
          <p className="text-sm font-semibold text-rose-400">{error}</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-purple-500/15">
          <p className="text-sm text-purple-300/60">No announcements published at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {announcements.map((ann) => {
            const isHigh = ann.priority === 'HIGH';
            const isMedium = ann.priority === 'MEDIUM';

            return (
              <div
                key={ann.id}
                className="glass-card rounded-3xl p-6 border border-purple-500/15 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        isHigh
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : isMedium
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {ann.priority} Priority
                    </span>
                    <span className="text-purple-300/50 text-[11px] font-mono">{formatDate(ann.createdAt)}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-purple-200/70 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-purple-500/10 flex items-center justify-between text-[11px] text-purple-300/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400/80" />
                    <span>{ann.hostelBlock || 'All Hostels'}</span>
                    <span className="text-purple-500">•</span>
                    <span>By {ann.authorName}</span>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 text-purple-300/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Notice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card w-full max-w-lg rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-purple-500/20 bg-purple-950/40">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Post Hostel Notice</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-purple-300/60 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Scheduled Water Tank Sanitization"
                  className="w-full px-4 py-2.5 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
                  >
                    <option value="LOW" className="bg-[#120B24] text-white">Low</option>
                    <option value="MEDIUM" className="bg-[#120B24] text-white">Medium</option>
                    <option value="HIGH" className="bg-[#120B24] text-white">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2">
                    Target Hostel
                  </label>
                  <select
                    value={formData.hostelBlock}
                    onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
                  >
                    <option value="All Hostels" className="bg-[#120B24] text-white">All Hostels</option>
                    {HOSTEL_BLOCKS.map((b) => (
                      <option key={b} value={b} className="bg-[#120B24] text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2">
                  Notice Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide complete announcement details, instructions, or disruption timings..."
                  className="w-full px-4 py-2.5 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-purple-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-purple px-5 py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
