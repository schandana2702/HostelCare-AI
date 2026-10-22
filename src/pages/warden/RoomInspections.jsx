import React, { useState, useEffect } from 'react';
import { inspectionService } from '../../services/inspectionService';
import { useAuth } from '../../context/AuthContext';
import { HOSTEL_BLOCKS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import { ClipboardCheck, Plus, Star, AlertTriangle, X } from 'lucide-react';

export default function RoomInspections() {
  const { currentUser } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    roomNumber: '',
    hostelBlock: currentUser?.hostelBlock || HOSTEL_BLOCKS[0],
    inspectorName: currentUser?.displayName || 'Hostel Warden',
    cleanlinessRating: 4,
    furnitureCondition: 'Good',
    violationsFound: 'None',
    notes: ''
  });

  const loadInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await inspectionService.getInspections();
      setInspections(list);
    } catch (err) {
      setError(err?.message || 'Failed to load room inspections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspections();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await inspectionService.recordInspection(formData);
      setShowModal(false);
      setFormData({
        roomNumber: '',
        hostelBlock: currentUser?.hostelBlock || HOSTEL_BLOCKS[0],
        inspectorName: currentUser?.displayName || 'Hostel Warden',
        cleanlinessRating: 4,
        furnitureCondition: 'Good',
        violationsFound: 'None',
        notes: ''
      });
      loadInspections();
    } catch (err) {
      alert(err?.message || 'Failed to record inspection.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5 text-white">
            <ClipboardCheck className="w-6 h-6 text-purple-400" />
            Room Inspection Records
          </h1>
          <p className="text-xs sm:text-sm text-purple-300/70 mt-0.5">
            Log routine checks, hygiene ratings, unauthorized appliances, and room furniture condition
          </p>
        </div>

        {['warden', 'admin', 'administrator'].includes(currentUser?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] btn-primary-purple flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Record Inspection
          </button>
        )}
      </div>

      {/* Inspections Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/60 animate-pulse">Loading inspection records...</div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-rose-500/20 bg-rose-950/20">
          <p className="text-xs font-semibold text-rose-400">{error}</p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-purple-500/20">
          <p className="text-xs text-purple-300/70">No room inspection audits recorded yet.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-purple-500/20 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-purple-200">
              <thead className="border-b border-purple-500/20 text-[11px] font-bold uppercase tracking-wider bg-purple-950/60 text-purple-200">
                <tr>
                  <th className="px-4 py-3.5">Room &amp; Block</th>
                  <th className="px-4 py-3.5">Inspector</th>
                  <th className="px-4 py-3.5">Cleanliness</th>
                  <th className="px-4 py-3.5">Furniture</th>
                  <th className="px-4 py-3.5">Violations</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-purple-600/10 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white whitespace-nowrap">
                      Room {insp.roomNumber} ({insp.hostelBlock})
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-purple-200/90">{insp.inspectorName}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-300 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                        <span>{insp.cleanlinessRating} / 5</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-purple-200/80">{insp.furnitureCondition}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {insp.violationsFound && insp.violationsFound !== 'None' ? (
                        <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-rose-500/35">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {insp.violationsFound}
                        </span>
                      ) : (
                        <span className="text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border border-emerald-500/30">
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-purple-200/80 max-w-xs truncate">{insp.notes || '-'}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-purple-300/60">
                      {formatDate(insp.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#150f2e] w-full max-w-md rounded-3xl shadow-2xl border border-purple-500/25 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-950/40">
              <h3 className="text-sm font-bold text-white">Record Room Inspection</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-purple-300/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="304"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                    Cleanliness (1-5)
                  </label>
                  <select
                    value={formData.cleanlinessRating}
                    onChange={(e) => setFormData({ ...formData, cleanlinessRating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} Stars
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Hostel Block
                </label>
                <select
                  value={formData.hostelBlock}
                  onChange={(e) => setFormData({ ...formData, hostelBlock: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
                >
                  {HOSTEL_BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Furniture Condition
                </label>
                <input
                  type="text"
                  value={formData.furnitureCondition}
                  onChange={(e) => setFormData({ ...formData, furnitureCondition: e.target.value })}
                  placeholder="e.g., Good, Bed frame loose, chair chipped"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Violations / Unauthorized Items
                </label>
                <input
                  type="text"
                  value={formData.violationsFound}
                  onChange={(e) => setFormData({ ...formData, violationsFound: e.target.value })}
                  placeholder="e.g., None or Electric kettle without permit"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                  Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observations regarding room upkeep or maintenance requirements..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 resize-none"
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
                  Save Inspection Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
