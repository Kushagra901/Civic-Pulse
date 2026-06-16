import { useRef, useEffect } from 'react';

const CATEGORIES = ['WATER','ELECTRICITY','ROAD','SAFETY','SANITATION'];
const STATUSES   = ['REPORTED','TRIAGED','ASSIGNED','IN_PROGRESS','RESOLVED'];
const SORT_OPTIONS = [
  { value: 'recent',   label: 'Most recent'  },
  { value: 'score',    label: 'Credibility'  },
  { value: 'severity', label: 'Severity'     },
];

const CATEGORY_EMOJI = {
  WATER:'💧', ELECTRICITY:'⚡', ROAD:'🛣️', SAFETY:'🚨', SANITATION:'🗑️',
};

export function SearchBar({ filters, onChange, resultCount, loading }) {
  const { q, category, status, sortBy } = filters;
  const inputRef = useRef(null);

  // Cmd/Ctrl+K focuses the search box
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const update = (key, value) => onChange({ ...filters, [key]: value });

  const hasActiveFilters = category || status || (sortBy && sortBy !== 'recent');

  return (
    <div className="space-y-3">

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center
                        pointer-events-none">
          {loading
            ? <div className="w-4 h-4 border-2 border-slate-900
                              border-t-transparent rounded-full animate-spin" />
            : <svg className="w-4 h-4 text-slate-400" fill="none"
                   viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
          }
        </div>

        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={e => update('q', e.target.value)}
          placeholder="Search incidents… (⌘K)"
          className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200
                     rounded-xl bg-white placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-slate-900/10
                     focus:border-slate-400 transition-all"
        />

        {q && (
          <button
            onClick={() => update('q', '')}
            className="absolute inset-y-0 right-3 flex items-center
                       text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={category}
          onChange={e => update('category', e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     bg-white text-slate-700 focus:outline-none
                     focus:ring-2 focus:ring-slate-900/10"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>
              {CATEGORY_EMOJI[c]} {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={e => update('status', e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     bg-white text-slate-700 focus:outline-none
                     focus:ring-2 focus:ring-slate-900/10"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={e => update('sortBy', e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2
                     bg-white text-slate-700 focus:outline-none
                     focus:ring-2 focus:ring-slate-900/10"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Clear all filters */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ q, category: '', status: '',
                                      sortBy: 'recent' })}
            className="text-xs text-slate-600 hover:text-slate-900
                       px-3 py-2 rounded-xl hover:bg-slate-50
                       transition-colors ml-auto font-medium"
          >
            Clear filters
          </button>
        )}

        {/* Result count */}
        {resultCount !== undefined && !loading && (
          <span className="text-xs text-slate-400 ml-auto font-medium">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap mt-1">
          {category && (
            <FilterChip
              label={`${CATEGORY_EMOJI[category]} ${category}`}
              onRemove={() => update('category', '')}
            />
          )}
          {status && (
            <FilterChip
              label={status.replace('_', ' ')}
              onRemove={() => update('status', '')}
            />
          )}
          {sortBy !== 'recent' && (
            <FilterChip
              label={`Sort: ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`}
              onRemove={() => update('sortBy', 'recent')}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium
                     bg-slate-50 text-slate-700 border border-slate-200/80
                     px-2.5 py-1 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-slate-900 transition-colors ml-0.5"
        aria-label="Remove filter"
      >
        ✕
      </button>
    </span>
  );
}
