import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

// ── Constants ────────────────────────────────────────────────

const STATUS_ORDER = [
  'REPORTED', 'TRIAGED', 'ASSIGNED',
  'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED',
];

const STATUS_STYLES = {
  REPORTED:    'bg-gray-100 text-gray-600',
  TRIAGED:     'bg-yellow-100 text-yellow-800',
  ASSIGNED:    'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  RESOLVED:    'bg-green-100 text-green-700',
  VERIFIED:    'bg-emerald-100 text-emerald-700',
  CLOSED:      'bg-slate-100 text-slate-500',
};

const CATEGORY_LABELS = {
  WATER: 'Water', ELECTRICITY: 'Electricity',
  ROAD: 'Road', SAFETY: 'Safety', SANITATION: 'Sanitation',
};

const TEAMS = [
  'Water Dept', 'Electrical Dept', 'Roads Dept',
  'Safety Team', 'Sanitation Dept', 'General Maintenance',
];

// ── Main dashboard ────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab,      setTab]      = useState('queue');   // queue | metrics
  const [metrics,  setMetrics]  = useState(null);
  const [queue,    setQueue]    = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters,  setFilters]  = useState({ status: '', category: '', page: 1 });
  const [loading,  setLoading]  = useState(true);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:  filters.page,
        limit: 20,
        ...(filters.status   && { status:   filters.status }),
        ...(filters.category && { category: filters.category }),
      });
      const data = await api.get(`/admin/queue?${params}`);
      setQueue(data.incidents || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await api.get('/admin/metrics');
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchQueue();  }, [fetchQueue]);
  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              Admin dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Moderate incidents and manage platform health
            </p>
          </div>
          <div className="flex gap-2">
            {['queue', 'metrics'].map(t => (
              <button key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${tab === t
                    ? 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t === 'queue' ? 'Triage queue' : 'Metrics'}
              </button>
            ))}
          </div>
        </div>

        {tab === 'metrics' && metrics && (
          <MetricsPanel metrics={metrics} />
        )}

        {tab === 'queue' && (
          <TriageQueue
            queue={queue}
            pagination={pagination}
            filters={filters}
            loading={loading}
            onFilterChange={(f) => setFilters({ ...f, page: 1 })}
            onPageChange={(page) => setFilters(f => ({ ...f, page }))}
            onRefresh={fetchQueue}
          />
        )}
      </div>
    </div>
  );
}

// ── Metrics panel ─────────────────────────────────────────────

