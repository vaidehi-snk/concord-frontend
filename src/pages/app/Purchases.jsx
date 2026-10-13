import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Search } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, ago, MATCH_STATUS, pct } from '../../lib/format';
import { EmptyState, ErrorNote, LoadingRows, PageHeader, StatusBadge, Tabs, TriplicateSlots } from '../../components/ui';

export default function Purchases() {
  useDocumentTitle('Purchases');
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi('/matches');
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data || []).filter((m) => (tab === 'all' || m.status === tab) && (!t || [m.poNumber, m.vendor?.name, m.invoice?.docNumber, m.deliveryNote?.docNumber].some((x) => x?.toLowerCase().includes(t))));
  }, [data, tab, q]);
  const count = (s) => (data || []).filter((m) => m.status === s).length;
  const evaluated = (data || []).filter((m) => m.status !== 'awaiting_documents');
  const touchless = evaluated.filter((m) => m.touchless).length;

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle="Every purchase order and the documents that have arrived against it. A purchase is checked the moment its invoice lands, and again when the challan arrives."
      >
        {data && evaluated.length > 0 && (
          <p className="mt-3 text-sm text-ink-2">
            <strong className="text-ink">{pct(touchless / evaluated.length)}</strong> of checked purchases went through with no one touching them.
          </p>
        )}
      </PageHeader>

      <div className="sheet overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-3 pt-2">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All', count: data?.length },
              { value: 'awaiting_documents', label: 'Waiting for documents', count: count('awaiting_documents') },
              { value: 'disputed', label: 'Disputed', count: count('disputed') },
              { value: 'needs_review', label: 'Needs review', count: count('needs_review') },
              { value: 'matched', label: 'Matched', count: count('matched') },
            ]}
          />
          <label className="relative mb-2 w-full sm:w-64">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="PO, invoice or vendor" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search purchases" />
          </label>
        </div>
        {loading && !data ? (
          <LoadingRows />
        ) : error ? (
          <div className="p-5">
            <ErrorNote error={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Layers} title={data?.length ? 'Nothing in this view' : 'No purchases yet'} body={data?.length ? 'Try another tab or clear the search.' : 'Upload a purchase order, challan or invoice and it will appear here.'} action={!data?.length && <Link className="btn-primary" to="/app/inbox">Upload documents</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[760px]">
              <thead>
                <tr>
                  <th>Purchase order</th>
                  <th>Vendor</th>
                  <th>Documents</th>
                  <th className="text-right">Invoice total</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m._id} className="row-link" onClick={() => navigate(`/app/purchases/${m._id}`)}>
                    <td>
                      <Link to={`/app/purchases/${m._id}`} className="num font-bold text-ink hover:text-carbon-dark" onClick={(e) => e.stopPropagation()}>
                        {m.poNumber}
                      </Link>
                      {m.touchless && <span className="ml-2 text-xs font-semibold text-ok">touchless</span>}
                    </td>
                    <td className="text-ink-2">{m.vendor?.name || '—'}</td>
                    <td>
                      <span className="flex items-center gap-3">
                        <TriplicateSlots po={m.po} dn={m.deliveryNote} invoice={m.invoice} size="sm" />
                        <span className="text-xs text-muted">{[!m.po && 'PO', !m.deliveryNote && 'challan', !m.invoice && 'invoice'].filter(Boolean).join(', ') ? `missing ${[!m.po && 'PO', !m.deliveryNote && 'challan', !m.invoice && 'invoice'].filter(Boolean).join(', ')}` : 'all three'}</span>
                      </span>
                    </td>
                    <td className="num text-right font-semibold">{money(m.invoice?.extracted?.totalAmount)}</td>
                    <td>
                      <span className="flex items-center gap-2">
                        <StatusBadge status={m.status} map={MATCH_STATUS} />
                        {m.dispute && <span className="num text-xs text-muted">{m.dispute.reference}</span>}
                      </span>
                    </td>
                    <td className="text-xs whitespace-nowrap text-muted">{ago(m.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
