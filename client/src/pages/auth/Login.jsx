import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const SEEDED_ACCOUNTS = [
  { role: 'Employee', name: 'Ravi Teja', email: 'ravi.teja@nexora-demo.example' },
  { role: 'Manager', name: 'Neha Joshi', email: 'neha.joshi@nexora-demo.example' },
  { role: 'Manager', name: 'Sanjay Patil', email: 'sanjay.patil@nexora-demo.example' },
  { role: 'Dept Head', name: 'Arjun Menon', email: 'arjun.menon@nexora-demo.example' },
  { role: 'HR', name: 'Rohan Desai', email: 'rohan.desai@nexora-demo.example' },
  { role: 'Finance', name: 'Karthik Iyer', email: 'karthik.iyer@nexora-demo.example' },
  { role: 'Admin', name: 'Meera Kapoor', email: 'meera.kapoor@nexora-demo.example' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('ProofFlow@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.roles?.includes('admin')) {
        navigate('/admin/dashboard');
      } else if (user.roles?.some((r) => ['manager', 'hr', 'finance', 'it', 'procurement', 'department_head'].includes(r))) {
        navigate('/approver/inbox');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (accEmail) => {
    setEmail(accEmail);
    setPassword('ProofFlow@123');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Left Branding Panel */}
      <div className="md:w-5/12 bg-gradient-to-br from-brand-900 via-indigo-900 to-slate-900 p-8 md:p-12 text-white flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-2xl shadow-lg mb-6">
            PF
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">ProofFlow</h1>
          <p className="text-indigo-200 mt-2 text-sm leading-relaxed">
            Enterprise Workflow Orchestration & Configurable Multi-Stage Approval Engine.
          </p>

          <div className="mt-8 space-y-3 text-xs text-indigo-100">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Generic Engine (Leave, Purchase, Expense, Resignation)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Strict Reporting-Manager Isolation & Self-Approval Prevention</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Immutable Workflow Versioning & Append-Only Audit Trail</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Automated SLA Deadlines & Escalation Scheduler</span>
            </div>
          </div>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mt-8 pt-6 border-t border-indigo-800/60">
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-2">
            Click to autofill seeded test accounts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SEEDED_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc.email)}
                className="px-2.5 py-1 text-[11px] bg-indigo-950/70 hover:bg-indigo-800 text-indigo-100 rounded-md border border-indigo-700/50 transition-colors cursor-pointer"
              >
                <span className="text-indigo-300 font-bold">{acc.role}:</span> {acc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="md:w-7/12 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Organization: Nexora Technologies Pvt. Ltd.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@nexora-demo.example"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default password for all seeded accounts: ProofFlow@123
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
