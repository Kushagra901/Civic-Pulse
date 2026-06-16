import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate }      from 'react-router-dom';
import { useLeafletMap }    from '../hooks/useLeafletMap';
import { api }              from '../api';
import { useError }         from '../context/ErrorContext';

const CATEGORIES = ['WATER', 'ELECTRICITY', 'ROAD', 'SAFETY', 'SANITATION'];

const CATEGORY_EMOJI = {
  WATER: '💧',
  ELECTRICITY: '⚡',
  ROAD: '🛣️',
  SAFETY: '🚨',
  SANITATION: '🗑️',
};

export default function MapView() {
  const containerRef = useRef(null);
  const navigate     = useNavigate();
  const { showError } = useError();

  const [mode,     setMode]     = useState('cluster');  // 'cluster' | 'heat'
  const [category, setCategory] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [count,    setCount]    = useState(0);

  // Viewport state — updated when the user pans/zooms
  const [viewport, setViewport] = useState({ bbox: null, zoom: 12 });

  // Debounce viewport changes — don't fetch on every pixel of a pan
  const viewportTimerRef = useRef(null);
  const handleMapMove    = useCallback((vp) => {
    clearTimeout(viewportTimerRef.current);
    viewportTimerRef.current = setTimeout(() => setViewport(vp), 400);
  }, []);

  const { setHeatmapData, setClusterData } = useLeafletMap(containerRef, {
    center:    [28.6139, 77.2090],   // New Delhi centroid
    zoom:      12,
    onMapMove: handleMapMove,
  });

  // ── Fetch and render heatmap ────────────────────────────────

  const loadHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ minScore: '1' });
      if (category)       params.set('category', category);
      if (viewport.bbox)  params.set('bbox', viewport.bbox);

      const data = await api.get(`/incidents/heatmap?${params}`);
      setHeatmapData(data.points);
      setCount(data.count);
    } catch (err) {
      showError('Failed to load heatmap data.');
    } finally {
      setLoading(false);
    }
  }, [category, viewport.bbox, setHeatmapData, showError]);

  // ── Fetch and render cluster markers ───────────────────────

  const loadClusters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (category)       params.set('category', category);
      if (viewport.bbox)  params.set('bbox', viewport.bbox);

      const data = await api.get(`/incidents?${params}`);

      // Extract lat/lng from the reports of each incident
      const withCoords = data.incidents.map(inc => ({
        ...inc,
        lat: inc.reports?.[0]?.lat,
        lng: inc.reports?.[0]?.lng,
      })).filter(inc => inc.lat && inc.lng);

      setClusterData(withCoords, (inc) => navigate(`/incident/${inc.id}`));
      setCount(withCoords.length);
    } catch (err) {
      showError('Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  }, [category, viewport.bbox, setClusterData, navigate, showError]);

  // ── Reload data when mode, category, or viewport changes ───

  useEffect(() => {
    if (mode === 'heat')    loadHeatmap();
    if (mode === 'cluster') loadClusters();
  }, [mode, category, viewport.bbox, loadHeatmap, loadClusters]);

  // ── Category legend for heatmap ─────────────────────────────

  const heatLegend = [
    { color: '#3b82f6', label: 'Low'      },
    { color: '#22c55e', label: 'Moderate' },
    { color: '#eab308', label: 'High'     },
    { color: '#f97316', label: 'Severe'   },
    { color: '#ef4444', label: 'Critical' },
  ];

  return (
    <div className="flex flex-col h-[650px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/80 shadow-md">

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white
                      border-b border-slate-200/80 flex-wrap z-10 shadow-sm">

        {/* Mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[
            { key: 'cluster', label: '📍 Incidents' },
            { key: 'heat',    label: '🔥 Heatmap'   },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setMode(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all
                ${mode === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
          ))}
        </select>

        {/* Count + loading */}
        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <div className="w-4 h-4 border-2 border-slate-900
                            border-t-transparent rounded-full animate-spin" />
          )}
          {!loading && (
            <span className="text-xs text-slate-400 font-medium">
              {count} {mode === 'heat' ? 'incidents' : 'markers'}
            </span>
          )}
        </div>
      </div>

      {/* Map container */}
      <div className="relative flex-1">
        <div ref={containerRef} className="w-full h-full z-0" />

        {/* Heatmap legend — only shown in heat mode */}
        {mode === 'heat' && (
          <div className="absolute bottom-6 right-4 bg-white/90 backdrop-blur-sm
                          border border-slate-200/85 rounded-xl px-3 py-2.5
                          shadow-md z-[1000]">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Severity
            </p>
            <div className="flex items-center gap-1.5 mb-1">
              {heatLegend.map(({ color }) => (
                <div key={color}
                  style={{ background: color }}
                  className="w-6 h-2 rounded-sm"
                />
              ))}
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Low</span>
              <span className="text-[10px] text-slate-400 font-medium">Critical</span>
            </div>
          </div>
        )}

        {/* Cluster legend — only in cluster mode */}
        {mode === 'cluster' && (
          <div className="absolute bottom-6 left-4 bg-white/90 backdrop-blur-sm
                          border border-slate-200/85 rounded-xl px-3 py-2.5
                          shadow-md z-[1000]">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Category
            </p>
            {[
              { cat: 'WATER',       color: '#3b82f6' },
              { cat: 'ELECTRICITY', color: '#eab308' },
              { cat: 'ROAD',        color: '#94a3b8' },
              { cat: 'SAFETY',      color: '#ef4444' },
              { cat: 'SANITATION',  color: '#22c55e' },
            ].map(({ cat, color }) => (
              <div key={cat} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <div style={{ background: color }}
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" />
                <span className="text-[11px] font-medium text-slate-600">{cat}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
