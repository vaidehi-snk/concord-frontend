import { getToken, logout } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Every protected call now sends the auth token — the backend reads
// companyId/userId/role from it (middleware/auth.js) instead of trusting
// whatever the client claims in the request body, which is what the app did
// before real auth existed. companyId/vendorId params are gone from every
// function signature here on purpose — the server already knows who's asking.

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

async function handle(res) {
  if (res.status === 401) {
    // Token missing/expired/invalid — there's no valid session to recover,
    // so send the user back to log in rather than showing a confusing error.
    logout();
    window.location.href = '/login';
    throw new Error('Session expired — please log in again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function uploadDocument({ file, type, vendorId }) {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  if (vendorId) form.append('vendorId', vendorId);
  const res = await fetch(`${BASE_URL}/documents`, { method: 'POST', headers: authHeaders(), body: form });
  return handle(res);
}

export async function runReconciliation({ poId, deliveryNoteId, invoiceId, vendorId }) {
  const res = await fetch(`${BASE_URL}/disputes/reconcile`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ poId, deliveryNoteId, invoiceId, vendorId }),
  });
  return handle(res);
}

export async function listDisputes({ status } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetch(`${BASE_URL}/disputes?${params}`, { headers: authHeaders() });
  return handle(res);
}

export async function draftSettlementEmail(disputeId) {
  const res = await fetch(`${BASE_URL}/negotiate/${disputeId}/draft`, { method: 'POST', headers: authHeaders() });
  return handle(res);
}

export async function logVendorReply(disputeId, replyText) {
  const res = await fetch(`${BASE_URL}/negotiate/${disputeId}/reply`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ replyText }),
  });
  return handle(res);
}

export async function listVendors() {
  const res = await fetch(`${BASE_URL}/vendors`, { headers: authHeaders() });
  return handle(res);
}

export async function createVendor({ name, contactEmail }) {
  const res = await fetch(`${BASE_URL}/vendors`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name, contactEmail }),
  });
  return handle(res);
}

export async function getSavingsReport() {
  const res = await fetch(`${BASE_URL}/disputes/report/summary`, { headers: authHeaders() });
  return handle(res);
}

export async function batchDraftEmail(disputeIds) {
  const res = await fetch(`${BASE_URL}/negotiate/batch-draft`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ disputeIds }),
  });
  return handle(res);
}
