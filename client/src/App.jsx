import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { tokenStore } from "./api.js";
import { useAuth } from "./auth.jsx";
import { ErrorProvider } from "./context/ErrorContext.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";

const Register = lazy(() => import("./pages/Register.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Feed = lazy(() => import("./pages/Feed.jsx"));
const Incident = lazy(() => import("./pages/Incident.jsx"));
const CreateIncident = lazy(() => import("./pages/CreateIncident.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const MapView = lazy(() => import("./pages/MapView.jsx"));


function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function RootRoute() {
  const { user } = useAuth();
  return user ? (
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
  ) : (
    <Landing />
  );
}

export default function App() {
  return (
    <ErrorProvider>
      <SocketProvider>
        <ErrorBoundary>
          <div className="min-h-[100dvh] bg-slate-50 text-slate-900">
            <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
            <Layout>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<RootRoute />} />
                  <Route path="/incident/:id" element={
                    <ErrorBoundary>
                      <Incident />
                    </ErrorBoundary>
                  } />
                  <Route path="/incidents/:id" element={
                    <ErrorBoundary>
                      <Incident />
                    </ErrorBoundary>
                  } />
                  <Route path="/incidents/new" element={
                    <ErrorBoundary>
                      <CreateIncident />
                    </ErrorBoundary>
                  } />
                  <Route path="/incident/new" element={
                    <ErrorBoundary>
                      <CreateIncident />
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
              </Suspense>
            </Layout>
          </div>
        </ErrorBoundary>
      </SocketProvider>
    </ErrorProvider>
  );
}
