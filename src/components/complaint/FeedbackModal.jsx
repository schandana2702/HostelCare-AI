import React, { useState, useEffect, useRef } from 'react';
import { X, Star, CheckCircle, ThumbsUp, AlertCircle, Loader2 } from 'lucide-react';

export default function FeedbackModal({ complaint, isOpen, onClose, onConfirm }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const closeTimerRef = useRef(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setFeedback('');
      setError('');
      setLoading(false);
      setSuccess(false);
    }
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || success) return;
    setLoading(true);
    setError('');
    try {
      await onConfirm(complaint.id, rating, feedback);
      setSuccess(true);
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Feedback confirmation error:', err);
      // Preserve rating and feedback on failure so the resident does not lose their input
      setError(err?.message || 'Failed to submit feedback and close complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#150f2e] w-full max-w-md rounded-3xl shadow-2xl border border-purple-500/25 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <CheckCircle className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Confirm Resolution &amp; Feedback</h3>
              <p className="text-xs text-purple-300/60">Ticket #{complaint.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || success}
            className="p-1.5 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body or Success State */}
        {success ? (
          <div className="p-8 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-white">Resolution Confirmed!</h4>
            <p className="text-xs text-purple-200/80 max-w-xs mx-auto">
              Thank you for your feedback. Complaint #{complaint.id} has been recorded and closed in Firebase.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-center">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-white">
                How satisfied are you with this repair?
              </h4>
              <p className="text-xs text-purple-300/70 mt-1">
                Your feedback directly evaluates maintenance quality and technician SLA.
              </p>

              {/* Interactive Stars */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    disabled={loading || success}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => !loading && !success && setHoverRating(star)}
                    onMouseLeave={() => !loading && !success && setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 disabled:hover:scale-100 disabled:opacity-50 focus:outline-hidden cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                          : 'text-purple-400/30'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold text-amber-300 mt-2.5">
                {rating === 5
                  ? '5 Stars — Excellent & Prompt Service'
                  : rating === 4
                  ? '4 Stars — Good & Satisfactory Repair'
                  : rating === 3
                  ? '3 Stars — Average / Solved the Issue'
                  : rating === 2
                  ? '2 Stars — Below Expectations'
                  : '1 Star — Poor or Delayed'}
              </p>
            </div>

            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Feedback / Comments (Optional)
              </label>
              <textarea
                rows={3}
                disabled={loading || success}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., Technician arrived promptly and fixed the problem cleanly. Great job!"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Action Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-500/20">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || success}
                className="px-4 py-2 text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-500/15 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-xl btn-primary-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Closing &amp; Saving...</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    <span>Confirm Resolution &amp; Close</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
