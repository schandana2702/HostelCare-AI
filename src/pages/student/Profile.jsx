import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { complaintService } from '../../services/complaintService';
import { ROLE_LABELS } from '../../utils/constants';
import {
  User,
  Mail,
  Phone,
  Home,
  Hash,
  Save,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [roomNumber, setRoomNumber] = useState(currentUser?.roomNumber || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    if (!currentUser) return;

    // Fetch this user's complaints from Firestore
    complaintService.getComplaints({ studentId: currentUser.uid })
      .then((userComplaints) => {
        setStats({
          total: userComplaints.length,
          pending: userComplaints.filter((c) =>
            ['SUBMITTED', 'PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)
          ).length,
          resolved: userComplaints.filter((c) =>
            ['COMPLETED', 'AWAITING_VERIFICATION', 'CLOSED'].includes(c.status)
          ).length
        });
      })
      .catch(() => {
        setStats({ total: 0, pending: 0, resolved: 0 });
      });
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      if (updateProfile) {
        await updateProfile({
          phone: phone.trim(),
          roomNumber: roomNumber.trim()
        });
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden bg-gradient-to-br from-purple-900/80 via-purple-950/90 to-[#120a28] border border-purple-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-3xl font-extrabold shadow-[0_0_25px_rgba(168,85,247,0.4)]">
            {currentUser?.displayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white">{currentUser?.displayName || 'Resident'}</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold border border-purple-400/35 bg-purple-500/20 text-purple-200">
                {currentUser ? ROLE_LABELS[currentUser.role] : 'Resident'}
              </span>
            </div>
            <p className="text-xs flex items-center gap-2 text-purple-200/80">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              {currentUser?.email}
            </p>
            {currentUser?.hostelBlock && (
              <p className="text-xs text-purple-200/80 flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-purple-400" />
                {currentUser.hostelBlock} {currentUser.roomNumber ? `• Room ${currentUser.roomNumber}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Stats for Residents */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/20 border border-purple-500/30 text-purple-300">
            <Layers className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-300/60">Total Complaints</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Clock className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-300/60">In Progress / Pending</p>
            <p className="text-2xl font-extrabold text-amber-300 mt-0.5">{stats.pending}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-purple-500/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-300/60">Resolved &amp; Closed</p>
            <p className="text-2xl font-extrabold text-emerald-300 mt-0.5">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Profile Details & Settings */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/25">
        <div className="border-b border-purple-500/20 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white">Profile &amp; Institutional Contact Details</h2>
          <p className="text-xs mt-0.5 text-purple-300/70">
            Keep your room and emergency contact information current for fast maintenance technician dispatch.
          </p>
        </div>

        {savedSuccess && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="text"
                  disabled
                  value={currentUser?.displayName || ''}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-purple-500/20 font-medium cursor-not-allowed bg-purple-950/20 text-purple-300/70"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-purple-500/20 font-medium cursor-not-allowed bg-purple-950/20 text-purple-300/70"
                />
              </div>
            </div>

            {/* Roll / Staff ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Institutional ID / Roll Number
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="text"
                  disabled
                  value={currentUser?.rollNumber || currentUser?.employeeId || 'N/A'}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-purple-500/20 font-medium cursor-not-allowed bg-purple-950/20 text-purple-300/70"
                />
              </div>
            </div>

            {/* Hostel Block */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Hostel Residence Block
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                <input
                  type="text"
                  disabled
                  value={currentUser?.hostelBlock || 'Campus Facilities'}
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-purple-500/20 font-medium cursor-not-allowed bg-purple-950/20 text-purple-300/70"
                />
              </div>
            </div>

            {/* Room Number (Editable for Student) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Room Number
              </label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g., 304"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                />
              </div>
            </div>

            {/* Phone Number (Editable) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-purple-500/20 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)] btn-primary-purple flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
