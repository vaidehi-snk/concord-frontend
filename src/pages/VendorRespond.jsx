import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const SEVERITY_STYLES = {
  HIGH: 'bg-danger-tint text-danger',
  MED: 'bg-amber-tint text-amber',
  LOW: 'bg-navy-tint text-muted',
};

export default function VendorRespond() {
  const { token } = useParams();
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(null); // 'accept' | 'dispute'
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${BASE_URL}/public/disputes/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('This link is invalid or has expired.');
        return res.json();
      })
      .then(setDispute)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleRespond(decision) {
    setSubmitting(decision);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/public/disputes/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, message }),
      });
      if (!res.ok) throw new Error('Failed to submit your response.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted text-sm">Loading…</div>;
  if (error && !dispute) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-danger text-sm">{error}</div>
      </div>
    );
  }
  if (!dispute) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-start justify-center px-6 py-14">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-md bg-navy flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
              <path d="M4 12L10 18L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] text-ink tracking-tight">Concord</span>
        </div>

        <div className="bg-white border border-line rounded-xl p-6 shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <div className="text-xs text-muted font-mono mb-1">
            PO {dispute.poNumber} · Invoice {dispute.invoiceNumber}
          </div>
          <h1 className="text-xl font-semibold text-ink tracking-tight mb-4">
            Billing discrepancy — {dispute.vendorName}
          </h1>

          <div className="space-y-2 mb-5">
            {dispute.flags.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${SEVERITY_STYLES[f.severity]}`}>
                  {f.severity}
                </span>
                <span className="text-ink leading-relaxed">{f.description}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center py-3 border-t border-b border-line mb-5">
            <span className="text-sm text-muted">Total impact</span>
            <span className="font-mono text-lg font-semibold text-ink">
              ₹{dispute.totalFinancialImpact.toLocaleString('en-IN')}
            </span>
          </div>

          {submitted ? (
            <div className="bg-success-tint text-success text-sm rounded-lg p-4 text-center font-medium">
              Thanks — your response has been recorded.
            </div>
          ) : dispute.status === 'resolved' ? (
            <div className="bg-success-tint text-success text-sm rounded-lg p-4 text-center font-medium">
              This dispute has already been marked resolved.
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Optional message…"
                className="w-full border border-line rounded-lg px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => handleRespond('accept')}
                  disabled={!!submitting}
                  className="flex-1 bg-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {submitting === 'accept' ? 'Submitting…' : 'Accept & Resolve'}
                </button>
                <button
                  onClick={() => handleRespond('dispute')}
                  disabled={!!submitting}
                  className="flex-1 border border-line text-ink px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-navy-tint transition-colors"
                >
                  {submitting === 'dispute' ? 'Submitting…' : 'I Disagree'}
                </button>
              </div>
              {error && <div className="mt-3 text-sm text-danger">{error}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
