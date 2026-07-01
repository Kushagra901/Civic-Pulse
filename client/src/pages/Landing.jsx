import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate }           from 'react-router-dom';
import { api }                         from '../api';
import { useAuth }                     from '../auth.jsx';

// ── Constants ─────────────────────────────────────────────────

const CATEGORY_EMOJI = {
  WATER: '💧', ELECTRICITY: '⚡',
  ROAD: '🛣️', SAFETY: '🚨', SANITATION: '🗑️',
};

const STATUS_LABEL = {
  RESOLVED: 'Resolved', VERIFIED: 'Verified', CLOSED: 'Closed',
};

const HOW_IT_WORKS = [
  {
    step:  '01',
    title: 'Report an issue',
    body:  'Pin the exact location on a map, add a photo, and describe the problem. Takes under 60 seconds.',
    emoji: '📍',
  },
  {
    step:  '02',
    title: 'Community verifies',
    body:  'Neighbours nearby confirm the issue independently. Credibility scores separate real problems from noise automatically.',
    emoji: '✓',
  },
  {
    step:  '03',
    title: 'Track resolution',
    body:  'Every status change is public and timestamped. Resolution teams upload proof of fix. Nothing disappears quietly.',
    emoji: '📋',
  },
];

const TRUST_SIGNALS = [
  {
    icon:  '🔒',
    title: 'No anonymous spam',
    body:  'Every report is tied to a verified account. Repeat false reports lower your trust score automatically.',
  },
  {
    icon:  '📊',
    title: 'Evidence-based scoring',
    body:  'Issues are ranked by credibility signals — location clustering, independent confirmations, and photo evidence — not social likes.',
  },
  {
    icon:  '🔍',
    title: 'Immutable audit trail',
    body:  'Every status change, assignment, and resolution is permanently logged with who did it and when.',
  },
  {
    icon:  '🏙️',
    title: 'Built for any community',
    body:  'Deploy for a city ward, campus, housing society, or hostel. Works at any scale.',
  },
];

// ── Main component ────────────────────────────────────────────

