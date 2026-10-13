import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UploadCloud, Loader2, Sparkles, FileText, Trash2, Pencil, CheckCircle2, AlertTriangle, Clock4, Download, X } from 'lucide-react';
import { api, download } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, ago, DOC, pct } from '../../lib/format';
import { Badge, DocChip, EmptyState, ErrorNote, Field, LoadingRows, Modal, PageHeader, Tabs } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';

const SAMPLES = [
  { kind: 'short_delivery', label: 'Short delivery', body: 'Challan shows fewer units than billed' },
  { kind: 'price_drift', label: 'Price drift', body: 'Invoice rate above the PO rate' },
  { kind: 'gst_error', label: 'GST error', body: 'Wrong tax rate or bad GSTIN' },
  { kind: 'mixed', label: 'Several issues', body: 'More than one problem at once' },
  { kind: 'clean', label: 'Clean purchase', body: 'Everything matches — auto-approved' },
];

function ResultRow({ r }) {
  const d = r.document;
  return (
    <li className="animate-in flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-2 px-5 py-3 last:border-0">
      {r.error ? <AlertTriangle size={18} className="text-stamp" /> : r.dispute ? <AlertTriangle size={18} className="text-stamp" /> : <CheckCircle2 size={18} className="text-ok" />}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {d?.type && <DocChip type={d.type} number={d.docNumber} />}
          <span className="truncate text-muted">{d?.originalFilename}</span>
        </p>
        <p className="mt-0.5 text-sm text-ink-2">
          {r.error
            ? `Couldn’t read this file: ${r.error}`
            : r.dispute
              ? `${r.dispute.flags} issue${r.dispute.flags > 1 ? 's' : ''} found against ${r.match?.poNumber}.`
              : r.match?.status === 'matched'
                ? `${r.match.poNumber} matched — all checks passed.`
                : r.match
                  ? `Filed under ${r.match.poNumber}. Waiting for the rest of the documents.`
                  : 'Read, but no PO number found to group it by.'}
          {r.vendorCreated && <span className="text-muted"> New vendor added: {r.vendor?.name}.</span>}
        </p>
        {r.hold && <p className="mt-1 text-xs text-stamp">Payment blocked: {r.hold.detail}</p>}
      </div>
      {r.dispute ? (
        <Link to={`/app/disputes/${r.dispute._id}`} className="btn-danger btn-sm">
          {r.dispute.reference}: {money(r.dispute.totalFinancialImpact)}
        </Link>
      ) : r.match ? (
        <Link to={`/app/purchases/${r.match._id}`} className="btn-secondary btn-sm">
          View purchase
        </Link>
      ) : null}
    </li>
  );
}

