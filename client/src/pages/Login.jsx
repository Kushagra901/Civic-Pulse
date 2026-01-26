import React, { useState } from "react";
import toast from "react-hot-toast";
import { api, tokenStore } from "../api.js";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center">
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-slate-500 mt-1">Log in to report and verify community issues.</p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
              focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
              focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
              placeholder="••••••••"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              toast.loading("Logging in...", { id: "login" });
              try {
                const res = await api.login(form);
                tokenStore.access = res.accessToken;
                tokenStore.refresh = res.refreshToken;
                toast.success("Logged in!", { id: "login" });
                nav("/");
              } catch (e) {
                toast.error(e.message, { id: "login" });
              } finally {
                setLoading(false);
              }
            }}
            className="w-full rounded-2xl bg-slate-900 text-white py-3 font-medium shadow-sm
            hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-sm text-slate-500">
            New here?{" "}
            <Link className="text-slate-900 font-medium hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </section>

      <aside className="hidden lg:block">
        <div className="rounded-3xl bg-slate-900 text-white p-8 shadow-lg">
          <h2 className="text-2xl font-semibold">Build safer communities.</h2>
          <p className="text-slate-200 mt-2">
            CivicPulse clusters duplicate reports, boosts verified signals, and keeps a transparent resolution timeline.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card title="Credibility" desc="Evidence-based scoring, not likes." />
            <Card title="Real-time" desc="Instant updates and status tracking." />
            <Card title="Accountability" desc="Immutable timeline events." />
            <Card title="Impact" desc="Better prioritization for teams." />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-200 mt-1">{desc}</p>
    </div>
  );
}
