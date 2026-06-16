import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api.js";

export function useInfiniteIncidents(filters = {}) {
  const [incidents, setIncidents] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Stable ref for filters so fetchMore doesn't re-create on every render
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const buildParams = useCallback((cursor = null) => {
    const p = new URLSearchParams();
    const f = filtersRef.current;

    if (f.status) p.set("status", f.status);
    if (f.category) p.set("category", f.category);
    if (f.near) p.set("near", f.near);
    if (f.bbox) p.set("bbox", f.bbox);
    p.set("limit", "20");

    if (cursor) {
      p.set("cursor", cursor.cursor);
      p.set("cursorDate", cursor.cursorDate);
    }

    return p.toString();
  }, []);

  // Initial load — resets the list when filters change
  const fetchFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/incidents?${buildParams()}`);
      setIncidents(data.incidents || []);
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    } catch (e) {
      setError("Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Append next page — called by the IntersectionObserver
  const fetchMore = useCallback(async () => {
    if (!hasNextPage || loadingMore || !nextCursor) return;

    setLoadingMore(true);
    try {
      const data = await api.get(`/incidents?${buildParams(nextCursor)}`);
      setIncidents(prev => {
        // Deduplicate in case a race condition delivers an id twice
        const existingIds = new Set(prev.map(i => i.id));
        const fresh = (data.incidents || []).filter(i => !existingIds.has(i.id));
        return [...prev, ...fresh];
      });
      setNextCursor(data.nextCursor);
      setHasNextPage(data.hasNextPage);
    } catch (e) {
      setError("Failed to load more.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, nextCursor, buildParams]);

  // Reset + refetch whenever filters change
  useEffect(() => {
    setIncidents([]);
    setNextCursor(null);
    setHasNextPage(true);
    fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { incidents, loading, loadingMore, hasNextPage, error, fetchMore, refresh: fetchFirst };
}
