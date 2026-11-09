import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Video,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  User,
  Shield,
  ArrowRight
} from 'lucide-react';
import { requestVideoConsultation, getCallHistory } from '../../services/extendedApi';

export const VideoConsultationModal = ({
  isOpen,
  onClose,
  leadId = null,
  projectId = null,
  executiveName = 'Senior Property Consultant'
}) => {
  const navigate = useNavigate();
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [recentConsultations, setRecentConsultations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      getCallHistory().then((res) => {
        if (res?.success && res.calls) {
          setRecentConsultations(res.calls);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let scheduledDateTime = new Date(Date.now() + 2 * 3600000).toISOString();
      if (preferredDate) {
        try {
          const cleanTime = preferredTime ? preferredTime.replace(/\s*[AP]M/i, '').trim() : '11:00';
          const parsed = new Date(`${preferredDate}T${cleanTime}`);
          if (!isNaN(parsed.getTime())) {
            scheduledDateTime = parsed.toISOString();
          }
        } catch (_) {}
      }

      const res = await requestVideoConsultation({
        leadId: leadId || undefined,
        projectId: projectId || undefined,
        callType: 'video',
        preferredTime: scheduledDateTime,
        notes: notes || 'Online 3D floor plan review and unit selection'
      });

      if (res.success && res.callSession) {
        setSuccessData(res);
      } else {
        setError(res.error || 'Failed to submit consultation request');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0F1927] border border-[#1F3354] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F3354] flex items-center justify-between bg-[#15233A]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8814F]/20 border border-[#C8814F]/40 flex items-center justify-center text-[#C8814F]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Video Consultation Request</h2>
              <p className="text-[11px] text-[#94A3B8]">
                One-on-one virtual walkthrough via secure Jitsi Meet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#1F3354] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {successData ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Consultation Requested!</h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Your assigned advisor will confirm the schedule. You can join directly once scheduled.
                </p>
              </div>

              <div className="p-3 bg-[#09111D] border border-[#1F3354] rounded-xl text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Status:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    {successData.callSession?.status || 'REQUESTED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Room Name:</span>
                  <span className="font-mono text-[#CBD5E1] text-[10px]">
                    {successData.callSession?.roomName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white rounded-xl bg-[#15233A]"
                >
                  Close
                </button>
                {successData.joinUrl && (
                  <button
                    type="button"
                    onClick={() => navigate(successData.joinUrl)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C8814F] hover:bg-[#b67040] text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <span>Go to Call Waiting Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Host Advisor Info */}
              <div className="p-3 rounded-xl bg-[#09111D] border border-[#1F3354] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#C8814F]/20 text-[#C8814F] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Assigned Host</span>
                    <span className="text-xs font-bold text-white">{executiveName}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1F3354] text-[#CBD5E1]">
                  Live Video
                </span>
              </div>

              {/* Date & Time Preferences */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full p-2.5 bg-[#09111D] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full p-2.5 bg-[#09111D] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F]"
                  />
                </div>
              </div>

              {/* Consultation Agenda / Notes */}
              <div>
                <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">
                  Discussion Agenda (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Looking for a 3 BHK above the 10th floor, review payment schedule and Vastu compliance..."
                  className="w-full p-3 bg-[#09111D] border border-[#1F3354] rounded-xl text-xs text-[#F3EFE8] focus:outline-none focus:border-[#C8814F] resize-none"
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-3 rounded-xl bg-[#09111D] border border-[#1F3354] flex items-start gap-2 text-[10px] text-[#94A3B8]">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Secure Jitsi Video: </strong>
                  Peer-to-peer encryption with camera and mic toggles. No automatic recording.
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white rounded-xl hover:bg-[#1F3354] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white font-bold rounded-xl text-xs shadow-lg transition-all disabled:opacity-50"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Request Consultation'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Consultation History */}
          {recentConsultations.length > 0 && (
            <div className="pt-4 border-t border-[#1F3354] space-y-2">
              <span className="text-[11px] font-semibold text-[#CBD5E1] block">
                Your Past & Scheduled Consultations
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {recentConsultations.slice(0, 3).map((call) => (
                  <div
                    key={call.id}
                    className="p-2.5 rounded-xl bg-[#09111D] border border-[#1F3354] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {call.callType === 'video' ? 'Video Tour' : 'Voice Call'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            call.status === 'SCHEDULED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : call.status === 'InProgress'
                              ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                              : call.status === 'REQUESTED'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-zinc-700/50 text-[#94A3B8]'
                          }`}
                        >
                          {call.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#64748B]">
                        Host: {call.executive?.name || 'Advisor'}
                      </span>
                    </div>

                    {(call.status === 'SCHEDULED' || call.status === 'InProgress' || call.status === 'REQUESTED') && (
                      <button
                        type="button"
                        onClick={() => navigate(`/call/${call.invitationToken}`)}
                        className="px-2.5 py-1 bg-[#15233A] hover:bg-[#C8814F] text-[#CBD5E1] hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <span>Join</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConsultationModal;

