import React from 'react';
import { Menu, Search, Plus, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ setMobileOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-[#0D1726]/90 backdrop-blur-md border-b border-[#1F3354] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 text-[#F3EFE8]">
      {/* Mobile toggle & search */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#94A3B8] hover:text-white lg:hidden rounded-lg hover:bg-[#15233A] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, units, visits..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#15233A] border border-[#1F3354] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C8814F] focus:border-[#C8814F] transition-all text-[#F3EFE8] placeholder-[#64748B]"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-[#94A3B8] border-l border-[#1F3354] pl-4">
          <Building2 className="w-3.5 h-3.5 text-[#C8814F]" />
          <span>Ahmedabad: SG Highway & South Bopal (420 Units)</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        {user?.role === 'BUYER' ? (
          <button
            onClick={() => navigate('/book-visit')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Site Visit</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/leads?action=create')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </button>
        )}

        {/* Live Chat Launcher */}
        <button
          onClick={() => navigate('/chat')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#15233A] hover:bg-[#1F3354] text-[#C8814F] border border-[#1F3354] rounded-lg text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C8814F]" />
          <span>AI Sales Advisor</span>
        </button>

        <div className="h-4 w-px bg-[#1F3354]" />

        {/* Current Role Indicator */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#15233A] border border-[#C8814F]/40 text-[#C8814F]">
              {user.role?.replace('_', ' ') || 'USER'}
            </span>
            <div className="hidden xl:block text-right">
              <div className="text-xs font-semibold text-white leading-tight">{user.name || user.email}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
