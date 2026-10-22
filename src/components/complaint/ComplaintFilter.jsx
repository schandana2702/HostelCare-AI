import React from 'react';
import { CATEGORIES, PRIORITIES, WORKFLOW_STATUSES, HOSTEL_BLOCKS } from '../../utils/constants';
import { Search, RotateCcw, Filter } from 'lucide-react';

export default function ComplaintFilter({
  filters,
  onChange,
  onReset,
  showBlockFilter = true
}) {
  const quickStatusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'SUBMITTED', label: 'Submitted' },
    { id: 'ASSIGNED', label: 'Assigned' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'AWAITING_VERIFICATION', label: 'Verification' },
    { id: 'CLOSED', label: 'Closed' }
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 mb-6">
      {/* Quick Pill Filter Bar (Mobile-friendly horizontal scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 border-b border-purple-500/15 scrollbar-none">
        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300/60 flex items-center gap-1 shrink-0 mr-1">
          <Filter className="w-3 h-3 text-purple-400" /> Filter:
        </span>
        {quickStatusTabs.map((tab) => {
          const isActive = (filters.status || 'ALL') === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange('status', tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-purple-400/40'
                  : 'bg-purple-950/40 text-purple-300/80 hover:text-white hover:bg-purple-900/50 border border-purple-500/20'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/80" />
          <input
            type="text"
            placeholder="Search tickets, rooms, resident names..."
            value={filters.search || ''}
            onChange={(e) => onChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onChange('status', e.target.value)}
            aria-label="Filter complaints by status"
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#150f2e] text-purple-200 outline-none focus:border-purple-400"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(WORKFLOW_STATUSES).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Dropdown */}
        <div>
          <select
            value={filters.priority || 'ALL'}
            onChange={(e) => onChange('priority', e.target.value)}
            aria-label="Filter complaints by priority"
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#150f2e] text-purple-200 outline-none focus:border-purple-400"
          >
            <option value="ALL">All Priorities</option>
            {Object.keys(PRIORITIES).map((pri) => (
              <option key={pri} value={pri}>
                {pri}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <select
            value={filters.category || 'ALL'}
            onChange={(e) => onChange('category', e.target.value)}
            aria-label="Filter complaints by category"
            className="w-full px-3 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-[#150f2e] text-purple-200 outline-none focus:border-purple-400"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Second row: Hostel Block filter + Reset button */}
      <div className="mt-3.5 pt-3 border-t border-purple-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
        {showBlockFilter ? (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-purple-300/70">Hostel Block:</span>
            <select
              value={filters.hostelBlock || 'All Hostels'}
              onChange={(e) => onChange('hostelBlock', e.target.value)}
              aria-label="Filter complaints by hostel block"
              className="px-2.5 py-1 text-xs rounded-lg border border-purple-500/25 bg-[#150f2e] text-purple-200 outline-none"
            >
              <option value="All Hostels">All Hostels</option>
              {HOSTEL_BLOCKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        ) : <div />}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 font-semibold text-purple-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
        </button>
      </div>
    </div>
  );
}
