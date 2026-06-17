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

  // Pages that use full-screen map should hide the top bar's shadow
  const isMapPage = location.pathname === '/map';

  const handleLogout = () => {
    tokenStore.clear();
    navigate('/login');
  };

  const isLanding = location.pathname === '/' && !user;
  if (isLanding) return <>{children}</>;

  return (
    // min-h-dvh uses dynamic viewport height — correct on mobile browsers
    // where the address bar collapses
    <div className="flex flex-col min-h-[100dvh] bg-gray-50 text-slate-900">

      {/* ── Top bar (desktop + mobile) ─────────────────────── */}
      <header className={`sticky top-0 z-40 bg-white border-b border-gray-200
                          ${isMapPage ? '' : 'shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-gray-900 text-base tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-slate-950 text-white grid place-items-center shadow-sm">
              <span className="text-xs font-bold">CP</span>
            </div>
            <span>Civic<span className="text-blue-600">Pulse</span></span>
          </NavLink>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:flex items-center gap-1 ml-6">
            <DesktopNavLink to="/"     label="Feed"    />
            <DesktopNavLink to="/map"  label="Map"     />
            {user && <DesktopNavLink to="/incidents/new" label="Report Issue" />}
            {user?.role &&
              ['MODERATOR','ADMIN'].includes(user.role) && (
              <DesktopNavLink to="/admin" label="Admin" />
            )}
          </nav>

          <div className="flex-1" />

          {/* Right side — always visible */}
          {user
            ? <div className="flex items-center gap-3">
                <NotificationBell />
                <NavLink to={`/users/${user.id}`}
                  className="hidden sm:flex w-8 h-8 rounded-full bg-blue-100
                             text-blue-800 text-xs font-medium items-center
                             justify-center hover:bg-blue-200 transition-colors">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-medium
                  bg-slate-900 text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  Logout
                </button>
              </div>
            : <div className="flex items-center gap-2">
                <NavLink to="/login"
                  className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5">
                  Sign in
                </NavLink>
                <NavLink to="/login"
                  className="sm:hidden text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 px-3 py-1.5 rounded-xl">
                  Sign in
                </NavLink>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium
                  bg-slate-900 text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  Get Started
                </button>
              </div>
          }
        </div>
      </header>

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
        <footer className="border-t border-slate-200 bg-white hidden sm:block">
          <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} CivicPulse • Built for social impact
            </p>
            <p className="text-xs text-slate-500">
              Tip: Confirm issues near you to increase credibility.
            </p>
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
