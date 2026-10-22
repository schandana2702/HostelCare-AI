import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { CheckCircle, Star, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export default function WorkHistory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    complaintService
      .getComplaints({ assignedToId: currentUser.uid })
      .then((list) => {
        const completedJobs = list.filter((c) =>
          ['COMPLETED', 'AWAITING_VERIFICATION', 'CLOSED'].includes(c.status)
        );
        setHistory(completedJobs);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Completed Work &amp; Service History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Archived record of resolved tickets, materials used, diagnostic remarks, and resident feedback.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/50">Loading work history...</div>
      ) : history.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-purple-500/15">
          <p className="text-sm text-purple-300/60">No completed jobs in your history yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/complaint/${item.id}`)}
              className="glass-card rounded-2xl p-5 border border-purple-500/15 hover:border-purple-500/35 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    #{item.id.slice(0, 8)}
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </span>

                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-purple-200/70 line-clamp-1 italic">
                  Notes: &ldquo;{item.workNotes || 'Standard maintenance resolution.'}&rdquo;
                </p>

                <div className="flex items-center gap-3 text-[11px] text-purple-300/50 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" /> {item.hostelBlock} • Rm {item.roomNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" /> Logged {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>

              {item.rating ? (
                <div className="sm:text-right shrink-0">
                  <div className="flex items-center sm:justify-end gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          item.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-purple-400/20'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-300 ml-1">
                      {item.rating} / 5
                    </span>
                  </div>
                  {item.feedback && (
                    <p className="text-[11px] text-purple-200/70 italic mt-0.5 line-clamp-1">
                      &ldquo;{item.feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-purple-300/40 italic sm:text-right">
                  Pending student rating
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
