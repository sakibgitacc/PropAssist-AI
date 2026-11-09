import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Badge } from '../components/ui/Badge';
import {
  Clock,
  Calendar,
  Plus,
  Building,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertCircle
} from 'lucide-react';

export const VisitSlotManagement = () => {
  const [slots, setSlots] = useState([]);
  const [projects, setProjects] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    capacity: 3,
    assignedExecutiveId: ''
  });

  const fetchSlotsAndData = async () => {
    try {
      const [slotsRes, projRes, execRes] = await Promise.all([
        api.get('/slots'),
        api.get('/projects'),
        api.get('/auth/executives')
      ]);

      if (slotsRes.data.success) setSlots(slotsRes.data.slots);
      if (projRes.data.success) {
        setProjects(projRes.data.projects);
        if (!formData.projectId && projRes.data.projects[0]) {
          setFormData(f => ({ ...f, projectId: projRes.data.projects[0].id }));
        }
      }
      if (execRes.data.success) setExecutives(execRes.data.executives);
    } catch (err) {
      console.error('Error fetching slot management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotsAndData();
  }, []);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/slots', {
        ...formData,
        capacity: Number(formData.capacity),
        assignedExecutiveId: formData.assignedExecutiveId || undefined
      });

      if (res.data.success) {
        setModalOpen(false);
        fetchSlotsAndData();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSlot = async (slotId) => {
    try {
      const res = await api.patch(`/slots/${slotId}/toggle`);
      if (res.data.success) {
        fetchSlotsAndData();
      }
    } catch {
      alert('Failed to toggle slot');
    }
  };

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Visit Slot Management</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Configure calendar capacity, assigned hosts, and active tour schedules.
          </p>
        </div>
        <button
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Visit Slot</span>
        </button>
      </div>

      {/* Slots Table */}
      <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D1726]/60 border-b border-[#1F3354] text-[#94A3B8] uppercase font-semibold">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4">Capacity & Bookings</th>
                <th className="py-3 px-4">Assigned Host</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3354] text-[#CBD5E1]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[#64748B]">Loading visit slots...</td>
                </tr>
              ) : slots.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[#64748B]">No slots created yet.</td>
                </tr>
              ) : (
                slots.map((slot) => {
                  const available = slot.capacity - slot.bookedCount;
                  return (
                    <tr key={slot.id} className="hover:bg-[#1A2C4C]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        {slot.project?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#CBD5E1]">
                        {slot.date}
                      </td>
                      <td className="py-3 px-4">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">{slot.bookedCount}</span> / {slot.capacity}
                        <span className="text-[10px] text-[#94A3B8] ml-2">({available} open)</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#CBD5E1]">
                        {slot.executive?.name || 'Any Available Host'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          slot.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {slot.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleSlot(slot.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#C8814F] hover:bg-[#1A2C4C] rounded-lg transition-colors"
                        >
                          {slot.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Slot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#15233A] rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-[#1F3354]">
            <div className="p-6 border-b border-[#1F3354] flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Create New Site Visit Slot</h2>
              <button onClick={() => setModalOpen(false)} className="text-[#94A3B8] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Project *
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Date (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    End Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="11:00 AM"
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Host Executive
                  </label>
                  <select
                    value={formData.assignedExecutiveId}
                    onChange={(e) => setFormData({ ...formData, assignedExecutiveId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="">Any Available Host</option>
                    {executives.map(exec => (
                      <option key={exec.id} value={exec.id}>{exec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1F3354]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[#1F3354] text-[#94A3B8] hover:bg-[#1A2C4C] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
