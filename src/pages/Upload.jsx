import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument, runReconciliation } from '../api/client';
import { getSettings } from '../api/settings';

const DOC_TYPES = [
  { key: 'PO', label: 'Purchase Order', hint: 'What was ordered' },
  { key: 'DN', label: 'Delivery Note', hint: 'What actually arrived' },
  { key: 'INVOICE', label: 'Invoice', hint: "What the vendor's billing" },
];

const STATUS_META = {
  parsed: { label: 'Parsed successfully', dot: 'bg-success', text: 'text-success' },
  needs_review: { label: 'Low confidence — worth checking', dot: 'bg-amber', text: 'text-amber' },
  failed: { label: 'Could not parse this file', dot: 'bg-danger', text: 'text-danger' },
};

function FileSlot({ label, hint, file, onChange, status }) {
  const meta = status && STATUS_META[status];
  return (
    <label className="group cursor-pointer border border-line rounded-xl p-5 flex flex-col hover:border-navy/40 hover:shadow-md transition-all bg-white shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-ink">{label}</div>
          <div className="text-xs text-muted mt-0.5">{hint}</div>
        </div>
        <div className="w-9 h-9 rounded-lg bg-navy-tint flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5">
            <path d="M12 4v12m0-12l-4 4m4-4l4 4M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <input
        type="file"
        accept="application/pdf,image/*"
        onChange={(e) => onChange(e.target.files[0])}
        className="hidden"
      />

      {file ? (
        <div className="text-xs font-mono text-ink bg-navy-tint rounded-md px-2.5 py-1.5 truncate mt-1">
          {file.name}
        </div>
      ) : (
        <div className="text-xs text-muted border border-dashed border-line rounded-md px-2.5 py-1.5 mt-1">
          Click to choose a file
        </div>
      )}

      {meta && (
        <div className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium ${meta.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </div>
      )}
    </label>
  );
}

export default function Upload() {
  const [files, setFiles] = useState({ PO: null, DN: null, INVOICE: null });
  const [uploaded, setUploaded] = useState({ PO: null, DN: null, INVOICE: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const allSelected = DOC_TYPES.every((t) => files[t.key]);

  async function handleReconcile() {
    setBusy(true);
    setError('');
    setResult(null);
    const { companyId, vendorId } = getSettings();
    if (!companyId || !vendorId) {
      setError('Set your Company ID and Vendor ID in Settings first.');
      setBusy(false);
      return;
    }

    try {
      const docs = {};
      for (const t of DOC_TYPES) {
        const doc = await uploadDocument({ file: files[t.key], type: t.key, companyId, vendorId });
        docs[t.key] = doc;
        setUploaded((prev) => ({ ...prev, [t.key]: doc }));
      }

      const recon = await runReconciliation({
        poId: docs.PO._id,
        deliveryNoteId: docs.DN._id,
        invoiceId: docs.INVOICE._id,
        companyId,
        vendorId,
      });
      setResult(recon);
      if (recon.hasDispute) {
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Upload documents</h1>
        <p className="text-muted text-sm mt-1.5">
          Upload the Purchase Order, Delivery Note, and Invoice for one order.
          Concord will parse and cross-check all three.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {DOC_TYPES.map((t) => (
          <FileSlot
            key={t.key}
            label={t.label}
            hint={t.hint}
            file={files[t.key]}
            status={uploaded[t.key]?.parseStatus}
            onChange={(file) => {
              setFiles((prev) => ({ ...prev, [t.key]: file }));
              // A newly-selected file hasn't been uploaded/parsed yet — clear
              // any stale status badge from a previous file in this slot.
              setUploaded((prev) => ({ ...prev, [t.key]: null }));
              setResult(null);
            }}
          />
        ))}
      </div>

      <button
        disabled={!allSelected || busy}
        onClick={handleReconcile}
        className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-35 disabled:cursor-not-allowed hover:bg-navy-light transition-colors shadow-sm"
      >
        {busy ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Processing…
          </span>
        ) : (
          'Upload & Reconcile'
        )}
      </button>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-sm text-danger bg-danger-tint border border-danger/20 rounded-lg px-4 py-3">
          <span>{error}</span>
        </div>
      )}

      {result && !result.hasDispute && !result.insufficientData && (
        <div className="mt-6 bg-success-tint border border-success/25 rounded-xl p-4 text-sm text-success font-medium flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All three documents match — no dispute found.
        </div>
      )}
      {result && !result.hasDispute && result.insufficientData && (
        <div className="mt-6 bg-amber-tint border border-amber/25 rounded-xl p-4 text-sm text-amber font-medium">
          Couldn't verify most fields — extraction found too little usable data on these documents to actually
          reconcile them. This is not the same as confirming they match; try clearer or more standard-format
          documents.
        </div>
      )}
      {result && result.hasDispute && (
        <div className="mt-6 bg-danger-tint border border-danger/25 rounded-xl p-4 text-sm text-danger font-medium">
          Dispute found — redirecting to the dashboard…
        </div>
      )}
    </div>
  );
}
