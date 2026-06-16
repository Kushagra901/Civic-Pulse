const API = "http://localhost:8080";

export const tokenStore = {
  get access() { return localStorage.getItem("accessToken"); },
  set access(v) { localStorage.setItem("accessToken", v); },
  get refresh() { return localStorage.getItem("refreshToken"); },
  set refresh(v) { localStorage.setItem("refreshToken", v); },
  clear() { localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken"); }
};

// Normalised error — every failed API call throws one of these
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;   // HTTP status: 401, 404, 422, 500 …
    this.code   = code;     // Optional machine-readable code from your server
  }
}

async function request(path, options = {}) {
  const token = tokenStore.access;
  const fullPath = path.startsWith("/api") ? path : `/api${path}`;

  const res = await fetch(`${API}${fullPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Attempt to parse a JSON body regardless of status
  let body = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (e.g. 502 from a proxy)
  }

  if (!res.ok) {
    const message = body?.message || `Request failed (${res.status})`;
    const code    = body?.code    || null;
    throw new ApiError(message, res.status, code);
  }

  return body;
}

export const api = {
  get:    (path, opts)         => request(path, { method: "GET", ...opts }),
  post:   (path, data, opts)   => request(path, { method: "POST",
                                   body: JSON.stringify(data), ...opts }),
  patch:  (path, data, opts)   => request(path, { method: "PATCH",
                                   body: JSON.stringify(data), ...opts }),
  delete: (path, opts)         => request(path, { method: "DELETE", ...opts }),

  // Backward compatibility methods
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  refresh: (payload) => api.post("/auth/refresh", payload),
  listIncidents: () => api.get("/incidents"),
  getIncident: (id) => api.get(`/incidents/${id}`),
  createIncident: (payload) => api.post("/incidents", payload),
  confirmIncident: (id, type) => api.post(`/incidents/${id}/confirm`, { type })
};
