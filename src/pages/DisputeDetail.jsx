import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { draftSettlementEmail, logVendorReply } from '../api/client';

const SEVERITY_STYLES = {
  HIGH: 'bg-danger-tint text-danger',
  MED: 'bg-amber-tint text-amber',
  LOW: 'bg-navy-tint text-muted',
};

const FIELD_LABELS = {
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  taxPercent: 'Tax %',
  deliveredQuantity: 'Delivered Quantity',
};

// Builds the "why was this flagged" breakdown from the documents already
// populated on the dispute — no extra API call needed. Line-item flags
// (the normal case now) embed the item name in quotes in the description,
// e.g. `"Wireless Mouse": PO ordered 5, Invoice bills for 8.` — this pulls
// that item back out and shows the full row from each document, rather than
// a flat single-value comparison that no longer matches how flags are made.
function findLineItem(lineItems, name) {
  if (!lineItems || !name) return null;
  const norm = name.toLowerCase().trim();
  return lineItems.find((i) => (i.description || '').toLowerCase().trim() === norm) || null;
}

function buildExplanation(flag, dispute) {
  const itemMatch = flag.description.match(/^"([^"]+)"/);
  const itemName = itemMatch ? itemMatch[1] : null;

  if (itemName) {
    const poItem = findLineItem(dispute.po?.extracted?.lineItems, itemName);
    const invItem = findLineItem(dispute.invoice?.extracted?.lineItems, itemName);
    const dnItem = findLineItem(dispute.deliveryNote?.extracted?.lineItems, itemName);

    if (flag.field === 'deliveredQuantity') {
      return {
        rows: [
          { label: 'Invoice bills for', value: invItem?.quantity != null ? `${invItem.quantity} units` : 'not found' },
          { label: 'Delivery Note confirms', value: dnItem?.quantity != null ? `${dnItem.quantity} units received` : 'not found' },
        ],
        calc: invItem?.quantity != null && dnItem?.quantity != null
          ? `Difference: ${Math.abs(invItem.quantity - dnItem.quantity)} units` +
            (invItem.unitPrice ? ` × ₹${invItem.unitPrice}/unit = ₹${(Math.abs(invItem.quantity - dnItem.quantity) * invItem.unitPrice).toLocaleString('en-IN')}` : '')
          : null,
      };
    }

    const poVal = poItem?.[flag.field];
    const invVal = invItem?.[flag.field];
    return {
      rows: [
        { label: `PO line item "${itemName}"`, value: poVal != null ? String(poVal) : 'not found on PO' },
        { label: `Invoice line item "${itemName}"`, value: invVal != null ? String(invVal) : 'not found on Invoice' },
      ],
      calc: poVal != null && invVal != null ? `Difference: ${Math.abs(invVal - poVal)}${flag.field === 'unitPrice' ? ' per unit' : ''}` : null,
    };
  }

  // Fallback: old flat-field comparison, for documents with no lineItems.
  const po = dispute.po?.extracted;
  const invoice = dispute.invoice?.extracted;
  const dn = dispute.deliveryNote?.extracted;

  if (flag.field === 'deliveredQuantity') {
    const billed = invoice?.quantity;
    const delivered = dn?.deliveredQuantity ?? dn?.quantity;
    const unitPrice = invoice?.unitPrice;
    return {
      rows: [
        { label: 'Invoice bills for', value: billed != null ? `${billed} units` : 'not found' },
        { label: 'Delivery Note confirms', value: delivered != null ? `${delivered} units received` : 'not found' },
      ],
      calc: billed != null && delivered != null
        ? `Difference: ${billed} − ${delivered} = ${Math.abs(billed - delivered)} units` +
          (unitPrice ? ` × ₹${unitPrice}/unit = ₹${(Math.abs(billed - delivered) * unitPrice).toLocaleString('en-IN')}` : '')
        : null,
    };
  }

  const poVal = po?.[flag.field];
  const invVal = invoice?.[flag.field];
  return {
    rows: [
      { label: 'Purchase Order states', value: poVal != null ? String(poVal) : 'not found' },
      { label: 'Invoice states', value: invVal != null ? String(invVal) : 'not found' },
    ],
    calc: poVal != null && invVal != null
      ? `Difference: ${Math.abs(invVal - poVal)}${flag.field === 'unitPrice' ? ' per unit' : ''}${flag.field === 'taxPercent' ? ' percentage points' : ''}`
      : null,
  };
}

