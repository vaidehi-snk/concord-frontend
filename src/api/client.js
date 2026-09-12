const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Every call here matches a route we already built and tested in the backend
// (routes/documents.js, routes/disputes.js, routes/negotiate.js). Centralizing
// them means the UI code never constructs a URL or a fetch call directly.

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function uploadDocument({ file, type, companyId, vendorId }) {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  form.append('companyId', companyId);
  if (vendorId) form.append('vendorId', vendorId);
  const res = await fetch(`${BASE_URL}/documents`, { method: 'POST', body: form });
  return handle(res);
}

export async function runReconciliation({ poId, deliveryNoteId, invoiceId, companyId, vendorId }) {
  const res = await fetch(`${BASE_URL}/disputes/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ poId, deliveryNoteId, invoiceId, companyId, vendorId }),
  });
  return handle(res);
}

export async function listDisputes({ companyId, status } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.set('companyId', companyId);
  if (status) params.set('status', status);
  const res = await fetch(`${BASE_URL}/disputes?${params}`);
  return handle(res);
}

export async function draftSettlementEmail(disputeId) {
  const res = await fetch(`${BASE_URL}/negotiate/${disputeId}/draft`, { method: 'POST' });
  return handle(res);
}

export async function logVendorReply(disputeId, replyText) {
  const res = await fetch(`${BASE_URL}/negotiate/${disputeId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyText }),
  });
  return handle(res);
}

export async function listVendors({ companyId } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.set('companyId', companyId);
  const res = await fetch(`${BASE_URL}/vendors?${params}`);
  return handle(res);
}

export async function getSavingsReport({ companyId } = {}) {
  const params = new URLSearchParams();
  if (companyId) params.set('companyId', companyId);
  const res = await fetch(`${BASE_URL}/disputes/report/summary?${params}`);
  return handle(res);
}
