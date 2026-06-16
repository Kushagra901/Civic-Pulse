import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate }    from 'react-router-dom';
import toast                    from 'react-hot-toast';
import { api, tokenStore }      from '../api.js';
import LocationPicker           from '../components/LocationPicker.jsx';
import PhotoUploader             from '../components/PhotoUploader.jsx';
import { SearchBar }            from '../components/SearchBar.jsx';
import { useIncidentSearch }    from '../hooks/useIncidentSearch.js';
import { useLeafletMap }        from '../hooks/useLeafletMap.js';
import { EmptyState }           from '../components/EmptyState.jsx';
import { IncidentCardSkeleton } from '../components/Skeletons.jsx';

const STATUS_STYLES = {
  REPORTED:    'bg-slate-100 text-slate-600 border-slate-200/50',
  TRIAGED:     'bg-amber-100 text-amber-700 border-amber-200/50',
  ASSIGNED:    'bg-blue-100 text-blue-700 border-blue-200/50',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200/50',
  RESOLVED:    'bg-green-100 text-green-700 border-green-200/50',
  VERIFIED:    'bg-emerald-100 text-emerald-700 border-emerald-200/50',
  CLOSED:      'bg-slate-100 text-slate-500 border-slate-200/50',
};

const CATEGORY_EMOJI = {
  WATER:'💧', ELECTRICITY:'⚡', ROAD:'🛣️', SAFETY:'🚨', SANITATION:'🗑️', OTHER: '📍'
};

const categories = ["ROAD", "WATER", "ELECTRICITY", "SAFETY", "SANITATION", "OTHER"];

