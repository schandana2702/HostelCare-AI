import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { uploadComplaintImage, validateImageFile } from '../../services/storageService';
import { CATEGORIES, PRIORITIES, HOSTEL_BLOCKS } from '../../utils/constants';
import SmartAssistant from '../../components/ai/SmartAssistant';
import { analyzeComplaintText, triageComplaintAI } from '../../services/aiService';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function SubmitComplaint() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'plumbing',
    priority: 'MEDIUM',
    hostelBlock: currentUser?.hostelBlock || HOSTEL_BLOCKS[0],
    roomNumber: currentUser?.roomNumber || ''
  });

  const [aiTriageResult, setAiTriageResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null = idle, 0-100 = uploading
  const [error, setError] = useState('');
  const abortControllerRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateImageFile(file);
    } catch (validationErr) {
      setError(validationErr.message);
      e.target.value = '';
      return;
    }

    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(null);
  };

  const handleApplyAISuggestion = (analysis) => {
    setFormData((prev) => ({
      ...prev,
      category: analysis.category,
      priority: analysis.priority
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide both a title and description of the issue.');
      return;
    }

    if (!formData.roomNumber.trim()) {
      setError('Please provide your room number.');
      return;
    }

    setLoading(true);
    setUploadProgress(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let uploadedImageUrl = null;

      if (imageFile) {
        uploadedImageUrl = await uploadComplaintImage(
          imageFile,
          'pending',
          (pct) => setUploadProgress(pct),
          abortController.signal
        );
        setUploadProgress(null);
      }

      // Ensure explainable AI triage and safety indicators are persisted.
      // If live AI is not yet resolved (e.g. rapid user submission before debounce),
      // attempt live triage now; falls back honestly to deterministic rules if unconfigured.
      let effectiveTriage = aiTriageResult;
      if (!effectiveTriage || (!effectiveTriage.available && effectiveTriage.provider === 'heuristic')) {
        try {
          const liveResult = await triageComplaintAI({
            title: formData.title.trim(),
            description: formData.description.trim(),
            category: formData.category,
            hostelBlock: formData.hostelBlock,
            roomNumber: formData.roomNumber.trim()
          });
          if (liveResult) {
            effectiveTriage = liveResult;
          }
        } catch {
          // Keep existing heuristic fallback
        }
      }
      if (!effectiveTriage) {
        effectiveTriage = analyzeComplaintText(formData.title.trim(), formData.description.trim());
      }

      const complaintData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        hostelBlock: formData.hostelBlock,
        roomNumber: formData.roomNumber.trim(),
        studentId: currentUser?.uid,
        studentName: currentUser?.displayName || 'Student',
        studentEmail: currentUser?.email,
        studentPhone: currentUser?.phone || '',
        imageUrl: uploadedImageUrl,
        aiTriage: effectiveTriage ? {
          category: effectiveTriage.category || formData.category,
          priority: effectiveTriage.priority || formData.priority,
          explanation: effectiveTriage.reasoning || effectiveTriage.explanation || '',
          confidence: effectiveTriage.confidence || null,
          provider: effectiveTriage.provider || 'heuristic',
          aiModel: effectiveTriage.aiModel || 'HostelCare Deterministic Triage Engine v1.0',
          available: Boolean(effectiveTriage.available),
          unavailableReason: effectiveTriage.unavailableReason || null,
          evaluatedAt: effectiveTriage.evaluatedAt || new Date().toISOString()
        } : null,
        safetyIndicators: Array.isArray(effectiveTriage?.safetyIndicators) ? effectiveTriage.safetyIndicators : []
      };

      const created = await complaintService.createComplaint(complaintData, {
        name: currentUser?.displayName,
        role: 'student'
      });

      navigate(`/complaint/${created.id}`);
    } catch (err) {
      setUploadProgress(null);
      if (err.message === 'Upload cancelled.') {
        setError('Image upload was cancelled. You can remove the image and try again.');
      } else {
        setError(err.message || 'Failed to submit complaint. Please try again.');
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/25">
        <div className="border-b border-purple-500/20 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.35)]">
              <FileText className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Submit Maintenance Complaint
              </h1>
              <p className="text-xs sm:text-sm mt-0.5 text-purple-300/70">
                Describe the issue clearly. Our AI assistant will help categorize and prioritize it.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs font-semibold text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
              Issue Title *
            </label>
            <input
              type="text"
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Washroom faucet leaking continuously"
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Explain the problem in detail (location within room, when it started, any electrical sparks or water flooding, etc.)..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all resize-none"
            />
          </div>

          {/* AI Smart Assistant suggestion block */}
          <SmartAssistant
            title={formData.title}
            description={formData.description}
            category={formData.category}
            hostelBlock={formData.hostelBlock}
            roomNumber={formData.roomNumber}
            onApplySuggestion={handleApplyAISuggestion}
            onTriageResult={(result) => setAiTriageResult(result)}
          />

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
              >
                {Object.keys(PRIORITIES).map((p) => (
                  <option key={p} value={p}>
                    {p} {p === 'EMERGENCY' ? '🔥 (Immediate hazard)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hostel Block & Room Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Hostel Block
              </label>
              <select
                name="hostelBlock"
                value={formData.hostelBlock}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
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
                Room Number / Location *
              </label>
              <input
                type="text"
                required
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="e.g., 304 or 3rd Floor Common Washroom"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
              />
            </div>
          </div>

          {/* Optional Image Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
              Attach Photo of the Issue (Optional, max 5MB)
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 w-full sm:w-64 h-48 bg-purple-950/40">
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors border border-purple-500/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-purple-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-purple-950/20 hover:bg-purple-900/30 group">
                <Upload className="w-8 h-8 mb-2 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white">
                  Click to select photo or take picture
                </span>
                <span className="text-[11px] mt-0.5 text-purple-300/60">
                  PNG, JPG, JPEG up to 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Upload progress bar */}
          {uploadProgress !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                <span>Uploading photo to secure storage…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-purple-950/60 border border-purple-500/20">
                <div
                  className="h-full rounded-full transition-all duration-200 bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submission Button */}
          <div className="pt-4 border-t border-purple-500/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-purple-300 hover:text-white hover:bg-purple-500/15 border border-purple-500/25 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] btn-primary-purple transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {uploadProgress !== null ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Uploading Photo…
                </>
              ) : loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Submitting Ticket…
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
