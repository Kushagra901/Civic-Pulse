import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { usePageMeta } from '../hooks/usePageMeta.js';


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

  const user = data?.user;

  usePageMeta(
    user ? `${user.name}'s Profile` : 'Loading Profile...',
    user ? `Civic reporting activity for ${user.name} on CivicPulse.` : 'View citizen trust rating, resolved reports, and community activity.'
  );

  if (loading) return <ProfileSkeleton />;
  if (error)   return <p className="text-center text-red-500 mt-20">{error}</p>;

  const { stats, recentReports } = data;
  const tier = user.tier;
  const tierStyle = TIER_STYLES[tier.color];

  const badges = [];
  if (stats.totalReports >= 1) {
    badges.push({ icon: '📢', title: 'First Alert', desc: 'Filed first civic report' });
  }
  if (stats.totalReports >= 5) {
    badges.push({ icon: '⚡', title: 'Sentinel Reporter', desc: 'Filed 5+ active reports' });
  }
  if (user.trustScore >= 50) {
    badges.push({ icon: '🛡️', title: 'Trusted Sentinel', desc: 'Trust score exceeded 50' });
  }
  if (stats.totalConfirmations >= 3) {
    badges.push({ icon: '📍', title: 'Local Guide', desc: 'Verified 3+ incidents nearby' });
  }
  if (badges.length === 0) {
    badges.push({ icon: '🌱', title: 'Civic Starter', desc: 'Profile verified & ready to report' });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-slate-100 pb-4">
        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Citizen Workspace</h1>
        <p className="text-xs text-slate-400 mt-1 font-semibold">Monitor contributions, achievements, and filed incidents</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column: Citizen Identity, Trust, and Badges (1 col) */}
        <div className="space-y-6">
          
          {/* Identity panel */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size={52} />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">{user.name}</h2>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${tierStyle}`}>
                  {tier.label}
                </span>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {new Date(user.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'short'
                  })}
                </p>
              </div>
              <div className="text-center">
                <TrustMeter score={user.trustScore} max={150} />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Trust Score</p>
              </div>
            </div>
          </div>

          {/* Badges Panel */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
              Civic Badges ({badges.length})
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {badges.map(b => (
                <div key={b.title} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 border border-slate-100">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{b.title}</p>
                    <p className="text-[9px] font-semibold text-slate-400 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Stats and Historical List (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Stats Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Reports Filed"    value={stats.totalReports} />
            <StatCard label="Resolved"         value={stats.resolvedReports} highlight />
            <StatCard label="Confirmations"    value={stats.totalConfirmations} />
            <StatCard label="Resolution Ratio"  value={`${stats.resolutionRate}%`} />
          </div>

          {/* Reports History */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Incident History</h3>
            </div>

            {recentReports.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 font-semibold">No reports filed yet. Use feed to start reporting.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentReports.map(({ id, createdAt, incident }) => (
                  <li key={id}>
                    <Link
                      to={`/incident/${incident.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <CategoryIcon category={incident.category} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {incident.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          Filed {new Date(createdAt).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                          {' · '}
                          Score Index: ⚡ {Math.round(incident.credibilityScore)}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 border uppercase tracking-wider
                        ${STATUS_STYLES[incident.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {incident.status.replace('_', ' ')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
      className="rounded-xl bg-blue-50 text-blue-600 font-extrabold border border-blue-100/50
                 flex items-center justify-center flex-shrink-0"
    >
      {initials}
    </div>
  );
}

function TrustMeter({ score, max }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  const r = 28, cx = 36, cy = 36;
  const toRad = d => (d * Math.PI) / 180;
  const arcX = (deg) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg) => cy + r * Math.sin(toRad(deg));

  const startDeg = 150, endDeg = 30;
  const sweepDeg = (360 - 150 + 30);
  const filledDeg = startDeg + (sweepDeg * pct) / 100;

  const bgPath = `M ${arcX(startDeg)} ${arcY(startDeg)}
    A ${r} ${r} 0 1 1 ${arcX(endDeg)} ${arcY(endDeg)}`;
  const fgPath = `M ${arcX(startDeg)} ${arcY(startDeg)}
    A ${r} ${r} 0 ${filledDeg - startDeg > 180 ? 1 : 0} 1
    ${arcX(filledDeg)} ${arcY(filledDeg)}`;

  return (
    <svg width="60" height="60" viewBox="0 0 72 72">
      <path d={bgPath} fill="none" stroke="#f1f5f9" strokeWidth="6"
            strokeLinecap="round" />
      <path d={fgPath} fill="none" stroke="#2563eb" strokeWidth="6"
            strokeLinecap="round" />
      <text x="36" y="42" textAnchor="middle" fontSize="15"
            fontWeight="800" fill="#0f172a">{score}</text>
    </svg>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border transition-all hover:shadow-sm
      ${highlight 
        ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' 
        : 'bg-white border-slate-200/60 text-slate-800'}`}>
      <p className={`text-2xl font-extrabold font-display leading-tight
        ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{label}</p>
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
    <span className="text-xl w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0" role="img"
          aria-label={category}>
      {CATEGORY_ICONS[category] || '📍'}
    </span>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6 animate-pulse">
      <div className="bg-slate-200 rounded-2xl h-28" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-slate-200 rounded-2xl h-48" />
    </div>
  );
}
