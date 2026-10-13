import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, MessageSquareWarning, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useDocumentTitle } from '../lib/hooks';
import { money, date, ISSUE } from '../lib/format';
import { Logo, ErrorNote, Field, Skeleton, Stamp, Badge } from '../components/ui';

function Compare({ c }) {
  const rows = c.invoice.map((it) => {
    const key = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const po = c.po.find((p) => key(p.description) === key(it.description)) || c.po.find((p) => key(p.description).slice(0, 8) === key(it.description).slice(0, 8));
    const dn = c.dn.find((p) => key(p.description) === key(it.description)) || c.dn.find((p) => key(p.description).slice(0, 8) === key(it.description).slice(0, 8));
    return { it, po, dn };
  });
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="text-[11px] font-semibold tracking-wide text-muted">
            <th className="px-4 py-2.5 text-left">Item</th>
            <th className="bg-po px-4 py-2.5 text-right">Ordered (PO)</th>
            <th className="bg-dn px-4 py-2.5 text-right">Received (challan)</th>
            <th className="bg-inv px-4 py-2.5 text-right">Your invoice</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ it, po, dn }, i) => {
            const qtyBad = (dn && it.quantity > dn.quantity) || (po && it.quantity > po.quantity);
            const priceBad = po && it.unitPrice > po.unitPrice * 1.0001;
            return (
              <tr key={i} className="border-t border-line-2">
                <td className="px-4 py-3 font-medium text-ink">{it.description}</td>
                <td className="num bg-po/40 px-4 py-3 text-right">{po ? `${po.quantity} × ${money(po.unitPrice, { decimals: po.unitPrice % 1 ? 2 : 0 })}` : <span className="font-semibold text-stamp">Not on PO</span>}</td>
                <td className={`num bg-dn/40 px-4 py-3 text-right ${dn && it.quantity > dn.quantity ? 'font-bold text-stamp' : ''}`}>{dn ? dn.quantity : '—'}</td>
                <td className="num bg-inv/40 px-4 py-3 text-right">
                  <span className={qtyBad ? 'font-bold text-stamp' : ''}>{it.quantity}</span> <span className={priceBad ? 'font-bold text-stamp' : 'text-muted'}>× {money(it.unitPrice, { decimals: it.unitPrice % 1 ? 2 : 0 })}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function VendorRespond() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ name: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  useDocumentTitle(data ? `${data.reference} from ${data.buyer}` : 'Invoice query');

  useEffect(() => {
    api
      .get(`/public/disputes/${token}`, { auth: false })
      .then(setData)
      .catch(setError);
  }, [token]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post(`/public/disputes/${token}/respond`, { decision: mode, ...form }, { auth: false });
      setData(res);
      setDone(mode);
      setMode(null);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const closed = data && ['resolved', 'dismissed'].includes(data.status);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line-2 bg-desk/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={14} /> Private link for this invoice only
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {!data && !error && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-60" />
          </div>
        )}
        {error && !data && <ErrorNote error={error} />}
        {data && (
          <>
            <p className="text-sm text-muted">
              Query from <strong className="text-ink">{data.buyer}</strong> to {data.vendorName}
            </p>
            <h1 className="mt-2 text-[30px] leading-[1.05] font-bold text-ink sm:text-[40px]">
              Invoice <span className="num">{data.invoiceNumber}</span> doesn’t match what was ordered and received
            </h1>
            <p className="mt-2 max-w-2xl text-ink-2">
              {data.buyer} compared your invoice with their purchase order <span className="num font-semibold">{data.poNumber}</span>
              {data.challanNumber && (
                <>
                  {' '}
                  and delivery challan <span className="num font-semibold">{data.challanNumber}</span>
                </>
              )}
              . Here is exactly what differs. You can accept the adjustment or explain why the invoice is correct.
            </p>

            <section className="mt-6 overflow-hidden rounded-2xl border border-line-2 bg-white/[0.02]">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
                <h2 className="text-[17px] font-semibold text-ink">
                  Reference <span className="num">{data.reference}</span>
                </h2>
                <p className="text-sm text-muted">
                  Adjustment requested <strong className="num text-lg text-stamp">{money(data.totalFinancialImpact)}</strong>
                </p>
              </header>
              <ul>
                {(data.flags || []).map((f, i) => (
                  <li key={i} className="border-b border-line-2 px-5 py-3.5 last:border-0">
                    <div className="flex flex-wrap items-start gap-3">
                      <Badge tone={f.severity === 'HIGH' ? 'red' : 'amber'}>{ISSUE[f.code] || f.code}</Badge>
                      <p className="flex-1 text-sm text-ink">{f.description}</p>
                      {f.financialImpact > 0 && <span className="num text-sm font-bold">{money(f.financialImpact)}</span>}
                    </div>
                    {f.formula && <p className="num mt-1.5 text-xs text-muted">{f.formula}</p>}
                  </li>
                ))}
              </ul>
              <Compare c={data.comparison} />
            </section>

            {closed ? (
              <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-ok/30 bg-ok-tint px-5 py-4">
                <CheckCircle2 className="text-ok" />
                <p className="flex-1 text-ink">{done === 'accept' ? 'Thank you. The buyer has been notified and will deduct the agreed amount — please send the credit note for your records.' : 'This query is closed. No further action is needed.'}</p>
                {done === 'accept' && <Stamp tone="green" land>Accepted</Stamp>}
              </div>
            ) : done === 'contest' ? (
              <div className="mt-6 rounded-2xl border border-line-2 bg-white/[0.02] px-5 py-4 text-ink">Your explanation has been sent to {data.buyer}. They’ll review it and reply by email.</div>
            ) : (
              <section className="mt-6 rounded-2xl border border-line-2 bg-white/[0.02] p-5">
                <h2 className="text-[17px] font-semibold text-ink">Your response</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button onClick={() => setMode('accept')} className={`rounded-xl border p-4 text-left transition-colors ${mode === 'accept' ? 'border-ok bg-ok-tint' : 'border-line hover:border-faint'}`}>
                    <CheckCircle2 className="text-ok" size={20} />
                    <p className="mt-2 font-semibold text-ink">Accept the adjustment</p>
                    <p className="text-sm text-muted">{money(data.totalFinancialImpact)} will be deducted. Send a credit note when convenient.</p>
                  </button>
                  <button onClick={() => setMode('contest')} className={`rounded-xl border p-4 text-left transition-colors ${mode === 'contest' ? 'border-wait bg-wait-tint' : 'border-line hover:border-faint'}`}>
                    <MessageSquareWarning className="text-wait" size={20} />
                    <p className="mt-2 font-semibold text-ink">The invoice is correct</p>
                    <p className="text-sm text-muted">Explain why — a revised PO, a second delivery, an agreed rate change.</p>
                  </button>
                </div>
                {mode && (
                  <div className="animate-in mt-4 space-y-3">
                    <ErrorNote error={error} />
                    <Field label="Your name">
                      <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label={mode === 'accept' ? 'Message (optional)' : 'What should they know?'}>
                      <textarea className="input min-h-28" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={mode === 'accept' ? 'Credit note will follow by Friday.' : 'The remaining 80 units were delivered on 14 Sep against challan DC-8851.'} />
                    </Field>
                    <button className={mode === 'accept' ? 'btn-primary' : 'btn-ink'} onClick={submit} disabled={busy || (mode === 'contest' && !form.message.trim())}>
                      {busy && <Loader2 size={15} className="animate-spin" />} {mode === 'accept' ? 'Accept adjustment' : 'Send explanation'}
                    </button>
                  </div>
                )}
              </section>
            )}

            {(data.thread || []).length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 text-sm font-bold text-ink">Messages</h2>
                <ul className="space-y-3">
                  {(data.thread || []).map((t, i) => (
                    <li key={i} className={`rounded-xl border px-4 py-3 text-sm ${t.direction === 'you' ? 'border-dn-edge/40 bg-dn' : 'border-line-2 bg-white/[0.02]'}`}>
                      <p className="text-xs text-muted">
                        {t.direction === 'you' ? 'You' : data.buyer}, {date(t.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-ink">{t.body.replace(/^\s*Subject:.*\n+/i, '')}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="mt-10 text-center text-xs text-faint">Sent with Concord, invoice reconciliation for Indian businesses. You don’t need an account to respond.</p>
          </>
        )}
      </main>
    </div>
  );
}
