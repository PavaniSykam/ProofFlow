import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardRoute } from '../../utils/navigation';
import {
  Workflow,
  GitBranch,
  ShieldCheck,
  History,
  Clock,
  Lock,
  ArrowRight,
  ChevronDown,
  Layers,
  CheckCircle2,
  Calendar,
  ShoppingBag,
  Receipt,
  UserX,
  Server,
  Database,
  Globe,
  Code2,
  Cpu,
  Cloud,
  ExternalLink,
  Building2,
  UserCheck,
} from 'lucide-react';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleScrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const dashboardRoute = getDashboardRoute(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md group-hover:shadow-indigo-200 transition-all">
              PF
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                ProofFlow
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-brand-700 border border-indigo-100 rounded-md">
                Workflow Orchestration
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleScrollToSection('problem')}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              The Problem
            </button>
            <button
              onClick={() => handleScrollToSection('capabilities')}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Core Capabilities
            </button>
            <button
              onClick={() => handleScrollToSection('workflows')}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Workflows
            </button>
            <button
              onClick={() => handleScrollToSection('technology')}
              className="hover:text-brand-600 transition-colors cursor-pointer"
            >
              Technology
            </button>
          </nav>

          {/* Right Action: Clean Handling for Authenticated vs Guest Users */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900">{user.name}</span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {user.roles?.[0] || 'Employee'}
                  </span>
                </div>
                <button
                  onClick={() => navigate(dashboardRoute)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="hidden sm:inline-block text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Product Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-brand-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-600" />
              ProofFlow
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Enterprise Workflow Orchestration &amp; Approval Platform
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              Turn internal business requests into structured, traceable, multi-stage workflows.
            </p>

            {/* Hero Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {user ? (
                <button
                  onClick={() => navigate(dashboardRoute)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={() => handleScrollToSection('capabilities')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
              >
                <span>Explore Platform</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Workflow Pipeline Architecture Graphic */}
          <div className="mt-14 max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  workflow: leave-request-v1 • tracking: REQ-2026-0042
                </span>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                Active Execution
              </span>
            </div>

            <div className="p-6 md:p-8 bg-slate-50/60">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                {/* Stage 1 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stage 1</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Completed</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Submission</div>
                  <div className="text-xs text-slate-500 mt-1">Initiator submits request payload with attachments</div>
                  <div className="mt-3 text-[10px] font-mono text-slate-400">Timestamp: 09:15 AM</div>
                </div>

                {/* Stage 2 */}
                <div className="bg-white p-4 rounded-xl border-2 border-brand-500 shadow-xs relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">Stage 2</span>
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">In Review</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Manager Approval</div>
                  <div className="text-xs text-slate-500 mt-1">Direct reporting hierarchy validation &amp; decision</div>
                  <div className="mt-3 text-[10px] font-semibold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> SLA: 18h remaining
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stage 3</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Queued</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Department Head</div>
                  <div className="text-xs text-slate-500 mt-1">Secondary sign-off and balance reconciliation</div>
                  <div className="mt-3 text-[10px] font-mono text-slate-400">Role: department_head</div>
                </div>

                {/* Stage 4 */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stage 4</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Queued</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">HR / Final Action</div>
                  <div className="text-xs text-slate-500 mt-1">Immutable audit logging &amp; final status execution</div>
                  <div className="mt-3 text-[10px] font-mono text-slate-400">Append-Only Audit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">
              The Operational Challenge
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Why Centralized Workflow Orchestration Matters
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              Organizations handle internal requests such as leave, purchases, expense reimbursements, and resignations across multiple people and departments, and ProofFlow centralizes these processes using configurable workflows, controlled routing, approval stages, and traceable histories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Unstructured Reality */}
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-4">
                  ✕
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Unstructured, Ad-Hoc Request Handling
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  When business requests rely on fragmented channels like email chains, paper forms, and messaging apps, organizations encounter recurring systemic vulnerabilities:
                </p>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>Lost requests with zero visibility into current approval bottlenecks or pending stages.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>Inconsistent approval authority, missing managerial chains, and unauthorized self-approvals.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>Lack of compliance audit trails to verify who authorized what, when, and under which criteria.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                    <span>Unmonitored delays leading to broken turnaround SLAs and stalled business operations.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* The ProofFlow Solution */}
            <div className="p-8 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold mb-4">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Deterministic Governance with ProofFlow
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  ProofFlow establishes a centralized control plane for internal workflows, replacing ad-hoc communication with algorithmic stage execution:
                </p>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <span><strong>Configurable Workflows:</strong> Standardize request schemas, transition triggers, and multi-stage sequences.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <span><strong>Controlled Routing:</strong> Dynamically compute approvers from organizational reporting hierarchy and functional roles.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <span><strong>Approval Stages:</strong> Sequential stage transitions with strict state machine integrity and replay protection.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <span><strong>Traceable Histories:</strong> Append-only immutable audit logs recording every state change, timestamp, and remark.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="capabilities" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">
              Platform Features
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Core Capabilities
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              Engineered with enterprise rigor to deliver reliable, compliant, and automated approval operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Capability 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Workflow className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Configurable Workflow Engine
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Design custom approval sequences with sequential stages, transition rules, and state machine integrity supporting Draft, In Review, Changes Requested, Approved, Rejected, and Cancelled lifecycles.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Hierarchy-Aware Approval Routing
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automatically resolves routing targets based on employee reporting lines, manager hierarchies, department heads, and functional roles without hardcoding individual user assignments.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Role-Based Access Control
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Strict segregation of duties across standard employees, managers, department heads, specialized departments (HR, Finance, IT, Procurement), and system administrators.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Workflow Versioning &amp; Audit Trail
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Immutable, append-only event logs capture every transition, comment, timestamp, and payload variation. New workflow revisions are versioned safely without corrupting active in-flight requests.
              </p>
            </div>

            {/* Capability 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                SLA Tracking &amp; Escalation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Configurable turnaround targets per stage with automatic reminders, overdue notices, and automated escalation to skip or notify higher organizational authority when deadlines expire.
              </p>
            </div>

            {/* Capability 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Secure Authentication &amp; Self-Approval Prevention
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                HttpOnly session cookies, cryptographic token versioning for instant revocation, mandatory credential policies, and rigorous mathematical enforcement that blocks initiators from approving their own requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Workflows Section */}
      <section id="workflows" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">
              Production Use Cases
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Example Workflows
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              ProofFlow standardizes common enterprise operations into structured, transparent approval lifecycles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Workflow 1 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Leave Request
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Employee absence management with reporting-manager routing, balance tracking, and automatic calendar verification.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Stages:
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>1. Direct Reporting Manager</div>
                  <div>2. Department Head / HR Record</div>
                </div>
              </div>
            </div>

            {/* Workflow 2 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Purchase Request
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Equipment, hardware, and software requisition with vendor comparison, budget verification, and procurement review.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Stages:
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>1. Manager Review</div>
                  <div>2. Procurement &amp; Finance Sign-Off</div>
                </div>
              </div>
            </div>

            {/* Workflow 3 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <Receipt className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Expense Reimbursement
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Corporate travel, client meetings, and operational expense claims with file attachment proofs and finance auditing.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Stages:
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>1. Manager Verification</div>
                  <div>2. Finance Settlement &amp; Payout</div>
                </div>
              </div>
            </div>

            {/* Workflow 4 */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-brand-500 transition-colors">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                  <UserX className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Resignation &amp; Clearance
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Structured multi-department employee exit lifecycle ensuring sequential signoffs and company asset reclamation.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Stages:
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>1. Manager &amp; IT Asset Return</div>
                  <div>2. Admin, Finance &amp; HR Clearance</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">
              Architecture &amp; Stack
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Technology
            </p>
            <p className="mt-4 text-base sm:text-lg text-slate-600">
              Built on a decoupled, production-proven modern enterprise stack.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* React */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">React</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                SPA architecture, reactive state, and responsive UI.
              </p>
            </div>

            {/* Node.js */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Node.js</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Asynchronous JavaScript server environment.
              </p>
            </div>

            {/* Express */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Express</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                RESTful routing, middleware guards &amp; API services.
              </p>
            </div>

            {/* MongoDB */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">MongoDB</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Document persistence for dynamic workflow models.
              </p>
            </div>

            {/* MongoDB Atlas */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <Cloud className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">MongoDB Atlas</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Managed cloud database cluster with global availability.
              </p>
            </div>

            {/* Vercel */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Vercel</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Edge deployment for single-page client &amp; reverse API proxy.
              </p>
            </div>

            {/* Render */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs text-center flex flex-col items-center col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Render</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Continuous backend API service &amp; cron scheduler host.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Sandbox Banner */}
      <section className="bg-white py-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Demonstration Environment
                </span>
                <span className="text-xs text-slate-500">
                  ProofFlow is pre-loaded with sample organizational data for <strong>Nexora Technologies Pvt. Ltd.</strong>
                </span>
              </div>
            </div>
            <Link
              to="/login"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 shrink-0"
            >
              <span>Explore Demo Accounts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer & Creator Credit */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            {/* Platform summary */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-sm">
                  PF
                </div>
                <span className="text-lg font-bold text-white tracking-tight">ProofFlow</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Enterprise workflow orchestration platform designed for structured internal approvals, hierarchy-driven routing, and immutable auditability.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => handleScrollToSection('problem')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    The Problem
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollToSection('capabilities')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Core Capabilities
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollToSection('workflows')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Example Workflows
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleScrollToSection('technology')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Technology Stack
                  </button>
                </li>
              </ul>
            </div>

            {/* Access */}
            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Platform Access
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Sign In to Nexora Demo
                  </Link>
                </li>
                {user && (
                  <li>
                    <button
                      onClick={() => navigate(dashboardRoute)}
                      className="text-brand-400 hover:text-brand-300 font-semibold cursor-pointer"
                    >
                      Active Session: Go to Dashboard →
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Explicit Creator Credit & Separation from Demo Org */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="text-[11px] text-slate-500 text-center sm:text-left order-2 sm:order-1">
              Nexora Technologies Pvt. Ltd. is a fictional demo entity used solely for workflow modeling.
            </div>
            <div className="text-slate-400 font-medium text-center sm:text-right order-1 sm:order-2">
              Developed by Sykam Pavani
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
