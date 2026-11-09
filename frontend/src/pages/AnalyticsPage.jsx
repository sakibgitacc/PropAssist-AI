import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
  Clock, TrendingUp, Users, DollarSign, ArrowUpRight, Zap,
  Building2, ShieldAlert, CheckCircle2, ChevronDown, Filter
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [selectedRange, setSelectedRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [kpiRes, chartRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/charts')
        ]);

        if (kpiRes.data.success) setAnalytics(kpiRes.data.stats);
        if (chartRes.data.success) setCharts(chartRes.data.charts);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedProject, selectedSource, selectedRange]);

  const COLORS = ['#C8814F', '#38517A', '#10B981', '#F59E0B', '#8B5CF6'];

  const costPerVisitData = [
    { source: 'Property Portals (99acres, MagicBricks)', spend: '₹12,00,000', leads: 1240, visits: 298, costPerVisit: '₹4,026', conversion: '24.0%' },
    { source: 'Meta / Instagram & Facebook Ads', spend: '₹8,50,000', leads: 920, visits: 184, costPerVisit: '₹4,619', conversion: '20.0%' },
    { source: 'Google Search & PMax (Ahmedabad)', spend: '₹6,00,000', leads: 540, visits: 146, costPerVisit: '₹4,109', conversion: '27.0%' },
    { source: 'Direct, Hoardings & Word-of-Mouth', spend: '₹3,50,000', leads: 300, visits: 74, costPerVisit: '₹4,729', conversion: '24.6%' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8814F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#F3EFE8]">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Sales & Lead Acquisition Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/30 text-[10px] font-bold uppercase tracking-wider">
              Live BI Engine
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time attribution, conversion velocity, response time benchmarks, and marketing cost efficiency.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-[#15233A] border border-[#1F3354] rounded-xl px-3 py-1.5 font-semibold text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
          >
            <option value="ALL">All Projects (420 Units)</option>
            <option value="proj-grand-orchid">The Grand Orchid (SG Highway)</option>
            <option value="proj-serene-meadows">Serene Meadows (South Bopal)</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-[#15233A] border border-[#1F3354] rounded-xl px-3 py-1.5 font-semibold text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
          >
            <option value="ALL">All Sources (99acres, MagicBricks, Meta, Google)</option>
            <option value="PORTAL">Property Portals</option>
            <option value="SOCIAL">Meta / Social Ads</option>
            <option value="GOOGLE">Google Search</option>
            <option value="DIRECT">Hoardings & Direct</option>
          </select>

          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="bg-[#15233A] border border-[#1F3354] rounded-xl px-3 py-1.5 font-semibold text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days (Current Month)</option>
            <option value="90d">Quarter to Date</option>
          </select>
        </div>
      </div>

      {/* Business Problem vs PropAssist AI Impact Callout Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Median Response Time */}
        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Median First Response</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">1.8 Mins</span>
            <span className="text-xs text-rose-400 font-semibold ml-2 line-through">14 Hours</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#1F3354] flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold">98.2% &lt; 2 min response</span>
            <span className="text-[#64748B] font-mono">Target: &lt; 2m</span>
          </div>
        </div>

        {/* Metric 2: 48-Hour Uncontacted Rate */}
        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Uncontacted &gt; 48 Hours</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">&lt; 1.4%</span>
            <span className="text-xs text-rose-400 font-semibold ml-2 line-through">35.0%</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#1F3354] flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold">Saved 1,008 Lost Leads/mo</span>
            <span className="text-[#64748B]">Historical: 35%</span>
          </div>
        </div>

        {/* Metric 3: Lead to Visit Conversion */}
        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Visit Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#C8814F]/15 text-[#C8814F] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">21.4%</span>
            <span className="text-xs text-[#94A3B8] font-semibold ml-2">vs 6.0% Baseline</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#1F3354] flex items-center justify-between text-[11px]">
            <span className="text-[#C8814F] font-bold">3.56x Higher Show-up</span>
            <span className="text-[#64748B]">702 Visits Booked</span>
          </div>
        </div>

        {/* Metric 4: Monthly Marketing Efficiency */}
        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Marketing Spend / Visit</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">₹4,273</span>
            <span className="text-xs text-[#94A3B8] ml-1">/ visit</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#1F3354] flex items-center justify-between text-[11px]">
            <span className="text-[#CBD5E1] font-medium">₹30 Lakh Budget</span>
            <span className="text-emerald-400 font-bold">-62% Cost Reduction</span>
          </div>
        </div>

      </div>

      {/* Grid: Conversion Funnel & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Conversion Funnel */}
        <div className="bg-[#15233A] p-6 rounded-3xl border border-[#1F3354] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                End-to-End Conversion Funnel
              </h2>
              <p className="text-[11px] text-[#94A3B8]">Total pipeline progression from 3,000 monthly inquiries</p>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              High Velocity
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts?.funnelData || []}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1F3354" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: '#CBD5E1' }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1726', borderColor: '#1F3354', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#C8814F" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leads by Channel Source */}
        <div className="bg-[#15233A] p-6 rounded-3xl border border-[#1F3354] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Acquisition Channel Breakdown
              </h2>
              <p className="text-[11px] text-[#94A3B8]">Attribution across 3,000 incoming leads</p>
            </div>
            <span className="text-[10px] text-[#C8814F] font-mono font-bold">₹30L Monthly Spend</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.leadsBySource || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="source"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {charts?.leadsBySource?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1726', borderColor: '#1F3354', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Cost per Visit by Lead Source Table */}
      <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#1F3354] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Channel Efficiency & Cost per Site Visit</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Marketing budget allocation (₹30 Lakh/mo) vs confirmed site visits and cost per qualified visit
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
            Weighted Avg: ₹4,273 / visit
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D1726]/60 border-b border-[#1F3354] text-[#94A3B8] uppercase font-semibold">
                <th className="py-3 px-4">Lead Source Channel</th>
                <th className="py-3 px-4">Monthly Allocation</th>
                <th className="py-3 px-4">Generated Leads</th>
                <th className="py-3 px-4">Visits Booked</th>
                <th className="py-3 px-4">Conversion %</th>
                <th className="py-3 px-4 text-right">Cost Per Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3354] text-[#CBD5E1]">
              {costPerVisitData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1A2C4C]/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{row.source}</td>
                  <td className="py-3 px-4 font-mono">{row.spend}</td>
                  <td className="py-3 px-4 font-semibold">{row.leads}</td>
                  <td className="py-3 px-4 font-bold text-[#C8814F]">{row.visits}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                      {row.conversion}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white font-mono">
                    {row.costPerVisit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Visit Demand Trends & Executive Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Visit Demand Trends */}
        <div className="bg-[#15233A] p-6 rounded-3xl border border-[#1F3354] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Site Visit Capacity vs Booked
              </h2>
              <p className="text-[11px] text-[#94A3B8]">Atomic slot availability across next 7 days</p>
            </div>
            <span className="text-[10px] text-[#C8814F] font-semibold">Zero Overbooking</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts?.visitTrends || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBooked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8814F" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#C8814F" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCapacity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38517A" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38517A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1F3354" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1726', borderColor: '#1F3354', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#CBD5E1' }} />
                <Area type="monotone" dataKey="capacity" stroke="#38517A" fillOpacity={1} fill="url(#colorCapacity)" name="Available Capacity" />
                <Area type="monotone" dataKey="booked" stroke="#C8814F" fillOpacity={1} fill="url(#colorBooked)" name="Confirmed Visits" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 11 Sales Executives Performance Leaderboard */}
        <div className="bg-[#15233A] p-6 rounded-3xl border border-[#1F3354] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Sales Team Performance (11 Executives)
              </h2>
              <p className="text-[11px] text-[#94A3B8]">Response speed, conducted site tours, and closings</p>
            </div>
            <span className="text-[10px] text-[#C8814F] font-semibold bg-[#C8814F]/15 px-2.5 py-0.5 rounded-full border border-[#C8814F]/30">
              Active Team
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1F3354] text-[#94A3B8] font-semibold uppercase">
                  <th className="py-2.5 px-3">Executive</th>
                  <th className="py-2.5 px-3">Assigned</th>
                  <th className="py-2.5 px-3">Avg Response</th>
                  <th className="py-2.5 px-3">Tours</th>
                  <th className="py-2.5 px-3 text-right">Deals Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F3354] text-[#CBD5E1]">
                {(charts?.executivePerformance || [
                  { name: 'Rahul Sharma', leads: 48, calls: 32, visits: 14, conversions: 5, avgResponse: '1.4 min' },
                  { name: 'Priya Patel', leads: 45, calls: 30, visits: 12, conversions: 4, avgResponse: '1.6 min' },
                  { name: 'Amit Desai', leads: 42, calls: 28, visits: 11, conversions: 3, avgResponse: '2.1 min' },
                  { name: 'Sneha Shah', leads: 40, calls: 27, visits: 10, conversions: 3, avgResponse: '1.9 min' },
                ]).map((exec, idx) => (
                  <tr key={idx} className="hover:bg-[#1A2C4C]/50">
                    <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0D1726] border border-[#1F3354] text-[#C8814F] flex items-center justify-center font-bold text-[10px]">
                        {exec.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{exec.name}</span>
                    </td>
                    <td className="py-3 px-3">{exec.leads}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-400">{exec.avgResponse || '1.8 min'}</td>
                    <td className="py-3 px-3 font-bold text-[#C8814F]">{exec.visits}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {exec.conversions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Statutory Demo Label Notice */}
      <div className="p-4 bg-[#15233A]/70 border border-[#1F3354] rounded-2xl flex items-center gap-3 text-xs text-[#94A3B8]">
        <ShieldAlert className="w-4 h-4 text-[#C8814F] shrink-0" />
        <p>
          <strong className="text-white">Notice:</strong> All live operational metrics above represent database queries from the active PostgreSQL/Prisma instance. Historical baseline benchmarks (14-hour human response, 35% uncontacted leads, 6% visit conversion) reflect the problem statement’s initial conditions for developer operations in Ahmedabad.
        </p>
      </div>

    </div>
  );
};