export default function Feed() {
  const navigate  = useNavigate();
  const [view,    setView]    = useState('list');  // 'list' | 'map'
  const [filters, setFilters] = useState({
    q:        '',
    category: '',
    status:   '',
    sortBy:   'recent',
  });

  // Map viewport bbox — set when user pans the map
  const [bbox, setBbox] = useState(null);

  const {
    incidents, loading, loadingMore,
    hasNextPage, error, fetchMore, refresh
  } = useIncidentSearch({ ...filters, bbox });

  const [form, setForm] = useState({
    title: "",
    category: "ROAD",
    description: "",
    location: { lat: 28.6139, lng: 77.209, label: "New Delhi (default)" },
    photoUrls: []
  });

  const loggedIn = Boolean(tokenStore.access);

  // ── Map setup ───────────────────────────────────────────────
  const mapContainerRef = useRef(null);
  const viewportTimer   = useRef(null);

  const handleMapMove = useCallback(({ bbox }) => {
    clearTimeout(viewportTimer.current);
    viewportTimer.current = setTimeout(() => setBbox(bbox), 400);
  }, []);

  const { setClusterData } = useLeafletMap(mapContainerRef, {
    center:    [28.6139, 77.2090],
    zoom:      12,
    onMapMove: handleMapMove,
  });

  // Re-render cluster markers whenever search results change
  useEffect(() => {
    if (view !== 'map') return;
    const withCoords = incidents
      .map(inc => ({
        ...inc,
        lat: inc.lat || inc.reports?.[0]?.lat,
        lng: inc.lng || inc.reports?.[0]?.lng,
      }))
      .filter(inc => inc.lat && inc.lng);

    setClusterData(withCoords, (inc) => navigate(`/incident/${inc.id}`));
  }, [incidents, view, setClusterData, navigate]);

  // Reset bbox when switching back to list view
  useEffect(() => {
    if (view === 'list') {
      setBbox(null);
    }
  }, [view]);

  // ── Infinite scroll sentinel ────────────────────────────────
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || view !== 'list') return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMore(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchMore, view]);

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
        photoUrls: form.photoUrls
      });
      toast.success("Report submitted!", { id: "submit" });
      setForm((p) => ({ ...p, title: "", description: "", photoUrls: [] }));
      await refresh();
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
            <p className="text-slate-500 mt-2 max-w-2xl font-medium">
              Report civic problems, confirm nearby incidents, and track resolution timelines with credibility-based ranking.
            </p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold
            border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm"
          >
            Refresh
          </button>
        </div>
      </section>

      {/* Create + Location Grid */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Report an issue</h2>
            <span className="text-xs text-slate-500 font-semibold">{loggedIn ? "Logged in" : "Login required"}</span>
          </div>

          {!loggedIn ? (
            <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 font-medium">
              Please login to create an incident.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Title</span>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                  focus:ring-2 focus:ring-slate-900/10 transition text-sm font-medium"
                  placeholder="e.g., Garbage overflow near hostel gate"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Category</span>
                <select
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 bg-white outline-none
                  focus:ring-2 focus:ring-slate-900/10 transition text-sm font-medium"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Description</span>
                <textarea
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none
                  focus:ring-2 focus:ring-slate-900/10 transition min-h-[120px] text-sm font-medium"
                  placeholder="Add details: where, since when, how severe."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Photos (optional)</span>
                <div className="mt-1">
                  <PhotoUploader
                    key={form.photoUrls.length === 0 ? 'reset' : 'active'}
                    onChange={(urls) => setForm((p) => ({ ...p, photoUrls: urls }))}
                  />
                </div>
              </label>

              <button
                onClick={submit}
                className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold shadow-sm
                hover:opacity-90 transition text-sm"
              >
                Submit report
              </button>

              <p className="text-xs text-slate-500 font-medium">
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

      {/* Incidents feed section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top incidents</h2>
          <span className="text-xs text-slate-500 font-semibold">
            {loading ? "Loading..." : `${incidents.length} items`}
          </span>
        </div>

        {/* Search Bar */}
        <SearchBar
          filters={filters}
          onChange={setFilters}
          resultCount={incidents.length}
          loading={loading}
        />

        {/* View Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 w-fit gap-1">
          {[
            { key: 'list', label: '☰ List' },
            { key: 'map',  label: '🗺 Map'  },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setView(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold
                transition-all
                ${view === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── List view ────────────────────────────────────── */}
        {view === 'list' && (
          <>
            {loading && (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <IncidentCardSkeleton key={idx} />
                ))}
              </div>
            )}

            {!loading && error && (
              <EmptyState preset="error" message={error} />
            )}

            {!loading && !error && incidents.length === 0 && (
              <EmptyState
                preset={filters.q ? 'search' : 'incidents'}
                action={filters.q || filters.category || filters.status
                  ? {
                      label:   'Clear all filters',
                      onClick: () => setFilters({
                        q: '', category: '', status: '', sortBy: 'recent',
                      }),
                    }
                  : undefined}
              />
            )}

            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {incidents.map(incident => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  highlight={filters.q}
                />
              ))}
            </div>

            {hasNextPage && !loading && (
              <div ref={sentinelRef} className="h-4 mt-6" aria-hidden="true" />
            )}

            {loadingMore && (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!hasNextPage && incidents.length > 0 && (
              <p className="text-xs text-slate-400 text-center py-6 mt-4 border-t border-slate-100 font-medium">
                All {incidents.length} results loaded
              </p>
            )}
          </>
        )}

        {/* ── Map view ─────────────────────────────────────── */}
        {view === 'map' && (
          <div className="relative rounded-2xl overflow-hidden border
                          border-slate-200 shadow-sm"
               style={{ height: '500px' }}>
            {/* Leaflet renders into this div */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Map overlay: loading indicator */}
            {loading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2
                              bg-white/95 backdrop-blur-sm border border-slate-200
                              rounded-xl px-3 py-2 z-[1000] flex items-center gap-2 shadow-sm">
                <div className="w-3.5 h-3.5 border-2 border-slate-900
                                border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-600 font-semibold font-sans">Loading…</span>
              </div>
            )}

            {/* Map overlay: result count */}
            {!loading && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm
                              border border-slate-200 rounded-xl px-3 py-1.5
                              z-[1000] shadow-sm">
                <span className="text-xs text-slate-600 font-semibold font-sans">
                  {incidents.filter(i => i.lat || i.reports?.[0]?.lat).length} mapped
                </span>
              </div>
            )}

            {/* Map legend */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm
                            border border-slate-200 rounded-xl px-3 py-2.5
                            z-[1000] text-xs shadow-md">
              <p className="font-semibold text-slate-700 mb-1.5 font-sans">Category</p>
              {[
                ['WATER',       '#3b82f6', '💧'],
                ['ELECTRICITY', '#eab308', '⚡'],
                ['ROAD',        '#94a3b8', '🛣️'],
                ['SAFETY',      '#ef4444', '🚨'],
                ['SANITATION',  '#22c55e', '🗑️'],
                ['OTHER',       '#64748b', '📍'],
              ].map(([cat, color, emoji]) => (
                <div key={cat} className="flex items-center gap-1.5 mb-1.5 last:mb-0">
                  <div style={{ background: color }}
                    className="w-2 h-2 rounded-full flex-shrink-0" />
                  <span className="text-slate-500 font-medium font-sans">
                    {emoji} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Incident card ──────────────────────────────────────────────

function IncidentCard({ incident, highlight }) {
  const photoUrl = incident.reports?.[0]?.photoUrls?.[0];
  const reporter = incident.reports?.[0]?.reportedBy;
  const age      = formatAge(incident.createdAt);
  const score    = Math.round(incident.credibilityScore);

  return (
    <Link to={`/incident/${incident.id}`}
      className="block bg-white border border-slate-200 rounded-2xl
                 overflow-hidden hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5
                 transition-all shadow-sm">
      <div className="flex flex-col h-full justify-between">
        <div className="flex gap-4 p-4">
          {/* Thumbnail */}
          <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden
                          bg-slate-100 flex items-center justify-center border border-slate-100">
            {photoUrl
              ? <img
                  src={photoUrl.replace('/upload/',
                    '/upload/w_112,h_112,c_fill,q_auto/')}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              : <span className="text-xl" role="img">
                  {CATEGORY_EMOJI[incident.category] || '📍'}
                </span>
            }
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-semibold text-slate-900 group-hover:underline leading-snug"
               dangerouslySetInnerHTML={{
                 __html: incident.titleHighlighted || incident.title,
               }}
            />
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {CATEGORY_EMOJI[incident.category] || '📍'} {incident.category}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
              ${STATUS_STYLES[incident.status] || 'bg-slate-100 text-slate-600 border-slate-200/50'}`}>
              {incident.status ? incident.status.replace('_', ' ') : 'REPORTED'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {incident._count?.reports ?? 1} report
              {(incident._count?.reports ?? 1) !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-medium">
            <span className="truncate max-w-[130px]">{reporter?.name || 'Anonymous'} · {age}</span>
            <CredBadge score={score} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function CredBadge({ score }) {
  const cls =
    score >= 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    score >= 5  ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-slate-50 text-slate-500 border-slate-100';
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
      flex-shrink-0 ${cls}`}>
      ⚡ {score}
    </span>
  );
}

function formatAge(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h    = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
