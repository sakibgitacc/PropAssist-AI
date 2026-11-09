import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Badge } from '../components/ui/Badge';
import {
  ShieldCheck,
  Server,
  Database,
  Users,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Radio
} from 'lucide-react';

export const AdminPanel = () => {
  const [health, setHealth] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingReminders, setProcessingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');

  const fetchAdminData = async () => {
    try {
      const [hRes, rRes, uRes] = await Promise.all([
        api.get('/health'),
        api.get('/reminders'),
        api.get('/auth/users')
      ]);

      if (hRes.data.success) setHealth(hRes.data);
      if (rRes.data.success) setReminders(rRes.data.reminders);
      if (uRes.data.success) setUsers(uRes.data.users);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleProcessReminders = async () => {
    setProcessingReminders(true);
    setReminderMessage('');
    try {
      const res = await api.post('/reminders/process');
      if (res.data.success) {
        setReminderMessage(`Dispatched ${res.data.dispatchedCount} scheduled reminders successfully.`);
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to process reminders');
    } finally {
      setProcessingReminders(false);
    }
  };

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">System & Security Administration</h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#C8814F]/20 text-[#C8814F] text-[10px] font-bold border border-[#C8814F]/30 uppercase tracking-wider">
            Enterprise Root
          </span>
        </div>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Server health monitor, automated WhatsApp & SMS reminder engine, and RBAC user provisioning.
        </p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">REST API Status</span>
            <p className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Operational
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Uptime: {Math.round(health?.uptime || 0)}s</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Prisma ORM Database</span>
            <p className="text-base font-bold text-[#C8814F] flex items-center gap-1.5 mt-1">
              <Database className="w-4 h-4" /> Connected
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5">14 Data Models Initialized</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#C8814F]/15 text-[#C8814F] border border-[#C8814F]/30 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#15233A] p-5 rounded-2xl border border-[#1F3354] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">AI Consultation Engine</span>
            <p className="text-base font-bold text-purple-400 flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Groq + Local Guard
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Multilingual EN / HI / GU</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Reminder Engine Section */}
      <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              24-Hour & 2-Hour Site Visit Reminder Engine
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Simulates automated WhatsApp & SMS dispatch for upcoming confirmed site visits without carrier billing.
            </p>
          </div>

          <button
            onClick={handleProcessReminders}
            disabled={processingReminders}
            className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${processingReminders ? 'animate-spin' : ''}`} />
            <span>{processingReminders ? 'Dispatching...' : 'Trigger Simulation Dispatch'}</span>
          </button>
        </div>

        {reminderMessage && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{reminderMessage}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1F3354] text-[#94A3B8] uppercase font-semibold">
                <th className="py-2.5 px-3">Buyer</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Scheduled For</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Message Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3354] text-[#CBD5E1]">
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-[#64748B]">No scheduled reminders in queue.</td>
                </tr>
              ) : (
                reminders.map((rem) => (
                  <tr key={rem.id} className="hover:bg-[#1A2C4C]/50">
                    <td className="py-3 px-3 font-semibold text-white">
                      {rem.lead?.fullName}
                      <span className="block text-[10px] text-[#94A3B8]">{rem.lead?.phone}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] font-semibold text-[#C8814F]">
                      {rem.reminderType}
                    </td>
                    <td className="py-3 px-3 text-[#CBD5E1]">
                      {new Date(rem.scheduledFor).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-[#0D1726] border border-[#1F3354] text-[#CBD5E1] text-[10px] font-medium">
                        {rem.channel}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={rem.status}>{rem.status}</Badge>
                    </td>
                    <td className="py-3 px-3 text-[#94A3B8] max-w-xs truncate" title={rem.messageContent}>
                      {rem.messageContent}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff & Role Management */}
      <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Team Roster & Authorized Roles
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Role-based server authorization (ADMIN, SALES_HEAD, SALES_EXECUTIVE, BUYER).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u) => (
            <div key={u.id} className="p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#15233A] border border-[#C8814F]/40 text-[#C8814F] flex items-center justify-center font-bold text-xs">
                {u.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white truncate">{u.name}</p>
                <p className="text-[11px] text-[#94A3B8] truncate">{u.email}</p>
                <div className="mt-1">
                  <Badge variant={u.role}>{u.role}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
