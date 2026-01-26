import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Feed from "./pages/Feed.jsx";
import Incident from "./pages/Incident.jsx";
import { tokenStore } from "./api.js";

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

export default function App() {
  const nav = useNavigate();
  const loggedIn = Boolean(tokenStore.access);

  return (
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
            {!loggedIn && <NavLink to="/login">Login</NavLink>}
            {!loggedIn && <NavLink to="/register">Register</NavLink>}
          </nav>

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
          <Route path="/" element={<Feed />} />
          <Route path="/incident/:id" element={<Incident />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
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
  );
}
