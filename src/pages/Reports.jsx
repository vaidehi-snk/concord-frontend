import { useEffect, useState } from 'react';
import { getSavingsReport, downloadAuditTrail } from '../api/client';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function StatCard({ label, value, accent }) {
  return (
    <div className="border border-line rounded-xl px-5 py-4 bg-white shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
      <div className={`text-2xl font-semibold tracking-tight ${accent || 'text-navy'}`}>{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSavingsReport()
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading report…</div>;
  if (error) return <div className="text-danger text-sm">{error}</div>;
  if (!report) return null;

  const { overall, monthly } = report;
  const maxAmount = Math.max(1, ...monthly.map((m) => m.totalFlaggedAmount));

  return (
    <div>
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">Savings &amp; Impact</h1>
          <p className="text-muted text-sm mt-1.5 max-w-xl">
            "Resolved" reflects disputes the negotiation loop actually closed out — a rough proxy for money
            recovered or corrected, not just flagged.
          </p>
        </div>
        <button
          onClick={() => downloadAuditTrail().catch((err) => setError(err.message))}
          className="shrink-0 text-sm font-semibold text-navy border border-line px-4 py-2.5 rounded-lg hover:bg-navy-tint transition-colors whitespace-nowrap"
        >
          Export Audit Trail (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total flagged" value={overall.totalFlagged} />
        <StatCard label="Total flagged amount" value={`₹${overall.totalFlaggedAmount.toLocaleString('en-IN')}`} />
        <StatCard label="Disputes resolved" value={overall.resolvedCount} accent="text-success" />
        <StatCard label="Amount resolved" value={`₹${overall.resolvedAmount.toLocaleString('en-IN')}`} accent="text-success" />
      </div>

      {monthly.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-12 text-center">
          <div className="text-sm font-medium text-ink mb-1">No data yet</div>
          <div className="text-sm text-muted">This fills in as disputes are flagged and resolved over time.</div>
        </div>
      ) : (
        <div className="border border-line rounded-xl p-6 bg-white shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <div className="text-sm font-semibold text-ink mb-5">Monthly breakdown</div>
          <div className="space-y-4">
            {monthly.map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-ink">{MONTH_NAMES[m.month - 1]} {m.year}</span>
                  <span className="text-muted font-mono">
                    ₹{m.totalFlaggedAmount.toLocaleString('en-IN')} flagged
                    {m.resolvedAmount > 0 && <span className="text-success"> · ₹{m.resolvedAmount.toLocaleString('en-IN')} resolved</span>}
                  </span>
                </div>
                <div className="w-full h-2 bg-navy-tint rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-navy-light rounded-full absolute"
                    style={{ width: `${(m.totalFlaggedAmount / maxAmount) * 100}%` }}
                  />
                  <div
                    className="h-full bg-success rounded-full absolute"
                    style={{ width: `${(m.resolvedAmount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
