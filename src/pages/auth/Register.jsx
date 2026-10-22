import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HOSTEL_BLOCKS } from '../../utils/constants';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Home,
  Hash,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';

function Field({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, required, children }) {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
        {label}{required && <span className="text-rose-400"> *</span>}
      </label>
      {children || (
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/70" />
          )}
          <input
            type={isPassword && showPass ? 'text' : type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
            style={{
              paddingLeft: Icon ? '2.5rem' : '0.85rem',
              paddingRight: isPassword ? '2.5rem' : '0.85rem'
            }}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/70 hover:text-purple-200 focus:outline-none"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    rollNumber: '',
    hostelBlock: HOSTEL_BLOCKS[0],
    roomNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!form.rollNumber.trim()) {
      setError('Student roll / ID number is required.');
      return;
    }
    if (!form.roomNumber.trim()) {
      setError('Room number is required.');
      return;
    }

    setLoading(true);
    try {
      await register(form.email.trim(), form.password, {
        displayName: form.displayName.trim(),
        phone: form.phone.trim(),
        rollNumber: form.rollNumber.trim(),
        hostelBlock: form.hostelBlock,
        roomNumber: form.roomNumber.trim()
      });
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#0B0816] text-[#F3F0FA] ambient-glow relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/20 rounded-full blur-[130px] z-0" 
        aria-hidden="true"
      />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center relative z-10">
        <div className="w-14 h-14 mx-auto rounded-3xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(168,85,247,0.45)] mb-3 bg-gradient-to-tr from-purple-700 to-indigo-600 border border-purple-400/40">
          <GraduationCap className="w-7 h-7 text-purple-100" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Student Registration
        </h2>
        <p className="mt-1 text-xs font-medium text-purple-300/70">
          HostelCare AI — Hostel Complaint &amp; Maintenance Management
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="glass-card py-7 px-6 sm:px-8 rounded-3xl shadow-2xl border border-purple-500/25">
          {/* Info notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-purple-500/25 bg-purple-950/40 mb-5 text-xs text-purple-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
            <span>
              This registration is for <strong>hostel residents</strong> only.
              Warden, Maintenance Staff, and Administrator accounts are provisioned securely by administrators.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" icon={User} name="displayName" value={form.displayName} onChange={handleChange} placeholder="Your full name" required />
            <Field label="Email Address" icon={Mail} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@college.edu" required />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Password" icon={Lock} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />
              <Field label="Confirm Password" icon={Lock} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
            </div>

            <Field label="Contact Phone" icon={Phone} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />

            <div className="border-t border-purple-500/20 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300/80 mb-3">
                Student &amp; Hostel Details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Field label="Roll / Student ID" icon={Hash} name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="e.g. CS2023-042" required />
                <Field label="Room Number" icon={Home} name="roomNumber" value={form.roomNumber} onChange={handleChange} placeholder="e.g. 304" required />
              </div>

              <Field label="Hostel Block" icon={Building2} name="hostelBlock" value={form.hostelBlock} onChange={handleChange}>
                <select
                  name="hostelBlock"
                  value={form.hostelBlock}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-purple-500/25 bg-[#1a1238] text-white outline-none focus:border-purple-400"
                >
                  {HOSTEL_BLOCKS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white btn-primary-purple disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Student Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-500/20 text-center text-xs text-purple-300/70">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-purple-300 hover:text-white transition-colors underline underline-offset-2">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
