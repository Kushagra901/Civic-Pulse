import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { tokenStore } from '../api.js';
import NotificationBell from './NotificationBell.jsx';

// Icons as inline SVG — no icon library dependency
const Icons = {
  Feed: ({ active }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.8} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  ),
  Map: ({ active }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.8} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0
           01.553-.894L9 2l6 3 5.447-2.724A1 1 0 0121
           3.236v10.764a1 1 0 01-.553.894L15 17l-6 3z" />
    </svg>
  ),
  Report: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 4v16m8-8H4" />
    </svg>
  ),
  Profile: ({ active }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.8} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0
           00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Admin: ({ active }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={active ? 2.2 : 1.8} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35
           0a1.724 1.724 0 002.573 1.066c1.543-.94
           3.31.826 2.37 2.37a1.724 1.724 0 001.065
           2.572c1.756.426 1.756 2.924 0 3.35a1.724
           1.724 0 00-1.066 2.573c.94 1.543-.826 3.31
           -2.37 2.37a1.724 1.724 0 00-2.572 1.065c
           -.426 1.756-2.924 1.756-3.35 0a1.724 1.724
           0 00-2.573-1.066c-1.543.94-3.31-.826-2.37
           -2.37a1.724 1.724 0 00-1.065-2.572c-1.756
           -.426-1.756-2.924 0-3.35a1.724 1.724 0
           001.066-2.573c-.94-1.543.826-3.31 2.37-2.37
           .996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = React.useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [motionReduce, setMotionReduce] = React.useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  React.useEffect(() => {
    if (motionReduce) {
      document.documentElement.classList.add("motion-reduce");
    } else {
      document.documentElement.classList.remove("motion-reduce");
    }
  }, [motionReduce]);

  // Pages that use full-screen map should hide the top bar's shadow
  const isMapPage = location.pathname === '/map';

  const handleLogout = () => {
    tokenStore.clear();
    navigate('/login');
  };

  const isLanding = location.pathname === '/' && !user;
  if (isLanding) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">

      {/* ── Top bar (desktop + mobile) ─────────────────────── */}
      <header className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-100 dark:border-slate-800 backdrop-blur-md
                          ${isMapPage ? '' : 'shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg tracking-tight">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-md shadow-blue-500/10 transition-transform hover:scale-105">
              <span className="text-sm font-extrabold">CP</span>
            </div>
            <span>Civic<span className="text-blue-600">Pulse</span></span>
          </NavLink>

          {/* Location Selector (Mock) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all ml-4">
            <span className="text-blue-600 font-semibold">📍</span>
            <span>New Delhi, Central Ward</span>
            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-1 ml-6">
            <DesktopNavLink to="/"     label="Feed"    />
            <DesktopNavLink to="/map"  label="Map"     />
            {user && <DesktopNavLink to="/incidents/new" label="Report Issue" />}
            {user?.role &&
              ['MODERATOR','ADMIN'].includes(user.role) && (
              <DesktopNavLink to="/admin" label="Admin Dashboard" />
            )}
          </nav>

          <div className="flex-1" />

          {/* Theme & Accessibility Toggles */}
          <div className="flex items-center gap-1.5 mr-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setMotionReduce(r => !r)}
              title={motionReduce ? "Enable Animations" : "Reduce Motion"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all min-h-0 min-w-0
                ${motionReduce 
                  ? 'bg-amber-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              🏃‍♂️
            </button>
            
            <button
              onClick={() => setDarkMode(d => !d)}
              title="Toggle Dark Mode"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all min-h-0 min-w-0"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Right side — always visible */}
          {user
            ? <div className="flex items-center gap-3">
                <NotificationBell />
                <NavLink to={`/users/${user.id}`}
                  className="flex w-9 h-9 rounded-xl bg-blue-50
                             text-blue-600 text-xs font-bold items-center
                             justify-center hover:bg-blue-100 hover:text-blue-700 border border-blue-100 transition-all">
                  {user.name?.slice(0, 2).toUpperCase() || 'CP'}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold
                  bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors"
                >
                  Logout
                </button>
              </div>
            : <div className="flex items-center gap-2">
                <NavLink to="/login"
                  className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 transition-colors">
                  Sign in
                </NavLink>
                <NavLink to="/login"
                  className="sm:hidden text-xs text-blue-600 hover:text-blue-700 font-bold border border-blue-200 px-3 py-1.5 rounded-xl transition-colors">
                  Sign in
                </NavLink>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold
                  bg-blue-600 text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </button>
              </div>
          }
        </div>
      </header>

      {/* ── Live Alert Banner ── */}
      {!isMapPage && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-medium py-2.5 px-4 flex items-center shadow-sm relative z-30 animate-in slide-in-from-top duration-300">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase animate-pulse">Urgent Announcement</span>
              <span>⚡ Scheduled water pressure optimization in Central Ward (Sectors 3, 4, and 5) tomorrow between 6:00 AM - 9:00 AM.</span>
            </div>
            <button className="text-white/70 hover:text-white font-bold text-xs p-1 min-h-0 min-w-0" onClick={(e) => e.target.parentElement.parentElement.remove()}>✕</button>
          </div>
        </div>
      )}

      {/* ── Page content ───────────────────────────────────── */}
      {/* pb-[calc(4rem+env(safe-area-inset-bottom))] reserves space
          for the bottom nav + iPhone home bar on mobile.
          On desktop (sm+) the bottom nav is hidden so pb-0 applies. */}
      <main className={`flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]
                        sm:pb-0 ${isMapPage ? 'flex flex-col' : ''}`}>
        {children}
      </main>

      {/* Footer - only shown on desktop & non-map pages */}
      {!isMapPage && (
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <span className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-blue-600 text-white grid place-items-center shadow-sm text-xs font-extrabold">CP</div>
                  CivicPulse
                </span>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  A high-credibility, evidence-based civic tech platform connecting citizens with municipal transparency and direct resolution action.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Smart City Node v2.6
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Civic Resources</h4>
                <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
                  <li><NavLink to="/map" className="hover:text-blue-600 transition-colors">Smart City Live Map</NavLink></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Ward Grievance Redressal</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Local Sanitation Schedule</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">City Council Archives</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Citizens</h4>
                <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
                  <li><NavLink to={user ? `/users/${user.id}` : "/login"} className="hover:text-blue-600 transition-colors">Citizen Dashboard</NavLink></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Streaks & Badges</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Voice-Assist Input Mode</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Accessibility Guidelines</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Help & Support</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3 font-medium">
                  Need immediate municipal support? Contact your ward helpline.
                </p>
                <div className="text-xs font-bold text-blue-600 bg-blue-50/50 border border-blue-100 rounded-xl p-3 inline-block w-full text-center">
                  📞 Central Emergency: 1800-CIVIC-SOS
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400 font-medium">
                © {new Date().getFullYear()} CivicPulse • Empowering communities through accountability.
              </p>
              <div className="flex gap-4 text-xs font-semibold text-slate-400">
                <a href="#" className="hover:text-slate-600 transition-colors">Accessibility Mode</a>
                <span>·</span>
                <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
                <span>·</span>
                <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ── Bottom nav — mobile only ────────────────────────── */}
      {user && (
        <BottomNav user={user} />
      )}
    </div>
  );
}

// ── Desktop nav link ──────────────────────────────────────────

function DesktopNavLink({ to, label }) {
  return (
    <NavLink to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
         ${isActive
           ? 'bg-blue-50 text-blue-700'
           : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
         }`
      }
    >
      {label}
    </NavLink>
  );
}

// ── Bottom navigation bar ─────────────────────────────────────

function BottomNav({ user }) {
  const items = [
    { to: '/',        label: 'Feed',    Icon: Icons.Feed    },
    { to: '/map',     label: 'Map',     Icon: Icons.Map     },
    { to: '/incidents/new', label: 'Report', Icon: Icons.Report, primary: true },
    { to: `/users/${user.id}`, label: 'Profile', Icon: Icons.Profile },
  ];

  // Show Admin tab for privileged roles
  if (['MODERATOR','ADMIN'].includes(user.role)) {
    items.push({ to: '/admin', label: 'Admin', Icon: Icons.Admin });
  }

  return (
    // fixed + safe-area-inset-bottom handles the iPhone home bar
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40
                    bg-white/95 backdrop-blur-md
                    border-t border-slate-200"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {items.map(({ to, label, Icon, primary }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 min-w-[56px] py-1
               rounded-xl transition-all
               ${primary
                 ? ''   // primary button has its own styling below
                 : isActive
                   ? 'text-blue-600 font-semibold'
                   : 'text-slate-400 active:text-slate-600'
               }`
            }
          >
            {({ isActive }) => primary
              // The centre Report button is a raised FAB-style element
              ? <div className="flex flex-col items-center gap-0.5">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl
                                  flex items-center justify-center
                                  shadow-lg shadow-blue-600/30
                                  active:scale-95 transition-transform -mt-4 text-white">
                    <Icon />
                    {/* White icon on blue background */}
                    <span className="sr-only">{label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {label}
                  </span>
                </div>
              : <>
                  <Icon active={isActive} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
            }
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
