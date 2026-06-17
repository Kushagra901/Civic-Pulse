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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          ← Back to Feed
        </Link>
        <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50 font-semibold">
          {incident.status}
        </span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{incident.title}</h1>
        <p className="text-slate-500 mt-1 font-medium">
          {incident.category}
          {incident.createdBy && (
            <>
              {" • "}
              Reported by{" "}
              <Link to={`/users/${incident.createdBy.id}`} className="font-semibold text-slate-900 hover:underline">
                {incident.createdBy.name}
              </Link>
            </>
          )}
        </p>

        <p className="mt-4 text-slate-700 text-sm sm:text-base leading-relaxed bg-slate-50/50 border border-slate-100 rounded-2xl p-4 font-medium">
          {incident.description}
        </p>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Stat label="Credibility" value={incident.credibilityScore} />
          <Stat label="Severity" value={incident.severityScore} />
          <Stat label="Reports" value={incident.reports?.length ?? 0} />
        </div>

        <InlineBoundary label="Voting section failed to load.">
          {canVote && (
            <>
              {/* Mobile vote bar — fixed to bottom, above the nav */}
              <div className="sm:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))]
                              inset-x-0 px-4 py-2 bg-white/95 backdrop-blur-md
                              border-t border-slate-100 z-30 flex gap-3 shadow-md">
                <button
                  onClick={() => castVote('CONFIRM')}
                  disabled={voting || hasVoted}
                  className="flex-1 py-2.5 rounded-xl bg-green-50 text-green-700
                             text-sm font-semibold active:bg-green-100
                             disabled:opacity-50 transition-colors"
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => castVote('DISPUTE')}
                  disabled={voting || hasVoted}
                  className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-700
                             text-sm font-semibold active:bg-red-100
                             disabled:opacity-50 transition-colors"
                >
                  ✗ Dispute
                </button>
              </div>

              {/* Desktop vote buttons — shown inline, not fixed */}
              <div className="hidden sm:flex gap-3 mt-5">
                <button
                  disabled={voting || hasVoted}
                  onClick={() => castVote('CONFIRM')}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold bg-slate-950 text-white
                  shadow-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  disabled={voting || hasVoted}
                  onClick={() => castVote('DISPUTE')}
                  className="rounded-2xl px-4 py-2 text-sm font-semibold border border-slate-200 bg-white
                  hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
                >
                  Dispute
                </button>
                {hasVoted && (
                  <span className="text-xs text-slate-500 self-center font-semibold">
                    Your response has been recorded
                  </span>
                )}
              </div>
            </>
          )}

          {!canVote && (
            <p className="text-sm text-slate-500 mt-5 font-semibold">Login to confirm/dispute.</p>
          )}
        </InlineBoundary>
      </section>

      {/* Citizen Reports */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Citizen Reports ({incident.reports?.length ?? 0})</h2>
        <div className="mt-4 space-y-5 divide-y divide-slate-100">
          {incident.reports?.length ? (
            incident.reports.map((report, idx) => (
              <div key={report.id} className={idx > 0 ? "pt-5" : ""}>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>
                    Reported by{" "}
                    {report.reportedBy ? (
                      <Link to={`/users/${report.reportedBy.id}`} className="font-semibold text-slate-900 hover:underline">
                        {report.reportedBy.name}
                      </Link>
                    ) : (
                      "Anonymous"
                    )}
                  </span>
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{report.description}</p>
                
                {report.photoUrls?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                    {report.photoUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                         className="block aspect-video rounded-lg overflow-hidden bg-gray-100">
                        {/* Use Cloudinary's on-the-fly transform for thumbnails */}
                        <img
                          src={url.includes('/upload/') ? url.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto/') : url}
                          alt={`Report photo ${i + 1}`}
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
            <p className="text-slate-500 text-sm">No reports attached.</p>
          )}
        </div>
      </section>

      <InlineBoundary label="Timeline failed to load.">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <div className="mt-4 space-y-3">
            {incident.timelineEvents?.length ? (
              incident.timelineEvents.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">
                      {t.eventType}
                      {t.actor && (
                        <span className="text-xs font-normal text-slate-500 ml-2">
                          by{" "}
                          <Link to={`/users/${t.actor.id}`} className="font-medium text-slate-800 hover:underline">
                            {t.actor.name}
                          </Link>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  {t.fromStatus && (
                    <p className="text-sm text-slate-600 mt-1">
                      {t.fromStatus} → <b className="text-slate-900">{t.toStatus}</b>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500">No events yet.</p>
            )}
          </div>
        </section>
      </InlineBoundary>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
