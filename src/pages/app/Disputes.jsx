import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileWarning, Search, Mail, Loader2, Download, Copy, FileSpreadsheet } from 'lucide-react';
import { api, download } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, date, daysFromNow, ISSUE } from '../../lib/format';
import { Badge, EmptyState, ErrorNote, LoadingRows, Modal, PageHeader, PriorityMark, StatusBadge, Tabs } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';

const TABS = [
  { value: 'active', label: 'Active', match: (d) => !['resolved', 'dismissed'].includes(d.status) },
  { value: 'pending_approval', label: 'Needs approval', match: (d) => d.status === 'pending_approval' },
  { value: 'awaiting_vendor', label: 'Waiting on vendor', match: (d) => d.status === 'awaiting_vendor' },
  { value: 'resolved', label: 'Resolved', match: (d) => d.status === 'resolved' },
  { value: 'dismissed', label: 'Dismissed', match: (d) => d.status === 'dismissed' },
  { value: 'all', label: 'All', match: () => true },
];

function Due({ d }) {
  if (['resolved', 'dismissed'].includes(d.status) || !d.dueDate) return <span className="text-faint">—</span>;
  const n = daysFromNow(d.dueDate);
  if (n < 0) return <span className="font-semibold text-stamp">{-n}d overdue</span>;
  return <span className={n <= 2 ? 'font-semibold text-wait' : 'text-ink-2'}>{n === 0 ? 'Today' : `in ${n}d`}</span>;
}

