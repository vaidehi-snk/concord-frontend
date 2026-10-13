export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const TOKEN_KEY = 'concord_token';
const SESSION_KEY = 'concord_session';

export const session = {
  get token() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  get data() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  },
  save({ token, user, company }) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, company }));
    } catch {
      /* storage unavailable — session lasts for this tab only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Server status for the "waking up" indicator. Render's free tier sleeps after
// 15 idle minutes; the first request then takes 30–60 s while it boots.
const listeners = new Set();
let pending = 0;
let slowTimer = null;
export const serverStatus = {
  state: 'ok', // ok | slow | down
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  set(state) {
    if (this.state === state) return;
    this.state = state;
    listeners.forEach((fn) => fn(state));
  },
};
function begin() {
  pending++;
  if (!slowTimer) slowTimer = setTimeout(() => pending > 0 && serverStatus.set('slow'), 2500);
}
function end(ok) {
  pending = Math.max(0, pending - 1);
  if (pending === 0) {
    clearTimeout(slowTimer);
    slowTimer = null;
  }
  if (ok && pending === 0) serverStatus.set('ok');
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const host = (() => {
  try {
    return new URL(API_URL).host;
  } catch {
    return API_URL;
  }
})();

// Wake the server as soon as the app loads, so it's ready by the time someone clicks.
export function warmUp() {
  fetch(`${API_URL}/health`).catch(() => {});
}

async function request(method, path, body, { raw = false, auth = true, retries } = {}) {
  const headers = {};
  if (auth && session.token) headers.Authorization = `Bearer ${session.token}`;
  let payload;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  // A failed fetch means the request never got a response, so it is safe to retry.
  const attempts = retries ?? 4;
  let res;
  begin();
  try {
    for (let i = 0; ; i++) {
      try {
        res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
        break;
      } catch {
        if (i >= attempts) {
          serverStatus.set('down');
          throw new ApiError(`Can’t reach the Concord server (${host}). It may still be starting up — wait a few seconds and try again.`, 0);
        }
        serverStatus.set('slow');
        await sleep([2000, 4000, 7000, 10000, 12000][i] || 12000);
      }
    }
  } finally {
    end(!!res);
  }
  if (res.status === 401 && auth && session.token) {
    session.clear();
    if (!location.pathname.startsWith('/login')) location.href = '/login?expired=1';
    throw new ApiError('Your session has expired. Log in again.', 401);
  }
  if (raw) {
    if (!res.ok) throw new ApiError(`Download failed (${res.status})`, res.status);
    return res;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status);
  return data;
}

export const api = {
  get: (p, o) => request('GET', p, undefined, o),
  post: (p, b, o) => request('POST', p, b ?? {}, o),
  put: (p, b, o) => request('PUT', p, b, o),
  patch: (p, b, o) => request('PATCH', p, b, o),
  del: (p, o) => request('DELETE', p, undefined, o),
};

export async function download(path, fallbackName) {
  const res = await request('GET', path, undefined, { raw: true });
  const disp = res.headers.get('Content-Disposition') || '';
  const name = disp.match(/filename="?([^"]+)"?/)?.[1] || fallbackName;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
