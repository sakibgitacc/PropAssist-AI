import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { Badge } from '../components/ui/Badge';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  X,
  Building,
  CheckCircle2,
  Trash2,
  MessageCircle
} from 'lucide-react';
import WhatsAppChatModal from '../components/common/WhatsAppChatModal';

export const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [selectedLeadForWA, setSelectedLeadForWA] = useState(null);
  const [projects, setProjects] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [searchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get('action') === 'create');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    budgetMin: '',
    budgetMax: '',
    preferredBhk: '3 BHK',
    preferredLocation: 'SG Highway',
    timeline: '1-3 months',
    source: 'Direct Web',
    projectId: '',
    assignedExecutiveId: '',
    notes: '',
    status: 'New'
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        projectId: projectFilter !== 'All' ? projectFilter : undefined
      };
      const res = await api.get('/leads', { params });
      if (res.data.success) {
        setLeads(res.data.leads || []);
        setTotalLeads(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.pages || 1);
      }
    } catch (err) {
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [projRes, execRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users?role=SALES_EXECUTIVE')
      ]);
      if (projRes.data.success) setProjects(projRes.data.projects || []);
      if (execRes.data.success) setExecutives(execRes.data.users || []);
    } catch (err) {
      console.error('Failed to load project/executive options', err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, projectFilter, page]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setDuplicateWarning(null);

    try {
      const payload = {
        ...formData,
        budgetMin: formData.budgetMin ? Number(formData.budgetMin) : null,
        budgetMax: formData.budgetMax ? Number(formData.budgetMax) : null,
        projectId: formData.projectId || null,
        assignedExecutiveId: formData.assignedExecutiveId || null
      };

      const res = await api.post('/leads', payload);
      if (res.data.success) {
        setModalOpen(false);
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          budgetMin: '',
          budgetMax: '',
          preferredBhk: '3 BHK',
          preferredLocation: 'SG Highway',
          timeline: '1-3 months',
          source: 'Direct Web',
          projectId: '',
          assignedExecutiveId: '',
          notes: '',
          status: 'New'
        });
        fetchLeads();
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setDuplicateWarning(err.response.data.duplicateLead || 'A lead with this phone number or email already exists.');
      } else {
        alert(err.response?.data?.error || 'Failed to create lead');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignExecutive = async (leadId, execId) => {
    try {
      const res = await api.post(`/leads/${leadId}/assign`, { executiveId: execId });
      if (res.data.success) {
        fetchLeads();
      }
    } catch (err) {
      alert('Failed to assign executive');
    }
  };

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Lead Pipeline Management</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Track inquiries, qualify buyers, prevent duplicate entries, and assign executive hosts.
          </p>
        </div>
        <button
          onClick={() => {
            setDuplicateWarning(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#15233A] p-4 rounded-2xl border border-[#1F3354] shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, notes..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl focus:outline-none focus:border-[#C8814F] text-[#F3EFE8] placeholder-[#64748B]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Visit Scheduled">Visit Scheduled</option>
            <option value="Visited">Visited</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Converted">Converted</option>
            <option value="Lost">Lost</option>
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[#15233A] rounded-2xl border border-[#1F3354] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D1726]/60 border-b border-[#1F3354] text-[#94A3B8] uppercase font-semibold">
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Preferences</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Host</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3354] text-[#CBD5E1]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#64748B]">
                    Loading pipeline leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#64748B]">
                    No leads found matching current filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="hover:bg-[#1A2C4C]/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{lead.fullName}</p>
                      <p className="text-[10px] text-[#64748B]">Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                        <Phone className="w-3 h-3 text-[#C8814F]" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-[#94A3B8] text-[11px] mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[130px]">{lead.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{lead.preferredBhk || 'Any BHK'}</span>
                      <p className="text-[11px] text-[#94A3B8]">
                        {lead.budgetMin ? `₹${(lead.budgetMin / 100000).toFixed(0)}L` : 'Flexible'}
                        {lead.budgetMax ? ` - ₹${(lead.budgetMax / 100000).toFixed(0)}L` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F3EFE8]">
                      {lead.project?.name || 'General Ahmedabad'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={lead.status}>{lead.status}</Badge>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.assignedExecutiveId || ''}
                        onChange={(e) => handleAssignExecutive(lead.id, e.target.value)}
                        className="text-xs bg-[#0D1726] border border-[#1F3354] rounded-lg px-2 py-1 text-[#CBD5E1] focus:outline-none focus:border-[#C8814F]"
                      >
                        <option value="">Unassigned</option>
                        {executives.map(exec => (
                          <option key={exec.id} value={exec.id}>{exec.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#0D1726] border border-[#1F3354] text-[#CBD5E1] font-mono text-[10px]">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeadForWA(lead);
                            setIsWhatsAppOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition border border-[#25D366]/30"
                          title="Open WhatsApp Click-to-Chat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/leads/${lead.id}`);
                          }}
                          className="text-[#C8814F] hover:text-[#b67040] font-semibold text-xs whitespace-nowrap"
                        >
                          View &rarr;
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#1F3354] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Showing {leads.length} of {totalLeads} total leads</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 border border-[#1F3354] rounded-lg hover:bg-[#1A2C4C] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 border border-[#1F3354] rounded-lg hover:bg-[#1A2C4C] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Lead Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#15233A] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#1F3354]">
            <div className="p-6 border-b border-[#1F3354] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Add New Real Estate Lead</h2>
                <p className="text-xs text-[#94A3B8]">Includes automatic duplicate detection by phone and email</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-[#94A3B8] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {duplicateWarning && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Duplicate Lead Detected (HTTP 409)</p>
                    <p className="mt-0.5 text-amber-200">
                      {typeof duplicateWarning === 'string'
                        ? duplicateWarning
                        : `A lead for ${duplicateWarning.fullName} (${duplicateWarning.phone}) already exists in status "${duplicateWarning.status}" assigned to ${duplicateWarning.assignedExecutive}.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98250 XXXXX"
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@example.com"
                  className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Project Interest
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="">General Inquiry</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Preferred BHK
                  </label>
                  <select
                    value={formData.preferredBhk}
                    onChange={(e) => setFormData({ ...formData, preferredBhk: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Min Budget (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="e.g. 7000000"
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Max Budget (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="e.g. 15000000"
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Assign Executive
                  </label>
                  <select
                    value={formData.assignedExecutiveId}
                    onChange={(e) => setFormData({ ...formData, assignedExecutiveId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="">Auto / Unassigned</option>
                    {executives.map(exec => (
                      <option key={exec.id} value={exec.id}>{exec.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                    Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  >
                    <option value="Direct Web">Direct Web</option>
                    <option value="AI Chatbot">AI Chatbot</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Referral">Referral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Buyer Notes / Requirements
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special preferences, floor choice, family size..."
                  className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                ></textarea>
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
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Validating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* WhatsApp Click-to-Chat Modal */}
      <WhatsAppChatModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        recipientName={selectedLeadForWA?.fullName || 'Prospective Homebuyer'}
        recipientPhone={selectedLeadForWA?.phone || ''}
        recipientRole="Assigned Lead"
        leadId={selectedLeadForWA?.id}
        defaultTemplate="executive_followup"
        defaultLanguage="en"
      />
    </div>
  );
};
