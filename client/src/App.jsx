import React from "react";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Feed from "./pages/Feed.jsx";
import Incident from "./pages/Incident.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MapView from "./pages/MapView.jsx";
import { tokenStore } from "./api.js";
import { useAuth } from "./auth.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import NotificationBell from "./components/NotificationBell.jsx";

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
    >
      {children}
    </Link>
  );
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const nav = useNavigate();
  const { user } = useAuth();
  const loggedIn = Boolean(tokenStore.access);
  const isAdminOrMod = user && ["MODERATOR", "ADMIN"].includes(user.role);

  return (
    <ErrorProvider>
      <SocketProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
          <Toaster position="top-right" toastOptions={{ duration: 2500 }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-bold">CP</span>
            </div>
            <div>
              <p className="text-sm font-semibold leading-4">CivicPulse</p>
              <p className="text-xs text-slate-500 -mt-0.5">Community Signal Platform</p>
            </div>
          </div>

          <nav className="ml-auto flex items-center gap-5">
            <NavLink to="/">Feed</NavLink>
            <NavLink to="/map">Map</NavLink>
            {isAdminOrMod && <NavLink to="/admin">Admin</NavLink>}
            {!loggedIn && <NavLink to="/login">Login</NavLink>}
            {!loggedIn && <NavLink to="/register">Register</NavLink>}
          </nav>

          {loggedIn && (
            <div className="ml-2">
              <NotificationBell />
            </div>
          )}

          <div className="ml-2">
            {loggedIn ? (
              <button
                onClick={() => {
                  tokenStore.clear();
                  nav("/login");
                }}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium
                bg-slate-900 text-white shadow-sm hover:opacity-90 transition"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => nav("/login")}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium
                bg-slate-900 text-white shadow-sm hover:opacity-90 transition"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={
            <ErrorBoundary fallback={(err, reset) => (
              <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                <p className="text-slate-500 text-sm mb-4">
                  The feed failed to load.
                </p>
                <button onClick={reset} className="text-sm text-blue-600 underline">
                  Retry
                </button>
              </div>
            )}>
              <Feed />
            </ErrorBoundary>
          } />
          <Route path="/incident/:id" element={
            <ErrorBoundary>
              <Incident />
            </ErrorBoundary>
          } />
          <Route path="/register" element={
            <ErrorBoundary>
              <Register />
            </ErrorBoundary>
          } />
          <Route path="/login" element={
            <ErrorBoundary>
              <Login />
            </ErrorBoundary>
          } />
          <Route path="/users/:userId" element={
            <ErrorBoundary>
              <Profile />
            </ErrorBoundary>
          } />
          <Route path="/admin" element={
            <ErrorBoundary>
              <RequireRole roles={["MODERATOR", "ADMIN"]}>
                <AdminDashboard />
              </RequireRole>
            </ErrorBoundary>
          } />
          <Route path="/map" element={
            <ErrorBoundary>
              <MapView />
            </ErrorBoundary>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CivicPulse • Built for social impact
          </p>
          <p className="text-xs text-slate-500">
            Tip: Confirm issues near you to increase credibility.
          </p>
        </div>
      </footer>
    </div>
        </ErrorBoundary>
      </SocketProvider>
    </ErrorProvider>
  );
}
