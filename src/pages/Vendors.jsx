import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVendors, batchDraftEmail } from '../api/client';
import { getSettings } from '../api/settings';

const RISK_STYLES = {
  high: { bar: 'bg-danger', text: 'text-danger', badge: 'bg-danger-tint text-danger' },
  medium: { bar: 'bg-amber', text: 'text-amber', badge: 'bg-amber-tint text-amber' },
  low: { bar: 'bg-success', text: 'text-success', badge: 'bg-success-tint text-success' },
  none: { bar: 'bg-line', text: 'text-muted', badge: 'bg-navy-tint text-muted' },
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batching, setBatching] = useState(null); // vendorId currently drafting
  const [batchResult, setBatchResult] = useState(null); // { vendorId, draft }

  useEffect(() => {
    const { companyId } = getSettings();
    if (!companyId) {
      setError('Set your Company ID in Settings first.');
      setLoading(false);
      return;
    }
    listVendors({ companyId })
      .then(setVendors)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleBatchDraft(vendor) {
    setBatching(vendor._id);
    setBatchResult(null);
    setError('');
    try {
      const result = await batchDraftEmail(vendor.openDisputeIds);
      setBatchResult({ vendorId: vendor._id, draft: result.draft });
    } catch (err) {
      setError(err.message);
    } finally {
      setBatching(null);
    }
  }

  if (loading) return <div className="text-muted text-sm">Loading vendors…</div>;
  if (error) return <div className="text-danger text-sm">{error}</div>;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Vendor risk scorecard</h1>
        <p className="text-muted text-sm mt-1.5 max-w-xl">
          Risk score is a transparent heuristic based on dispute frequency, total disputed amount, and
          recency — not a trained model yet. That's planned once there's enough real dispute history to
          learn from.
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-12 text-center">
          <div className="text-sm font-medium text-ink mb-1">No vendors yet</div>
          <div className="text-sm text-muted">Vendors appear here once you've uploaded documents for them.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map((v) => {
            const style = RISK_STYLES[v.riskLabel] || RISK_STYLES.none;
            const openCount = v.openDisputeIds?.length || 0;
            return (
              <div key={v._id} className="border border-line rounded-xl p-5 bg-white shadow-[0_1px_2px_rgba(20,23,31,0.04)] hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">{v.name}</div>
                    {v.contactEmail && <div className="text-xs text-muted mt-0.5">{v.contactEmail}</div>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${style.badge}`}>
                    {v.riskLabel === 'none' ? 'No history' : `${v.riskLabel} risk`}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-navy-tint rounded-full overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${v.riskScore}%` }} />
                </div>

                <div className="flex gap-6 text-xs text-muted font-mono mb-3">
                  <span>Score: <span className="text-ink font-semibold">{v.riskScore}/100</span></span>
                  <span>Disputes: <span className="text-ink font-semibold">{v.stats?.totalDisputes || 0}</span></span>
                  <span>
                    Total disputed: <span className="text-ink font-semibold">
                      ₹{(v.stats?.totalDisputedAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>

                {openCount >= 2 && (
                  <div className="pt-3 border-t border-line">
                    <button
                      onClick={() => handleBatchDraft(v)}
                      disabled={batching === v._id}
                      className="text-xs font-semibold text-navy bg-navy-tint hover:bg-navy hover:text-white transition-colors px-3 py-1.5 rounded-md disabled:opacity-40"
                    >
                      {batching === v._id ? 'Drafting…' : `Draft one combined email for ${openCount} open disputes`}
                    </button>
                  </div>
                )}
                {openCount === 1 && (
                  <div className="pt-3 border-t border-line text-xs text-muted">
                    1 open dispute — <Link to={`/disputes/${v.openDisputeIds[0]}`} className="text-navy hover:underline">view it</Link>
                  </div>
                )}

                {batchResult?.vendorId === v._id && (
                  <div className="mt-3 bg-navy-tint rounded-lg p-4 text-xs whitespace-pre-wrap leading-relaxed text-ink">
                    {batchResult.draft}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
