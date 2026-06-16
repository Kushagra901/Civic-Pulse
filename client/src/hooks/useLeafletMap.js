import { useEffect, useRef, useCallback } from 'react';

export function useLeafletMap(containerRef, options = {}) {
  const mapRef        = useRef(null);
  const heatLayerRef  = useRef(null);
  const clusterLayerRef = useRef(null);

  const {
    center    = [20.5937, 78.9629],   // Centroid
    zoom      = 12,
    onMapMove,                         // (bounds) => void
  } = options;

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const L   = window.L;
    if (!L) {
      console.warn("Leaflet library not found on window object.");
      return;
    }

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl:       true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom:     19,
    }).addTo(map);

    mapRef.current = map;

    // Notify parent when the viewport changes so it can refetch
    if (onMapMove) {
      const handler = () => {
        const b = map.getBounds();
        onMapMove({
          bbox: [
            b.getWest(), b.getSouth(),
            b.getEast(), b.getNorth(),
          ].map(n => n.toFixed(6)).join(','),
          zoom: map.getZoom(),
        });
      };
      map.on('moveend', handler);
      // Fire once on mount with initial bounds
      handler();
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Heatmap layer ─────────────────────────────────────────

  const setHeatmapData = useCallback((points) => {
    const L   = window.L;
    const map = mapRef.current;
    if (!map || !L || !L.heatLayer) return;

    // Remove existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!points || points.length === 0) return;

    // Adjust radius and blur by zoom level — at low zoom, spread
    // the heat wider so clusters are visible from far out
    const zoom   = map.getZoom();
    const radius = zoom < 10 ? 35 : zoom < 13 ? 25 : 15;
    const blur   = zoom < 10 ? 25 : zoom < 13 ? 18 : 12;

    heatLayerRef.current = L.heatLayer(points, {
      radius,
      blur,
      maxZoom:   18,
      max:       1.0,
      // Gradient: blue (very low) -> green -> yellow -> orange -> red (critical)
      gradient: {
        0.0:  '#3b82f6',   // blue   — very low
        0.25: '#22c55e',   // green  — low
        0.5:  '#eab308',   // yellow — medium
        0.75: '#f97316',   // orange — high
        1.0:  '#ef4444',   // red    — critical
      },
    }).addTo(map);
  }, []);

  // ── Marker cluster layer ──────────────────────────────────

  const setClusterData = useCallback((incidents, onMarkerClick) => {
    const L   = window.L;
    const map = mapRef.current;
    if (!map || !L) return;

    if (clusterLayerRef.current) {
      map.removeLayer(clusterLayerRef.current);
      clusterLayerRef.current = null;
    }

    if (!incidents || incidents.length === 0) return;

    const CATEGORY_COLORS = {
      WATER:       '#3b82f6',
      ELECTRICITY: '#eab308',
      ROAD:        '#94a3b8',
      SAFETY:      '#ef4444',
      SANITATION:  '#22c55e',
    };

    const group = L.markerClusterGroup({
      maxClusterRadius:       60,
      showCoverageOnHover:    false,
      zoomToBoundsOnClick:    true,
      spiderfyOnMaxZoom:      true,
      // Custom cluster icon showing incident count
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size  = count < 10 ? 32 : count < 50 ? 40 : 48;
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:rgba(59,130,246,0.85);
            border:2px solid white;
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:${size < 40 ? 12 : 14}px;font-weight:500;
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
          ">${count}</div>`,
          className: '',
          iconSize:  [size, size],
        });
      },
    });

    incidents.forEach(incident => {
      if (!incident.lat || !incident.lng) return;

      const color = CATEGORY_COLORS[incident.category] || '#64748b';
      const score = Math.round(incident.credibilityScore);

      const icon = L.divIcon({
        html: `<div style="
          width:28px;height:28px;
          background:${color};
          border:2px solid white;
          border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:11px;font-weight:500;
          box-shadow:0 2px 6px rgba(0,0,0,0.25);
        ">${score}</div>`,
        className: '',
        iconSize:  [28, 28],
        iconAnchor:[14, 14],
      });

      const marker = L.marker([incident.lat, incident.lng], { icon });

      marker.bindPopup(`
        <div style="min-width:180px;padding:4px 0">
          <p style="font-weight:500;font-size:13px;margin:0 0 4px">
            ${incident.title}
          </p>
          <p style="font-size:11px;color:#64748b;margin:0 0 8px">
            ${incident.category} · Score ${score}
          </p>
          <a href="/incident/${incident.id}"
             style="font-size:12px;color:#3b82f6;text-decoration:none">
            View details →
          </a>
        </div>
      `);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(incident));
      }

      group.addLayer(marker);
    });

    clusterLayerRef.current = group;
    map.addLayer(group);
  }, []);

  const flyTo = useCallback((lat, lng, zoom = 15) => {
    mapRef.current?.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, []);

  return {
    map:            mapRef,
    setHeatmapData,
    setClusterData,
    flyTo,
  };
}
