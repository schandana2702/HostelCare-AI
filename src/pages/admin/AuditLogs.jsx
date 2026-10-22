import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import { FileSpreadsheet, Search } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setError(null);
    auditService.getAuditLogs().then((list) => {
      setLogs(list);
      setLoading(false);
    }).catch((err) => {
      setError(err?.message || 'Failed to load audit logs.');
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.actorName?.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.targetId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                System Audit Trail
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Immutable transaction log of user activities, ticket assignments, status updates, and SLA escalations.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
        <input
          type="text"
          placeholder="Filter audit logs by action, actor, ticket ID, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/50">Loading audit history...</div>
      ) : error ? (
        <div className="glass-card rounded-3xl border border-rose-500/20 bg-rose-950/20 p-12 text-center text-rose-400 text-sm">
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-card rounded-3xl border border-purple-500/15 p-12 text-center">
          <p className="text-sm text-purple-300/60">No audit events match your search query.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-purple-500/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 border-b border-purple-500/20 text-[11px] font-bold uppercase tracking-wider text-purple-200">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Action Type</th>
                  <th className="px-5 py-3.5">Actor &amp; Role</th>
                  <th className="px-5 py-3.5">Target ID</th>
                  <th className="px-5 py-3.5">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10 text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-purple-900/15 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-300/60 font-mono">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full font-semibold text-[10px] border bg-purple-500/15 border-purple-500/30 text-purple-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-white">{log.actorName}</span>{' '}
                      <span className="text-[10px] text-purple-300/60 capitalize">({log.actorRole})</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-purple-300 font-mono">
                      {log.targetId ? `#${log.targetId.slice(0, 8)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-purple-200/80 max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
