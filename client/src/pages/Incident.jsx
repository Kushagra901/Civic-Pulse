import React, { useState, useEffect } from "react";
import { api, tokenStore } from "../api.js";
import { useParams, Link } from "react-router-dom";
import { useAsync } from "../hooks/useAsync.js";
import { useError } from "../context/ErrorContext.jsx";
import { EmptyState } from "../components/EmptyState.jsx";
import { IncidentDetailSkeleton } from "../components/Skeletons.jsx";
import { InlineBoundary } from "../components/ErrorBoundary.jsx";
import { useSocket } from "../context/SocketContext.jsx";

export default function Incident() {
  const { id } = useParams();
  const { showSuccess, handleError } = useError();
  const [voting, setVoting] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          ← Back to Feed
        </Link>
        <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50">
          {incident.status}
        </span>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">{incident.title}</h1>
        <p className="text-slate-500 mt-1">
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

        <p className="mt-4 text-slate-700 text-sm sm:text-base leading-relaxed bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
          {incident.description}
        </p>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Stat label="Credibility" value={incident.credibilityScore} />
          <Stat label="Severity" value={incident.severityScore} />
          <Stat label="Reports" value={incident.reports?.length ?? 0} />
        </div>

        <InlineBoundary label="Voting section failed to load.">
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={!canVote || voting}
              onClick={async () => {
                setVoting(true);
                try {
                  await api.confirmIncident(id, "CONFIRM");
                  showSuccess("Thanks for confirming this issue.");
                  await reload();
                } catch (e) {
                  handleError(e);
                } finally {
                  setVoting(false);
                }
              }}
              className="rounded-2xl px-4 py-2 text-sm font-medium bg-slate-900 text-white
              shadow-sm hover:opacity-90 transition disabled:opacity-50"
            >
              Confirm
            </button>

            <button
              disabled={!canVote || voting}
              onClick={async () => {
                setVoting(true);
                try {
                  await api.confirmIncident(id, "DISPUTE");
                  showSuccess("Your dispute has been recorded.");
                  await reload();
                } catch (e) {
                  handleError(e);
                } finally {
                  setVoting(false);
                }
              }}
              className="rounded-2xl px-4 py-2 text-sm font-medium border border-slate-200 bg-white
              hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              Dispute
            </button>

            {!canVote && (
              <p className="text-sm text-slate-500 self-center">Login to confirm/dispute.</p>
            )}
          </div>
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
