import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowUpRight, Upload, Sparkles, Users, Building2, Clock4, AlertTriangle, Wallet, ShieldAlert, FileText, GitCompareArrows, Handshake, Landmark, Settings as Cog, FileDown } from 'lucide-react';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { session, download } from '../../lib/api';
import { money, moneyShort, pct, date, ago, ISSUE, STATUS } from '../../lib/format';
import { Badge, ErrorNote, Skeleton, StatusBadge } from '../../components/ui';
import { ChartTooltip, Legend, SERIES, GRID, AXIS } from '../../components/charts';
import { CountUp } from '../../lib/motion';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const ACT_ICON = { document: FileText, match: GitCompareArrows, dispute: AlertTriangle, negotiation: Handshake, approval: Handshake, vendor: Building2, payment: Landmark, settings: Cog, team: Users };

function Spark({ values = [], color }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 30 - (v / max) * 26 - 2]);
  const line = pts.map((p) => p.join(',')).join(' ');
  const id = `g${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,30 ${line} 100,30`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Kpi({ label, value, num, fmt, sub, tone = 'ink', to, spark, sparkColor = 'var(--color-carbon)', hero = false }) {
  const color = tone === 'red' ? 'text-stamp' : tone === 'green' ? 'text-ok' : 'text-ink';
  const body = (
    <div className={`sheet group relative flex h-full flex-col overflow-hidden p-5 ${hero ? 'ring-aurora' : ''}`}>
      <p className="flex items-center justify-between text-[13px] text-muted">
        {label}
        {to && <ArrowUpRight size={14} className="text-faint opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:opacity-100" />}
      </p>
      <p className={`figure mt-3 text-[32px] ${hero ? 'lit' : ''} ${color}`}>{num != null ? <CountUp value={num} format={fmt} /> : value}</p>
      {sub && <p className="mt-2 text-[12.5px] text-muted">{sub}</p>}
      <div className="-mx-5 -mb-5 mt-auto pt-4">
        <Spark values={spark} color={sparkColor} />
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

// Where every purchase is right now, as one continuous flow
function Pipeline({ k, funnel }) {
  const by = (st) => (funnel || []).find((f) => f.status === st)?.count || 0;
  const stages = [
    { label: 'Documents read', value: k.documentsProcessed, to: '/app/inbox' },
    { label: 'Purchases checked', value: k.purchasesChecked, to: '/app/purchases' },
    { label: 'Waiting for documents', value: k.awaitingDocuments, to: '/app/purchases' },
    { label: 'In dispute', value: k.openDisputes, to: '/app/disputes', tone: 'text-stamp' },
    { label: 'Settled', value: by('resolved') + by('dismissed'), to: '/app/disputes?tab=resolved', tone: 'text-ok' },
  ];
  return (
    <section className="sheet overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-5">
        {stages.map((st, i) => (
          <Link key={st.label} to={st.to} className="group relative px-5 py-4 transition-colors hover:bg-ink/[0.02]">
            {i > 0 && <span className="absolute top-1/2 left-0 hidden h-8 w-px -translate-y-1/2 bg-ink/[0.06] sm:block" />}
            <p className="text-[12px] text-muted">{st.label}</p>
            <p className={`figure mt-1.5 text-[24px] ${st.tone || 'text-ink'}`}>
              <CountUp value={st.value ?? 0} />
            </p>
          </Link>
        ))}
      </div>
      <div className="relative h-[2px] w-full bg-line opacity-70">
        <div className="flow-line absolute inset-0" />
      </div>
    </section>
  );
}

function Onboarding() {
  const pains = session.data?.company?.painPoints || [];
  const extra = [
    pains.includes('gst_itc') && { icon: Landmark, title: 'Upload your GSTR-2B', body: 'See which suppliers haven’t filed and how much input tax credit is at risk.', to: '/app/gst', cta: 'GST & ITC' },
    pains.includes('msme') && { icon: Building2, title: 'Mark your MSME suppliers', body: 'Concord then tracks each invoice’s payment deadline (45 days with a written agreement, 15 without).', to: '/app/vendors', cta: 'Vendors' },
    pains.includes('vendor_followup') && { icon: Handshake, title: 'Check autopilot is on', body: 'Silent vendors get a firmer follow-up drafted for approval.', to: '/app/settings', cta: 'Settings' },
    !pains.includes('msme') && { icon: Building2, title: 'Add vendor details', body: 'Mark MSME suppliers so Concord tracks their 45 or 15-day payment deadline.', to: '/app/vendors', cta: 'Vendors' },
    { icon: Users, title: 'Invite your team', body: 'Members raise disputes, managers approve what goes to vendors.', to: '/app/settings', cta: 'Team' },
  ].filter(Boolean);
  const steps = [
    { icon: Upload, title: 'Upload a PO, challan and invoice', body: 'PDFs or phone photos, any order. Concord reads them and groups them by purchase.', to: '/app/inbox', cta: 'Open inbox' },
    { icon: Sparkles, title: 'Or generate a sample purchase', body: 'Real PDFs with a short delivery or price drift baked in — watch it get caught.', to: '/app/inbox?sample=1', cta: 'Try a sample' },
    ...extra,
  ].slice(0, 4);
  return (
    <section className="sheet ring-aurora p-6">
      <h2 className="text-xl text-ink">Set up your workspace</h2>
      <p className="mt-1 text-sm text-muted">Four steps to your first caught overcharge. Most teams are done in ten minutes.</p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col rounded-xl border border-line-2 bg-ink/[0.02] p-4">
            <span className="flex items-center gap-2 text-xs font-bold text-muted">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-carbon-tint text-carbon-dark">{i + 1}</span>
              <s.icon size={15} />
            </span>
            <p className="mt-3 font-semibold text-ink">{s.title}</p>
            <p className="mt-1 flex-1 text-sm text-muted">{s.body}</p>
            <Link to={s.to} className="btn-secondary btn-sm mt-4 self-start">
              {s.cta}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Overview() {
  useDocumentTitle('Overview');
  const { data, error, loading, reload } = useApi('/overview?weeks=10');
  const pay = useApi('/payments/payrun');
  const feed = useApi('/activity?limit=14');
  const s = session.data;
  const k = data?.kpis;

  if (error) return <ErrorNote error={error} onRetry={reload} />;

  const headline = k
    ? k.openDisputes
      ? `${k.openDisputes} open ${k.openDisputes === 1 ? 'dispute' : 'disputes'} worth ${money(k.moneyAtRisk)}${k.overdueDisputes ? `, ${k.overdueDisputes} past the vendor's reply date` : ''}.`
      : k.documentsProcessed
        ? 'Nothing waiting on you. Every checked purchase is clean or settled.'
        : 'Upload your first documents and Concord will start checking.'
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[1.05] text-ink">
            {greeting()}, {s?.user?.name?.split(' ')[0]}
          </h1>
          <div className="mt-2 text-[14px] text-muted">{loading ? <Skeleton className="mt-2 h-4 w-80" /> : headline}</div>
        </div>
        {k && k.documentsProcessed > 0 && (
          <button className="btn-secondary" onClick={() => download('/reports/savings', 'concord-savings-report.pdf').catch(() => {})}>
            <FileDown size={15} /> Savings report
          </button>
        )}
      </div>

      {k && k.documentsProcessed === 0 && <Onboarding />}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !k ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sheet p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-32" />
              <Skeleton className="mt-6 h-10 w-full" />
            </div>
          ))
        ) : (
          <>
            <Kpi hero label="Money at risk" num={k.moneyAtRisk} fmt={money} sub={`${k.openDisputes} open disputes`} tone={k.moneyAtRisk ? 'red' : 'ink'} to="/app/disputes" spark={(data.series || []).map((x) => x.flagged)} sparkColor="var(--color-stamp)" />
            <Kpi label="Recovered" num={k.moneyRecovered} fmt={money} sub={`${pct(k.recoveryRate)} of everything flagged`} tone="green" spark={(data.series || []).map((x) => x.recovered)} sparkColor="var(--color-ok)" />
            <Kpi label="Touchless matches" num={k.touchlessRate} fmt={(n) => pct(n)} sub={`${k.purchasesChecked} purchases checked, no human needed`} to="/app/purchases" spark={(data.series || []).map((x) => x.matched)} />
            <Kpi label="Time saved" num={k.hoursSaved} fmt={(n) => `${Math.round(n)} hrs`} sub={`vs ~${k.minutesPerManualMatchAssumed} min per manual 3-way match`} spark={(data.series || []).map((x) => x.documents)} sparkColor="var(--color-carbon)" />
          </>
        )}
      </section>

      {k && k.documentsProcessed > 0 && <Pipeline k={k} funnel={data.statusFunnel} />}

      {k && (k.paymentHolds > 0 || k.itcAtRisk > 0) && (
        <section className="grid gap-3 md:grid-cols-2">
          {(data.holds || []).map((h) => (
            <Link key={h.id} to="/app/payments" className="glow group flex items-start gap-4 rounded-2xl border border-stamp/25 bg-stamp-tint p-5 transition-colors hover:border-stamp/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stamp/15 text-stamp">
                <ShieldAlert size={19} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">Payment blocked: bank account changed</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{h.detail}</span>
              </span>
            </Link>
          ))}
          {k.itcAtRisk > 0 && (
            <Link to="/app/gst" className="glow group flex items-start gap-4 rounded-2xl border border-wait/25 bg-wait-tint p-5 transition-colors hover:border-wait/50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wait/15 text-wait">
                <Landmark size={19} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink">
                  <span className="num">{money(k.itcAtRisk)}</span> of input tax credit at risk
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">
                  {k.gstVendorsToChase} supplier{k.gstVendorsToChase === 1 ? ' hasn’t' : 's haven’t'} filed every invoice in GSTR-1, so the GST you paid can’t be claimed yet. See who to chase.
                </span>
              </span>
            </Link>
          )}
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        {/* Needs attention */}
        <section className="sheet overflow-hidden">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">Needs your attention</h2>
            <Link to="/app/disputes" className="text-sm font-semibold text-carbon-dark transition-colors hover:text-ink">
              All disputes
            </Link>
          </header>
          {loading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (data.needsAttention || []).length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No open disputes. When a document doesn’t match, it will show up here.</p>
          ) : (
            <ul>
              {(data.needsAttention || []).map((d) => (
                <li key={d.id} className="border-b border-line-2 last:border-0">
                  <Link to={`/app/disputes/${d.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ink/[0.025]">
                    <div className="min-w-0 flex-1">
                      <p className="flex min-w-0 items-center gap-2 text-sm">
                        <span className="num shrink-0 font-bold text-ink">{d.reference}</span>
                        <span className="truncate text-ink-2">{d.vendor}</span>
                        {d.overdue && <Badge tone="red" className="shrink-0">Overdue</Badge>}
                      </p>
                      <p className="mt-1 truncate text-[13px] text-muted">{d.headline}</p>
                    </div>
                    <div className="hidden shrink-0 sm:block">
                      <StatusBadge status={d.status} />
                    </div>
                    <span className="num w-24 shrink-0 text-right font-display text-[15px] font-semibold text-ink">{money(d.amount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pay run */}
        <section className="sheet flex flex-col overflow-hidden">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">This fortnight’s pay run</h2>
            <Link to="/app/payments" className="text-sm font-semibold text-carbon-dark transition-colors hover:text-ink">
              Open pay run
            </Link>
          </header>
          {pay.loading || !pay.data ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted">Safe to pay</p>
                  <p className="figure mt-1 text-[30px] text-ink">{money(pay.data.summary.payNow)}</p>
                  <p className="text-xs text-muted">{pay.data.summary.payNowCount} verified invoices</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Held back</p>
                  <p className="figure mt-1 text-[30px] text-stamp">{money(pay.data.summary.held)}</p>
                  <p className="text-xs text-muted">on disputed lines only</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {pay.data.summary.msmeAtRisk + pay.data.summary.msmeBreached > 0 && (
                  <Link to="/app/payments?tab=msme" className="flex items-start gap-3 rounded-xl border border-wait/20 bg-wait-tint px-3.5 py-3 text-sm text-ink-2 transition-colors hover:border-wait/45">
                    <ShieldAlert size={18} className="mt-0.5 shrink-0 text-wait" />
                    <span>
                      <strong>
                        {pay.data.summary.msmeAtRisk + pay.data.summary.msmeBreached} MSME invoice{pay.data.summary.msmeAtRisk + pay.data.summary.msmeBreached > 1 ? 's' : ''}
                      </strong>{' '}
                      near or past their MSME payment deadline (45 days, or 15 without a written agreement). Up to <span className="num font-semibold">{money(pay.data.summary.deductionAtRisk)}</span> of tax cost if missed.
                    </span>
                  </Link>
                )}
                {k?.paymentLeakage > 0 && (
                  <Link to="/app/payments?tab=bank" className="flex items-start gap-3 rounded-xl border border-stamp/20 bg-stamp-tint px-3.5 py-3 text-sm text-ink-2 transition-colors hover:border-stamp/45">
                    <Wallet size={18} className="mt-0.5 shrink-0 text-stamp" />
                    <span>
                      <span className="num font-semibold">{money(k.paymentLeakage)}</span> paid twice or overpaid, found in your bank statement.
                    </span>
                  </Link>
                )}
                {pay.data.summary.waiting > 0 && (
                  <p className="flex items-start gap-3 px-3 py-1 text-sm text-muted">
                    <Clock4 size={16} className="mt-0.5 shrink-0" />
                    {pay.data.summary.waiting} invoice{pay.data.summary.waiting > 1 ? 's' : ''} not verified yet — waiting for a challan or PO.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="sheet p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] text-ink">Flagged vs recovered</h2>
              <p className="text-sm text-muted">Per week, last 10 weeks</p>
            </div>
            <Legend
              items={[
                ['Flagged', SERIES[0]],
                ['Recovered', SERIES[1]],
              ]}
            />
          </div>
          <div className="mt-4 h-64">
            {data ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} barGap={2} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="week" tickFormatter={(w) => date(w)} tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={moneyShort} tick={AXIS} axisLine={false} tickLine={false} width={56} />
                  <Tooltip cursor={{ fill: 'var(--color-carbon-tint)' }} content={<ChartTooltip labelFormat={(w) => `Week of ${date(w)}`} />} />
                  <Bar dataKey="flagged" name="Flagged" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="recovered" name="Recovered" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full" />
            )}
          </div>
        </section>

        <section className="sheet p-5">
          <h2 className="text-[17px] text-ink">What went wrong</h2>
          <p className="text-sm text-muted">Every issue found, by money involved</p>
          {data && (data.issueBreakdown || []).length === 0 && <p className="py-10 text-center text-sm text-muted">No issues found yet.</p>}
          <ul className="mt-4 space-y-3">
            {(data?.issueBreakdown || []).slice(0, 7).map((x) => {
              const max = Math.max(...data.issueBreakdown.map((y) => y.amount), 1);
              return (
                <li key={x.code}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">
                      {ISSUE[x.code] || x.code} <span className="text-muted">×{x.count}</span>
                    </span>
                    <span className="num font-semibold text-ink">{money(x.amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.05]">
                    <div className="h-full rounded-full bg-carbon" style={{ width: `${Math.max(2, (x.amount / max) * 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="sheet overflow-hidden">
          <header className="flex items-center justify-between border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">Vendors with the most disputes</h2>
            <Link to="/app/vendors" className="text-sm font-semibold text-carbon-dark transition-colors hover:text-ink">
              All vendors
            </Link>
          </header>
          <table className="table-ledger">
            <thead>
              <tr>
                <th>Vendor</th>
                <th className="text-right">Disputes</th>
                <th className="text-right">Disputed</th>
                <th className="text-right">Recovered</th>
                <th className="text-right">Risk</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topVendors || []).map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link to={`/app/vendors/${v.id}`} className="font-semibold text-ink hover:text-carbon-dark">
                      {v.name}
                    </Link>
                  </td>
                  <td className="num text-right">{v.disputes}</td>
                  <td className="num text-right">{money(v.amount)}</td>
                  <td className="num text-right text-ok">{money(v.recovered)}</td>
                  <td className="text-right">
                    <Badge tone={v.risk >= 60 ? 'red' : v.risk >= 30 ? 'amber' : 'green'}>{v.risk}</Badge>
                  </td>
                </tr>
              ))}
              {data && !(data.topVendors || []).length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No vendor disputes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-5 py-3 text-xs text-muted">
              {data.statusFunnel
                .filter((f) => f.count)
                .map((f) => (
                  <span key={f.status}>
                    {STATUS[f.status]?.label} <strong className="text-ink">{f.count}</strong>
                  </span>
                ))}
              {k?.avgResolutionDays != null && (
                <span>
                  Avg. time to settle <strong className="text-ink">{k.avgResolutionDays} days</strong>
                </span>
              )}
            </div>
          )}
        </section>

        <section className="sheet overflow-hidden">
          <header className="border-b border-line-2 px-5 py-4">
            <h2 className="text-[17px] text-ink">Activity</h2>
          </header>
          <ul className="max-h-[380px] overflow-y-auto px-5 py-2">
            {feed.data?.map((a) => {
              const Icon = ACT_ICON[a.kind] || FileText;
              const inner = (
                <>
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-2 bg-ink/[0.03] text-muted">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{a.message}</span>
                    <span className="text-xs text-muted">
                      {a.actorName ? `${a.actorName}, ` : ''}
                      {ago(a.createdAt)}
                    </span>
                  </span>
                </>
              );
              const to = a.refType === 'Dispute' ? `/app/disputes/${a.refId}` : a.refType === 'Match' ? `/app/purchases/${a.refId}` : null;
              return (
                <li key={a._id} className="border-b border-line-2 last:border-0">
                  {to ? (
                    <Link to={to} className="-mx-2 flex gap-3 rounded-lg px-2 py-2.5 hover:bg-ink/[0.025]">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex gap-3 py-2.5">{inner}</div>
                  )}
                </li>
              );
            })}
            {feed.data && !feed.data.length && <li className="py-8 text-center text-sm text-muted">Nothing yet.</li>}
          </ul>
        </section>
      </div>
      {k && (
        <p className="text-xs text-faint">
          {k.documentsProcessed} documents read, {pct(k.autoReadRate)} without manual correction. {k.vendors} vendors
          {k.invalidGstinVendors ? `, ${k.invalidGstinVendors} with an invalid GSTIN on file` : ''}.
        </p>
      )}
    </div>
  );
}
