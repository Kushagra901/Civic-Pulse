import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate }    from 'react-router-dom';
import toast                    from 'react-hot-toast';
import { api, tokenStore }      from '../api.js';
import { SearchBar }            from '../components/SearchBar.jsx';
import { useIncidentSearch }    from '../hooks/useIncidentSearch.js';
import { useLeafletMap }        from '../hooks/useLeafletMap.js';
import { EmptyState }           from '../components/EmptyState.jsx';
import { IncidentCardSkeleton } from '../components/Skeletons.jsx';

const STATUS_STYLES = {
  REPORTED:    'bg-slate-50 text-slate-600 border-slate-200',
  TRIAGED:     'bg-amber-50 text-amber-700 border-amber-200',
  ASSIGNED:    'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RESOLVED:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  VERIFIED:    'bg-teal-50 text-teal-700 border-teal-200',
  CLOSED:      'bg-slate-50 text-slate-500 border-slate-200',
};

const CATEGORY_EMOJI = {
  WATER:'💧', ELECTRICITY:'⚡', ROAD:'🛣️', SAFETY:'🚨', SANITATION:'🗑️', OTHER: '📍'
};

function usePullToRefresh(onRefresh) {
  const startYRef    = useRef(null);
  const [pulling,    setPulling]    = useState(false);
  const [pullDist,   setPullDist]   = useState(0);
  const THRESHOLD    = 80;   // px to pull before triggering

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startYRef.current === null) return;
    const dist = e.touches[0].clientY - startYRef.current;
    if (dist > 0 && dist < THRESHOLD * 1.5) {
      setPullDist(dist);
      setPulling(dist >= THRESHOLD);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pulling) onRefresh();
    startYRef.current = null;
    setPulling(false);
    setPullDist(0);
  }, [pulling, onRefresh]);

  return { onTouchStart, onTouchMove, onTouchEnd, pullDist, pulling };
}

export default function Feed() {
  const navigate  = useNavigate();
  const [view,    setView]    = useState('list');  // 'list' | 'map'
  const [filters, setFilters] = useState({
    q:        '',
    category: '',
    status:   '',
    sortBy:   'recent',
  });

  const [bbox, setBbox] = useState(null);

  const {
    incidents, loading, loadingMore,
    hasNextPage, error, fetchMore, refresh
  } = useIncidentSearch({ ...filters, bbox });

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

  useEffect(() => {
    if (view === 'list') {
      setBbox(null);
    }
  }, [view]);

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

  const { onTouchStart, onTouchMove, onTouchEnd, pullDist, pulling } = usePullToRefresh(refresh);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="space-y-6 min-h-[calc(100dvh-4rem)] pb-12"
    >
      {/* Pull indicator */}
      {pullDist > 10 && (
        <div className="flex justify-center py-2 transition-all"
             style={{ height: `${Math.min(pullDist * 0.5, 40)}px` }}>
          <div className={`w-6 h-6 border-2 border-blue-500 rounded-full
                           transition-transform
                           ${pulling
                             ? 'border-t-transparent animate-spin'
                             : ''}`}
               style={{ transform: `rotate(${pullDist * 2}deg)` }}
          />
        </div>
      )}

      {/* Hero / Header Page */}
      <section className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Ward Monitoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display">Grievances & Reports Feed</h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Verify local community signals, report street issues, and follow direct resolution pathways tracked by credibility rank.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold
              border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm text-slate-700"
            >
              🔄 Refresh Data
            </button>
            <Link
              to="/incidents/new"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold
              bg-blue-600 text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/10 hover:scale-[1.02]"
            >
              ➕ Report Issue
            </Link>
          </div>
        </div>
      </section>

      {/* Incidents feed section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Community Indicators</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">
              {loading ? "Syncing..." : `${incidents.length} incidents found`}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <SearchBar
          filters={filters}
          onChange={setFilters}
          resultCount={incidents.length}
          loading={loading}
        />

        {/* View Toggle */}
        <div className="segmented">
          {[
            { key: 'list', label: '☰ List View' },
            { key: 'map',  label: '🗺 Map View'  },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setView(key)}
              className={`segmented-btn ${view === key ? 'segmented-btn-active' : ''}`}
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
      className="incident-card">
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
