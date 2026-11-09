import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  ShieldCheck,
  Eye
} from 'lucide-react';

export const FactSheetEditor = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formData, setFormData] = useState({
    overview: '',
    pricingDetails: '',
    specifications: '',
    connectivity: '',
    legalDisclaimers: '',
    rawContent: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success) {
          setProjects(res.data.projects);
          if (res.data.projects.length > 0) {
            setSelectedProjectId(res.data.projects[0].id);
          }
        }
      } catch (err) {
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const fetchFactSheet = async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await api.get(`/projects/${projectId}`);
      if (res.data.success && res.data.project.factSheet) {
        const fs = res.data.project.factSheet;
        setFormData({
          overview: fs.overview || '',
          pricingDetails: fs.pricingDetails || '',
          specifications: typeof fs.specifications === 'object' ? JSON.stringify(fs.specifications, null, 2) : fs.specifications || '',
          connectivity: fs.connectivity || '',
          legalDisclaimers: fs.legalDisclaimers || '',
          rawContent: fs.rawContent || ''
        });
      } else {
        setFormData({
          overview: '',
          pricingDetails: '',
          specifications: '',
          connectivity: '',
          legalDisclaimers: '',
          rawContent: ''
        });
      }
    } catch (err) {
      setError('Failed to load fact sheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchFactSheet(selectedProjectId);
    }
  }, [selectedProjectId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      let parsedSpecs = formData.specifications;
      try {
        parsedSpecs = JSON.parse(formData.specifications);
      } catch {
        // Keep as string if not valid JSON
      }

      const res = await api.put(`/factsheets/${selectedProjectId}`, {
        ...formData,
        specifications: parsedSpecs
      });

      if (res.data.success) {
        setSuccess('Project Fact Sheet updated and AI prompt cache refreshed successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save fact sheet');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Verified Fact Sheet Editor</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C8814F]/20 text-[#C8814F] text-[10px] font-bold border border-[#C8814F]/30 uppercase tracking-wider">
              Single Source of Truth
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Admin governance for authorized pricing, specifications, and AI grounding context.
          </p>
        </div>

        {/* Project Selector */}
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="px-3.5 py-2 bg-[#15233A] border border-[#1F3354] rounded-xl text-xs font-semibold text-[#CBD5E1] shadow-sm focus:outline-none focus:border-[#C8814F]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSave} className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-5">
        <div>
          <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1">
            Executive Project Overview
          </label>
          <textarea
            rows="3"
            required
            value={formData.overview}
            onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
            className="w-full p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] leading-relaxed"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1">
              Authorized Pricing & Payment Plans
            </label>
            <textarea
              rows="3"
              required
              value={formData.pricingDetails}
              onChange={(e) => setFormData({ ...formData, pricingDetails: e.target.value })}
              className="w-full p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1">
              Connectivity & Landmark Proximity
            </label>
            <textarea
              rows="3"
              required
              value={formData.connectivity}
              onChange={(e) => setFormData({ ...formData, connectivity: e.target.value })}
              className="w-full p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] leading-relaxed"
            ></textarea>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1">
            Technical Specifications (JSON or text)
          </label>
          <textarea
            rows="3"
            required
            value={formData.specifications}
            onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
            className="w-full p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs font-mono text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] leading-relaxed"
          ></textarea>
        </div>

        {/* AI Grounding Knowledge Box */}
        <div className="p-5 bg-[#0D1726] border border-[#1F3354] rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-[#C8814F] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI Fact Grounding Context (Groq & Rule-Based NLP Source)</span>
          </div>
          <p className="text-[11px] text-[#94A3B8]">
            This knowledge block is injected directly into the LLM system prompt to ensure strictly factual, hallucination-free buyer consultation.
          </p>
          <textarea
            rows="5"
            required
            value={formData.rawContent}
            onChange={(e) => setFormData({ ...formData, rawContent: e.target.value })}
            className="w-full p-3 bg-[#15233A] border border-[#1F3354] rounded-xl text-xs font-mono text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] leading-relaxed"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider mb-1">
            Mandatory Legal Disclaimers
          </label>
          <textarea
            rows="2"
            value={formData.legalDisclaimers}
            onChange={(e) => setFormData({ ...formData, legalDisclaimers: e.target.value })}
            className="w-full p-3 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#94A3B8] focus:outline-none focus:border-[#C8814F]"
          ></textarea>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Synchronizing Knowledge...' : 'Publish Approved Fact Sheet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
