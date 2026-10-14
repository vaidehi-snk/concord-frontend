import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, Upload, Loader2, ShieldAlert, Landmark, FileSpreadsheet } from 'lucide-react';
import { api, download } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, moneyShort, date } from '../../lib/format';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartTooltip, Legend, SERIES, GRID, AXIS } from '../../components/charts';
import { Badge, EmptyState, ErrorNote, LoadingRows, PageHeader, Tabs } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';

const ACTION = {
  pay: { label: 'Pay', tone: 'green' },
  pay_partial: { label: 'Pay part', tone: 'amber' },
  hold: { label: 'Hold', tone: 'red' },
  wait: { label: 'Not verified', tone: 'grey' },
  blocked: { label: 'Blocked', tone: 'red' },
  none: { label: 'Nothing to pay', tone: 'grey' },
};
const PAY_STATUS = {
  matched: { label: 'Matched', tone: 'green' },
  underpaid: { label: 'Underpaid', tone: 'amber' },
  overpaid: { label: 'Overpaid', tone: 'red' },
  duplicate_payment: { label: 'Paid twice', tone: 'red' },
  unmatched: { label: 'No invoice found', tone: 'grey' },
};

function Days({ n, breached }) {
  if (n == null) return <span className="text-faint">—</span>;
  if (n < 0) return <span className="font-semibold text-stamp">{breached ? 'Breached ' : ''}{-n}d late</span>;
  if (n === 0) return <span className="font-semibold text-wait">Today</span>;
  return <span className={n <= 7 ? 'font-semibold text-wait' : 'text-ink-2'}>{n}d left</span>;
}

