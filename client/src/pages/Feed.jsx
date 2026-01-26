import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, tokenStore } from "../api.js";
import { Link } from "react-router-dom";
import LocationPicker from "../components/LocationPicker.jsx";

const categories = ["WATER", "ELECTRICITY", "ROAD", "SAFETY", "SANITATION", "OTHER"];

export default function Feed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ category: "", status: "" });

  const [form, setForm] = useState({
    title: "",
    category: "ROAD",
    description: "",
    location: { lat: 28.6139, lng: 77.209, label: "New Delhi (default)" }
  });

  const loggedIn = Boolean(tokenStore.access);

  async function load() {
    setLoading(true);
    try {
      const res = await api.listIncidents();
      setItems(res.items || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter((i) => {
    if (filters.category && i.category !== filters.category) return false;
    if (filters.status && i.status !== filters.status) return false;
    return true;
  });

  async function submit() {
    if (!loggedIn) return toast.error("Please login first");
    if (!form.title.trim()) return toast.error("Title required");
    if (!form.description.trim()) return toast.error("Description required");

    toast.loading("Submitting report...", { id: "submit" });
    try {
      await api.createIncident({
        title: form.title,
        category: form.category,
        description: form.description,
        lat: form.location.lat,
        lng: form.location.lng,
        photoUrls: []
      });
      toast.success("Report submitted!", { id: "submit" });
      setForm((p) => ({ ...p, title: "", description: "" }));
      await load();
    } catch (e) {
      toast.error(e.message, { id: "submit" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Community Issues Feed</h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Report civic problems, confirm nearby incidents, and track resolution timelines with credibility-based ranking.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium
            border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <select
            className="w-full sm:w-56 rounded-2xl border border-slate-200 px-4 py-3 bg-white outline-none
            focus:ring-2 focus:ring-slate-900/10 transition"
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            className="w-full sm:w-56 rounded-2xl border border-slate-200 px-4 py-3 bg-white outline-none
            focus:ring-2 focus:ring-slate-900/10 transition"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">All statuses</option>
            {["REPORTED","TRIAGED","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFIED","CLOSED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ category: "", status: "" })}
            className="rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 bg-white
            hover:bg-slate-50 transition shadow-sm"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Create + Location */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Report an issue</h2>
            <span className="text-xs text-slate-500">{loggedIn ? "Logged in" : "Login required"}</span>
          </div>

          {!loggedIn ? (
            <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              Please login to create an incident.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                  focus:ring-2 focus:ring-slate-900/10 transition"
                  placeholder="e.g., Garbage overflow near hostel gate"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white outline-none
                  focus:ring-2 focus:ring-slate-900/10 transition"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                  focus:ring-2 focus:ring-slate-900/10 transition min-h-[120px]"
                  placeholder="Add details: where, since when, how severe."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>

              <button
                onClick={submit}
                className="w-full rounded-2xl bg-slate-900 text-white py-3 font-medium shadow-sm
                hover:opacity-90 transition"
              >
                Submit report
              </button>

              <p className="text-xs text-slate-500">
                Duplicate reports within ~250m auto-cluster into one incident.
              </p>
            </div>
          )}
        </div>

        <LocationPicker
          value={form.location}
          onChange={(loc) => setForm((p) => ({ ...p, location: { ...p.location, ...loc } }))}
        />
      </section>

      {/* List */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top incidents</h2>
          <span className="text-xs text-slate-500">
            {loading ? "Loading..." : `${filtered.length} items`}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                <div className="h-3 w-1/2 bg-slate-200 rounded mt-3"></div>
                <div className="h-3 w-2/3 bg-slate-200 rounded mt-3"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="font-medium">No incidents yet.</p>
            <p className="text-sm text-slate-600 mt-1">Create the first report or reset filters.</p>
          </div>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((i) => (
              <Link
                key={i.id}
                to={`/incident/${i.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm
                hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-snug group-hover:underline">{i.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{i.category}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50">
                    {i.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span>Cred: <b className="text-slate-900">{i.credibilityScore}</b></span>
                  <span>Sev: <b className="text-slate-900">{i.severityScore}</b></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
