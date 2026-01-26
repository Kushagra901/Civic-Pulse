import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, tokenStore } from "../api.js";
import { useParams, Link } from "react-router-dom";

export default function Incident() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.getIncident(id);
      setIncident(res.incident);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return <p className="text-slate-500">Loading…</p>;
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
        <p className="text-slate-500 mt-1">{incident.category}</p>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Stat label="Credibility" value={incident.credibilityScore} />
          <Stat label="Severity" value={incident.severityScore} />
          <Stat label="Reports" value={incident.reports?.length ?? 0} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={!canVote}
            onClick={async () => {
              try {
                await api.confirmIncident(id, "CONFIRM");
                toast.success("Confirmed");
                await load();
              } catch (e) {
                toast.error(e.message);
              }
            }}
            className="rounded-2xl px-4 py-2 text-sm font-medium bg-slate-900 text-white
            shadow-sm hover:opacity-90 transition disabled:opacity-50"
          >
            Confirm
          </button>

          <button
            disabled={!canVote}
            onClick={async () => {
              try {
                await api.confirmIncident(id, "DISPUTE");
                toast("Disputed");
                await load();
              } catch (e) {
                toast.error(e.message);
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
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <div className="mt-4 space-y-3">
          {incident.timelineEvents?.length ? (
            incident.timelineEvents.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{t.eventType}</p>
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
