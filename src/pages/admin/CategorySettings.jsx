import React, { useState, useEffect } from 'react';
import { CATEGORIES, HOSTEL_BLOCKS } from '../../utils/constants';
import { Sliders, Save, Check, Loader2 } from 'lucide-react';
import { db, isFirebaseConfigured } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function CategorySettings() {
  const [categories, setCategories] = useState(CATEGORIES);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      if (!isFirebaseConfigured || !db) return;
      try {
        const ref = doc(db, 'settings', 'categories');
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().items) {
          setCategories(snap.data().items);
        }
      } catch (err) {
        console.error('Error loading category settings from Firestore:', err);
        setError(err.message || 'Failed to load category settings.');
      }
    }
    loadSettings();
  }, []);

  const handleSlaChange = (id, newSla) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, defaultSla: Number(newSla) } : c))
    );
    setSaved(false);
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isFirebaseConfigured && db) {
        const ref = doc(db, 'settings', 'categories');
        await setDoc(ref, { items: categories, updatedAt: new Date().toISOString() }, { merge: true });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save category SLA settings:', err);
      setError(err.message || 'Failed to save settings to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Sliders className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Categories &amp; SLA Configuration
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Configure complaint categories, default SLA resolution deadlines, and structural wings.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary-purple px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto disabled:opacity-60 cursor-pointer shadow-lg shadow-purple-600/30"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save SLA Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs font-semibold text-rose-300">
          {error}
        </div>
      )}

      {/* Category SLA Table */}
      <div className="glass-card rounded-3xl border border-purple-500/15 overflow-hidden">
        <div className="p-5 border-b border-purple-500/20 bg-purple-950/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200">
            Active Maintenance Categories &amp; Target Resolution Time
          </h3>
        </div>

        <div className="divide-y divide-purple-500/10">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-purple-900/15 transition-colors"
            >
              <div>
                <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                <p className="text-[11px] text-purple-300/60 font-mono mt-0.5">Key: {cat.id}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-purple-300/80">Target SLA:</span>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={cat.defaultSla}
                  onChange={(e) => handleSlaChange(cat.id, e.target.value)}
                  className="w-20 px-3 py-1.5 text-xs font-bold text-white text-center bg-purple-950/40 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400 font-mono"
                />
                <span className="text-xs text-purple-300/60 font-medium">hours</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hostel Blocks Registry */}
      <div className="glass-card rounded-3xl border border-purple-500/15 p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300/70 mb-4">
          Registered Hostel Blocks &amp; Wings
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HOSTEL_BLOCKS.map((block) => (
            <div
              key={block}
              className="p-3.5 rounded-2xl border border-purple-500/15 bg-purple-950/30 text-xs font-semibold text-purple-200 text-center"
            >
              {block}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
