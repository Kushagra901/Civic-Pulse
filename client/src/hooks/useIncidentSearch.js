import {
  useState, useEffect, useCallback,
  useRef, useReducer,
} from 'react';
import { api } from '../api';

const initialState = {
  incidents:   [],
  loading:     false,
  loadingMore: false,
  error:       null,
  nextCursor:  null,
  hasNextPage: false,
  total:       0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading:     false,
        incidents:   action.incidents,
        nextCursor:  action.nextCursor,
        hasNextPage: action.hasNextPage,
      };
    case 'FETCH_MORE_START':
      return { ...state, loadingMore: true };
    case 'FETCH_MORE_SUCCESS': {
      const existingIds = new Set(state.incidents.map(i => i.id));
      const fresh = action.incidents.filter(i => !existingIds.has(i.id));
      return {
        ...state,
        loadingMore: false,
        incidents:   [...state.incidents, ...fresh],
        nextCursor:  action.nextCursor,
        hasNextPage: action.hasNextPage,
      };
    }
    case 'FETCH_ERROR':
      return { ...state, loading: false, loadingMore: false,
               error: action.error };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function useIncidentSearch({
  q         = '',
  category  = '',
  status    = '',
  sortBy    = 'recent',
  minScore  = 0,
  bbox      = null,
  debounce  = 350,
} = {}) {
  const [state,    dispatch] = useReducer(reducer, initialState);
  const abortRef             = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Debounced query value — only updates after user stops typing
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), debounce);
    return () => clearTimeout(timer);
  }, [q, debounce]);

  const buildParams = useCallback((cursor = null) => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set('q',        debouncedQ);
    if (category)   p.set('category', category);
    if (status)     p.set('status',   status);
    if (sortBy)     p.set('sortBy',   sortBy);
    if (minScore)   p.set('minScore', String(minScore));
    if (bbox)       p.set('bbox',     bbox);
    p.set('limit', '20');
    if (cursor) {
      p.set('cursor',     cursor.cursor);
      p.set('cursorDate', cursor.cursorDate);
    }
    return p.toString();
  }, [debouncedQ, category, status, sortBy, minScore, bbox]);

  // Initial fetch — fires when any filter changes
  useEffect(() => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    dispatch({ type: 'FETCH_START' });

    const endpoint = '/incidents/search';

    api.get(`${endpoint}?${buildParams()}`, { signal: abortRef.current.signal })
      .then(data => dispatch({
        type:        'FETCH_SUCCESS',
        incidents:   data.incidents || [],
        nextCursor:  data.nextCursor,
        hasNextPage: data.hasNextPage || false,
      }))
      .catch(err => {
        if (err.name !== 'AbortError') {
          dispatch({ type: 'FETCH_ERROR', error: err.message });
        }
      });

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [buildParams, refreshTrigger]);

  const fetchMore = useCallback(async () => {
    if (!state.hasNextPage || state.loadingMore || !state.nextCursor) return;

    dispatch({ type: 'FETCH_MORE_START' });
    try {
      const data = await api.get(
        `/incidents/search?${buildParams(state.nextCursor)}`
      );
      dispatch({
        type:        'FETCH_MORE_SUCCESS',
        incidents:   data.incidents || [],
        nextCursor:  data.nextCursor,
        hasNextPage: data.hasNextPage || false,
      });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', error: err.message });
    }
  }, [state.hasNextPage, state.loadingMore, state.nextCursor, buildParams]);

  return { ...state, fetchMore, refresh };
}