export default function DisputeDetail() {
  const { id } = useParams();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  function fetchDispute() {
    setLoading(true);
    fetch(`${BASE_URL}/disputes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dispute');
        return res.json();
      })
      .then(setDispute)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(fetchDispute, [id]);

  async function handleDraft() {
    setDrafting(true);
    setError('');
    try {
      await draftSettlementEmail(id);
      fetchDispute();
    } catch (err) {
      setError(err.message);
    } finally {
      setDrafting(false);
    }
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    setError('');
    try {
      await logVendorReply(id, replyText);
      setReplyText('');
      fetchDispute();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingReply(false);
    }
  }

  if (loading) return <div className="text-muted text-sm">Loading…</div>;
  if (error && !dispute) return <div className="text-danger text-sm">{error}</div>;
  if (!dispute) return null;

  const latestDraft = [...dispute.thread].reverse().find((t) => t.direction === 'outbound_draft');

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1.5 mb-4">
        <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to dashboard
      </Link>

      <h1 className="text-2xl font-semibold text-ink tracking-tight">{dispute.vendor?.name}</h1>
      <div className="text-sm text-muted mt-1 mb-7 font-mono">
        PO {dispute.po?.docNumber || dispute.po?._id} · Invoice {dispute.invoice?.docNumber || dispute.invoice?._id}
      </div>

      <div className="border border-line rounded-xl divide-y divide-line mb-6 overflow-hidden shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
        {dispute.flags.map((f, i) => {
          const isOpen = !!expanded[i];
          const explanation = isOpen ? buildExplanation(f, dispute) : null;
          return (
            <div key={i} className="bg-white">
              <button
                onClick={() => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
                className="w-full p-4 flex items-start gap-3 text-left hover:bg-navy-tint/50 transition-colors"
              >
                <span className={`text-xs font-mono font-semibold px-2 py-1 rounded shrink-0 ${SEVERITY_STYLES[f.severity]}`}>
                  {f.severity}
                </span>
                <div className="text-sm text-ink leading-relaxed flex-1">
                  {f.description}
                  {f.financialImpact > 0 && (
                    <span className="text-muted"> — ₹{f.financialImpact.toLocaleString('en-IN')} impact</span>
                  )}
                </div>
                <svg
                  viewBox="0 0 24 24" fill="none"
                  className={`w-4 h-4 shrink-0 text-muted transition-transform mt-0.5 ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && explanation && (
                <div className="px-4 pb-4 pl-[60px]">
                  <div className="bg-navy-tint rounded-lg p-4 text-xs space-y-2">
                    <div className="font-mono uppercase tracking-wide text-muted mb-2">Why this was flagged</div>
                    {explanation.rows.map((r, ri) => (
                      <div key={ri} className="flex justify-between gap-4">
                        <span className="text-muted">{r.label}</span>
                        <span className="font-mono text-ink font-medium">{r.value}</span>
                      </div>
                    ))}
                    {explanation.calc && (
                      <div className="pt-2 mt-2 border-t border-line/60 font-mono text-navy">
                        {explanation.calc}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-6 px-1">
        <span className="text-sm text-muted">Total financial impact</span>
        <span className="font-mono text-lg font-semibold text-ink">
          ₹{dispute.totalFinancialImpact.toLocaleString('en-IN')}
        </span>
      </div>

      {dispute.publicToken && (
        <div className="mb-6 bg-navy-tint rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="text-xs text-muted">
            Vendor response link — no login needed, works straight from an email
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/respond/${dispute.publicToken}`)}
            className="text-xs font-semibold text-navy bg-white border border-line px-3 py-1.5 rounded-md hover:bg-navy hover:text-white hover:border-navy transition-colors shrink-0"
          >
            Copy link
          </button>
        </div>
      )}

      <button
        onClick={handleDraft}
        disabled={drafting}
        className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-35 hover:bg-navy-light transition-colors shadow-sm"
      >
        {drafting ? 'Drafting…' : latestDraft ? 'Re-draft settlement email' : 'Draft settlement email with AI'}
      </button>

      {error && <div className="mt-3 text-sm text-danger">{error}</div>}

      {dispute.thread.length > 0 && (
        <div className="mt-6 border border-line rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <div className="px-5 py-3 border-b border-line flex justify-between items-center bg-navy-tint">
            <span className="font-semibold text-sm text-ink">Negotiation Thread</span>
            <span className={`text-xs font-mono px-2.5 py-1 rounded-full ${
              dispute.status === 'resolved' ? 'text-success bg-success-tint' : 'text-amber bg-amber-tint'
            }`}>
              {dispute.status.replace('_', ' ')}
            </span>
          </div>
          <div className="divide-y divide-line">
            {dispute.thread.map((t, i) => (
              <div key={i} className="p-5">
                <div className="text-[11px] font-mono uppercase tracking-wide text-muted mb-1.5">
                  {t.direction === 'vendor_reply' ? "Vendor's reply" : t.direction === 'outbound_sent' ? 'Internal note' : 'Drafted by agent'}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed text-ink">{t.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dispute.status !== 'resolved' && dispute.status !== 'dismissed' && dispute.thread.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink mb-1.5">Log the vendor's reply</label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Paste what the vendor actually said back, and the agent will decide whether to close this out or draft a follow-up…"
            className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
          />
          <button
            onClick={handleReply}
            disabled={submittingReply || !replyText.trim()}
            className="mt-2 bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-35 hover:bg-navy-light transition-colors shadow-sm"
          >
            {submittingReply ? 'Agent deciding…' : 'Submit reply to agent'}
          </button>
        </div>
      )}
    </div>
  );
}
