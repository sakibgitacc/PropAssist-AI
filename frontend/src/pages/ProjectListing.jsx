import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  Building2,
  MapPin,
  Calendar,
  Maximize2,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export const ProjectListing = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success) {
          setProjects(res.data.projects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Ahmedabad Residential Projects</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Verified master developments with live fact sheets, approved pricing, and scheduled site visits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#15233A] text-[#C8814F] border border-[#1F3354] rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>420 Master Residences • SG Highway & South Bopal</span>
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8814F]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const primaryImage = project.images?.find(img => img.isPrimary) || project.images?.[0];
            const fallbackImg = '/assets/story/story-01-discover.jpg';

            return (
              <div
                key={project.id}
                className="bg-[#15233A] rounded-3xl border border-[#1F3354] shadow-xl hover:border-[#C8814F]/50 transition-all overflow-hidden flex flex-col group"
              >
                {/* Hero Image */}
                <div className="relative h-64 w-full overflow-hidden bg-[#0D1726]">
                  <img
                    src={primaryImage?.url || fallbackImg}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = fallbackImg;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1726] via-transparent to-black/40" />

                  {/* Badges on image */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2.5 py-1 bg-[#0D1726]/80 backdrop-blur-md text-[#C8814F] text-[10px] font-bold rounded-lg border border-[#C8814F]/30">
                      {project.bhkOptions}
                    </span>
                    <span className="px-2.5 py-1 bg-[#15233A]/90 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/30">
                      {project.status}
                    </span>
                  </div>

                  {/* Price overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">RERA Carpet Price</p>
                      <p className="text-xl font-bold tracking-tight text-[#F3EFE8]">
                        ₹{(project.minPrice / 10000000).toFixed(2)} Cr - ₹{(project.maxPrice / 10000000).toFixed(2)} Cr
                      </p>
                    </div>
                    <span className="text-xs text-[#CBD5E1] font-medium bg-[#0D1726]/70 px-2.5 py-1 rounded-md border border-[#1F3354]">
                      Possession: {project.possession}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">{project.name}</h2>
                    <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#C8814F] shrink-0" />
                      <span>{project.location}</span>
                    </p>
                    <p className="text-xs text-[#CBD5E1] mt-3 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Amenities highlights */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                      Key Highlights & Amenities
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.amenitiesList?.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-[#0D1726] border border-[#1F3354] text-[#CBD5E1] text-[10px] font-medium rounded-lg"
                        >
                          {amenity}
                        </span>
                      ))}
                      {project.amenitiesList?.length > 4 && (
                        <span className="px-2.5 py-1 bg-[#0D1726] text-[#94A3B8] text-[10px] font-medium rounded-lg border border-[#1F3354]">
                          +{project.amenitiesList.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RERA Notice */}
                  <div className="p-3 bg-[#0D1726]/70 rounded-xl text-[10px] text-[#94A3B8] border border-[#1F3354] flex items-center justify-between">
                    <span>RERA: <strong className="text-white">{project.reraNumber}</strong></span>
                    <span className="font-semibold text-[#C8814F]">{project.minArea} - {project.maxArea} sq.ft</span>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center gap-2.5 border-t border-[#1F3354]">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex-1 py-2.5 px-3 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Explore Fact Sheet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigate(`/book-visit?projectId=${project.id}`)}
                      className="py-2.5 px-4 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#F3EFE8] border border-[#1F3354] rounded-xl text-xs font-semibold transition-all"
                    >
                      Book Tour
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
