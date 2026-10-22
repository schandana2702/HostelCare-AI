import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardPathForRole } from '../../utils/constants';
import { Building2, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const destination = getDashboardPathForRole(user?.role);
      if (destination) {
        navigate(destination, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0B0816] text-[#F3F0FA] ambient-glow relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/20 rounded-full blur-[130px] z-0" 
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-600/15 rounded-full blur-[120px] z-0" 
        aria-hidden="true"
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        {/* Logo mark */}
        <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center text-white shadow-[0_0_35px_rgba(168,85,247,0.5)] mb-4 bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 border border-purple-400/40">
          <Building2 className="w-8 h-8 text-purple-100" />
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            HostelCare <span className="text-purple-400">AI</span>
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Sparkles className="w-2.5 h-2.5 text-purple-300" /> AI
          </span>
        </div>
        <p className="mt-1.5 text-xs sm:text-sm font-medium text-purple-300/70">
          Smart Hostel Complaint &amp; Maintenance Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-card py-8 px-6 sm:px-8 rounded-3xl shadow-2xl border border-purple-500/25">
          <h3 className="text-sm sm:text-base font-bold mb-6 text-center text-white">
            Sign in to your account
          </h3>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/70" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@hostel.edu"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/70" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-purple-500/25 bg-purple-950/40 text-white placeholder-purple-300/40 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400/70 hover:text-purple-200 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white btn-primary-purple disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-purple-500/20 text-center text-xs text-purple-300/70">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-purple-300 hover:text-white transition-colors underline underline-offset-2"
            >
              Create Account
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-purple-300/50">
          HostelCare AI &copy; {new Date().getFullYear()} — Secure Hostel Management System
        </p>
      </div>
    </div>
  );
}
