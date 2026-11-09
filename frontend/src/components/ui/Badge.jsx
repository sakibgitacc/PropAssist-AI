import React from 'react';

const statusStyles = {
  'New': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Contacted': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Qualified': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Visit Scheduled': 'bg-[#C8814F]/20 text-[#C8814F] border-[#C8814F]/40',
  'Visited': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Negotiation': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Converted': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold',
  'Lost': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  // Role styles
  'ADMIN': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'SALES_HEAD': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'SALES_EXECUTIVE': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'BUYER': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  // Slot / Booking styles
  'Confirmed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Pending': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Completed': 'bg-[#C8814F]/20 text-[#C8814F] border-[#C8814F]/30',
  'Simulated': 'bg-blue-500/15 text-blue-400 border-blue-500/30'
};

export const Badge = ({ children, variant, className = '' }) => {
  const style = statusStyles[variant || children] || 'bg-[#1F3354] text-[#CBD5E1] border-[#38517A]';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style} ${className}`}>
      {children}
    </span>
  );
};
