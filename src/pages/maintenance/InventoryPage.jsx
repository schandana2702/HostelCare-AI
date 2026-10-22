import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Search, AlertTriangle, CheckCircle, Edit2, Trash2 } from 'lucide-react';

const getStorageKey = (uid) => `hostelcare_inventory_${uid}`;
const SAMPLE_CATEGORIES = ['Electrical', 'Plumbing', 'Carpentry', 'HVAC', 'General', 'Safety'];

const INITIAL_INVENTORY = [
  { id: 'inv-1', name: 'Wire Connectors (pack)', category: 'Electrical', qty: 15, minQty: 5, unit: 'pack', notes: '' },
  { id: 'inv-2', name: 'PVC Pipes 1/2"', category: 'Plumbing', qty: 8, minQty: 10, unit: 'pcs', notes: 'Need to reorder' },
  { id: 'inv-3', name: 'Wood Screws Assorted', category: 'Carpentry', qty: 200, minQty: 50, unit: 'pcs', notes: '' },
  { id: 'inv-4', name: 'LED Bulbs 9W', category: 'Electrical', qty: 12, minQty: 10, unit: 'pcs', notes: '' },
  { id: 'inv-5', name: 'Plumber Tape (Teflon)', category: 'Plumbing', qty: 6, minQty: 3, unit: 'rolls', notes: '' }
];

function loadInventory(uid) {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return INITIAL_INVENTORY.map((i) => ({ ...i }));
}

function saveInventory(uid, items) {
  localStorage.setItem(getStorageKey(uid), JSON.stringify(items));
}

export default function InventoryPage() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Electrical', qty: '', minQty: '', unit: 'pcs', notes: '' });

  useEffect(() => {
    if (currentUser) {
      setItems(loadInventory(currentUser.uid));
    }
  }, [currentUser]);

  const persist = (newItems) => {
    setItems(newItems);
    if (currentUser) saveInventory(currentUser.uid, newItems);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', category: 'Electrical', qty: '', minQty: '', unit: 'pcs', notes: '' });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, qty: item.qty, minQty: item.minQty, unit: item.unit, notes: item.notes || '' });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const qty = parseInt(form.qty) || 0;
    const minQty = parseInt(form.minQty) || 0;
    if (editItem) {
      persist(items.map((i) => i.id === editItem.id ? { ...i, ...form, qty, minQty } : i));
    } else {
      const newItem = { id: `inv-${Date.now()}`, ...form, qty, minQty };
      persist([...items, newItem]);
    }
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this item from inventory?')) {
      persist(items.filter((i) => i.id !== id));
    }
  };

  const filtered = items.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'ALL' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const lowStockCount = items.filter((i) => i.qty < i.minQty).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Package className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Materials &amp; Inventory
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Track spare parts, replacement hardware, and consumables used in hostel maintenance.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="btn-primary-purple px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border bg-amber-500/10 border-amber-500/30 text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-xs font-bold text-amber-300">
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} below minimum stock level
            </p>
            <p className="text-[11px] text-amber-200/70">Highlighted in the table below. Request replenishment from warden.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2.5 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-4 py-2.5 text-xs text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
        >
          <option value="ALL" className="bg-[#120B24] text-white">All Categories</option>
          {SAMPLE_CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#120B24] text-white">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="glass-card rounded-3xl border border-purple-500/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-purple-950/40 border-b border-purple-500/20">
              <tr>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-purple-200">Item Name</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-purple-200">Category</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right text-purple-200">Qty</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right text-purple-200">Min Qty</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-purple-200">Unit</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-purple-200">Status</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-purple-200">Notes</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-purple-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-purple-300/50">
                    No inventory items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.qty < item.minQty;
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors hover:bg-purple-900/15 ${
                        isLow ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-semibold text-white">{item.name}</td>
                      <td className="px-5 py-3.5 text-purple-300/80">{item.category}</td>
                      <td
                        className={`px-5 py-3.5 text-right font-bold font-mono ${
                          isLow ? 'text-rose-400' : 'text-purple-100'
                        }`}
                      >
                        {item.qty}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-purple-300/60">{item.minQty}</td>
                      <td className="px-5 py-3.5 text-purple-300/80">{item.unit}</td>
                      <td className="px-5 py-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            <CheckCircle className="w-3 h-3" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-[150px] truncate text-purple-300/60">
                        {item.notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg mr-1 text-purple-300/70 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-3xl border border-purple-500/30 shadow-2xl p-6">
            <h3 className="text-base font-bold text-white mb-5">
              {editItem ? 'Edit Inventory Item' : 'Add New Item'}
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Item Name', field: 'name', type: 'text', placeholder: 'e.g. LED Bulbs 9W' },
                { label: 'Quantity', field: 'qty', type: 'number', placeholder: '0' },
                { label: 'Minimum Qty (alert threshold)', field: 'minQty', type: 'number', placeholder: '5' },
                { label: 'Unit', field: 'unit', type: 'text', placeholder: 'pcs / rolls / pack' },
                { label: 'Notes', field: 'notes', type: 'text', placeholder: 'Optional notes...' }
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-[11px] font-semibold text-purple-200 uppercase tracking-wider mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-semibold text-purple-200 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
                >
                  {SAMPLE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#120B24] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-purple-500/20">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs rounded-xl font-medium text-purple-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn-primary-purple px-5 py-2 text-xs rounded-xl font-semibold cursor-pointer"
              >
                {editItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
