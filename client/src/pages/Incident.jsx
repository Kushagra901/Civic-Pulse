import React, { useState, useEffect } from "react";
import { api, tokenStore } from "../api.js";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync.js";
import { useError } from "../context/ErrorContext.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { IncidentDetailSkeleton } from "../components/Skeletons.jsx";
import { InlineBoundary } from "../components/ErrorBoundary.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useAuth } from "../auth.jsx";
import { usePageMeta } from "../hooks/usePageMeta.js";


export default function Incident() {
  const { id } = useParams();
  const { showSuccess, handleError } = useError();
  const { user } = useAuth();
  const [voting, setVoting] = useState(false);

  const castVote = async (type) => {
    if (!navigator.geolocation) {
      handleError(new Error("Geolocation is not supported by your browser. Location verification is required to vote."));
      return;
    }

    setVoting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await api.confirmIncident(id, type, latitude, longitude);
          showSuccess(type === 'CONFIRM' ? "Thanks for confirming this issue." : "Your dispute has been recorded.");
          await reload();
        } catch (e) {
          handleError(e);
        } finally {
          setVoting(false);
        }
      },
      (error) => {
        let message = "Please allow location access to confirm or dispute incidents.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. CivicPulse requires location verification within 500m to vote.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out. Please try again.";
        }
        handleError(new Error(message));
        setVoting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const {
    data: resData,
    loading,
    error,
    execute: reload,
    setData: setResData,
  } = useAsync(() => api.getIncident(id), [id]);

  const incident = resData?.incident;

  usePageMeta(
    incident?.title,
    incident?.description?.slice(0, 150)
  );

  const { joinRoom, leaveRoom, subscribe } = useSocket();

  useEffect(() => {
    if (!id) return;
    joinRoom(`incident:${id}`);

    // Live score update — update the displayed credibility score
    const unsubScore = subscribe("incident:score_updated", (data) => {
      if (data.incidentId !== id) return;
      setResData(prev => prev
        ? { ...prev, incident: { ...prev.incident, credibilityScore: data.credibilityScore } }
        : prev
      );
    });

    // New report added — show a toast/success and reload data
    const unsubReport = subscribe("incident:report_added", (data) => {
      if (data.incidentId !== id) return;
      showSuccess(`${data.reporterName} filed an additional report.`);
      reload(); // reload everything to get reports count and list updated
    });

    // Status changed by moderator
    const unsubStatus = subscribe("incident:status_changed", (data) => {
      if (data.incidentId !== id) return;
      setResData(prev => prev
        ? { ...prev, incident: { ...prev.incident, status: data.toStatus } }
        : prev
      );
      showSuccess(`Status updated to ${data.toStatus.replace("_", " ")}`);
    });

    return () => {
      leaveRoom(`incident:${id}`);
      unsubScore();
      unsubReport();
      unsubStatus();
    };
  }, [id, joinRoom, leaveRoom, subscribe, reload, setResData, showSuccess]);

  if (loading) return <IncidentDetailSkeleton />;

  if (error) {
    return (
      <EmptyState
        preset="error"
        message={error.status === 404 ? "This incident no longer exists." : "Failed to load incident details."}
        action={error.status !== 404 ? { label: "Try again", onClick: reload } : undefined}
      />
    );
  }

  if (!incident) return null;

  const canVote = Boolean(tokenStore.access);
  const userConfirmations = incident?.confirmations || [];
  const hasVoted = user && userConfirmations.some(c => c.userId === user.id);

  const confirms = userConfirmations.filter(c => c.type === 'CONFIRM').length;
  const disputes = userConfirmations.filter(c => c.type === 'DISPUTE').length;
  const totalVotes = confirms + disputes;
  const confirmPct = totalVotes > 0 ? Math.round((confirms / totalVotes) * 100) : 100;
  const disputePct = totalVotes > 0 ? Math.round((disputes / totalVotes) * 100) : 0;

  const STATUS_STEPS = [
    { value: 'REPORTED',    label: 'Reported',   desc: 'Complaint filed' },
    { value: 'TRIAGED',     label: 'Triaged',    desc: 'Details validated' },
    { value: 'ASSIGNED',    label: 'Assigned',   desc: 'Routed to team' },
    { value: 'IN_PROGRESS', label: 'Resolving',  desc: 'Active repair work' },
    { value: 'RESOLVED',    label: 'Resolved',   desc: 'Resolution posted' },
    { value: 'VERIFIED',    label: 'Verified',   desc: 'Citizen confirmed' },
  ];

  const currentStatusIndex = STATUS_STEPS.findIndex(step => step.value === incident.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Back button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <Link to="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1">
          ← BACK TO ACTIVE FEED
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border
            ${STATUS_STYLES[incident.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {incident.status ? incident.status.replace('_', ' ') : 'REPORTED'}
          </span>
        </div>
      </div>

      {/* Main Incident Details Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Side: Description and Stats (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50/60 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {incident.category} Grievance
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display mt-2">
                {incident.title}
              </h1>
              {incident.createdBy && (
                <p className="text-xs text-slate-400 font-semibold">
                  Filed by <Link to={`/users/${incident.createdBy.id}`} className="text-slate-600 hover:text-blue-600 underline">
                    {incident.createdBy.name}
                  </Link>
                </p>
              )}
            </div>

            <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 border border-slate-100 rounded-xl p-4 font-semibold whitespace-pre-wrap">
              {incident.description}
            </p>

            {/* Dashboard stats panel */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credibility</p>
                <p className="text-xl font-extrabold text-blue-600 font-display">⚡ {incident.credibilityScore}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Severity</p>
                <p className="text-xl font-extrabold text-amber-600 font-display">🔥 {incident.severityScore}</p>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signals</p>
                <p className="text-xl font-extrabold text-slate-900 font-display">{incident.reports?.length ?? 1}</p>
              </div>
            </div>
          </section>

          {/* Citizen Updates Log */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Citizen Verification Files
            </h2>
            <div className="space-y-5 divide-y divide-slate-100">
              {incident.reports?.length ? (
                incident.reports.map((report, idx) => (
                  <div key={report.id} className={idx > 0 ? "pt-5" : ""}>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-semibold">
                      <span>
                        Uploaded by{" "}
                        {report.reportedBy ? (
                          <Link to={`/users/${report.reportedBy.id}`} className="text-slate-600 hover:text-blue-600 font-bold">
                            {report.reportedBy.name}
                          </Link>
                        ) : (
                          "Verified Citizen"
                        )}
                      </span>
                      <span>{new Date(report.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium', timeStyle: 'short'
                      })}</span>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed bg-slate-50/30 p-3 rounded-lg border border-slate-100/50">{report.description}</p>
                    
                    {report.photoUrls?.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
                        {report.photoUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                             className="block aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200/40 hover:scale-[1.01] transition-transform">
                            <img
                              src={url.includes('/upload/') ? url.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto/') : url}
                              alt={`Report proof ${i + 1}`}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs font-semibold py-4 text-center">No reports attached.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Side: Verification Stepper and Timeline (1 col) */}
        <div className="space-y-6">
          
          {/* Live Voting & Poll Results Panel */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              Proximity Verification
            </h2>
            
            <InlineBoundary label="Verification system unavailable.">
              {canVote ? (
                <div className="space-y-4">
                  
                  {/* Proximity Tip */}
                  <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-[11px] text-slate-500 font-semibold leading-relaxed">
                    📍 Proximity check active. Users verified within 500m of coordinates can validate this signal.
                  </div>

                  {/* Poll results visualization */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <span>Confirm Issue</span>
                        <span>{confirms} ({confirmPct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${confirmPct}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <span>Dispute Issue</span>
                        <span>{disputes} ({disputePct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${disputePct}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Vote button controls */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => castVote('CONFIRM')}
                      disabled={voting || hasVoted}
                      className="w-full py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      ✓ Confirm Proximity Signal
                    </button>
                    <button
                      onClick={() => castVote('DISPUTE')}
                      disabled={voting || hasVoted}
                      className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors disabled:opacity-50"
                    >
                      ✗ Dispute Report
                    </button>
                    {hasVoted && (
                      <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider pt-1">
                        🔒 Verification Response Logged
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed mb-3">
                    You must be registered and authenticated to verify reports.
                  </p>
                  <Link to="/login" className="inline-block text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                    Sign in to Vote
                  </Link>
                </div>
              )}
            </InlineBoundary>
          </section>

          {/* Stepper Pipeline */}
          <section className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              Resolution Progress
            </h2>
            
            <div className="relative pl-5 space-y-5 border-l border-slate-100 ml-2 pt-1.5 pb-1">
              {STATUS_STEPS.map((step, idx) => {
                const isActive = currentStatusIndex >= idx;
                const isCurrent = currentStatusIndex === idx;

                return (
                  <div key={step.value} className="relative">
                    {/* Node marker */}
                    <div className={`absolute -left-[29px] top-1 h-4 w-4 rounded-full border-2 grid place-items-center transition-all duration-300
                      ${isCurrent 
                        ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-500/20' 
                        : isActive 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'bg-white border-slate-200'}`}>
                      {isActive && !isCurrent && (
                        <span className="text-[7px] font-bold">✓</span>
                      )}
                      {isCurrent && (
                        <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold transition-colors
                        ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Complete Audit Logs */}
          <InlineBoundary label="Audit events failed to load.">
            <section className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                Audit Trail Log
              </h2>
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {incident.timelineEvents?.length ? (
                  incident.timelineEvents.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-100 p-3 space-y-1.5 bg-slate-50/50 text-[11px]">
                      <div className="flex items-center justify-between gap-2 font-bold text-slate-800">
                        <span>{t.eventType}</span>
                        <span className="text-slate-400 font-medium">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric'
                          })}
                        </span>
                      </div>
                      {t.fromStatus && (
                        <p className="text-slate-500 font-semibold">
                          Pipeline: {t.fromStatus} → <b className="text-slate-800">{t.toStatus}</b>
                        </p>
                      )}
                      {t.actor && (
                        <p className="text-slate-400 font-medium">
                          Operator: <Link to={`/users/${t.actor.id}`} className="text-slate-600 hover:text-blue-600 font-semibold underline">{t.actor.name}</Link>
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs font-semibold py-4 text-center">No timeline records logged.</p>
                )}
              </div>
            </section>
          </InlineBoundary>
        </div>
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  REPORTED:    'bg-slate-50 text-slate-600 border-slate-200',
  TRIAGED:     'bg-amber-50 text-amber-700 border-amber-200',
  ASSIGNED:    'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFIED:    'bg-teal-50 text-teal-700 border-teal-200',
  CLOSED:      'bg-slate-50 text-slate-500 border-slate-200',
};
