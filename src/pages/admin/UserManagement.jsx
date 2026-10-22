import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { ROLES, ROLE_LABELS, HOSTEL_BLOCKS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import {
  Users,
  Search,
  CheckCircle2,
  Ban,
  UserPlus,
  X,
  Shield,
  Building,
  Mail,
  Lock,
  Phone,
  User,
  AlertCircle
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Privileged account creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: ROLES.WARDEN,
    hostelBlock: HOSTEL_BLOCKS[0],
    phone: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await userService.getUsers();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    if (confirm(`Are you sure you want to change this user's role to ${ROLE_LABELS[newRole]}?`)) {
      try {
        await userService.updateUserRole(uid, newRole);
        loadUsers();
      } catch (err) {
        alert(err.message || 'Failed to update user role.');
      }
    }
  };

  const handleStatusToggle = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await userService.toggleUserStatus(uid, newStatus);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (form.password.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      await userService.createPrivilegedUser({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        role: form.role,
        hostelBlock: form.role === ROLES.WARDEN ? form.hostelBlock : '',
        phone: form.phone.trim()
      });

      setCreateSuccess(`Successfully created ${ROLE_LABELS[form.role]} account for ${form.displayName}.`);
      setForm({
        displayName: '',
        email: '',
        password: '',
        role: ROLES.WARDEN,
        hostelBlock: HOSTEL_BLOCKS[0],
        phone: ''
      });
      loadUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setCreateSuccess('');
      }, 1800);
    } catch (err) {
      setCreateError(err.message || 'Failed to create privileged account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.displayName?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.rollNumber?.toLowerCase().includes(q) ||
      u.hostelBlock?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
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
                <Users className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                User &amp; Role Management
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl">
              Administer system roles, authorized accounts, student permissions, and staff assignments.
            </p>
          </div>

          <button
            onClick={() => {
              setCreateError('');
              setCreateSuccess('');
              setIsModalOpen(true);
            }}
            className="btn-primary-purple px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create Staff Account
          </button>
        </div>
      </div>

      {/* Search & Role Filter */}
      <div className="glass-card rounded-2xl border border-purple-500/15 p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll number, or hostel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter users by role"
            className="w-full px-3 py-2.5 text-xs text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
          >
            <option value="ALL" className="bg-[#120B24] text-white">All Roles</option>
            {Object.keys(ROLES).map((rKey) => (
              <option key={rKey} value={ROLES[rKey]} className="bg-[#120B24] text-white">
                {ROLE_LABELS[ROLES[rKey]]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-20 text-center text-xs text-purple-300/50">Loading user registry...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-card rounded-3xl border border-purple-500/15 p-12 text-center">
          <p className="text-sm text-purple-300/60">No users found matching your search.</p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-purple-500/15 overflow-hidden">
          {/* Mobile Card List View (< md) */}
          <div className="divide-y divide-purple-500/10 md:hidden">
            {filteredUsers.map((u) => (
              <div key={`m-${u.uid}`} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                      {u.displayName?.charAt(0)?.toUpperCase() || u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white">{u.displayName || u.name || 'User'}</p>
                      <p className="text-[11px] text-purple-300/60">{u.email}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-[11px] capitalize px-2.5 py-0.5 rounded-full border bg-purple-500/15 text-purple-300 border-purple-500/30">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-purple-300/70">
                    {u.hostelBlock ? `${u.hostelBlock} ${u.roomNumber ? `• Rm ${u.roomNumber}` : ''}` : 'No Room'}
                  </span>
                  <button
                    onClick={() => handleStatusToggle(u.uid, u.status)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${
                      u.status === 'suspended'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {u.status === 'suspended' ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {u.status === 'suspended' ? 'Suspended' : 'Active'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
                  <span className="text-[11px] text-purple-300/60">Change Role:</span>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                    aria-label={`Change role for ${u.displayName}`}
                    className="px-2.5 py-1 text-xs rounded-xl border border-purple-500/30 bg-purple-950/60 text-white font-medium outline-none"
                  >
                    {Object.keys(ROLES).map((k) => (
                      <option key={k} value={ROLES[k]} className="bg-[#120B24] text-white">
                        {ROLE_LABELS[ROLES[k]]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-950/40 border-b border-purple-500/20 text-[11px] font-bold uppercase tracking-wider text-purple-200">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Hostel &amp; Room</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Account Status</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-purple-900/15 transition-colors">
                    <td className="px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-400/30 text-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.displayName?.charAt(0)?.toUpperCase() || u.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.displayName || u.name || 'User'}</p>
                          <p className="text-[11px] text-purple-300/60">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-200">
                      {u.hostelBlock ? `${u.hostelBlock} ${u.roomNumber ? `• Rm ${u.roomNumber}` : ''}` : '-'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-xs capitalize px-2.5 py-0.5 rounded-full border bg-purple-500/15 text-purple-300 border-purple-500/30">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(u.uid, u.status)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                          u.status === 'suspended'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        }`}
                      >
                        {u.status === 'suspended' ? (
                          <>
                            <Ban className="w-3 h-3" /> Suspended
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-purple-300/60 font-mono">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                        aria-label={`Change role for ${u.displayName}`}
                        className="px-2.5 py-1 text-xs rounded-xl border border-purple-500/30 bg-purple-950/60 text-white font-medium outline-none"
                      >
                        {Object.keys(ROLES).map((k) => (
                          <option key={k} value={ROLES[k]} className="bg-[#120B24] text-white">
                            {ROLE_LABELS[ROLES[k]]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff / Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card w-full max-w-md rounded-3xl border border-purple-500/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-300 bg-purple-500/20 border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create Privileged Account
                  </h3>
                  <p className="text-[11px] text-purple-300/60">
                    Creates a real Firebase Auth user &amp; Firestore profile
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-purple-300/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="p-3 rounded-xl flex items-center gap-2 text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1 text-[11px] text-purple-200">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full pl-9 pr-3 py-2 text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1 text-[11px] text-purple-200">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="staff@hostel.edu"
                    className="w-full pl-9 pr-3 py-2 text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider mb-1 text-[11px] text-purple-200">
                  Temporary Password (min 6 chars) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-[11px] text-purple-200">
                    Assigned Role *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
                    >
                      <option value={ROLES.WARDEN} className="bg-[#120B24] text-white">Hostel Warden</option>
                      <option value={ROLES.MAINTENANCE} className="bg-[#120B24] text-white">Maintenance Staff</option>
                      <option value={ROLES.ADMIN} className="bg-[#120B24] text-white">Administrator</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-[11px] text-purple-200">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-9 pr-3 py-2 text-white bg-purple-950/30 rounded-xl border border-purple-500/30 placeholder-purple-400/30 focus:outline-hidden focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              {form.role === ROLES.WARDEN && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider mb-1 text-[11px] text-purple-200">
                    Assigned Hostel Block
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <select
                      value={form.hostelBlock}
                      onChange={(e) => setForm((f) => ({ ...f, hostelBlock: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 text-white bg-purple-950/50 rounded-xl border border-purple-500/30 focus:outline-hidden focus:border-purple-400"
                    >
                      {HOSTEL_BLOCKS.map((b) => (
                        <option key={b} value={b} className="bg-[#120B24] text-white">{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl font-medium text-purple-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary-purple px-5 py-2 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