function MetricsPanel({ metrics }) {
  const { overview, byCategory, byStatus } = metrics;

  const maxCat = Math.max(...(byCategory || []).map(c => c.count), 1);

  return (
    <div className="space-y-5">

      {/* Overview stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total incidents"  value={overview.totalIncidents} />
        <StatCard label="Open"             value={overview.openIncidents}
                  variant="warning" />
        <StatCard label="Resolved (7d)"    value={overview.resolvedLast7d}
                  variant="success" />
        <StatCard label="New (24h)"        value={overview.newLast24h} />
        <StatCard label="Total users"      value={overview.totalUsers} />
        <StatCard label="New users (7d)"   value={overview.newUsersLast7d}
                  variant="info" />
        <StatCard label="Avg resolution"
                  value={overview.avgResolutionHours != null
                    ? `${overview.avgResolutionHours}h` : 'N/A'} />
      </div>

      {/* By category */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Incidents by category
        </h2>
        <div className="space-y-3">
          {byCategory?.map(({ category, count }) => (
            <div key={category} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">
                {CATEGORY_LABELS[category] || category}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(count / maxCat) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-8
                               text-right flex-shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* By status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Pipeline breakdown
        </h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map(status => {
            const found = byStatus?.find(s => s.status === status);
            const count = found?.count ?? 0;
            return (
              <div key={status}
                className={`px-3 py-2 rounded-xl text-center min-w-[80px]
                  ${STATUS_STYLES[status]}`}>
                <p className="text-lg font-medium">{count}</p>
                <p className="text-xs mt-0.5 opacity-75">
                  {status.replace('_', ' ')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Triage queue ──────────────────────────────────────────────

function TriageQueue({
  queue, pagination, filters, loading,
  onFilterChange, onPageChange, onRefresh,
}) {
  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4
                      flex flex-wrap gap-3 items-center">
        <select
          value={filters.status}
          onChange={e => onFilterChange({ ...filters, status: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2
                     text-gray-700 bg-white"
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={e => onFilterChange({ ...filters, category: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2
                     text-gray-700 bg-white"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <button onClick={onRefresh}
          className="ml-auto text-sm text-gray-500 hover:text-gray-700
                     px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          Refresh
        </button>
      </div>

      {/* Queue table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <QueueSkeleton />
        ) : queue.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-16">
            No incidents match these filters.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {queue.map(incident => (
              <IncidentRow
                key={incident.id}
                incident={incident}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3
                          border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
              {' · '}{pagination.total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                           disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200
                           disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single incident row with inline actions ───────────────────

function IncidentRow({ incident, onRefresh }) {
  const [expanded,    setExpanded]    = useState(false);
  const [assigning,   setAssigning]   = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [busy,        setBusy]        = useState(false);

  const reporter = incident.reports?.[0]?.reportedBy;
  const team     = incident.assignments?.[0]?.teamName;
  const age      = formatAge(incident.createdAt);

  const handleFlag = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/incidents/${incident.id}/flag`, {
        flag:   !incident.isFlagged,
        reason: 'Flagged via admin dashboard',
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async () => {
    setBusy(true);
    try {
      await api.post(`/admin/incidents/${incident.id}/assign`,
        { teamName: selectedTeam });
      setAssigning(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (status) => {
    setBusy(true);
    try {
      await api.patch(`/incidents/${incident.id}/status`, { status });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`transition-colors ${incident.isFlagged ? 'bg-red-50' : ''}`}>

      {/* Main row */}
      <div className="px-5 py-4 flex items-start gap-4">

        {/* Scores */}
        <div className="text-center flex-shrink-0 w-12">
          <p className="text-base font-medium text-gray-800">
            {Math.round(incident.credibilityScore)}
          </p>
          <p className="text-xs text-gray-400">cred</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/incident/${incident.id}`}
              className="text-sm font-medium text-gray-900 hover:text-blue-600
                         truncate transition-colors">
              {incident.title}
            </Link>
            {incident.isFlagged && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5
                               rounded-full flex-shrink-0">
                Flagged
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${STATUS_STYLES[incident.status]}`}>
              {incident.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-400">
              {CATEGORY_LABELS[incident.category]}
            </span>
            <span className="text-xs text-gray-400">
              {incident._count?.reports || 0} reports
              · {incident._count?.confirmations || 0} votes
            </span>
            {reporter && (
              <span className="text-xs text-gray-400">
                by{" "}
                <Link to={`/users/${reporter.id}`} className="font-semibold text-slate-700 hover:underline">
                  {reporter.name}
                </Link>
                {' '}(trust: {reporter.trustScore})
              </span>
            )}
            {team && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5
                               rounded-full">
                {team}
              </span>
            )}
            <span className="text-xs text-gray-400">{age}</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5
                       rounded-lg hover:bg-gray-100 transition-colors"
          >
            {expanded ? 'Close' : 'Actions'}
          </button>
        </div>
      </div>

      {/* Expanded actions panel */}
      {expanded && (
        <div className="px-5 pb-4 pt-0 flex flex-wrap gap-2 items-center
                        border-t border-gray-100 bg-gray-50/50">

          {/* Status transitions */}
          <div className="flex gap-1.5 flex-wrap">
            {nextStatuses(incident.status).map(s => (
              <button key={s}
                disabled={busy}
                onClick={() => handleStatusChange(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium
                  transition-colors disabled:opacity-50
                  ${STATUS_STYLES[s]} hover:opacity-80`}
              >
                → {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Assign team */}
          {assigning ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5
                           bg-white text-gray-700"
              >
                {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={handleAssign} disabled={busy}
                className="text-xs bg-blue-600 text-white px-3 py-1.5
                           rounded-lg hover:bg-blue-700 disabled:opacity-50
                           transition-colors">
                Confirm
              </button>
              <button onClick={() => setAssigning(false)}
                className="text-xs text-gray-400 hover:text-gray-600">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setAssigning(true)} disabled={busy}
              className="text-xs text-blue-600 hover:text-blue-700 px-3 py-1.5
                         rounded-lg hover:bg-blue-50 transition-colors">
              Assign team
            </button>
          )}

          {/* Flag toggle */}
          <button onClick={handleFlag} disabled={busy}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors
              disabled:opacity-50
              ${incident.isFlagged
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-gray-500 hover:bg-gray-100'
              }`}
          >
            {incident.isFlagged ? 'Unflag' : 'Flag'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, variant }) {
  const variants = {
    success: 'text-green-700',
    warning: 'text-amber-700',
    info:    'text-blue-700',
    default: 'text-gray-800',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className={`text-2xl font-medium ${variants[variant] || variants.default}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="px-5 py-4 flex gap-4">
          <div className="w-12 h-10 bg-gray-100 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function nextStatuses(current) {
  const map = {
    REPORTED:    ['TRIAGED', 'CLOSED'],
    TRIAGED:     ['ASSIGNED', 'CLOSED'],
    ASSIGNED:    ['IN_PROGRESS', 'CLOSED'],
    IN_PROGRESS: ['RESOLVED', 'CLOSED'],
    RESOLVED:    ['VERIFIED', 'CLOSED'],
    VERIFIED:    ['CLOSED'],
    CLOSED:      [],
  };
  return map[current] || [];
}

function formatAge(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
