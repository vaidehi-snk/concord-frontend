import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listDisputes } from '../api/client';

const STATUS_STYLES = {
  open: 'bg-danger-tint text-danger',
  pending_approval: 'bg-amber-tint text-amber',
  email_drafted: 'bg-amber-tint text-amber',
  awaiting_vendor: 'bg-amber-tint text-amber',
  resolved: 'bg-success-tint text-success',
  dismissed: 'bg-navy-tint text-muted',
};

function StatCard({ label, value }) {
  return (
    <div className="border border-line rounded-xl px-5 py-4 bg-white shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
      <div className="text-2xl font-semibold text-navy tracking-tight">{value}</div>
      <div className="text-xs text-muted mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listDisputes()
      .then(setDisputes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted text-sm">Loading disputes…</div>;
  if (error) return <div className="text-danger text-sm">{error}</div>;

  const openCount = disputes.filter((d) => d.status !== 'resolved' && d.status !== 'dismissed').length;
  const totalImpact = disputes.reduce((sum, d) => sum + (d.totalFinancialImpact || 0), 0);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Disputes</h1>
        <p className="text-muted text-sm mt-1.5">Every discrepancy Concord has flagged across your uploads.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Open disputes" value={openCount} />
        <StatCard label="Total flagged" value={disputes.length} />
        <StatCard label="Total financial impact" value={`₹${totalImpact.toLocaleString('en-IN')}`} />
      </div>

      {disputes.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-12 text-center">
          <div className="text-sm font-medium text-ink mb-1">No disputes yet</div>
          <div className="text-sm text-muted">Upload a document set to get started.</div>
        </div>
      ) : (
        <div className="border border-line rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-ink text-white text-xs font-mono uppercase tracking-wide">
            <div>Vendor</div>
            <div>Flags</div>
            <div>Financial impact</div>
            <div>Status</div>
          </div>
          {disputes.map((d) => (
            <Link
              to={`/app/disputes/${d._id}`}
              key={d._id}
              className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-4 px-5 py-4 border-t border-line items-center hover:bg-navy-tint transition-colors"
            >
              <div className="text-sm font-medium text-ink">{d.vendor?.name || 'Unknown vendor'}</div>
              <div className="text-sm text-muted">{d.flags?.length || 0} flagged</div>
              <div className="text-sm font-mono text-ink">₹{(d.totalFinancialImpact || 0).toLocaleString('en-IN')}</div>
              <div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[d.status] || ''}`}>
                  {d.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
