import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { draftSettlementEmail } from '../api/client';

const SEVERITY_STYLES = {
  HIGH: 'bg-danger-tint text-danger',
  MED: 'bg-amber-tint text-amber',
  LOW: 'bg-navy-tint text-muted',
};

export default function DisputeDetail() {
  const { id } = useParams();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafting, setDrafting] = useState(false);

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
        {dispute.flags.map((f, i) => (
          <div key={i} className="p-4 flex items-start gap-3 bg-white">
            <span className={`text-xs font-mono font-semibold px-2 py-1 rounded shrink-0 ${SEVERITY_STYLES[f.severity]}`}>
              {f.severity}
            </span>
            <div className="text-sm text-ink leading-relaxed">
              {f.description}
              {f.financialImpact > 0 && (
                <span className="text-muted"> — ₹{f.financialImpact.toLocaleString('en-IN')} impact</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6 px-1">
        <span className="text-sm text-muted">Total financial impact</span>
        <span className="font-mono text-lg font-semibold text-ink">
          ₹{dispute.totalFinancialImpact.toLocaleString('en-IN')}
        </span>
      </div>

      <button
        onClick={handleDraft}
        disabled={drafting}
        className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-35 hover:bg-navy-light transition-colors shadow-sm"
      >
        {drafting ? 'Drafting…' : latestDraft ? 'Re-draft settlement email' : 'Draft settlement email with AI'}
      </button>

      {error && <div className="mt-3 text-sm text-danger">{error}</div>}

      {latestDraft && (
        <div className="mt-6 border border-line rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <div className="px-5 py-3 border-b border-line flex justify-between items-center bg-navy-tint">
            <span className="font-semibold text-sm text-ink">Negotiation Agent — Draft</span>
            <span className="text-xs font-mono text-success bg-success-tint px-2.5 py-1 rounded-full">Ready to send</span>
          </div>
          <div className="p-5 text-sm whitespace-pre-wrap leading-relaxed bg-white text-ink">{latestDraft.body}</div>
        </div>
      )}
    </div>
  );
}