export default function Landing() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // Redirect authenticated users straight to the feed
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const [stats,        setStats]        = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api.get('/incidents/stats/public')
      .then(setStats)
      .catch((err) => console.error('Failed to load stats:', err))   // stats failing should never break the landing page
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 h-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <span className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-md shadow-blue-500/10">
              <span className="text-sm font-extrabold">CP</span>
            </div>
            <span>Civic<span className="text-blue-600">Pulse</span></span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors px-3.5 py-2 font-semibold">
              Sign in
            </Link>
            <Link to="/register"
              className="text-xs bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-500/10 hover:scale-[1.02]">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero copy */}
          <div className="lg:col-span-7 space-y-6">
            {/* Social proof pill */}
            {stats && stats.resolvedIncidents > 0 && (
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {stats.resolvedIncidents} local issues resolved in your community
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08] font-display">
              Local problems,
              <br />
              <span className="text-signal bg-gradient-to-r from-signal to-blue-600 bg-clip-text text-transparent">publicly accountable.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl font-medium">
              CivicPulse turns scattered complaints into verified, prioritized incidents. We build trust through location verification, community signal matching, and a public audit trail that holds everyone accountable.
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-accent text-slate-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-accent-hover active:scale-[0.98] transition-all shadow-md shadow-accent/15 hover:scale-[1.02]">
                Report an issue
                <span aria-hidden="true">→</span>
              </Link>
              <Link to="/map"
                className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition-all hover:border-slate-350 dark:hover:border-slate-750">
                View live map
              </Link>
            </div>

            {/* Trust Copy */}
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-3">
              <span className="flex items-center gap-1">🛡️ No anonymous spam</span>
              <span>•</span>
              <span className="flex items-center gap-1">📍 GPS-verified signals</span>
            </div>
          </div>

          {/* Right Column: Premium Smart City Dashboard / Map mockup */}
          <div className="lg:col-span-5">
            <div className="relative bg-white border border-slate-100 rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in duration-700">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest">Central Triage Monitor</span>
                </div>
                <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">DELHI ZONE II</span>
              </div>
              
              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-2xl font-extrabold text-slate-900 font-display">94.8%</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Resolution Rate</p>
                </div>
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
                  <span className="text-2xl font-extrabold text-slate-900 font-display">12.5h</span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Avg Triage Speed</p>
                </div>
              </div>
              
              {/* Recent resolved signal */}
              <div className="border border-slate-100 rounded-xl p-3.5 space-y-2 bg-gradient-to-tr from-slate-50/30 to-white">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">✓ RESOLVED IN WARD 12</span>
                  <span className="text-[9px] font-semibold text-slate-400">12m ago</span>
                </div>
                <p className="text-xs font-bold text-slate-800">⚡ Damaged streetlight line reported & repaired at Rajpath crossing.</p>
              </div>
              
              {/* Interactive map card */}
              <div className="h-36 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-hatch opacity-40"></div>
                {/* Mock grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                  <div className="h-px bg-slate-500 w-full"></div>
                  <div className="h-px bg-slate-500 w-full"></div>
                  <div className="h-px bg-slate-500 w-full"></div>
                </div>
                <div className="absolute inset-0 flex justify-between opacity-5">
                  <div className="w-px bg-slate-500 h-full"></div>
                  <div className="w-px bg-slate-500 h-full"></div>
                  <div className="w-px bg-slate-500 h-full"></div>
                </div>
                
                {/* Pins */}
                <span className="absolute top-1/4 left-1/4 text-xl animate-bounce duration-1000">💧</span>
                <span className="absolute bottom-1/4 right-1/4 text-xl animate-pulse">🛣️</span>
                <span className="absolute top-1/2 right-1/3 text-lg opacity-30">🚨</span>
                
                <div className="absolute bottom-3 bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-xl py-1.5 px-3 shadow-md text-[10px] font-extrabold text-slate-700 flex items-center gap-1.5 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  <span>📍 Real-time Incident Heatmap Layer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live stats ticker ─────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-white/70 backdrop-blur-sm shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {statsLoading
            ? <StatsSkeleton />
            : stats
              ? <StatsRow stats={stats} />
              : null
          }
        </div>
      </section>

      {/* ── Recently resolved — proof that it works ────────────── */}
      {stats?.recentlyResolved?.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 animate-in fade-in duration-300">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">
                Proof of Impact
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                Recently resolved reports
              </h2>
            </div>
            <Link to="/map"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors hidden sm:block border-b border-blue-200 hover:border-blue-600 pb-0.5">
              Explore Ward Map →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.recentlyResolved.map(incident => (
              <ResolvedCard key={incident.id} incident={incident} />
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2.5">
              Resolution Pipeline
            </p>
            <h2 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Community Reporting in 3 Steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step}
                className="relative bg-white rounded-2xl p-7 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between">
                {/* Connector line between steps — desktop only */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-4 w-8 h-px bg-slate-200 z-10" />
                )}
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-6 border border-blue-100/50">
                    {item.emoji}
                  </div>
                  <p className="text-xs font-mono text-slate-400 mb-1.5 font-bold">
                    STEP {item.step}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Built for integrity
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            Designed to prevent platform abuse
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto font-semibold leading-relaxed">
            Most reporting tools become dump yards of fake reports. CivicPulse rewards legitimate reporters, uses verified signal clusters, and assigns dynamic trust scoring.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {TRUST_SIGNALS.map(signal => (
            <div key={signal.title}
              className="flex gap-5 p-6 rounded-2xl bg-white border border-slate-100 shadow-card">
              <span className="text-3xl flex-shrink-0 mt-0.5" role="img">
                {signal.icon}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  {signal.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {signal.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────── */}
      <section className="bg-slate-900 relative overflow-hidden rounded-3xl max-w-6xl mx-auto my-6 px-6 py-16 text-center shadow-lg">
        <div className="absolute inset-0 bg-hatch opacity-[0.03]"></div>
        <div className="relative z-10 max-w-2xl mx-auto space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white font-display tracking-tight">
              Works at any structural scale
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-semibold">
              Deployable in minutes for city administrations, academic campuses, residential complexes, and public entities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: '🏙️', label: 'Municipal Wards' },
              { emoji: '🎓', label: 'College Campuses' },
              { emoji: '🏘️', label: 'Housing Societies' },
              { emoji: '🏨', label: 'Public Institutions' },
            ].map(({ emoji, label }) => (
              <div key={label}
                className="bg-slate-800/40 border border-slate-800 rounded-2xl px-4 py-5 text-center transition-all hover:bg-slate-800/60">
                <span className="text-3xl block mb-3.5" role="img">
                  {emoji}
                </span>
                <p className="text-xs font-bold text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
          Explore local transparency today
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto font-semibold leading-relaxed">
          Browse the active map and check local ward health statistics. Join verification drives or submit complaints by creating a profile.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5 pt-2">
          <Link to="/map"
            className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all hover:border-slate-300">
            🗺 View live map
          </Link>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 hover:scale-[1.02]">
            Create free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600 text-white grid place-items-center shadow-sm text-xs font-extrabold">CP</div>
            CivicPulse
          </p>
          <p className="text-xs text-slate-400 font-medium max-w-md text-center md:text-left leading-relaxed">
            Empowering communities through credible data and public records audit trails. Optimized for Indian smart cities and local governance wards.
          </p>
          <div className="flex gap-6">
            {[
              { to: '/map',      label: 'Live map' },
              { to: '/register', label: 'Register'  },
              { to: '/login',    label: 'Sign in'  },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-xs text-slate-400 hover:text-slate-950 font-bold transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function StatsRow({ stats }) {
  const items = [
    {
      value: stats.totalIncidents.toLocaleString('en-IN'),
      label: 'Issues reported',
      color: 'text-gray-900',
    },
    {
      value: stats.resolvedIncidents.toLocaleString('en-IN'),
      label: 'Resolved',
      color: 'text-green-755',
    },
    {
      value: `${stats.resolutionRate}%`,
      label: 'Resolution rate',
      color: stats.resolutionRate >= 50 ? 'text-green-700' : 'text-amber-700',
    },
    {
      value: stats.totalUsers.toLocaleString('en-IN'),
      label: 'Active citizens',
      color: 'text-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
      {items.map(({ value, label, color }) => (
        <div key={label} className="text-center sm:text-left">
          <AnimatedCounter
            value={value}
            className={`text-3xl sm:text-4xl font-semibold ${color}`}
          />
          <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
        </div>
      ))}
    </div>
  );
}

function ResolvedCard({ incident }) {
  const photo    = incident.reports?.[0]?.photoUrls?.[0];
  const category = incident.category;
  const age      = formatAge(incident.createdAt);

  return (
    <Link to={`/incident/${incident.id}`}
      className="group block bg-white border border-gray-200 rounded-2xl
                 overflow-hidden hover:border-gray-300 hover:shadow-sm
                 transition-all shadow-sm">

      {/* Photo or category placeholder */}
      <div className="h-32 bg-gray-100 overflow-hidden relative">
        {photo
          ? <img
              src={photo.replace('/upload/',
                '/upload/w_600,h_256,c_fill,q_auto/')}
              alt=""
              className="w-full h-full object-cover
                         group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          : <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl" role="img" aria-label={category}>
                {CATEGORY_EMOJI[category] || '📍'}
              </span>
            </div>
        }
        {/* Resolved badge overlay */}
        <div className="absolute top-2.5 right-2.5">
          <span className="text-xs font-semibold bg-green-500 text-white
                           px-2 py-0.5 rounded-full">
            ✓ {STATUS_LABEL[incident.status] || 'Resolved'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-gray-950 line-clamp-2 mb-2">
          {incident.title}
        </p>
        <div className="flex items-center justify-between font-semibold">
          <span className="text-xs text-slate-500">
            {CATEGORY_EMOJI[category]} {category.charAt(0) +
              category.slice(1).toLowerCase()}
          </span>
          <span className="text-xs text-slate-400 font-medium">{age}</span>
        </div>
      </div>
    </Link>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-9 bg-gray-200 rounded-lg w-20 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

// Counts up to a number on mount — makes stats feel alive
function AnimatedCounter({ value, className }) {
  const [display, setDisplay] = useState('0');
  const ref                   = useRef(null);

  useEffect(() => {
    // If value contains non-numeric chars (like % or ,),
    // extract the numeric part, animate it, then reformat
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numeric)) { setDisplay(value); return; }

    const suffix   = value.replace(/[0-9,. ]/g, '');    // e.g. '%'
    const duration = 1200;
    const start    = performance.now();

    const tick = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(eased * numeric);
      setDisplay(current.toLocaleString('en-IN') + suffix);
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };

    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return <p className={className}>{display}</p>;
}

function formatAge(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h    = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  const d    = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
