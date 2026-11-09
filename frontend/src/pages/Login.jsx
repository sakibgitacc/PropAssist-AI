import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, ArrowRight, ShieldCheck, UserCheck, AlertCircle,
  Eye, EyeOff, ArrowLeft, Building2, CalendarCheck, MapPin,
  CheckCircle, Lock, TrendingUp, Users, Shield, Compass, Mail, Phone, UserPlus, LogIn,
  Key, Check
} from 'lucide-react';
import api from '../api/client';
import { getDashboardRouteForRole } from '../utils/roleRoutes';

/* ─── LUXURY THEME TOKENS ───
   Night Navy: #0D1726
   Glass Slate: #15233A
   Card Border: #1F3354
   Copper Gold: #C8814F
   Text Ivory:  #F3EFE8
   Text Muted:  #94A3B8
─────────────────────────────── */

const ROLE_ACCOUNTS = [
  {
    role: 'Super Admin',
    title: 'Platform Super Admin',
    email: 'superadmin@propassist.ai',
    password: 'Admin@123',
    badge: 'SUPER_ADMIN',
    tagline: 'System APIs & Global Governance',
    icon: ShieldCheck,
    badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    iconClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  {
    role: 'Sales Head',
    title: 'Sales Head Director',
    email: 'saleshead@propassist.ai',
    password: 'Sales@123',
    badge: 'SALES_HEAD',
    tagline: 'Lead Pipeline & Unit Approvals',
    icon: TrendingUp,
    badgeClass: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    iconClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  },
  {
    role: 'Sales Executive',
    title: 'Executive Sales Advisor',
    email: 'executive1@propassist.ai',
    password: 'Exec@123',
    badge: 'SALES_EXEC',
    tagline: 'Lead CRM, WhatsApp & Consultations',
    icon: UserCheck,
    badgeClass: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    iconClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  },
  {
    role: 'Verified Buyer',
    title: 'Prospective Homebuyer',
    email: 'buyer@example.com',
    password: 'Buyer@123',
    badge: 'BUYER PORTAL',
    tagline: '3 BHK Search, Visits & Token Booking',
    icon: Users,
    badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    iconClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  }
];

export const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setIsRegisterMode(true);
    }
  }, [location.search]);

  const handleSelectRole = (acc) => {
    setIsRegisterMode(false);
    setEmail(acc.email);
    setPassword(acc.password);
    setSelectedRole(acc.role);
    setError('');
    setSuccessMsg(`Loaded credentials for ${acc.role}. Click 'Sign In' below.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        // Real Buyer Registration (Option 1: Manual Login flow)
        const registeredEmail = email;
        const res = await register(name, email, password, phone, false);
        setLoading(false);
        if (res.success) {
          // Switch to Sign In mode and display success message
          setIsRegisterMode(false);
          setEmail(registeredEmail);
          setPassword('');
          setSelectedRole(null);
          setError('');
          setSuccessMsg(`Account registered successfully for ${registeredEmail}! Please enter your password to sign in.`);
        } else {
          setError(res.error || 'Registration failed. Please verify your details.');
        }
      } else {
        // Real Account Login
        const res = await login(email, password);
        setLoading(false);
        if (res.success) {
          const searchParams = new URLSearchParams(window.location.search);
          const redirect = searchParams.get('redirect');
          if (redirect && !redirect.startsWith('/#') && redirect !== '/' && !redirect.includes('login')) {
            navigate(redirect);
          } else {
            const targetRoute = getDashboardRouteForRole(res.user?.role);
            navigate(targetRoute);
          }
        } else {
          setError(res.error || 'Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please ensure the backend and database are reachable.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotLoading(false);
      if (res.data.success) {
        setSuccessMsg('Password reset instructions have been dispatched to your email.');
        setShowForgotModal(false);
      } else {
        setError(res.data.error || 'Failed to dispatch reset email.');
      }
    } catch (err) {
      setForgotLoading(false);
      setError(err.response?.data?.error || 'Password reset request failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1726] text-[#F3EFE8] flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-[#C8814F]/30 selection:text-[#F3EFE8]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#C8814F]/10 rounded-full blur-[140px] transform -translate-y-1/2" />
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-[#1F3354]/25 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1F3354_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 px-6 sm:px-12 py-6 flex items-center justify-between border-b border-[#1F3354]/60 bg-[#0D1726]/80 backdrop-blur-md">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8814F] to-[#8C5229] flex items-center justify-center shadow-lg shadow-[#C8814F]/20 text-white font-bold group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg tracking-wider text-white">PROPASSIST</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/40">
                AI AUTHENTICATION
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] font-medium tracking-wide">
              Ahmedabad Developer Portfolio • 420 Residences
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#15233A] hover:bg-[#1F3354] border border-[#1F3354] text-xs font-semibold text-[#F3EFE8] hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C8814F]" />
          <span>Back to Public Portal</span>
        </button>
      </header>

      {/* Main Split Authentication Grid */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* LEFT: Architectural Visual Showcase */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between bg-[#15233A] border border-[#1F3354] rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 z-0">
              <img
                src="/assets/story/story-01-discover.jpg"
                alt="Architectural Skyline"
                className="w-full h-full object-cover opacity-25 filter contrast-125"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1726] via-[#15233A]/80 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8814F]/20 border border-[#C8814F]/40 text-[#C8814F] text-[11px] font-bold tracking-widest uppercase mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Supabase Protected Identity</span>
              </div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-display font-bold text-white tracking-tight leading-tight">
                Autonomous Real Estate <br />
                <span className="text-[#C8814F]">Sales & Residence Suite</span>
              </h1>
              <p className="mt-4 text-sm text-[#94A3B8] max-w-lg leading-relaxed">
                Connect directly with certified property advisors, review verified floor configurations, book VIP show residence visits, and receive tamper-proof digital allotment certificates.
              </p>
            </div>

            {/* Architecture Highlights */}
            <div className="relative z-10 mt-8 pt-6 border-t border-[#1F3354] space-y-3">
              <div className="flex items-center gap-3 text-xs text-[#CBD5E1]">
                <CheckCircle className="w-4 h-4 text-[#C8814F] shrink-0" />
                <span>The Grand Orchid (SG Highway, Bodakdev) • 240 Units • ₹85 Lakh — ₹1.2 Crore</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#CBD5E1]">
                <CheckCircle className="w-4 h-4 text-[#C8814F] shrink-0" />
                <span>Serene Meadows (South Bopal) • 180 Units • ₹68 Lakh — ₹92 Lakh</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#CBD5E1]">
                <CheckCircle className="w-4 h-4 text-[#C8814F] shrink-0" />
                <span>Strict Database Row Level Security (RLS) & Verified JWT Sessions</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Real Authentication Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center">
            <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-7 sm:p-9 shadow-2xl relative">
              
              {/* Mode Toggle Bar: Sign In vs Register */}
              <div className="flex items-center p-1 bg-[#0D1726] rounded-2xl border border-[#1F3354] mb-6">
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(false); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    !isRegisterMode
                      ? 'bg-[#C8814F] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isRegisterMode
                      ? 'bg-[#C8814F] text-white shadow-md'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Buyer</span>
                </button>
              </div>

              {/* Card Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#C8814F]">
                    {isRegisterMode ? 'Buyer Registration' : 'Account Authentication'}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <Lock className="w-3 h-3" />
                    <span>Supabase Secured</span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
                  {isRegisterMode ? 'Create Buyer Account' : 'Welcome to PropAssist'}
                </h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {isRegisterMode
                    ? 'Register your official customer profile to schedule private visits & reserve apartments.'
                    : 'Sign in to access your authorized workspace, leads, and customer portfolio.'}
                </p>
              </div>

              {/* Status & Error Alerts */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Executive Role Persona Selector (Zero Raw Passwords / Emails Exposed) */}
              {!isRegisterMode && (
                <div className="mb-6 p-4 sm:p-5 bg-gradient-to-br from-[#0D1726] to-[#15233A]/60 border border-[#1F3354] rounded-2xl shadow-xl space-y-3.5 relative overflow-hidden">
                  {/* Subtle decorative glow */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#C8814F]/5 rounded-full blur-2xl pointer-events-none" />

                  {/* Top Bar */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#C8814F]/10 border border-[#C8814F]/30 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-[#C8814F]" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                          Instant Access Persona
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">
                          Select a verified role to auto-load credentials
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      4 Roles Active
                    </span>
                  </div>

                  {/* 4 Luxury Persona Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-10">
                    {ROLE_ACCOUNTS.map((acc) => {
                      const Icon = acc.icon;
                      const isSelected = selectedRole === acc.role;
                      return (
                        <button
                          key={acc.role}
                          type="button"
                          onClick={() => handleSelectRole(acc)}
                          className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 relative group ${
                            isSelected
                              ? 'border-[#C8814F] bg-gradient-to-r from-[#C8814F]/20 via-[#15233A] to-[#0D1726] ring-1 ring-[#C8814F] shadow-lg shadow-[#C8814F]/10'
                              : 'border-[#1F3354] bg-[#0D1726]/70 hover:border-[#C8814F]/40 hover:bg-[#15233A]/80'
                          }`}
                        >
                          {/* Left Avatar Icon */}
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${acc.iconClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Center Content: Role Title & Description (No raw credentials) */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white font-display truncate">
                                {acc.role}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border font-mono ${acc.badgeClass}`}>
                                {acc.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                              {acc.tagline}
                            </p>
                          </div>

                          {/* Right Selection Radio / Checkmark */}
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-[#C8814F] text-white flex items-center justify-center shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-[#1F3354] bg-[#15233A] group-hover:border-[#94A3B8]/50 transition-colors" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Real Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegisterMode && (
                  <div>
                    <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-1.5">
                      Full Legal Name
                    </label>
                    <input
                      id="register-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      placeholder="e.g. Hardik Patel"
                      className={`w-full px-4 py-3 bg-[#0D1726] border rounded-xl text-sm text-[#F3EFE8] placeholder-[#64748B] focus:outline-none transition-all ${
                        focused === 'name' ? 'border-[#C8814F] ring-1 ring-[#C8814F]' : 'border-[#1F3354]'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-1.5">
                    Official Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="name@example.com"
                    className={`w-full px-4 py-3 bg-[#0D1726] border rounded-xl text-sm text-[#F3EFE8] placeholder-[#64748B] focus:outline-none transition-all ${
                      focused === 'email' ? 'border-[#C8814F] ring-1 ring-[#C8814F]' : 'border-[#1F3354]'
                    }`}
                  />
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider mb-1.5">
                      Mobile Phone Number (India)
                    </label>
                    <input
                      id="register-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocused('phone')}
                      onBlur={() => setFocused(null)}
                      placeholder="+91 98765 43210"
                      className={`w-full px-4 py-3 bg-[#0D1726] border rounded-xl text-sm text-[#F3EFE8] placeholder-[#64748B] focus:outline-none transition-all ${
                        focused === 'phone' ? 'border-[#C8814F] ring-1 ring-[#C8814F]' : 'border-[#1F3354]'
                      }`}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
                      {isRegisterMode ? 'Create Password (min 6 characters)' : 'Password'}
                    </label>
                    {!isRegisterMode && (
                      <button
                        type="button"
                        onClick={() => { setShowForgotModal(true); setForgotEmail(email); }}
                        className="text-[11px] text-[#C8814F] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('pass')}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••••••"
                      className={`w-full pl-4 pr-11 py-3 bg-[#0D1726] border rounded-xl text-sm text-[#F3EFE8] placeholder-[#64748B] focus:outline-none transition-all ${
                        focused === 'pass' ? 'border-[#C8814F] ring-1 ring-[#C8814F]' : 'border-[#1F3354]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F3EFE8] transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#C8814F] hover:bg-[#b67040] text-white font-bold text-sm shadow-xl shadow-[#C8814F]/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isRegisterMode ? 'Registering Supabase Account...' : 'Authenticating Credentials...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isRegisterMode
                          ? 'Create Real Buyer Profile'
                          : selectedRole
                          ? `Sign In as ${selectedRole}`
                          : 'Sign In to Workspace'}
                      </span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Informational Guidance for Staff */}
              <div className="mt-6 pt-5 border-t border-[#1F3354] text-center">
                <p className="text-xs text-[#94A3B8]">
                  {isRegisterMode ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsRegisterMode(false)}
                        className="text-[#C8814F] font-bold hover:underline"
                      >
                        Sign in here
                      </button>
                    </>
                  ) : (
                    <>
                      Prospective Buyer without an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsRegisterMode(true)}
                        className="text-[#C8814F] font-bold hover:underline"
                      >
                        Register as Buyer
                      </button>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-[#64748B] mt-2">
                  Staff accounts (Super Admin, Sales Head, Sales Executive) are created through the secure administrative workflow.
                </p>
              </div>

              {/* Compliance Footer */}
              <div className="mt-5 pt-4 border-t border-[#1F3354]/60 flex items-center justify-between text-[10px] text-[#64748B]">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#C8814F]" /> DPDP Act 2023 Compliant
                </span>
                <span>•</span>
                <span>Row Level Security Active</span>
                <span>•</span>
                <span>Supabase Protected</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15233A] border border-[#1F3354] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white">Reset Account Password</h3>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">
              Enter your registered email address to receive secure password reset instructions via Supabase Auth.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 bg-[#0D1726] border border-[#1F3354] rounded-xl text-sm text-white focus:outline-none focus:border-[#C8814F]"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[#1F3354] text-xs font-semibold text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#C8814F] hover:bg-[#b67040] text-white font-bold text-xs shadow-md"
                >
                  {forgotLoading ? 'Dispatching...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-[#64748B] border-t border-[#1F3354]/40">
        PropAssist AI • Real Estate Sales Acceleration System • The Grand Orchid & Serene Meadows
      </footer>
    </div>
  );
};

export default Login;
