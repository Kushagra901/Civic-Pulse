import React, { useState } from "react";
import toast from "react-hot-toast";
import { api, tokenStore } from "../api.js";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-xl">
      <section className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-slate-500 mt-1">Start reporting and verifying local issues.</p>

        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none
              focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

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
              placeholder="Min 6 characters"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              toast.loading("Creating account...", { id: "reg" });
              try {
                const res = await api.register(form);
                tokenStore.access = res.accessToken;
                tokenStore.refresh = res.refreshToken;
                localStorage.setItem("userName", res.user.name);
                toast.success("Account created!", { id: "reg" });
                nav("/");
              } catch (e) {
                toast.error(e.message, { id: "reg" });
              } finally {
                setLoading(false);
              }
            }}
            className="w-full rounded-2xl bg-slate-900 text-white py-3 font-medium shadow-sm
            hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="text-slate-900 font-medium hover:underline" to="/login">
              Login
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
