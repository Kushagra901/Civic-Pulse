const API = "http://localhost:8080";

export const tokenStore = {
  get access() { return localStorage.getItem("accessToken"); },
  set access(v) { localStorage.setItem("accessToken", v); },
  get refresh() { return localStorage.getItem("refreshToken"); },
  set refresh(v) { localStorage.setItem("refreshToken", v); },
  clear() { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); }
};

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  refresh: (payload) => request("/api/auth/refresh", { method: "POST", body: payload }),

  listIncidents: () => request("/api/incidents"),
  getIncident: (id) => request(`/api/incidents/${id}`),

  createIncident: (payload) =>
    request("/api/incidents", { method: "POST", body: payload, auth: true }),

  confirmIncident: (id, type) =>
    request(`/api/incidents/${id}/confirm`, { method: "POST", body: { type }, auth: true })
};
