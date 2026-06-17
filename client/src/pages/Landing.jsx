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
    <div className="min-h-screen bg-white">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md
                      border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14
                        flex items-center justify-between">
          <span className="font-semibold text-gray-900 text-base">
            Civic<span className="text-blue-600">Pulse</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm text-gray-500 hover:text-gray-800
                         transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link to="/register"
              className="text-sm bg-blue-600 text-white px-4 py-2
                         rounded-xl hover:bg-blue-700 transition-colors
                         font-semibold">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6
                          pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="max-w-2xl">

          {/* Social proof pill — shown once stats load */}
          {stats && stats.resolvedIncidents > 0 && (
            <div className="inline-flex items-center gap-2 bg-green-50
                            border border-green-200 text-green-800
                            text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500
                               animate-pulse" />
              {stats.resolvedIncidents} issues resolved in your community
            </div>
          )}

          <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900
                         leading-tight tracking-tight">
            Local problems,
            <br />
            <span className="text-blue-600">publicly accountable.</span>
          </h1>

          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-xl font-medium">
            CivicPulse turns scattered complaints into verified, prioritised
            incidents — with a public audit trail that holds everyone accountable
            from report to resolution.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register"
              className="inline-flex items-center gap-2 bg-blue-600 text-white
                         px-6 py-3 rounded-xl text-sm font-semibold
                         hover:bg-blue-700 active:scale-[0.98]
                         transition-all shadow-sm shadow-blue-600/20">
              Report an issue
              <span aria-hidden="true">→</span>
            </Link>
            <Link to="/map"
              className="inline-flex items-center gap-2 border border-gray-200
                         text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold
                         hover:bg-gray-50 active:scale-[0.98] transition-all">
              View live map
            </Link>
          </div>

          {/* Micro-copy below CTA */}
          <p className="mt-3 text-xs text-gray-400 font-semibold">
            Free to use. No app download required.
          </p>
        </div>
      </section>

      {/* ── Live stats ticker ─────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 animate-in fade-in duration-300">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase
                            tracking-wider mb-1">
                Proof it works
              </p>
              <h2 className="text-2xl font-semibold text-gray-900">
                Recently resolved
              </h2>
            </div>
            <Link to="/map"
              className="text-sm text-blue-600 hover:text-blue-700
                         transition-colors hidden sm:block font-semibold">
              View live map →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentlyResolved.map(incident => (
              <ResolvedCard key={incident.id} incident={incident} />
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="bg-gray-50/60 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-blue-600 uppercase
                          tracking-wider mb-2">
              Process
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              How CivicPulse works
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step}
                className="relative bg-white rounded-2xl p-6
                           border border-gray-200 shadow-sm">
                {/* Connector line between steps — desktop only */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute top-10
                                  -right-4 w-8 h-px bg-gray-200 z-10" />
                )}
                <div className="w-10 h-10 rounded-xl bg-blue-50
                                flex items-center justify-center
                                text-xl mb-4">
                  {item.emoji}
                </div>
                <p className="text-xs font-mono text-gray-400 mb-1 font-semibold">
                  {item.step}
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust signals ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-blue-600 uppercase
                        tracking-wider mb-2">
            Why it's different
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            Designed to prevent abuse
          </h2>
          <p className="mt-3 text-gray-500 text-sm max-w-lg mx-auto font-medium">
            Most reporting tools become spam dumps. CivicPulse is built
            from the ground up to reward legitimate reporters and
            surface real problems.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {TRUST_SIGNALS.map(signal => (
            <div key={signal.title}
              className="flex gap-4 p-5 rounded-2xl bg-gray-50
                         border border-gray-200">
              <span className="text-2xl flex-shrink-0 mt-0.5" role="img">
                {signal.icon}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {signal.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  {signal.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use cases ─────────────────────────────────────────── */}
      <section className="bg-blue-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-white">
              Works for any community
            </h2>
            <p className="mt-2 text-blue-200 text-sm font-medium">
              Deploy in minutes. No infrastructure setup required.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: '🏙️', label: 'City wards'         },
              { emoji: '🎓', label: 'College campuses'    },
              { emoji: '🏘️', label: 'Housing societies'   },
              { emoji: '🏨', label: 'Hostel management'   },
            ].map(({ emoji, label }) => (
              <div key={label}
                className="bg-blue-500/40 border border-blue-400/40
                           rounded-2xl px-4 py-5 text-center">
                <span className="text-3xl block mb-2" role="img">
                  {emoji}
                </span>
                <p className="text-sm font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold text-gray-900 mb-4">
          See what's happening near you
        </h2>
        <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto font-medium">
          Browse the live incident map without an account.
          Create one to file reports and track resolutions.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/map"
            className="inline-flex items-center gap-2 border border-gray-200
                       text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold
                       hover:bg-gray-50 transition-all">
            🗺 View live map
          </Link>
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-blue-600 text-white
                       px-6 py-3 rounded-xl text-sm font-semibold
                       hover:bg-blue-700 transition-all
                       shadow-sm shadow-blue-600/20">
            Create free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8
                        flex flex-col sm:flex-row items-center
                        justify-between gap-4">
          <p className="text-sm font-bold text-gray-900">
            Civic<span className="text-blue-600">Pulse</span>
          </p>
          <p className="text-xs text-gray-400 text-center font-medium">
            Built for communities that deserve better infrastructure.
          </p>
          <div className="flex gap-5">
            {[
              { to: '/map',      label: 'Live map' },
              { to: '/register', label: 'Sign up'  },
              { to: '/login',    label: 'Sign in'  },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-xs text-gray-400 hover:text-gray-600
                           transition-colors font-semibold">
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
  const age      = formatAge(incident.updatedAt);

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
