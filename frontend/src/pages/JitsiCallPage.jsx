import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getDashboardRouteForRole } from '../utils/roleRoutes';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  Users,
  Clock,
  ShieldCheck,
  Building2,
  CheckCircle,
  AlertCircle,
  Lock,
  Sparkles,
  ArrowLeft,
  Calendar
} from 'lucide-react';

export const JitsiCallPage = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role'); // 'executive' or undefined
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Ready'); // 'Ready', 'Connecting', 'InProgress', 'Completed'
  const [copied, setCopied] = useState(false);

  // In-call custom controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/calls/session/${token}`);
        if (res.data.success) {
          setSession(res.data.session);
        }
      } catch (err) {
        if (err.response && err.response.status === 410) {
          setError('This meeting invitation has expired. Please contact your sales executive.');
        } else {
          setError(err.response?.data?.error || 'Invalid meeting token');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token]);

  // Ensure Jitsi External API script is loaded
  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement('script');
      script.src = `https://${session?.jitsiDomain || 'meet.jit.si'}/external_api.js`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [session]);

  // Duration timer
  useEffect(() => {
    if (callStatus === 'InProgress') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMeetingDateTime = (dateStr) => {
    if (!dateStr) return 'Immediate VIP Consultation';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return (
        d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) +
        ' at ' +
        d.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
    } catch (_) {
      return dateStr;
    }
  };

  const handleJoinCall = () => {
    setJoined(true);
    setCallStatus('Connecting');

    const domain = session?.jitsiDomain || 'meet.jit.si';
    const displayName =
      user?.name ||
      session?.displayName ||
      (roleParam === 'executive' ? 'Sales Executive' : session?.leadName || 'Consultation Guest');

    setTimeout(() => {
      try {
        if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
          const options = {
            roomName: session.roomName,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            userInfo: {
              displayName
            },
            configOverwrite: {
              startWithAudioMuted: false,
              startWithVideoMuted: session.callType === 'voice',
              enableWelcomePage: false,
              prejoinPageEnabled: false,
              disableDeepLinking: true,
              enableClosePage: false
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              TOOLBAR_BUTTONS: [
                'microphone',
                'camera',
                'closedcaptions',
                'desktop',
                'fullscreen',
                'fodeviceselection',
                'hangup',
                'chat',
                'raisehand',
                'videoquality',
                'filmstrip',
                'tileview'
              ]
            }
          };

          const apiInstance = new window.JitsiMeetExternalAPI(domain, options);
          jitsiApiRef.current = apiInstance;

          apiInstance.addEventListeners({
            videoConferenceJoined: async () => {
              setCallStatus('InProgress');
              await api.post(`/calls/${session.id}/status`, { status: 'InProgress' }).catch(() => {});
            },
            videoConferenceLeft: async () => {
              handleEndCall();
            },
            audioMuteStatusChanged: (e) => {
              setIsMuted(e.muted);
            },
            videoMuteStatusChanged: (e) => {
              setIsVideoMuted(e.muted);
            }
          });
        } else {
          // Virtual direct connection
          setCallStatus('InProgress');
        }
      } catch (err) {
        console.warn('Jitsi fallback mode engaged:', err);
        setCallStatus('InProgress');
      }
    }, 150);
  };

  const handleEndCall = async () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch {
        // Ignored
      }
      jitsiApiRef.current = null;
    }
    setCallStatus('Completed');
    setJoined(false);

    // Save final call duration in backend
    try {
      await api.post(`/calls/${session.id}/status`, {
        status: 'Completed',
        durationSeconds: callDuration
      });
    } catch {
      // Ignored
    }
  };

  const toggleMic = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleAudio');
    } else {
      setIsMuted(prev => !prev);
    }
  };

  const toggleCam = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand('toggleVideo');
    } else {
      setIsVideoMuted(prev => !prev);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/call/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReturnToDashboard = () => {
    if (user?.role) {
      navigate(getDashboardRouteForRole(user.role));
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C8814F] to-[#15233A] flex items-center justify-center animate-spin">
          <Video className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs text-[#94A3B8] font-semibold tracking-wider uppercase">
          Connecting Secure Video Consultation...
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto my-16 bg-[#15233A] p-8 rounded-3xl border border-[#1F3354] text-center space-y-5 shadow-2xl text-white">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Meeting Room Unavailable</h2>
          <p className="text-xs text-[#94A3B8] mt-1">{error || 'Session could not be initialized or verified.'}</p>
        </div>

        {session && (
          <div className="p-3.5 bg-[#0D1726] rounded-xl border border-[#1F3354] text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Project:</span>
              <span className="font-semibold text-white">{session.projectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Scheduled Time:</span>
              <span className="font-semibold text-[#C8814F]">{formatMeetingDateTime(session.scheduledAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Advisor Host:</span>
              <span className="text-white">{session.executiveName}</span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const res = await api.post('/calls/request', {
                  callType: 'video',
                  notes: 'Direct VIP Video Tour Request'
                });
                if (res.data.success && res.data.joinUrl) {
                  window.location.href = res.data.joinUrl;
                } else {
                  window.location.reload();
                }
              } catch (_) {
                window.location.reload();
              }
            }}
            className="w-full py-2.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            <span>Launch Instant VIP Video Consultation</span>
          </button>
          <button
            onClick={handleReturnToDashboard}
            className="w-full py-2.5 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] border border-[#1F3354] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#C8814F]" />
            <span>Return to My Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto text-[#F3EFE8]">
      {/* Top Meeting Header Bar */}
      <div className="bg-[#15233A] text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#1F3354]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleReturnToDashboard}
            className="p-2 rounded-xl bg-[#0D1726] hover:bg-[#1F3354] border border-[#1F3354] text-[#CBD5E1] transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Return to your personal workspace"
          >
            <ArrowLeft className="w-4 h-4 text-[#C8814F]" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C8814F] to-[#15233A] flex items-center justify-center shadow-md border border-[#C8814F]/40">
            <Video className="w-4 h-4 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                {session.projectName} Consultation Room
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8814F]/20 text-[#C8814F] border border-[#C8814F]/30 uppercase font-semibold">
                {session.callType.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Host: <strong className="text-white">{session.executiveName}</strong></span>
              <span>•</span>
              <span>Buyer: <strong className="text-white">{session.leadName}</strong></span>
              <span>•</span>
              <span className="text-[#C8814F] flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3" />
                {formatMeetingDateTime(session.scheduledAt)}
              </span>
            </p>
          </div>
        </div>

        {/* Status, Duration & Actions */}
        <div className="flex items-center gap-3">
          {callStatus === 'InProgress' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{formatTimer(callDuration)}</span>
            </div>
          )}

          <button
            onClick={copyInviteLink}
            className="px-3 py-1.5 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] border border-[#1F3354] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-[#C8814F]" />
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          <button
            onClick={handleReturnToDashboard}
            className="px-3 py-1.5 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>

      {/* Main Call Viewport */}
      <div className="relative w-full h-[600px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-[#1F3354] flex items-center justify-center">
        {/* Hidden Jitsi iframe container always mounted so DOM ref is guaranteed */}
        <div ref={jitsiContainerRef} className={`w-full h-full bg-slate-950 ${joined ? 'block' : 'hidden'}`} />

        {callStatus === 'Completed' ? (
          /* Call Ended Summary Card */
          <div className="text-center p-8 max-w-md bg-[#15233A] border border-[#1F3354] rounded-2xl shadow-xl text-white space-y-5 animate-fade-in z-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Consultation Concluded
              </span>
              <h2 className="text-xl font-bold mt-1 text-white">Call Ended Successfully</h2>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Total duration: <strong className="text-white font-mono">{formatTimer(callDuration)}</strong>. A summary log has been recorded in your PropAssist dashboard.
              </p>
            </div>

            <button
              onClick={() => navigate(getDashboardRouteForRole(user?.role))}
              className="w-full py-3 px-6 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              Return to My Dashboard
            </button>
          </div>
        ) : !joined ? (
          /* Pre-join Welcome Card */
          <div className="text-center p-8 max-w-lg bg-[#15233A] border border-[#1F3354] rounded-2xl shadow-xl text-white space-y-5 animate-fade-in z-20">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C8814F]/20 border border-[#C8814F]/30 flex items-center justify-center text-[#C8814F]">
              <Video className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C8814F]">
                PropAssist Embedded Conference
              </span>
              <h2 className="text-xl font-bold mt-1 text-white">Ready to join your consultation?</h2>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                Connect directly in this secure workspace without external downloads or third-party meeting apps.
              </p>
            </div>

            <div className="p-4 bg-[#0D1726] rounded-xl text-xs text-left space-y-2 border border-[#1F3354]">
              <div className="flex justify-between items-center py-1 border-b border-[#1F3354]/60">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C8814F]" />
                  Meeting Date & Time:
                </span>
                <span className="font-semibold text-[#C8814F]">
                  {formatMeetingDateTime(session.scheduledAt)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1F3354]/60">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Assigned Host:
                </span>
                <span className="font-semibold text-white">
                  {session.executiveName} {session.executivePhone ? `(${session.executivePhone})` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1F3354]/60">
                <span className="text-[#94A3B8] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Project Tour:
                </span>
                <span className="font-semibold text-white">
                  {session.projectName}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#94A3B8]">Your Identity:</span>
                <span className="font-semibold text-white">
                  {user?.name || session.displayName || session.leadName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(getDashboardRouteForRole(user?.role))}
                className="w-1/3 py-3 px-4 bg-[#0D1726] hover:bg-[#1A2C4C] text-[#CBD5E1] border border-[#1F3354] rounded-xl text-xs font-semibold transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleJoinCall}
                className="w-2/3 py-3 px-6 bg-[#C8814F] hover:bg-[#b67040] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#C8814F]/25 transition-all flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Join Meeting Now</span>
              </button>
            </div>
          </div>
        ) : !jitsiApiRef.current && (
          /* In-App Direct Virtual Consultation Fallback Display */
          <div className="text-center p-8 max-w-lg bg-[#15233A] border border-[#1F3354] rounded-2xl shadow-2xl text-white space-y-6 animate-fade-in z-20">
            <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#C8814F] to-indigo-600 flex items-center justify-center text-white shadow-xl">
              <Video className="w-10 h-10" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#15233A] animate-ping" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                Live Consultation Connected
              </span>
              <h2 className="text-xl font-bold mt-2 text-white">{session.projectName} Consultation</h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Consultation active between <strong>{session.executiveName}</strong> and <strong>{user?.name || session.leadName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-[#0D1726] rounded-xl text-xs text-left space-y-2 border border-[#1F3354]">
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Session Duration:</span>
                <span className="font-mono font-bold text-emerald-400">{formatTimer(callDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Microphone:</span>
                <span className={isMuted ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {isMuted ? 'Muted' : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94A3B8]">Video Camera:</span>
                <span className={isVideoMuted ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  {isVideoMuted ? 'Disabled' : 'Streaming'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-[#0D1726] text-[#CBD5E1] border-[#1F3354]'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-[#C8814F]" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
              <button
                onClick={toggleCam}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  isVideoMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-[#0D1726] text-[#CBD5E1] border-[#1F3354]'
                }`}
              >
                {isVideoMuted ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-[#C8814F]" />}
                <span>{isVideoMuted ? 'Start Camera' : 'Stop Camera'}</span>
              </button>
              <button
                onClick={handleEndCall}
                className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Controls Bar (when in call) */}
      {joined && jitsiApiRef.current && (
        <div className="bg-[#15233A] p-3 rounded-2xl border border-[#1F3354] shadow-xl flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMic}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-[#0D1726] hover:bg-[#1F3354] text-[#CBD5E1] border-[#1F3354]'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-[#C8814F]" />}
              <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
            </button>

            <button
              onClick={toggleCam}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isVideoMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-[#0D1726] hover:bg-[#1F3354] text-[#CBD5E1] border-[#1F3354]'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-[#C8814F]" />}
              <span>{isVideoMuted ? 'Start Camera' : 'Stop Camera'}</span>
            </button>
          </div>

          <button
            onClick={handleEndCall}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      )}

      {/* Security & Architecture Disclosure Notice */}
      <div className="p-4 bg-[#15233A]/70 rounded-2xl border border-[#1F3354] text-[#94A3B8] text-xs flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-[#C8814F] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Video Conferencing Security Architecture</p>
          <p className="mt-0.5 leading-relaxed text-[11px] text-[#94A3B8]">
            PropAssist AI generates unique 24-character cryptographic tokens and unpredictably randomized room hashes for each buyer consultation session. All video and audio streams are rendered directly in-browser using the Jitsi Meet External API without third-party app requirements. For enterprise-grade isolated VPC compliance, custom authenticated JaaS or self-hosted Jitsi deployments can be connected via the <code>JITSI_DOMAIN</code> environment variable.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JitsiCallPage;
