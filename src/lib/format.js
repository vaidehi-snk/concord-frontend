// Indian number formatting: ₹1,23,456 and compact ₹1.2L / ₹3.4Cr
export function money(n, { decimals = 0 } = {}) {
  if (n == null || Number.isNaN(n)) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function moneyShort(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const v = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (v >= 1e7) return `${sign}₹${(v / 1e7).toFixed(v >= 1e8 ? 0 : 1)}Cr`;
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(v >= 1e6 ? 0 : 1)}L`;
  if (v >= 1e3) return `${sign}₹${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K`;
  return `${sign}₹${Math.round(v)}`;
}

export function pct(n, digits = 0) {
  if (n == null) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export function date(d, opts = {}) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(opts.year ? { year: 'numeric' } : {}) });
}

export function dateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function ago(d) {
  if (!d) return '';
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return date(d);
}

export function daysFromNow(d) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export const STATUS = {
  open: { label: 'New', tone: 'red' },
  pending_approval: { label: 'Needs approval', tone: 'amber' },
  email_drafted: { label: 'Ready to send', tone: 'blue' },
  awaiting_vendor: { label: 'Waiting on vendor', tone: 'grey' },
  resolved: { label: 'Resolved', tone: 'green' },
  dismissed: { label: 'Dismissed', tone: 'grey' },
};

export const MATCH_STATUS = {
  awaiting_documents: { label: 'Waiting for documents', tone: 'amber' },
  matched: { label: 'Matched', tone: 'green' },
  disputed: { label: 'Disputed', tone: 'red' },
  needs_review: { label: 'Needs review', tone: 'amber' },
};

export const ISSUE = {
  SHORT_DELIVERY: 'Short delivery',
  QTY_OVER_PO: 'Billed above PO quantity',
  PRICE_MISMATCH: 'Price above PO rate',
  ITEM_NOT_ON_PO: 'Item never ordered',
  TAX_RATE_MISMATCH: 'Wrong GST rate',
  LINE_ARITHMETIC: 'Line maths wrong',
  TOTAL_ARITHMETIC: 'Totals don’t add up',
  TOTAL_OVER_PO: 'Total above PO value',
  GSTIN_INVALID: 'Invalid GSTIN',
  GSTIN_MISMATCH: 'GSTIN differs from vendor',
  DUPLICATE_INVOICE: 'Duplicate invoice',
  DN_UNVERIFIABLE: 'Delivery not verifiable',
  PO_PRESENT: 'No purchase order',
};

export const DOC = {
  PO: { label: 'Purchase order', short: 'PO' },
  DN: { label: 'Delivery challan', short: 'Challan' },
  INVOICE: { label: 'Invoice', short: 'Invoice' },
};

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}
