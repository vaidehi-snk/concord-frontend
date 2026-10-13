import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCw, Loader2, Unlock, Upload, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, date, pct, MATCH_STATUS, DOC } from '../../lib/format';
import { ErrorNote, Skeleton, StatusBadge, Stamp } from '../../components/ui';
import { ThreeWayTable, Checklist } from '../../components/domain';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';

const PAPER = {
  PO: 'bg-po border-po-edge/50',
  DN: 'bg-dn border-dn-edge/50',
  INVOICE: 'bg-inv border-inv-edge/50',
};

function DocSlot({ type, doc }) {
  if (!doc)
    return (
      <Link to="/app/inbox" className="flex min-h-[132px] flex-col justify-between rounded-xl border border-dashed border-line p-4 text-muted transition-colors hover:border-carbon/50 hover:text-carbon-dark">
        <span className="text-xs font-extrabold tracking-wide">{DOC[type].label}</span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Upload size={15} /> Not received yet
        </span>
      </Link>
    );
  return (
    <div className={`min-h-[132px] rounded-xl border p-4 ${PAPER[type]}`}>
      <div className="flex items-baseline justify-between gap-2 border-b border-ink/10 pb-2">
        <span className="text-xs font-bold tracking-wide text-ink-2">{DOC[type].label}</span>
        <span className="num text-sm font-bold text-ink">{doc.docNumber || '—'}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted">Dated</dt>
        <dd className="num text-right text-ink">{date(doc.docDate || doc.createdAt, { year: true })}</dd>
        {type !== 'DN' && (
          <>
            <dt className="text-muted">Total</dt>
            <dd className="num text-right font-semibold text-ink">{money(doc.extracted?.totalAmount)}</dd>
          </>
        )}
        <dt className="text-muted">Lines</dt>
        <dd className="num text-right text-ink">{doc.extracted?.lineItems?.length || 0}</dd>
        <dt className="text-muted">Read</dt>
        <dd className="text-right text-ink">{doc.extractionMethod === 'manual' ? 'corrected by hand' : `${pct(doc.parseConfidence)} confident`}</dd>
      </dl>
    </div>
  );
}

export default function PurchaseDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { refresh } = useShell();
  const { data, error, loading, reload } = useApi(`/matches/${id}`);
  const disputeId = data?.match?.dispute?._id;
  const dispute = useApi(disputeId ? `/disputes/${disputeId}` : null, [disputeId]);
  const [busy, setBusy] = useState(null);
  const m = data?.match;
  useDocumentTitle(m ? m.poNumber : 'Purchase');

  const act = async (what) => {
    setBusy(what);
    try {
      await api.post(`/matches/${id}/${what}`);
      await reload();
      refresh();
      toast(what === 'release' ? 'Released on a 2-way match' : 'Re-checked against current rules');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading || !m)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-60" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );

  const flags = dispute.data?.dispute?.flags || [];
  const canRelease = m.po && m.invoice && !m.deliveryNote && m.status !== 'disputed' && m.status !== 'matched';

  return (
    <div>
      <Link to="/app/purchases" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={15} /> Purchases
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="num text-[30px] leading-none text-ink">{m.poNumber}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
            {m.vendor && (
              <Link to={`/app/vendors/${m.vendor._id}`} className="font-semibold text-ink-2 hover:text-carbon-dark">
                {m.vendor.name}
              </Link>
            )}
            <StatusBadge status={m.status} map={MATCH_STATUS} />
            {m.matchedAt && <span>{m.matchType === 'two_way' ? '2-way' : '3-way'} match on {date(m.matchedAt)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRelease && (
            <button className="btn-secondary" onClick={() => act('release')} disabled={!!busy} title="For services or items with no delivery challan">
              {busy === 'release' ? <Loader2 size={15} className="animate-spin" /> : <Unlock size={15} />} Release without challan
            </button>
          )}
          <button className="btn-secondary" onClick={() => act('recheck')} disabled={!!busy}>
            {busy === 'recheck' ? <Loader2 size={15} className="animate-spin" /> : <RotateCw size={15} />} Re-check
          </button>
        </div>
      </div>

      <div className="relative grid gap-4 md:grid-cols-3">
        <DocSlot type="PO" doc={m.po} />
        <DocSlot type="DN" doc={m.deliveryNote} />
        <DocSlot type="INVOICE" doc={m.invoice} />
        {m.status === 'matched' && (
          <div className="pointer-events-none absolute -top-4 right-4 hidden md:block">
            <Stamp tone="green" land className="bg-desk/80 text-lg">
              Verified {m.matchType === 'two_way' ? '2-way' : '3-way'}
            </Stamp>
          </div>
        )}
      </div>

      {m.dispute && (
        <Link to={`/app/disputes/${m.dispute._id}`} className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-stamp/25 bg-stamp-tint px-4 py-3 text-sm text-ink-2 transition-colors hover:border-stamp/50">
          <span className="font-bold text-stamp">{m.dispute.reference}</span>
          <span className="flex-1">
            {flags.length || 'Some'} issue{flags.length === 1 ? '' : 's'} worth <strong className="num">{money(m.dispute.totalFinancialImpact)}</strong> raised with the vendor.
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-carbon-dark">
            Open dispute <ArrowRight size={15} />
          </span>
        </Link>
      )}

      {m.status === 'awaiting_documents' && (
        <p className="mt-5 rounded-xl border border-wait/20 bg-wait-tint px-4 py-3 text-sm text-ink-2">
          {!m.invoice
            ? 'Nothing to check until the invoice arrives. The PO and challan are filed and waiting.'
            : !m.po
              ? 'The invoice is here but its purchase order isn’t. Upload the PO so prices and quantities can be checked.'
              : 'The invoice matches the PO. Concord is waiting for the delivery challan to confirm what was actually received before marking it safe to pay.'}
        </p>
      )}

      <section className="sheet mt-6 overflow-hidden">
        <header className="border-b border-line-2 px-5 py-4">
          <h2 className="text-[17px] text-ink">Line by line</h2>
          <p className="text-sm text-muted">What was ordered, what arrived, and what was billed.</p>
        </header>
        {m.po || m.invoice ? <ThreeWayTable po={m.po} dn={m.deliveryNote} invoice={m.invoice} flags={flags} /> : <p className="p-5 text-sm text-muted">No documents with line items yet.</p>}
      </section>

      {data.checks && (
        <section className="sheet mt-6 p-5">
          <h2 className="mb-4 text-[17px] text-ink">Checks</h2>
          <Checklist checks={data.checks} />
        </section>
      )}
    </div>
  );
}
