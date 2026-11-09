import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Calendar,
  Maximize2,
  CheckCircle2,
  Building,
  ShieldCheck,
  CalendarCheck,
  Sparkles,
  ArrowLeft,
  FileEdit,
  ExternalLink
} from 'lucide-react';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [project, setProject] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`);
        if (res.data.success) {
          setProject(res.data.project);
          if (res.data.project.images?.length > 0) {
            setSelectedImage(res.data.project.images[0].url);
          }
        }
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8814F]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-[#94A3B8]">
        <p>Project not found.</p>
        <button onClick={() => navigate('/projects')} className="text-[#C8814F] mt-2 text-xs font-semibold">
          &larr; Back to all projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-[#F3EFE8]">
      {/* Top Back Navigation & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#C8814F] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-2">
          {hasRole(['ADMIN', 'SALES_HEAD']) && (
            <button
              onClick={() => navigate(`/factsheets?projectId=${project.id}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#15233A] hover:bg-[#1A2C4C] border border-[#1F3354] text-[#CBD5E1] rounded-xl text-xs font-semibold transition-all"
            >
              <FileEdit className="w-3.5 h-3.5 text-[#C8814F]" />
              <span>Edit Fact Sheet</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/book-visit?projectId=${project.id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Book Site Visit</span>
          </button>
        </div>
      </div>

      {/* Hero Gallery Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main image viewer */}
        <div className="lg:col-span-2 space-y-3">
          <div className="h-96 rounded-3xl overflow-hidden bg-[#0D1726] border border-[#1F3354] shadow-xl relative">
            <img
              src={selectedImage || '/assets/story/story-01-discover.jpg'}
              alt={project.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/assets/story/story-01-discover.jpg';
              }}
            />
            <div className="absolute top-4 left-4 bg-[#0D1726]/80 backdrop-blur-md px-3 py-1 rounded-xl text-[#C8814F] text-xs font-bold border border-[#C8814F]/40">
              {project.bhkOptions}
            </div>
          </div>

          {/* Thumbnails */}
          {project.images?.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {project.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`h-16 w-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.url ? 'border-[#C8814F] ring-2 ring-[#C8814F]/30' : 'border-[#1F3354] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.caption || 'Thumbnail'} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Key Project Metrics Card */}
        <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/30 uppercase tracking-wider">
              Approved Master Project
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight mt-2">{project.name}</h1>
            <p className="text-xs text-[#94A3B8] flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#C8814F]" />
              <span>{project.location}</span>
            </p>

            <div className="mt-4 p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354]">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Price Range</span>
              <p className="text-2xl font-bold text-[#F3EFE8] mt-0.5">
                ₹{(project.minPrice / 10000000).toFixed(2)} Cr - ₹{(project.maxPrice / 10000000).toFixed(2)} Cr
              </p>
              <p className="text-[11px] text-[#94A3B8] mt-1">Super Area: {project.minArea} - {project.maxArea} sq.ft</p>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1F3354]">
                <span className="text-[#94A3B8]">Possession</span>
                <span className="font-semibold text-white">{project.possession}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F3354]">
                <span className="text-[#94A3B8]">Demo RERA</span>
                <span className="font-mono text-[11px] font-semibold text-[#C8814F]">{project.reraNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F3354]">
                <span className="text-[#94A3B8]">City / State</span>
                <span className="font-semibold text-white">{project.city}, Gujarat</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate(`/book-visit?projectId=${project.id}`)}
              className="w-full py-3 px-4 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              Book Site Tour
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="w-full py-2.5 px-4 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] border border-[#1F3354] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C8814F]" />
              <span>Ask AI Chatbot About Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fact Sheet Detailed Overview & Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overview, Amenities & Connectivity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Project Fact Sheet & Overview</h2>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              {project.factSheet?.overview || project.description}
            </p>
          </div>

          {/* Amenities */}
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Lifestyle Amenities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {project.amenitiesList?.map((amenity, idx) => (
                <div key={idx} className="p-3 bg-[#0D1726] rounded-2xl border border-[#1F3354] flex items-center gap-2 text-xs font-medium text-white">
                  <CheckCircle2 className="w-4 h-4 text-[#C8814F] shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specifications */}
          {project.factSheet?.parsedSpecs && (
            <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Approved Technical Specifications</h2>
              <div className="divide-y divide-[#1F3354] text-xs">
                {Object.entries(project.factSheet.parsedSpecs).map(([key, val]) => (
                  <div key={key} className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="font-semibold text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-[#94A3B8] sm:text-right max-w-md">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Location Map & Connectivity */}
        <div className="space-y-6">
          <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ahmedabad Location Map</h2>
            <div className="rounded-2xl overflow-hidden border border-[#1F3354] h-64 bg-[#0D1726] relative">
              <iframe
                title="Ahmedabad OpenStreetMap"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${project.longitude - 0.03}%2C${project.latitude - 0.03}%2C${project.longitude + 0.03}%2C${project.latitude + 0.03}&layer=mapnik&marker=${project.latitude}%2C${project.longitude}`}
              ></iframe>
            </div>
            <p className="text-[11px] text-[#94A3B8] text-center font-medium">
              Coordinates: {project.latitude}° N, {project.longitude}° E
            </p>
          </div>

          {/* Connectivity */}
          {project.factSheet?.connectivity && (
            <div className="bg-[#15233A] rounded-3xl border border-[#1F3354] p-6 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Connectivity & Commute</h2>
              <p className="text-xs text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                {project.factSheet.connectivity}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
