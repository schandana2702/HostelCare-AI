import React, { useState, useEffect } from 'react';
import { Building, Edit2, Users, BedDouble, Home, AlertCircle } from 'lucide-react';
import { HOSTEL_BLOCKS, HOSTEL_BLOCK_META } from '../../utils/constants';
import { hostelService, DEFAULT_HOSTEL_DATA } from '../../services/hostelService';

export default function HostelManagement() {
  const [rooms, setRooms] = useState(DEFAULT_HOSTEL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editBlock, setEditBlock] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ total: '', occupied: '', floors: '' });

  const loadHostels = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await hostelService.getHostels();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load hostel data from Firestore:', err);
      setError(err.message || 'Failed to load hostel configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostels();
  }, []);

  const openEdit = (block) => {
    setEditBlock(block);
    const r = rooms[block] || DEFAULT_HOSTEL_DATA[block] || { total: 0, occupied: 0, floors: 1 };
    setForm({ total: r.total, occupied: r.occupied, floors: r.floors });
  };

  const saveEdit = async () => {
    if (!editBlock) return;
    setSaving(true);
    setError('');

    const newTotal = parseInt(form.total, 10) || 0;
    const newOccupied = parseInt(form.occupied, 10) || 0;
    const defaultFloor = editBlock === 'B Block' ? 15 : 1;
    const newFloors = parseInt(form.floors, 10) || defaultFloor;

    try {
      await hostelService.updateBlock(editBlock, {
        total: newTotal,
        occupied: newOccupied,
        floors: newFloors
      });

      setRooms((prev) => ({
        ...prev,
        [editBlock]: {
          ...prev[editBlock],
          total: newTotal,
          occupied: newOccupied,
          floors: newFloors
        }
      }));
      setEditBlock(null);
    } catch (err) {
      console.error('Error saving hostel changes to Firestore:', err);
      setError(err.message || 'Failed to save hostel changes.');
    } finally {
      setSaving(false);
    }
  };

  const totalRooms = Object.values(rooms).reduce((s, r) => s + (r.total || 0), 0);
  const totalOccupied = Object.values(rooms).reduce((s, r) => s + (r.occupied || 0), 0);
  const totalVacant = Math.max(0, totalRooms - totalOccupied);
  const occupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Building className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Hostel Management
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Manage hostel blocks, room allocation, floors, and structural capacity across the campus.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Rooms', value: totalRooms, icon: BedDouble, bg: 'bg-purple-950/40 border-purple-500/20', color: 'text-white' },
          { label: 'Occupied', value: totalOccupied, icon: Users, bg: 'bg-purple-500/10 border-purple-500/30', color: 'text-purple-300' },
          { label: 'Vacant', value: totalVacant, icon: Home, bg: 'bg-emerald-500/10 border-emerald-500/30', color: 'text-emerald-300' },
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: Building, bg: 'bg-blue-500/10 border-blue-500/30', color: 'text-blue-300' }
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-3xl border p-5 ${s.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-300/70">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Block Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/50">Loading hostel configuration from Firestore...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HOSTEL_BLOCKS.map((block) => {
            const r = rooms[block] || DEFAULT_HOSTEL_DATA[block] || { total: 0, occupied: 0, floors: 1 };
            const pct = r.total > 0 ? Math.round((r.occupied / r.total) * 100) : 0;
            const vacant = Math.max(0, r.total - r.occupied);

            return (
              <div
                key={block}
                className="glass-card rounded-3xl border border-purple-500/15 p-6 space-y-5 hover:border-purple-500/35 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{block}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {HOSTEL_BLOCK_META[block]?.gender && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-purple-500/15 border-purple-500/30 text-purple-300">
                            {HOSTEL_BLOCK_META[block].gender === 'Men' ? "Men's" : "Women's"}
                          </span>
                        )}
                        <p className="text-[11px] text-purple-300/60">
                          {r.floors} floor{r.floors !== 1 ? 's' : ''}
                          {HOSTEL_BLOCK_META[block]?.description ? ` · ${HOSTEL_BLOCK_META[block].description}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(block)}
                    className="p-2 rounded-xl text-purple-300/60 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
                    title="Edit block details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-purple-300/60">Occupancy</span>
                    <span className="font-bold text-white font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-purple-950/60 border border-purple-500/20">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 90
                          ? 'bg-rose-500'
                          : pct >= 70
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Total', value: r.total, color: 'text-white' },
                    { label: 'Occupied', value: r.occupied, color: 'text-purple-300' },
                    { label: 'Vacant', value: vacant, color: 'text-emerald-300' }
                  ].map((s) => (
                    <div key={s.label} className="text-center rounded-2xl py-2.5 bg-purple-950/40 border border-purple-500/15">
                      <p className={`text-base font-extrabold font-mono ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] text-purple-300/60 uppercase font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card w-full max-w-sm rounded-3xl border border-purple-500/30 shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">
              Edit: {editBlock}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Total Rooms', field: 'total', placeholder: '0' },
                { label: 'Occupied Rooms', field: 'occupied', placeholder: '0' },
                { label: 'Number of Floors', field: 'floors', placeholder: editBlock === 'B Block' ? '15' : '1' }
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-purple-200">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-purple-500/20">
              <button
                onClick={() => setEditBlock(null)}
                disabled={saving}
                className="px-4 py-2 text-xs rounded-xl font-medium text-purple-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="btn-primary-purple px-5 py-2 text-xs rounded-xl font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save to Firestore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
