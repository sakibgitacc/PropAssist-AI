import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCheck, BotMessageSquare, Building2,
  CalendarCheck2, Briefcase, BarChart3, ShieldCheck, FileSpreadsheet,
  Clock, LogOut, Sparkles, ArrowLeft, CreditCard, Award, PhoneCall,
  Bell, Settings, FileText, Plug, BookmarkCheck, Zap, User,
  CalendarCheck, MessageSquare, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleDisplayName } from '../../utils/roleRoutes';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'BUYER';

  // ─── 1. SUPER ADMIN SIDEBAR (17 Sections + Logout) ───
  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard?tab=overview', tab: 'overview', icon: LayoutDashboard },
    { label: 'Organizations', path: '/admin/dashboard?tab=organizations', tab: 'organizations', icon: Building2 },
    { label: 'Users Management', path: '/admin/dashboard?tab=users', tab: 'users', icon: Users },
    { label: 'Sales Heads', path: '/admin/dashboard?tab=sales-heads', tab: 'sales-heads', icon: UserCheck },
    { label: 'Sales Executives', path: '/admin/dashboard?tab=sales-executives', tab: 'sales-executives', icon: UserCheck },
    { label: 'Projects Management', path: '/admin/dashboard?tab=projects', tab: 'projects', icon: Building2 },
    { label: 'Inventory Management', path: '/admin/dashboard?tab=inventory', tab: 'inventory', icon: Building2 },
    { label: 'Lead Overview', path: '/admin/dashboard?tab=leads', tab: 'leads', icon: Users },
    { label: 'Payments Overview', path: '/admin/dashboard?tab=payments', tab: 'payments', icon: CreditCard },
    { label: 'Property Bookings', path: '/admin/dashboard?tab=bookings', tab: 'bookings', icon: BookmarkCheck },
    { label: 'Allotment Management', path: '/admin/dashboard?tab=allotments', tab: 'allotments', icon: Award },
    { label: 'Calling & Communication', path: '/admin/dashboard?tab=calling', tab: 'calling', icon: PhoneCall },
    { label: 'AI Configuration', path: '/admin/dashboard?tab=ai-config', tab: 'ai-config', icon: BotMessageSquare, badge: 'AI' },
    { label: 'Integrations', path: '/admin/dashboard?tab=integrations', tab: 'integrations', icon: Plug },
    { label: 'Notifications', path: '/admin/dashboard?tab=notifications', tab: 'notifications', icon: Bell },
    { label: 'Audit Logs', path: '/admin/dashboard?tab=audit-logs', tab: 'audit-logs', icon: FileText },
    { label: 'System Settings', path: '/admin/dashboard?tab=settings', tab: 'settings', icon: Settings },
  ];

  // ─── 2. SALES HEAD SIDEBAR (18 Sections + Logout) ───
  const salesHeadNavItems = [
    { label: 'Dashboard', path: '/sales-head/dashboard?tab=overview', tab: 'overview', icon: LayoutDashboard },
    { label: 'All Leads', path: '/sales-head/dashboard?tab=leads', tab: 'leads', icon: Users },
    { label: 'Buyers', path: '/sales-head/dashboard?tab=buyers', tab: 'buyers', icon: Users },
    { label: 'Lead Assignment', path: '/sales-head/dashboard?tab=assignment', tab: 'assignment', icon: Briefcase },
    { label: 'Sales Team', path: '/sales-head/dashboard?tab=team', tab: 'team', icon: UserCheck },
    { label: 'AI Conversations', path: '/sales-head/dashboard?tab=ai-conversations', tab: 'ai-conversations', icon: BotMessageSquare, badge: 'AI' },
    { label: 'Site Visits', path: '/sales-head/dashboard?tab=site-visits', tab: 'site-visits', icon: CalendarCheck2 },
    { label: 'Follow-ups', path: '/sales-head/dashboard?tab=follow-ups', tab: 'follow-ups', icon: Clock },
    { label: 'Projects & Fact Sheets', path: '/sales-head/dashboard?tab=fact-sheets', tab: 'fact-sheets', icon: Building2 },
    { label: 'Inventory', path: '/sales-head/dashboard?tab=inventory', tab: 'inventory', icon: Building2 },
    { label: 'Payments', path: '/sales-head/dashboard?tab=payments', tab: 'payments', icon: CreditCard },
    { label: 'Property Bookings', path: '/sales-head/dashboard?tab=bookings', tab: 'bookings', icon: BookmarkCheck },
    { label: 'Allotment Approvals', path: '/sales-head/dashboard?tab=allotment-approvals', tab: 'allotment-approvals', icon: Award },
    { label: 'WhatsApp Comm', path: '/sales-head/dashboard?tab=whatsapp', tab: 'whatsapp', icon: Send },
    { label: 'Notifications', path: '/sales-head/dashboard?tab=notifications', tab: 'notifications', icon: Bell },
    { label: 'Reports & Analytics', path: '/sales-head/dashboard?tab=reports', tab: 'reports', icon: BarChart3 },
    { label: 'Settings', path: '/sales-head/dashboard?tab=settings', tab: 'settings', icon: Settings },
  ];

  // ─── 3. SALES EXECUTIVE SIDEBAR (10 Sections + Logout) ───
  const executiveNavItems = [
    { label: 'Dashboard', path: '/executive/dashboard?tab=overview', tab: 'overview', icon: LayoutDashboard },
    { label: 'My Assigned Leads', path: '/executive/dashboard?tab=leads', tab: 'leads', icon: Users },
    { label: 'My Buyers', path: '/executive/dashboard?tab=buyers', tab: 'buyers', icon: Users },
    { label: 'AI Handoffs', path: '/executive/dashboard?tab=ai-handoffs', tab: 'ai-handoffs', icon: Zap, badge: 'Urgent' },
    { label: 'Follow-ups', path: '/executive/dashboard?tab=follow-ups', tab: 'follow-ups', icon: Clock },
    { label: 'Site Visits', path: '/executive/dashboard?tab=site-visits', tab: 'site-visits', icon: CalendarCheck2 },
    { label: 'In-App Chat', path: '/executive/dashboard?tab=conversations', tab: 'conversations', icon: MessageSquare },
    { label: 'Notifications', path: '/executive/dashboard?tab=notifications', tab: 'notifications', icon: Bell },
    { label: 'My Performance', path: '/executive/dashboard?tab=performance', tab: 'performance', icon: Award },
    { label: 'Profile', path: '/executive/dashboard?tab=profile', tab: 'profile', icon: User },
  ];

  // ─── 4. BUYER SIDEBAR (10 Sections + Logout — STRICTLY PERSONAL) ───
  const buyerNavItems = [
    { label: 'My Dashboard', path: '/buyer/dashboard?tab=overview', tab: 'overview', icon: LayoutDashboard },
    { label: 'My Enquiries', path: '/buyer/dashboard?tab=enquiries', tab: 'enquiries', icon: Building2 },
    { label: 'AI Assistant', path: '/buyer/dashboard?tab=ai-assistant', tab: 'ai-assistant', icon: BotMessageSquare, badge: 'AI' },
    { label: 'My Site Visits', path: '/buyer/dashboard?tab=site-visits', tab: 'site-visits', icon: CalendarCheck2 },
    { label: 'My Payments', path: '/buyer/dashboard?tab=payments', tab: 'payments', icon: CreditCard },
    { label: 'My Receipts', path: '/buyer/dashboard?tab=receipts', tab: 'receipts', icon: FileText },
    { label: 'My Property Bookings', path: '/buyer/dashboard?tab=bookings', tab: 'bookings', icon: BookmarkCheck },
    { label: 'My Allotment Letters', path: '/buyer/dashboard?tab=allotments', tab: 'allotments', icon: Award },
    { label: 'Notifications', path: '/buyer/dashboard?tab=notifications', tab: 'notifications', icon: Bell },
    { label: 'My Profile', path: '/buyer/dashboard?tab=profile', tab: 'profile', icon: User },
  ];

  // Select appropriate role nav list
  let navItems = buyerNavItems;
  let roleTitle = 'Verified Buyer';
  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    navItems = adminNavItems;
    roleTitle = 'Super Admin';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else if (role === 'SALES_HEAD') {
    navItems = salesHeadNavItems;
    roleTitle = 'Sales Head';
    badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  } else if (role === 'SALES_EXECUTIVE') {
    navItems = executiveNavItems;
    roleTitle = 'Sales Executive';
    badgeColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }

  const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0D1726] text-[#94A3B8] flex flex-col border-r border-[#1F3354] transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand header */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F3354] gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C8814F] to-[#8C5229] flex items-center justify-center shadow-lg shadow-[#C8814F]/20 text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sm tracking-wide text-white flex items-center gap-1.5 truncate">
              PROPASSIST <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/40">AI</span>
            </div>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-medium truncate">
              Ahmedabad Portfolio
            </p>
          </div>
        </div>

        {/* User Identity Banner */}
        <div className="px-4 py-3 bg-[#15233A]/60 border-b border-[#1F3354] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0D1726] border border-[#1F3354] flex items-center justify-center text-xs font-bold text-[#C8814F]">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Authorized User'}</div>
            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badgeColor}`}>
              {roleTitle}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 no-scrollbar">
          <div className="px-3 pb-1 text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
            {roleTitle} Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrentActive = location.pathname === item.path.split('?')[0] && currentTab === item.tab;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group
                  ${isCurrentActive
                    ? 'bg-[#C8814F]/15 text-[#C8814F] border border-[#C8814F]/30 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F3EFE8] hover:bg-[#15233A]'
                  }
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 transition-colors" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/30 shrink-0">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer controls: Public website link and Logout */}
        <div className="p-3 border-t border-[#1F3354] bg-[#0D1726] space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-white hover:bg-[#15233A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#C8814F]" />
            <span>Public Website</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