function PayRun({ days, setDays }) {
  const toast = useToast();
  const { data, error, loading, reload } = useApi(`/payments/payrun?days=${days}`);
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  const s = data?.summary;
  return (
    <>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line-2 bg-line-2 md:grid-cols-4">
        {[
          ['Safe to pay', s && money(s.payNow), s && `${s.payNowCount} invoices in the next ${days} days`, 'text-ink'],
          ['Held on disputes', s && money(s.held), 'only the disputed lines', 'text-stamp'],
          ['Not verified yet', s?.waiting, 'waiting for a challan or PO', 'text-ink'],
          s?.blocked ? ['Blocked', s.blocked, `${money(s.blockedAmount)} — bank account changed`, 'text-stamp'] : ['Overdue', s?.overdue, 'verified but past due date', s?.overdue ? 'text-stamp' : 'text-ink'],
        ].map(([l, v, sub, c]) => (
          <div key={l} className="bg-paper px-6 py-5">
            <p className="text-[13px] text-muted">{l}</p>
            <p className={`figure mt-2 text-[30px] ${c}`}>{v ?? '—'}</p>
            <p className="mt-2 text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>
      <div className="sheet mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 px-5 py-3.5">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Paying invoices due in the next
            <select className="input w-auto py-1" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[7, 14, 30, 60].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <button className="btn-primary btn-sm" disabled={!s?.payNowCount} onClick={() => download(`/payments/payrun/bank-file?days=${days}`, 'concord-payrun.csv').catch((e) => toast(e.message, { tone: 'error' }))}>
            <Download size={14} /> Bank upload file (CSV)
          </button>
        </div>
        {loading && !data ? (
          <LoadingRows />
        ) : !(data.rows || []).length ? (
          <EmptyState icon={Landmark} title="No unpaid invoices" body="Unpaid invoices appear here once they’re uploaded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[960px]">
              <thead>
                <tr>
                  <th>Vendor and invoice</th>
                  <th className="text-right">Invoice total</th>
                  <th className="text-right">Credit</th>
                  <th className="text-right">Hold</th>
                  <th className="text-right">Pay</th>
                  <th>Due</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((r) => (
                  <tr key={r.invoiceId} className={r.inThisRun ? '' : 'opacity-70'}>
                    <td>
                      <p className="font-semibold text-ink">
                        {r.vendor?.name} {r.vendor?.msme && <Badge tone="blue">MSME</Badge>}
                      </p>
                      <p className="num text-xs text-muted">
                        {r.invoice} {r.poNumber && `against ${r.poNumber}`}
                      </p>
                    </td>
                    <td className="num text-right">{money(r.total)}</td>
                    <td className="num text-right text-ok">{r.credit ? `−${money(r.credit)}` : ''}</td>
                    <td className="num text-right text-stamp">{r.hold ? money(r.hold) : ''}</td>
                    <td className="num text-right font-bold">{r.safeToPay ? money(r.safeToPay) : '—'}</td>
                    <td className="text-sm whitespace-nowrap">
                      <Days n={r.daysLeft} />
                      {r.msmeDeadline && <p className="text-xs text-muted">MSME limit {date(r.msmeDeadline)}</p>}
                    </td>
                    <td className="max-w-[260px]">
                      <Badge tone={ACTION[r.action].tone}>{ACTION[r.action].label}</Badge>
                      {r.bankHold && (
                        <p className="mt-1 text-xs leading-snug text-stamp">
                          {r.bankHold}{' '}
                          {r.vendor?.id && (
                            <Link to={`/app/vendors/${r.vendor.id}`} className="font-semibold underline underline-offset-2">
                              Verify
                            </Link>
                          )}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">
                        {r.bankHold ? null : r.dispute ? (
                          <Link to={`/app/disputes/${r.dispute.id}`} className="hover:text-carbon-dark">
                            {r.reason}
                          </Link>
                        ) : (
                          r.reason
                        )}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Msme() {
  const { data, error, loading, reload } = useApi('/payments/payrun?days=60');
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  const rows = (data?.rows || []).filter((r) => r.msmeDeadline).sort((a, b) => a.msmeDaysLeft - b.msmeDaysLeft);
  const s = data?.summary;
  return (
    <>
      <div className="rounded-2xl border border-wait/25 bg-wait-tint p-6 text-sm text-ink">
        <p className="flex items-center gap-2 font-bold">
          <ShieldAlert size={18} className="text-wait" /> Income Tax Act, section 43B(h)
        </p>
        <p className="mt-2 max-w-3xl text-ink-2">
          Payments to micro and small enterprises must be made within the agreed terms, capped at 45 days from accepting the goods (15 days if there’s no written agreement). Pay late and that expense can’t be deducted this financial year — you pay tax on money you actually spent. Concord counts from the delivery challan date.
        </p>
        {s && (
          <p className="mt-3 text-ink">
            <strong>{s.msmeInvoices}</strong> unpaid MSME invoices. <strong className="text-wait">{s.msmeAtRisk}</strong> due within 7 days, <strong className="text-stamp">{s.msmeBreached}</strong> already past the limit. Estimated extra tax if missed: <strong className="num">{money(s.deductionAtRisk)}</strong>{' '}
            <span className="text-muted">(at {Math.round(s.corporateTaxRateAssumed * 10000) / 100}% corporate rate).</span>
          </p>
        )}
      </div>
      <div className="sheet mt-5 overflow-hidden">
        {loading && !data ? (
          <LoadingRows />
        ) : !rows.length ? (
          <EmptyState icon={ShieldAlert} title="No unpaid MSME invoices" body="Mark MSME suppliers on the Vendors page so Concord can track their deadlines." action={<Link className="btn-secondary" to="/app/vendors">Vendors</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[820px]">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Invoice</th>
                  <th>Goods accepted</th>
                  <th>Pay by</th>
                  <th>Time left</th>
                  <th className="text-right">Invoice total</th>
                  <th className="text-right">Tax cost if missed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.invoiceId} className={r.msmeBreached ? 'bg-stamp-tint/40' : r.msmeAtRisk ? 'bg-wait-tint/50' : ''}>
                    <td className="font-semibold text-ink">{r.vendor?.name}</td>
                    <td className="num">{r.invoice}</td>
                    <td>{date(r.acceptedOn)}</td>
                    <td className="font-semibold">{date(r.msmeDeadline)}</td>
                    <td>
                      <Days n={r.msmeDaysLeft} breached={r.msmeBreached} />
                    </td>
                    <td className="num text-right">{money(r.total)}</td>
                    <td className="num text-right font-semibold">{money(Math.round(r.total * (s?.corporateTaxRateAssumed || 0.2517)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Forecast() {
  const { data, error, loading, reload } = useApi('/payments/forecast?weeks=8');
  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading && !data) return <LoadingRows />;
  const rows = data.buckets.map((b) => ({ ...b, name: b.start ? `w/c ${date(b.start)}` : 'Overdue' }));
  return (
    <>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line-2 bg-line-2 md:grid-cols-3">
        {[
          ['Verified to pay', data.totals.verified, 'checked against PO and challan', 'text-ink'],
          ['Waiting on documents', data.totals.unverified, 'due, but not yet verified', 'text-ink'],
          ['Held back', data.totals.held, 'disputed lines and blocked payments', 'text-stamp'],
        ].map(([l, v, sub, c]) => (
          <div key={l} className="bg-paper px-6 py-5">
            <p className="text-[13px] text-muted">{l}</p>
            <p className={`figure mt-2 text-[30px] ${c}`}>{money(v)}</p>
            <p className="mt-2 text-xs text-muted">{sub}, next {data.weeks} weeks</p>
          </div>
        ))}
      </div>
      <section className="sheet mt-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] text-ink">Cash going out, week by week</h2>
            <p className="text-sm text-muted">By due date, including MSME deadlines. Plan the bank balance before the bills arrive.</p>
          </div>
          <Legend
            items={[
              ['Verified', SERIES[0]],
              ['Waiting on documents', SERIES[1]],
              ['Held back', SERIES[2]],
            ]}
          />
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={moneyShort} tick={AXIS} axisLine={false} tickLine={false} width={56} />
              <Tooltip cursor={{ fill: 'var(--color-carbon-tint)' }} content={<ChartTooltip />} />
              <Bar dataKey="verified" name="Verified" stackId="a" fill={SERIES[0]} stroke="var(--color-paper)" strokeWidth={2} />
              <Bar dataKey="unverified" name="Waiting on documents" stackId="a" fill={SERIES[1]} stroke="var(--color-paper)" strokeWidth={2} />
              <Bar dataKey="held" name="Held back" stackId="a" fill={SERIES[2]} stroke="var(--color-paper)" strokeWidth={2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
}

const TEMPLATE = 'Date,Description,Reference,Withdrawal,Deposit\n05/10/2026,NEFT-GANESH ENGINEERING-INV SGE/1182,N2781123,48210.00,\n';

function Bank() {
  const toast = useToast();
  const { refresh } = useShell();
  const fileRef = useRef(null);
  const { data, error, loading, reload } = useApi('/payments');
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  const upload = async (file) => {
    setBusy(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/payments/statement', fd);
      setLast(res.summary);
      reload();
      refresh();
      toast(res.summary.leakage ? `${money(res.summary.leakage)} of leakage found` : `${res.summary.matched} of ${res.summary.total} payments matched`, { tone: res.summary.leakage ? 'error' : 'ok' });
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="sheet p-5">
          <h2 className="text-[17px] text-ink">Reconcile a bank statement</h2>
          <p className="mt-1 text-sm text-muted">Export your current-account statement as CSV from net banking. Concord matches each debit to an invoice — by invoice number in the narration, then vendor and amount — and flags anything paid twice or overpaid.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload CSV
            </button>
            <a className="btn-ghost" href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="statement-template.csv">
              <FileSpreadsheet size={15} /> Column template
            </a>
          </div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files[0] && upload(e.target.files[0])} />
          <p className="hint mt-3">Works with HDFC, ICICI, SBI, Axis and Kotak exports. Needs a date, a narration and a debit/withdrawal column.</p>
        </div>
        {last && (
          <div className="sheet animate-in grid grid-cols-3 gap-4 p-6 text-sm">
            <div>
              <p className="text-muted">Matched</p>
              <p className="figure mt-1 text-[30px] text-ok">
                {last.matched}/{last.total}
              </p>
            </div>
            <div>
              <p className="text-muted">Paid twice</p>
              <p className="figure mt-1 text-[30px] text-stamp">{last.duplicate}</p>
            </div>
            <div>
              <p className="text-muted">Leakage</p>
              <p className="figure mt-1 text-[30px] text-stamp">{money(last.leakage)}</p>
            </div>
          </div>
        )}
      </div>
      <div className="sheet mt-5 overflow-hidden">
        <header className="border-b border-line-2 px-5 py-4">
          <h2 className="text-[17px] text-ink">Payments from statements</h2>
        </header>
        {error ? (
          <div className="p-5">
            <ErrorNote error={error} onRetry={reload} />
          </div>
        ) : loading && !data ? (
          <LoadingRows />
        ) : !data.length ? (
          <EmptyState icon={Landmark} title="No statements reconciled yet" body="Upload a CSV export to check every payment against its invoice." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[820px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Narration</th>
                  <th className="text-right">Amount</th>
                  <th>Invoice</th>
                  <th>Result</th>
                  <th className="text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p._id} className={['duplicate_payment', 'overpaid'].includes(p.status) ? 'bg-stamp-tint/40' : ''}>
                    <td className="whitespace-nowrap">{p.date ? date(p.date) : p.rawDate}</td>
                    <td className="max-w-[280px] truncate text-xs text-ink-2" title={p.description}>
                      {p.description}
                    </td>
                    <td className="num text-right font-semibold">{money(p.amount, { decimals: 2 })}</td>
                    <td>
                      {p.invoice ? (
                        <>
                          <span className="num">{p.invoice.docNumber}</span>
                          <p className="text-xs text-muted">{p.vendor?.name}</p>
                        </>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td>
                      <Badge tone={PAY_STATUS[p.status]?.tone}>{PAY_STATUS[p.status]?.label || p.status}</Badge>
                    </td>
                    <td className="num text-right">{p.status === 'duplicate_payment' ? <span className="font-semibold text-stamp">{money(p.amount)}</span> : p.difference ? <span className={p.difference > 0 ? 'text-stamp' : 'text-wait'}>{p.difference > 0 ? '+' : ''}{money(p.difference, { decimals: 2 })}</span> : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function Payments() {
  useDocumentTitle('Payments');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'run';
  const [days, setDays] = useState(14);
  return (
    <div>
      <PageHeader title="Payments" subtitle="Pay only what’s been verified, hold back only what’s disputed, never miss an MSME deadline, and catch anything paid twice." />
      <div className="mb-5">
        <Tabs
          value={tab}
          onChange={(v) => setParams(v === 'run' ? {} : { tab: v })}
          tabs={[
            { value: 'run', label: 'Pay run' },
            { value: 'forecast', label: 'Cash forecast' },
            { value: 'msme', label: 'MSME deadlines' },
            { value: 'bank', label: 'Bank statement' },
          ]}
        />
      </div>
      {tab === 'run' && <PayRun days={days} setDays={setDays} />}
      {tab === 'forecast' && <Forecast />}
      {tab === 'msme' && <Msme />}
      {tab === 'bank' && <Bank />}
    </div>
  );
}
