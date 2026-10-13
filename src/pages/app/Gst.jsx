import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Loader2, Sparkles, MessageCircle, Mail, Copy, Landmark, Download } from 'lucide-react';
import { api, download, session } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, date, dateTime } from '../../lib/format';
import { Badge, EmptyState, ErrorNote, LoadingRows, PageHeader, Tabs } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';

const STATUS = {
  missing_in_2b: { label: 'Not filed by supplier', tone: 'red' },
  value_mismatch: { label: 'Value differs', tone: 'amber' },
  not_in_books: { label: 'Not in your books', tone: 'blue' },
  matched: { label: 'Matched', tone: 'green' },
};

function reminder(v, company) {
  return `Dear ${v.name} team,\n\nWhile reconciling our GSTR-2B we found that the following invoice(s) you raised on ${company} are not yet reported in your GSTR-1: ${v.invoices.join(', ')}.\n\nUntil they are filed we cannot claim the input tax credit (about ${money(v.itcAtRisk)}). Please file or amend GSTR-1 at the earliest and confirm.\n\nThank you,\nAccounts Payable, ${company}`;
}

export default function Gst() {
  useDocumentTitle('GST & ITC');
  const toast = useToast();
  const { refresh } = useShell();
  const fileRef = useRef(null);
  const { data: run, loading, error, reload, setData } = useApi('/gst/2b');
  const [busy, setBusy] = useState(null);
  const [tab, setTab] = useState('attention');
  const company = session.data?.company?.name || 'our company';

  const submit = async (payload, label) => {
    setBusy(label);
    try {
      const res = await api.post('/gst/2b', payload);
      setData(res);
      refresh();
      setTab('attention');
      toast(res.summary.itcAtRisk ? `${money(res.summary.itcAtRisk)} of input tax credit at risk` : 'Every invoice is in your GSTR-2B', { tone: res.summary.itcAtRisk ? 'error' : 'ok' });
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };
  const uploadFile = (f) => {
    const fd = new FormData();
    fd.append('file', f);
    submit(fd, 'upload');
  };
  const runSample = async () => {
    setBusy('sample');
    try {
      const sample = await api.get('/gst/2b/sample');
      await submit({ text: JSON.stringify(sample) }, 'sample');
    } catch (e) {
      toast(e.message, { tone: 'error' });
      setBusy(null);
    }
  };

  const rows = useMemo(() => {
    const all = run?.rows || [];
    if (tab === 'attention') return all.filter((r) => r.status !== 'matched');
    if (tab === 'all') return all;
    return all.filter((r) => r.status === tab);
  }, [run, tab]);
  const s = run?.summary || {};
  const count = (st) => (run?.rows || []).filter((r) => r.status === st).length;

  return (
    <div>
      <PageHeader
        title="GST & ITC"
        subtitle="You can claim input tax credit only on invoices your supplier has reported. Upload your GSTR-2B and Concord shows which invoices are missing, which were filed at a different value, and whom to chase."
        actions={
          <>
            <button className="btn-secondary" onClick={runSample} disabled={!!busy}>
              {busy === 'sample' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Try a sample 2B
            </button>
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={!!busy}>
              {busy === 'upload' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload GSTR-2B
            </button>
            <input ref={fileRef} hidden type="file" accept=".json,.csv,application/json,text/csv" onChange={(e) => e.target.files[0] && uploadFile(e.target.files[0])} />
          </>
        }
      />

      {error && <ErrorNote error={error} onRetry={reload} />}
      {loading && !run ? (
        <LoadingRows />
      ) : !run ? (
        <div className="sheet">
          <EmptyState
            icon={Landmark}
            title="No GSTR-2B uploaded yet"
            body="On the GST portal: Returns → GSTR-2B → pick the month → Download JSON. Upload that file here (a CSV export works too)."
            action={
              <button className="btn-secondary" onClick={runSample} disabled={!!busy}>
                <Sparkles size={15} /> Try it with a sample built from your invoices
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* headline */}
          <section className="grid gap-px overflow-hidden rounded-2xl border border-line-2 bg-line-2 md:grid-cols-[1.4fr_1fr_1fr]">
            <div className="bg-paper px-6 py-6">
              <p className="text-sm text-muted">Input tax credit at risk</p>
              <p className={`figure lit mt-2 text-[44px] ${s.itcAtRisk ? 'text-stamp' : 'text-ok'}`}>{money(s.itcAtRisk)}</p>
              <p className="mt-2 text-sm text-muted">
                {s.missingIn2b} invoice{s.missingIn2b === 1 ? '' : 's'} not filed{s.valueMismatch ? `, ${s.valueMismatch} filed at a different value` : ''}
              </p>
            </div>
            <div className="bg-paper px-6 py-6">
              <p className="text-sm text-muted">Claimable now</p>
              <p className="figure mt-2 text-[34px] text-ink">{money(s.itcClaimable)}</p>
              <p className="mt-2 text-sm text-muted">{s.matched} invoices match the portal</p>
            </div>
            <div className="bg-paper px-6 py-6">
              <p className="text-sm text-muted">Not in your books</p>
              <p className="figure mt-2 text-[34px] text-ink">{s.notInBooks}</p>
              <p className="mt-2 text-sm text-muted">filed by suppliers, never received here</p>
            </div>
          </section>
          <p className="mt-2 text-xs text-faint">
            {run.filename ? `${run.filename}, ` : ''}uploaded {dateTime(run.createdAt)}
            {run.periodStart ? ` covering ${date(run.periodStart)} to ${date(run.periodEnd)}` : ''}.
          </p>

          {s.vendorsToChase?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl text-ink">Suppliers to chase</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(s.vendorsToChase || []).map((v) => {
                  const msg = reminder(v, company);
                  return (
                    <div key={v.gstin || v.name} className="sheet p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {v.vendor ? (
                            <Link to={`/app/vendors/${v.vendor}`} className="font-semibold text-ink hover:text-carbon-dark">
                              {v.name}
                            </Link>
                          ) : (
                            <p className="font-semibold text-ink">{v.name || v.gstin}</p>
                          )}
                          <p className="num mt-0.5 text-xs text-muted">{v.gstin}</p>
                        </div>
                        <p className="figure text-2xl text-stamp">{money(v.itcAtRisk)}</p>
                      </div>
                      <p className="mt-3 text-sm text-muted">
                        Not filed: <span className="num text-ink-2">{v.invoices.join(', ')}</span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a className="btn-secondary btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(msg)}`}>
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                        <a className="btn-secondary btn-sm" href={`mailto:?subject=${encodeURIComponent(`GSTR-1 filing pending: ${v.invoices.join(', ')}`)}&body=${encodeURIComponent(msg)}`}>
                          <Mail size={14} /> Email
                        </a>
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => {
                            navigator.clipboard?.writeText(msg);
                            toast('Reminder copied');
                          }}
                        >
                          <Copy size={14} /> Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="sheet mt-8 overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 px-3 pt-2">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: 'attention', label: 'Needs attention', count: (run.rows || []).length - count('matched') },
                  { value: 'missing_in_2b', label: 'Not filed', count: count('missing_in_2b') },
                  { value: 'value_mismatch', label: 'Value differs', count: count('value_mismatch') },
                  { value: 'not_in_books', label: 'Not in books', count: count('not_in_books') },
                  { value: 'matched', label: 'Matched', count: count('matched') },
                  { value: 'all', label: 'All', count: (run.rows || []).length },
                ]}
              />
              <button className="btn-ghost btn-sm mb-2" onClick={() => download('/gst/2b/sample', 'sample-gstr2b.json').catch((e) => toast(e.message, { tone: 'error' }))}>
                <Download size={14} /> Sample 2B file
              </button>
            </div>
            {rows.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">Nothing here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-ledger min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Invoice</th>
                      <th className="text-right">In your books</th>
                      <th className="text-right">On the portal</th>
                      <th className="text-right">ITC at risk</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <p className="font-medium text-ink">{r.supplierName || '—'}</p>
                          <p className="num text-xs text-muted">{r.supplierGstin}</p>
                        </td>
                        <td>
                          <p className="num text-ink">{r.invoiceNumber}</p>
                          <p className="text-xs text-muted">{date(r.invoiceDate)}</p>
                        </td>
                        <td className="num text-right">{r.booksValue != null ? money(r.booksValue) : <span className="text-faint">—</span>}</td>
                        <td className="num text-right">{r.portalValue != null ? money(r.portalValue) : <span className="text-faint">—</span>}</td>
                        <td className="num text-right font-semibold">{r.itcAtRisk ? <span className="text-stamp">{money(r.itcAtRisk)}</span> : <span className="text-faint">—</span>}</td>
                        <td className="max-w-[300px]">
                          <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                          {r.note && <p className="mt-1 text-xs leading-snug text-muted">{r.note}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