export default function Disputes() {
  useDocumentTitle('Disputes');
  const navigate = useNavigate();
  const toast = useToast();
  const { refresh } = useShell();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'active';
  const [q, setQ] = useState('');
  const [sel, setSel] = useState([]);
  const [batch, setBatch] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useApi('/disputes');

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const m = TABS.find((x) => x.value === tab)?.match || (() => true);
    return (data || []).filter((d) => m(d) && (!t || [d.reference, d.vendor?.name, d.invoice?.docNumber, d.po?.docNumber, ...(d.flags || []).map((f) => f.description)].some((s) => s?.toLowerCase().includes(t))));
  }, [data, tab, q]);

  const selected = (data || []).filter((d) => sel.includes(d._id));
  const sameVendor = selected.length >= 2 && new Set(selected.map((d) => d.vendor?._id)).size === 1;
  const total = rows.reduce((a, d) => a + (d.totalFinancialImpact || 0), 0);

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const draftBatch = async () => {
    setBusy(true);
    try {
      const res = await api.post('/disputes/batch-draft', { disputeIds: sel, tone: 'collaborative' });
      setBatch({ ...res, vendor: selected[0]?.vendor?.name, count: res.disputeIds.length });
      setSel([]);
      reload();
      refresh();
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Disputes"
        subtitle="Each one has the evidence attached: which document says what, and how the amount was worked out."
        actions={
          <>
            <button className="btn-secondary" title="Debit-note vouchers for every settled dispute, ready to import into TallyPrime" onClick={() => download('/reports/tally-debit-notes', 'concord-tally-debit-notes.xml').catch((e) => toast(e.message, { tone: 'error' }))}>
              <FileSpreadsheet size={15} /> Export to Tally
            </button>
            <button className="btn-secondary" onClick={() => download('/audit-trail/export', 'concord-audit-trail.csv').catch((e) => toast(e.message, { tone: 'error' }))}>
              <Download size={15} /> Audit trail (CSV)
            </button>
          </>
        }
      />
      <div className="sheet overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 px-3 pt-2">
          <Tabs
            value={tab}
            onChange={(v) => {
              setParams(v === 'active' ? {} : { tab: v });
              setSel([]);
            }}
            tabs={TABS.map((t) => ({ value: t.value, label: t.label, count: (data || []).filter(t.match).length }))}
          />
          <label className="relative mb-2 w-full sm:w-64">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Reference, vendor, invoice" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search disputes" />
          </label>
        </div>

        {sel.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-y border-carbon/25 bg-carbon-tint px-5 py-2.5 text-sm">
            <span className="font-semibold text-ink">{sel.length} selected</span>
            {sameVendor ? (
              <button className="btn-primary btn-sm" onClick={draftBatch} disabled={busy}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Draft one email to {selected[0].vendor?.name}
              </button>
            ) : (
              <span className="text-muted">{selected.length < 2 ? 'Select another dispute with the same vendor to combine them into one email.' : 'Combined emails need disputes with the same vendor.'}</span>
            )}
            <button className="ml-auto text-muted hover:text-ink" onClick={() => setSel([])}>
              Clear
            </button>
          </div>
        )}

        {loading && !data ? (
          <LoadingRows />
        ) : error ? (
          <div className="p-5">
            <ErrorNote error={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={FileWarning} title={tab === 'active' ? 'No open disputes' : 'Nothing in this view'} body={tab === 'active' ? 'When an invoice doesn’t match its PO or challan, the dispute appears here with its evidence.' : 'Try another tab or clear the search.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-10" />
                  <th>Dispute</th>
                  <th>What’s wrong</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const closed = ['resolved', 'dismissed'].includes(d.status);
                  return (
                    <tr key={d._id} className="row-link" onClick={() => navigate(`/app/disputes/${d._id}`)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        {!closed && <input type="checkbox" className="h-4 w-4 accent-carbon" checked={sel.includes(d._id)} onChange={() => toggle(d._id)} aria-label={`Select ${d.reference}`} />}
                      </td>
                      <td>
                        <Link to={`/app/disputes/${d._id}`} className="num font-semibold text-ink hover:text-carbon-dark" onClick={(e) => e.stopPropagation()}>
                          {d.reference}
                        </Link>
                        <p className="text-xs text-muted">{d.vendor?.name}</p>
                      </td>
                      <td>
                        <div className="flex max-w-[340px] flex-wrap gap-1">
                          {[...new Set((d.flags || []).map((f) => f.code))].slice(0, 3).map((c) => (
                            <Badge key={c} tone={(d.flags || []).find((f) => f.code === c)?.severity === 'HIGH' ? 'red' : 'amber'}>
                              {ISSUE[c] || c}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          Invoice <span className="num">{d.invoice?.docNumber}</span> against <span className="num">{d.po?.docNumber || 'no PO'}</span>
                        </p>
                      </td>
                      <td className="num text-right font-display text-[15px] font-semibold text-ink">
                        {money(d.totalFinancialImpact)}
                        {d.status === 'resolved' && d.recoveredAmount > 0 && <p className="text-xs font-semibold text-ok">{money(d.recoveredAmount)} back</p>}
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>
                        <PriorityMark priority={d.priority} />
                      </td>
                      <td className="text-sm whitespace-nowrap">
                        <Due d={d} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td colSpan={2} className="px-4 py-3 text-sm text-muted">
                    {rows.length} dispute{rows.length === 1 ? '' : 's'}
                  </td>
                  <td className="num px-4 py-3 text-right font-bold text-ink">{money(total)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!batch}
        onClose={() => setBatch(null)}
        title={`One email to ${batch?.vendor} covering ${batch?.count} disputes`}
        wide
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                navigator.clipboard?.writeText(batch.body);
                toast('Copied');
              }}
            >
              <Copy size={15} /> Copy
            </button>
            <button className="btn-primary" onClick={() => setBatch(null)}>
              Done
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted">
          The draft has been added to each dispute and is waiting for manager approval. Written by {batch?.generatedBy === 'llm' ? 'the AI agent' : 'Concord’s templates'} on {date(new Date())}.
        </p>
        <pre className="max-h-[50vh] overflow-y-auto rounded-xl border border-line-2 bg-ink/[0.035] p-4 font-sans text-sm whitespace-pre-wrap text-ink-2">{batch?.body}</pre>
      </Modal>
    </div>
  );
}
