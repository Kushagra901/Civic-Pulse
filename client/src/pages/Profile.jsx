import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

const TIER_STYLES = {
  purple: 'bg-purple-100 text-purple-800',
  blue:   'bg-blue-100 text-blue-800',
  teal:   'bg-teal-100 text-teal-800',
  amber:  'bg-amber-100 text-amber-800',
  gray:   'bg-gray-100 text-gray-600',
};

const STATUS_STYLES = {
  REPORTED:    'bg-gray-100 text-gray-600',
  TRIAGED:     'bg-yellow-100 text-yellow-800',
  ASSIGNED:    'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  RESOLVED:    'bg-green-100 text-green-800',
  VERIFIED:    'bg-emerald-100 text-emerald-800',
  CLOSED:      'bg-slate-100 text-slate-600',
};

export default function Profile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/users/${userId}`)
      .then(setData)
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <ProfileSkeleton />;
  if (error)   return <p className="text-center text-red-500 mt-20">{error}</p>;

  const { user, stats, recentReports } = data;
  const tier = user.tier;
  const tierStyle = TIER_STYLES[tier.color];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-start gap-5">
        <Avatar name={user.name} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-medium text-gray-900 truncate">{user.name}</h1>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tierStyle}`}>
              {tier.label}
            </span>
          </div>
          {user.email && (
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long'
            })}
          </p>
        </div>

        {/* Trust score badge */}
        <div className="text-center flex-shrink-0">
          <TrustMeter score={user.trustScore} max={150} />
          <p className="text-xs text-gray-400 mt-1">trust score</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Reports filed"    value={stats.totalReports} />
        <StatCard label="Resolved"         value={stats.resolvedReports} highlight />
        <StatCard label="Confirmations"    value={stats.totalConfirmations} />
        <StatCard label="Resolution rate"  value={`${stats.resolutionRate}%`} />
      </div>

      {/* Recent activity */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-medium text-gray-700">Recent reports</h2>
        </div>

        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No reports yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentReports.map(({ id, createdAt, incident }) => (
              <li key={id}>
                <Link
                  to={`/incident/${incident.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <CategoryIcon category={incident.category} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {incident.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(createdAt).toLocaleDateString('en-IN')}
                      {' · '}
                      credibility {Math.round(incident.credibilityScore)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0
                    ${STATUS_STYLES[incident.status]}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function Avatar({ name, size = 44 }) {
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-blue-100 text-blue-800 font-medium
                 flex items-center justify-center flex-shrink-0"
    >
      {initials}
    </div>
  );
}

function TrustMeter({ score, max }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  // Arc from 210° to 330° (120° sweep)
  const r = 28, cx = 36, cy = 36;
  const toRad = d => (d * Math.PI) / 180;
  const arcX = (deg) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg) => cy + r * Math.sin(toRad(deg));

  const startDeg = 150, endDeg = 30;  // 240° sweep going clockwise
  const sweepDeg = (360 - 150 + 30);  // = 240
  const filledDeg = startDeg + (sweepDeg * pct) / 100;

  const bgPath = `M ${arcX(startDeg)} ${arcY(startDeg)}
    A ${r} ${r} 0 1 1 ${arcX(endDeg)} ${arcY(endDeg)}`;
  const fgPath = `M ${arcX(startDeg)} ${arcY(startDeg)}
    A ${r} ${r} 0 ${filledDeg - startDeg > 180 ? 1 : 0} 1
    ${arcX(filledDeg)} ${arcY(filledDeg)}`;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <path d={bgPath} fill="none" stroke="#e5e7eb" strokeWidth="5"
            strokeLinecap="round" />
      <path d={fgPath} fill="none" stroke="#3b82f6" strokeWidth="5"
            strokeLinecap="round" />
      <text x="36" y="38" textAnchor="middle" fontSize="13"
            fontWeight="500" fill="#1e3a5f">{score}</text>
    </svg>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-4 text-center
      ${highlight ? 'bg-green-50' : 'bg-gray-50'}`}>
      <p className={`text-2xl font-medium
        ${highlight ? 'text-green-700' : 'text-gray-800'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

const CATEGORY_ICONS = {
  WATER:       '💧',
  ELECTRICITY: '⚡',
  ROAD:        '🛣️',
  SAFETY:      '🚨',
  SANITATION:  '🗑️',
};

function CategoryIcon({ category }) {
  return (
    <span className="text-lg w-7 text-center flex-shrink-0" role="img"
          aria-label={category}>
      {CATEGORY_ICONS[category] || '📍'}
    </span>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="bg-gray-100 rounded-2xl h-28" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-gray-100 rounded-2xl h-48" />
    </div>
  );
}
