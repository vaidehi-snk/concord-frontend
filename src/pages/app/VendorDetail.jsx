import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowLeft, Pencil, Loader2, TrendingUp, Minus, ShieldCheck, ShieldAlert, Mail, Phone } from 'lucide-react';
import { api, session } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, date, pct, MATCH_STATUS } from '../../lib/format';
import { Badge, ErrorNote, Modal, Skeleton, StatusBadge } from '../../components/ui';
import { ChartTooltip, Legend, SERIES, GRID, AXIS } from '../../components/charts';
import VendorForm from '../../components/VendorForm';
import { useToast } from '../../components/toast';

const PARTS = [
  ['disputeRate', 'How often bills don’t match', 45],
  ['moneyAtStake', 'Money involved', 25],
  ['recency', 'How recent', 15],
  ['unresolved', 'Still unresolved', 15],
];

export default function VendorDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, error, loading, reload } = useApi(`/vendors/${id}`);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState(0);
  const [busyAcct, setBusyAcct] = useState(null);
  const canVerify = ['admin', 'manager'].includes(session.data?.user?.role);
  const decide = async (account, decision) => {
    setBusyAcct(account + decision);
    try {
      const res = await api.post(`/vendors/${id}/bank-accounts/decide`, { account, decision });
      toast(decision === 'trust' ? `Account verified${res.released ? `; ${res.released} invoice${res.released > 1 ? 's' : ''} released for payment` : ''}` : 'Account rejected. Invoices to it stay blocked.');
      reload();
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusyAcct(null);
    }
  };
  const v = data?.vendor;
  useDocumentTitle(v?.name || 'Vendor');

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`/vendors/${id}`, edit);
      setEdit(null);
      reload();
      toast('Vendor updated');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading && !v)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );

  // Spread between the lowest and highest rate seen: catches spikes that first-vs-last hides
  const series = data.priceHistory
    .filter((x) => (x.points || []).length >= 2)
    .map((x) => {
      const prices = (x.points || []).map((p) => p.price);
      const lo = Math.min(...prices);
      return { ...x, spreadPct: lo ? Math.round(((Math.max(...prices) - lo) / lo) * 1000) / 10 : 0 };
    })
    .sort((a, b) => b.spreadPct - a.spreadPct);
  const s = series[item];
  const risk = data.risk;

  return (
    <div>
      <Link to="/app/vendors" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={15} /> Vendors
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight text-ink">{v.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {v.gstin ? (
              data.gst?.valid ? (
                <Badge tone="green">
                  <ShieldCheck size={12} /> GSTIN valid, {data.gst.state}
                </Badge>
              ) : (
                <Badge tone="red">
                  <ShieldAlert size={12} /> GSTIN invalid
                </Badge>
              )
            ) : (
              <Badge>No GSTIN on file</Badge>
            )}
            {v.msme && <Badge tone="blue">MSME, {v.msmeCategory}</Badge>}
            <span className="text-muted">{v.paymentTermsDays || 30}-day terms</span>
          </div>
          <p className="mt-2 flex flex-wrap gap-4 text-sm text-ink-2">
            {v.contactName && <span>{v.contactName}</span>}
            {v.contactEmail && (
              <a href={`mailto:${v.contactEmail}`} className="inline-flex items-center gap-1 hover:text-carbon-dark">
                <Mail size={14} /> {v.contactEmail}
              </a>
            )}
            {v.phone && (
              <a href={`tel:${v.phone}`} className="inline-flex items-center gap-1 hover:text-carbon-dark">
                <Phone size={14} /> {v.phone}
              </a>
            )}
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setEdit({ name: v.name, contactName: v.contactName, contactEmail: v.contactEmail, phone: v.phone, gstin: v.gstin, paymentTermsDays: v.paymentTermsDays, msme: v.msme, msmeCategory: v.msmeCategory, udyamNumber: v.udyamNumber, hasWrittenAgreement: v.hasWrittenAgreement })}>
          <Pencil size={15} /> Edit details
        </button>
      </div>

      {v.gstin && data.gst && !data.gst.valid && (
        <div className="mb-6 rounded-xl border border-stamp/25 bg-stamp-tint px-4 py-3 text-sm text-ink">
          <strong className="num">{v.gstin}</strong> fails validation: {data.gst.reason}. Input tax credit can’t be claimed on invoices carrying an invalid GSTIN — ask the vendor to confirm their registration.
        </div>
      )}

      {v.bankAccounts?.length > 0 && (
        <section className={`sheet mb-6 overflow-hidden ${(v.bankAccounts || []).some((b) => b.status === 'unverified') ? 'border-stamp/40' : ''}`}>
          <header className="border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">Bank accounts</h2>
            <p className="text-sm text-muted">Every account this vendor’s invoices have asked to be paid into. A new one blocks payment until someone verifies it.</p>
          </header>
          <ul>
            {(v.bankAccounts || []).map((b) => (
              <li key={b.account} className="flex flex-wrap items-center gap-4 border-b border-line-2 px-5 py-4 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="num font-semibold text-ink">
                    {b.account} <span className="ml-2 text-sm font-normal text-muted">{b.ifsc}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    First seen {b.firstSeenDoc ? `on ${b.firstSeenDoc}` : ''} {b.firstSeenAt ? date(b.firstSeenAt, { year: true }) : ''}
                    {b.verifiedBy ? `. ${b.status === 'trusted' ? 'Verified' : 'Rejected'} by ${b.verifiedBy} on ${date(b.verifiedAt)}` : ''}
                  </p>
                </div>
                {b.status === 'trusted' && <Badge tone="green">Trusted</Badge>}
                {b.status === 'rejected' && <Badge tone="red">Rejected</Badge>}
                {b.status === 'unverified' &&
                  (canVerify ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-stamp">Called {v.contactName || 'the vendor'} on a number you already had?</span>
                      <button className="btn-secondary btn-sm" disabled={!!busyAcct} onClick={() => decide(b.account, 'trust')}>
                        {busyAcct === b.account + 'trust' ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Confirmed, release payment
                      </button>
                      <button className="btn-danger btn-sm" disabled={!!busyAcct} onClick={() => decide(b.account, 'reject')}>
                        Not genuine
                      </button>
                    </div>
                  ) : (
                    <Badge tone="red">Waiting for a manager to verify</Badge>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="sheet p-5">
          <p className="text-sm text-muted">Risk score</p>
          <p className={`figure lit text-[52px] ${risk.score >= 60 ? 'text-stamp' : risk.score >= 30 ? 'text-wait' : 'text-ok'}`}>
            {risk.score}
            <span className="text-lg font-semibold text-faint">/100</span>
          </p>
          <ul className="mt-5 space-y-3">
            {PARTS.map(([k, label, max]) => (
              <li key={k}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-2">{label}</span>
                  <span className="num font-semibold text-ink">
                    {risk.parts[k]}
                    <span className="text-faint">/{max}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div className="h-full rounded-full bg-carbon" style={{ width: `${(risk.parts[k] / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-muted">Purchases checked</dt>
              <dd className="num text-lg font-bold">{risk.purchases}</dd>
            </div>
            <div>
              <dt className="text-muted">Dispute rate</dt>
              <dd className="num text-lg font-bold">{risk.purchases ? pct(Math.min(1, risk.disputeRate)) : '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Disputed</dt>
              <dd className="num text-lg font-bold">{money(v.stats?.totalDisputedAmount || 0)}</dd>
            </div>
            <div>
              <dt className="text-muted">Recovered</dt>
              <dd className="num text-lg font-bold text-ok">{money(v.stats?.recoveredAmount || 0)}</dd>
            </div>
          </dl>
        </section>

        <section className="sheet min-w-0 p-5">
          <h2 className="text-[17px] text-ink">Price history</h2>
          <p className="text-sm text-muted">Rates on every PO and invoice from this vendor. Catches slow creep that no single invoice reveals.</p>
          {series.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">Needs at least two documents with the same item to draw a trend.</p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {series.slice(0, 6).map((x, i) => (
                  <button key={x.item} onClick={() => setItem(i)} className={`rounded-full border px-3 py-1 text-sm transition-colors ${i === item ? 'border-transparent bg-ink text-desk' : 'border-line text-ink-2 hover:border-faint'}`}>
                    {x.item.length > 28 ? `${x.item.slice(0, 28)}…` : x.item}
                    <span className={`ml-1.5 font-semibold ${i === item ? '' : x.spreadPct > 0 ? 'text-stamp' : 'text-muted'}`}>{x.spreadPct > 0 ? `±${x.spreadPct}%` : 'steady'}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-ink">
                {(() => {
                  const po = (s.points || []).filter((p) => p.type === 'PO').map((p) => p.price);
                  const inv = (s.points || []).filter((p) => p.type === 'INVOICE').map((p) => p.price);
                  const agreed = po.length ? Math.min(...po) : null;
                  const billed = inv.length ? Math.max(...inv) : null;
                  const f = (n) => money(n, { decimals: n % 1 ? 2 : 0 });
                  if (agreed && billed && billed > agreed * 1.001)
                    return (
                      <span className="inline-flex items-center gap-2">
                        <TrendingUp size={16} className="text-stamp" /> Agreed at <strong className="num">{f(agreed)}</strong> on the PO, billed as high as <strong className="num text-stamp">{f(billed)}</strong> ({Math.round(((billed - agreed) / agreed) * 1000) / 10}% over).
                      </span>
                    );
                  return (
                    <span className="inline-flex items-center gap-2">
                      <Minus size={16} className="text-muted" /> Billed rates have stayed at or below the PO rate across {(s.points || []).length} documents.
                    </span>
                  );
                })()}
              </p>
              <div className="mt-3 flex justify-end">
                <Legend
                  items={[
                    ['Agreed on PO', SERIES[0]],
                    ['Billed on invoice', SERIES[2]],
                  ]}
                />
              </div>
              <div className="mt-2 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(s.points || []).map((p) => ({ t: date(p.date), doc: p.doc, [p.type === 'PO' ? 'po' : 'inv']: p.price }))}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="t" tick={AXIS} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS} axisLine={false} tickLine={false} width={56} domain={[(m) => Math.floor(m * 0.92), (m) => Math.ceil(m * 1.06)]} tickFormatter={(n) => `₹${n}`} />
                    <Tooltip content={<ChartTooltip valueFormat={(n) => money(n, { decimals: n % 1 ? 2 : 0 })} labelFormat={(l) => l} />} />
                    <Line type="stepAfter" connectNulls dataKey="po" name="Agreed on PO" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 4, fill: SERIES[0], stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    <Line type="linear" connectNulls dataKey="inv" name="Billed on invoice" stroke={SERIES[2]} strokeWidth={2} dot={{ r: 4, fill: SERIES[2], stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="sheet overflow-hidden">
          <header className="border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">Disputes</h2>
          </header>
          <table className="table-ledger">
            <tbody>
              {(data.disputes || []).map((d) => (
                <tr key={d._id}>
                  <td>
                    <Link to={`/app/disputes/${d._id}`} className="num font-bold text-ink hover:text-carbon-dark">
                      {d.reference}
                    </Link>
                    <p className="text-xs text-muted">{date(d.createdAt)}</p>
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="num text-right font-semibold">{money(d.totalFinancialImpact)}</td>
                </tr>
              ))}
              {!(data.disputes || []).length && (
                <tr>
                  <td className="py-8 text-center text-muted">No disputes with this vendor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
        <section className="sheet overflow-hidden">
          <header className="border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">Purchases</h2>
          </header>
          <table className="table-ledger">
            <tbody>
              {(data.matches || []).map((m) => (
                <tr key={m._id}>
                  <td>
                    <Link to={`/app/purchases/${m._id}`} className="num font-bold text-ink hover:text-carbon-dark">
                      {m.poNumber}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={m.status} map={MATCH_STATUS} />
                  </td>
                  <td className="num text-right">{money(m.invoice?.extracted?.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Edit ${v.name}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy && <Loader2 size={15} className="animate-spin" />} Save
            </button>
          </>
        }
      >
        {edit && <VendorForm value={edit} onChange={setEdit} />}
      </Modal>
    </div>
  );
}
