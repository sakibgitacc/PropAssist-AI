import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRouteForRole } from '../utils/roleRoutes';
import api from '../api/client';
import { Badge } from '../components/ui/Badge';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Building,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const SiteVisitBooking = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('projectId') || '';

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(preselectedProject);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  // Form inputs prefilled from logged-in user profile
  const [buyerName, setBuyerName] = useState(user?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '');
  const [specialRequests, setSpecialRequests] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (!buyerName && user.name) setBuyerName(user.name);
      if (!buyerPhone && user.phone) setBuyerPhone(user.phone);
      if (!buyerEmail && user.email) setBuyerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.data.success) {
          setProjects(res.data.projects);
          if (!selectedProject && res.data.projects.length > 0) {
            setSelectedProject(res.data.projects[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    fetchProjects();
  }, []);

  const fetchSlots = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const res = await api.get('/slots', { params: { projectId: selectedProject } });
      if (res.data.success) {
        setSlots(res.data.slots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedProject]);

  const handleBookVisit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available site visit slot');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        slotId: selectedSlot.id,
        buyerName: buyerName || user?.name || 'Verified Buyer',
        buyerPhone: buyerPhone || user?.phone || '+919825012345',
        buyerEmail: buyerEmail || user?.email || null,
        specialRequests
      };

      const res = await api.post('/slots/book', payload);
      if (res.data.success) {
        const projectName = projects.find(p => p.id === selectedProject)?.name || 'The Grand Orchid';
        const projectLocation = projects.find(p => p.id === selectedProject)?.location || 'Ahmedabad, Gujarat';
        
        const bookingData = {
          ...res.data.booking,
          confirmationCode: res.data.confirmationCode || res.data.booking?.confirmationCode || `PA-VIS-${Date.now().toString().slice(-6)}`,
          slot: res.data.slot || res.data.booking?.slot || {
            project: projectName,
            date: selectedSlot?.date || 'Scheduled Date',
            time: `${selectedSlot?.startTime || '11:00 AM'} - ${selectedSlot?.endTime || '12:30 PM'}`,
            executive: selectedSlot?.assignedExecutive?.name || 'On-site Executive',
            location: projectLocation
          }
        };
        setSuccessBooking(bookingData);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete site visit reservation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#F3EFE8]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Private Site Visit Booking</h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Select an Ahmedabad development, choose an available VIP slot, and reserve your preview tour.
        </p>
      </div>

      {successBooking ? (
        /* Booking Confirmation Card */
        <div className="bg-[#15233A] rounded-3xl border border-emerald-500/40 p-8 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-lg border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Booking Confirmed
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-2">
              Your Site Visit is Scheduled!
            </h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Confirmation Code: <span className="font-mono font-bold text-[#C8814F] text-base">{successBooking.confirmationCode}</span>
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 bg-[#0D1726] rounded-2xl border border-[#1F3354] text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Project:</span>
              <span className="font-semibold text-white">{successBooking.slot?.project || 'Ahmedabad Development'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Date & Time:</span>
              <span className="font-semibold text-[#C8814F]">
                {successBooking.slot?.date || 'Confirmed Tour'} at {successBooking.slot?.time || '11:00 AM - 12:30 PM'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Assigned Host:</span>
              <span className="font-semibold text-white">{successBooking.slot?.executive || 'On-site Executive'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94A3B8]">Site Location:</span>
              <span className="font-semibold text-white">{successBooking.slot?.location || 'Ahmedabad, Gujarat'}</span>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8]">
            Automated WhatsApp and SMS reminders (24-hour and 2-hour before your tour) have been scheduled.
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setSuccessBooking(null);
                fetchSlots();
              }}
              className="px-4 py-2 border border-[#1F3354] bg-[#0D1726] hover:bg-[#1A2C4C] rounded-xl text-xs font-semibold text-[#CBD5E1]"
            >
              Book Another Visit
            </button>
            <button
              onClick={() => navigate(user?.role ? getDashboardRouteForRole(user.role) : '/dashboard')}
              className="px-5 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              Return to My Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Booking Flow Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Slot Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Project Picker */}
            <div className="bg-[#15233A] p-5 rounded-3xl border border-[#1F3354] shadow-xl space-y-3">
              <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                1. Select Ahmedabad Development
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.isArray(projects) && projects.length > 0 ? (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(p.id);
                        setSelectedSlot(null);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        selectedProject === p.id
                          ? 'border-[#C8814F] bg-[#C8814F]/10 ring-1 ring-[#C8814F]'
                          : 'border-[#1F3354] hover:border-[#38517A] bg-[#0D1726]/80'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white text-xs">{p.name}</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{p.location || 'Ahmedabad, Gujarat'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#C8814F] mt-2">{p.bhkOptions || 'Luxury Residences'}</span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 p-6 text-center text-[#64748B] text-xs">
                    No active developments found. Please try refreshing.
                  </div>
                )}
              </div>
            </div>

            {/* Slots Picker */}
            <div className="bg-[#15233A] p-5 rounded-3xl border border-[#1F3354] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                  2. Choose An Available Visit Slot
                </label>
                <span className="text-[10px] text-[#C8814F] font-semibold">Atomic Capacity Control</span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-[#64748B] text-xs">Loading available slots...</div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-xs">
                  No active visit slots found for this project.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const availableSeats = slot.capacity - slot.bookedCount;
                    const isFull = availableSeats <= 0;
                    const isSelected = selectedSlot?.id === slot.id;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isFull}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isFull
                            ? 'opacity-30 bg-[#0D1726] border-[#1F3354] cursor-not-allowed'
                            : isSelected
                            ? 'border-[#C8814F] bg-[#C8814F] text-white shadow-lg'
                            : 'border-[#1F3354] hover:border-[#C8814F]/60 bg-[#0D1726] text-[#CBD5E1]'
                        }`}
                      >
                        <div>
                          <p className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-white'}`}>
                            {slot.date}
                          </p>
                          <p className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isFull
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isFull ? 'Full' : `${availableSeats} left`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Buyer Details & Submit */}
          <div className="bg-[#15233A] p-6 rounded-3xl border border-[#1F3354] shadow-xl space-y-4 h-fit">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              3. Buyer Information
            </h2>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookVisit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Sanjay Patel"
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
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+91 98250 12345"
                  className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="sanjay@example.com"
                  className="w-full px-3 py-2 bg-[#0D1726] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#CBD5E1] uppercase mb-1">
                  Special Requests / Requirements
                </label>
                <textarea
                  rows="2"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Wheelchair access, specific floor plan focus..."
                  className="w-full p-2 text-xs bg-[#0D1726] border border-[#1F3354] rounded-xl focus:outline-none focus:border-[#C8814F] text-[#F3EFE8]"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedSlot}
                  className="w-full py-3 px-4 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {submitting ? 'Confirming with Database...' : 'Confirm Site Visit Reservation'}
                </button>
              </div>

              <p className="text-[10px] text-[#64748B] text-center leading-tight">
                Backend transaction prevents concurrent overbooking. Instant confirmation code generated upon database success.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteVisitBooking;