function EditDocument({ doc, onClose, onSaved }) {
  const [f, setF] = useState({ type: doc.type, docNumber: doc.docNumber || '', poReference: doc.poReference || '', totalAmount: doc.extracted?.totalAmount ?? '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/documents/${doc._id}`, { ...f, totalAmount: f.totalAmount === '' ? undefined : Number(f.totalAmount) });
      onSaved();
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Correct ${doc.originalFilename || 'document'}`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />} Save and re-check
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorNote error={error} />
        <p className="text-sm text-muted">Fix anything the reader got wrong. The purchase is re-matched and every check runs again.</p>
        <Field label="Document type">
          <select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            {Object.entries(DOC).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Document number">
            <input className="input num" value={f.docNumber} onChange={(e) => setF({ ...f, docNumber: e.target.value })} />
          </Field>
          <Field label="PO it refers to" hint={f.type === 'PO' ? 'Not needed for a PO' : 'This is how documents are grouped'}>
            <input className="input num" value={f.poReference} disabled={f.type === 'PO'} onChange={(e) => setF({ ...f, poReference: e.target.value })} />
          </Field>
        </div>
        <Field label="Total incl. GST (₹)">
          <input className="input num" type="number" step="0.01" value={f.totalAmount} onChange={(e) => setF({ ...f, totalAmount: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

export default function InboxPage() {
  useDocumentTitle('Inbox');
  const toast = useToast();
  const { refresh } = useShell();
  const [params, setParams] = useSearchParams();
  const fileRef = useRef(null);
  const resultsRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [typeHint, setTypeHint] = useState('');
  const [busy, setBusy] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const docs = useApi('/documents?limit=200');

  const after = (res) => {
    setResults((prev) => [...res.results, ...prev].slice(0, 30));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    docs.reload();
    refresh();
    const disputes = (res.results || []).filter((r) => r.dispute).length;
    const n = (res.results || []).length;
    const failed = (res.results || []).filter((r) => r.error).length;
    const label = `${n} document${n === 1 ? '' : 's'}`;
    toast(failed === n ? `Couldn’t read ${n === 1 ? 'this file' : 'these files'} — see below` : disputes ? `${label} read — ${disputes} raised a dispute` : `${label} read`, { tone: disputes || failed ? 'error' : 'ok' });
  };

  const upload = async (files) => {
    const pdfs = [...files].filter((f) => /\.(pdf|jpe?g|png|webp)$/i.test(f.name) || /pdf|image\/(jpeg|png|webp)/.test(f.type));
    if (!pdfs.length) return setError({ message: 'Upload PDFs or photos (JPG, PNG). Other file types can’t be read.' });
    setError(null);
    setBusy('upload');
    const fd = new FormData();
    pdfs.forEach((f) => fd.append('files', f));
    if (typeHint) fd.append('type', typeHint);
    try {
      after(await api.post('/documents', fd));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  };

  const sample = async (kind) => {
    setError(null);
    setBusy(kind);
    try {
      after(await api.post('/documents/sample-pack', { kind }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  };

  // Same seed for all three so the PO, challan and invoice belong to one purchase
  const downloadPack = async (kind) => {
    const seed = 10000 + Math.floor(Math.random() * 90000);
    try {
      for (const i of [0, 1, 2]) await download(`/documents/sample-pack/${kind}/${i}?seed=${seed}`, `${kind}-${i}.pdf`);
      toast('Three PDFs downloaded. Upload them here, in any order.');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete ${d.originalFilename || d.docNumber}? Its purchase will be re-checked without it.`)) return;
    try {
      await api.del(`/documents/${d._id}`);
      docs.reload();
      refresh();
      toast('Document deleted');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  };

  const list = (docs.data || []).filter((d) => filter === 'all' || (filter === 'review' ? ['needs_review', 'failed'].includes(d.parseStatus) : d.type === filter));
  const count = (fn) => (docs.data || []).filter(fn).length;

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Drop purchase orders, delivery challans and invoices in any order. Concord works out which is which, groups them by PO, and checks each purchase as its documents arrive." />

      {params.get('welcome') && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-carbon/30 bg-carbon-tint px-4 py-3 text-sm text-ink-2">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-carbon-dark" />
          <p className="flex-1">
            Your workspace is ready. Upload a PO, its challan and its invoice — or generate a sample purchase below to see a discrepancy get caught in a few seconds.
          </p>
          <button
            aria-label="Dismiss"
            onClick={() => {
              params.delete('welcome');
              setParams(params);
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            upload(e.dataTransfer.files);
          }}
          className={`relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed px-6 py-10 text-center transition-all duration-300 ${drag ? 'border-carbon bg-carbon-tint' : 'border-line bg-ink/[0.015] hover:border-carbon/40'}`}
        >
          {busy === 'upload' ? (
            <>
              <Loader2 size={36} className="animate-spin text-carbon-dark" />
              <p className="mt-4 font-display text-lg font-semibold text-ink">Reading and matching…</p>
              <p className="text-sm text-muted">Pulling out line items, GSTINs, bank details and totals, then running 13 checks.</p>
            </>
          ) : (
            <>
              <div className="relative flex -space-x-3">
                <span className="h-14 w-11 -rotate-6 rounded-md bg-sheet-po shadow-[0_18px_40px_-18px_rgba(27,36,51,0.35)]" />
                <span className="z-10 h-14 w-11 rounded-md bg-sheet-dn shadow-[0_18px_40px_-18px_rgba(27,36,51,0.35)]" />
                <span className="z-20 h-14 w-11 rotate-6 rounded-md bg-sheet-inv shadow-[0_18px_40px_-18px_rgba(27,36,51,0.35)]" />
              </div>
              <p className="relative mt-6 font-display text-xl font-semibold text-ink">Drop PDFs or photos here</p>
              <p className="relative mt-1.5 max-w-md text-sm text-muted">Up to 30 files at once, 15 MB each. Digital PDFs from Tally, Zoho or any billing tool, scanned bills, or a phone photo of a challan.</p>
              <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
                <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                  <UploadCloud size={16} /> Choose files
                </button>
                <select className="input w-auto" value={typeHint} onChange={(e) => setTypeHint(e.target.value)} aria-label="Document type">
                  <option value="">Detect type automatically</option>
                  <option value="PO">All are purchase orders</option>
                  <option value="DN">All are delivery challans</option>
                  <option value="INVOICE">All are invoices</option>
                </select>
              </div>
              <input ref={fileRef} type="file" accept="application/pdf,.pdf,image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => e.target.files.length && upload(e.target.files)} />
            </>
          )}
        </div>

        <div className={`sheet p-5 ${params.get('sample') ? 'ring-2 ring-carbon/40' : ''}`}>
          <h2 className="flex items-center gap-2 text-ink">
            <Sparkles size={16} className="text-carbon-dark" /> Try a sample purchase
          </h2>
          <p className="mt-1 text-sm text-muted">Generates a real PO, challan and invoice as PDFs and sends them through the same reader your uploads use.</p>
          <ul className="mt-4 space-y-2">
            {SAMPLES.map((s) => (
              <li key={s.kind} className="flex items-center gap-2">
                <button className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-line-2 bg-ink/[0.02] px-3.5 py-2.5 text-left transition-all hover:border-carbon/50 hover:bg-carbon-tint disabled:opacity-60" onClick={() => sample(s.kind)} disabled={!!busy}>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{s.label}</span>
                    <span className="block text-xs text-muted">{s.body}</span>
                  </span>
                  {busy === s.kind && <Loader2 size={16} className="animate-spin text-carbon-dark" />}
                </button>
                <button className="btn-ghost btn-sm" title="Download these sample PDFs to try uploading yourself" aria-label={`Download ${s.label} sample PDFs`} onClick={() => downloadPack(s.kind)}>
                  <Download size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorNote error={error} />
        </div>
      )}

      {results.length > 0 && (
        <section ref={resultsRef} className="sheet mt-6 scroll-mt-24 overflow-hidden">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-3.5">
            <h2 className="text-[17px] text-ink">Just processed</h2>
            <button className="text-sm text-muted hover:text-ink" onClick={() => setResults([])}>
              Clear
            </button>
          </header>
          <ul>
            {results.map((r, i) => (
              <ResultRow key={r.document?._id || i} r={r} />
            ))}
          </ul>
        </section>
      )}

      <section className="sheet mt-6 overflow-hidden">
        <div className="px-5 pt-4">
          <h2 className="text-[17px] text-ink">All documents</h2>
        </div>
        <div className="px-3">
          <Tabs
            value={filter}
            onChange={setFilter}
            tabs={[
              { value: 'all', label: 'All', count: docs.data?.length },
              { value: 'PO', label: 'Purchase orders', count: count((d) => d.type === 'PO') },
              { value: 'DN', label: 'Challans', count: count((d) => d.type === 'DN') },
              { value: 'INVOICE', label: 'Invoices', count: count((d) => d.type === 'INVOICE') },
              { value: 'review', label: 'Needs review', count: count((d) => ['needs_review', 'failed'].includes(d.parseStatus)) },
            ]}
          />
        </div>
        {docs.loading && !docs.data ? (
          <LoadingRows />
        ) : docs.error ? (
          <div className="p-5">
            <ErrorNote error={docs.error} onRetry={docs.reload} />
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={FileText} title="No documents here" body="Upload PDFs above, or generate a sample purchase." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[760px]">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Vendor</th>
                  <th>Purchase</th>
                  <th className="text-right">Total</th>
                  <th>Read</th>
                  <th>Received</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <DocChip type={d.type} number={d.docNumber || '—'} />
                      </div>
                      <p className="mt-1 max-w-[220px] truncate text-xs text-muted">
                        {d.originalFilename}
                        {d.source === 'email' ? ', by email' : d.source === 'api' ? ', via API' : ''}
                      </p>
                    </td>
                    <td className="text-ink-2">{d.vendor?.name || <span className="text-faint">Unknown</span>}</td>
                    <td>
                      {d.match ? (
                        <Link className="num font-semibold text-carbon-dark transition-colors hover:text-ink" to={`/app/purchases/${d.match._id}`}>
                          {d.match.poNumber}
                        </Link>
                      ) : (
                        <span className="text-faint">Not grouped</span>
                      )}
                    </td>
                    <td className="num text-right font-semibold">{money(d.extracted?.totalAmount)}</td>
                    <td>
                      {d.parseStatus === 'parsed' ? (
                        <Badge tone="green" className="gap-1">
                          {pct(d.parseConfidence)} {d.extractionMethod === 'manual' ? 'corrected' : d.extractionMethod === 'vision' ? 'photo' : d.extractionMethod?.includes('llm') ? 'AI' : 'rules'}
                        </Badge>
                      ) : d.parseStatus === 'needs_review' ? (
                        <Badge tone="amber">
                          <Clock4 size={11} /> Check fields
                        </Badge>
                      ) : d.parseStatus === 'failed' ? (
                        <Badge tone="red">Unreadable</Badge>
                      ) : (
                        <Badge>Pending</Badge>
                      )}
                    </td>
                    <td className="text-xs whitespace-nowrap text-muted">{ago(d.createdAt)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(d)} aria-label="Correct fields" title="Correct fields">
                        <Pencil size={14} />
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => remove(d)} aria-label="Delete" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && (
        <EditDocument
          doc={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            docs.reload();
            refresh();
            toast('Saved — purchase re-checked');
          }}
        />
      )}
    </div>
  );
}
