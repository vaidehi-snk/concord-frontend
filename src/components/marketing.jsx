import { useEffect, useState } from 'react';
import { LayoutDashboard, Inbox, Layers, FileWarning, Building2, Wallet, Landmark, MessageSquareText, ShieldAlert, Check, X, ArrowRight, Lock } from 'lucide-react';
import { Logo, Stamp } from './ui';
import { CountUp } from '../lib/motion';

/* ------------------------------------------------------------------ */
/*  A faithful miniature of the app's overview, framed as a window.    */
/* ------------------------------------------------------------------ */
const BARS = [
  [18, 8],
  [26, 22],
  [12, 6],
  [34, 30],
  [22, 12],
  [48, 40],
  [30, 18],
  [64, 52],
  [40, 31],
  [28, 10],
];

export function AppMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[1120px] [perspective:2000px]">
      <div className="aurora pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 opacity-80" />
      <div className="ring-aurora overflow-hidden rounded-[18px] bg-[#080b14]/95 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.95),0_0_120px_-40px_rgba(111,125,255,0.6)] [transform:rotateX(9deg)] transition-transform duration-700 hover:[transform:rotateX(2deg)]">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="mx-auto rounded-md bg-white/[0.04] px-3 py-1 text-[11px] text-faint">app.concord.in/overview</span>
        </div>
        <div className="grid grid-cols-[180px_1fr] text-left max-md:grid-cols-1">
          {/* sidebar */}
          <div className="border-r border-white/[0.05] p-3 max-md:hidden">
            <Logo className="scale-90" />
            <div className="mt-4 rounded-lg bg-[linear-gradient(180deg,#8592ff,#5d6cf7)] py-1.5 text-center text-[11px] font-semibold text-white">Upload documents</div>
            <ul className="mt-4 space-y-0.5 text-[11.5px] text-muted">
              {[
                [LayoutDashboard, 'Overview', null, true],
                [Inbox, 'Inbox'],
                [Layers, 'Purchases', '2'],
                [FileWarning, 'Disputes', '4', false, true],
                [Building2, 'Vendors'],
                [Wallet, 'Payments', '1', false, true],
                [Landmark, 'GST & ITC', '2'],
                [MessageSquareText, 'Ask Concord'],
              ].map(([Icon, l, c, active, red]) => (
                <li key={l} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${active ? 'bg-white/[0.06] text-ink' : ''}`}>
                  <Icon size={13} /> <span className="flex-1">{l}</span>
                  {c && <span className={`rounded-full px-1.5 text-[10px] ${red ? 'bg-stamp/15 text-[#ff8f87]' : 'bg-white/[0.06]'}`}>{c}</span>}
                </li>
              ))}
            </ul>
          </div>
          {/* main */}
          <div className="relative overflow-hidden p-5">
            <div className="beam pointer-events-none absolute inset-x-0 top-0 h-1/2" />
            <div className="toast-in absolute right-4 bottom-4 z-10 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#121729]/95 px-3 py-2 text-[11px] shadow-2xl backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-stamp shadow-[0_0_8px_2px_rgba(255,100,90,0.7)]" />
              <span className="text-ink-2">
                <span className="font-semibold text-ink">DSP-0010 opened</span> — short delivery, ₹4,531
              </span>
            </div>
            <p className="flex items-center gap-2 font-display text-[22px] font-semibold tracking-[-0.03em] text-ink">
              Good morning, Priya
              <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 font-sans text-[10px] font-medium tracking-normal text-ok">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-ok" />
                </span>
                Live
              </span>
            </p>
            <p className="text-[11.5px] text-muted">4 open disputes worth ₹32,870, 2 past the vendor’s reply date.</p>
            <div className="mt-4 grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.06] max-sm:grid-cols-2">
              {[
                ['Money at risk', 32870, (n) => `₹${Math.round(n).toLocaleString('en-IN')}`, 'text-stamp lit'],
                ['Recovered', 73743, (n) => `₹${Math.round(n).toLocaleString('en-IN')}`, 'text-ok'],
                ['Touchless matches', 67, (n) => `${Math.round(n)}%`, 'text-ink'],
                ['Time saved', 5, (n) => `${Math.round(n)} hrs`, 'text-ink'],
              ].map(([l, v, f, c]) => (
                <div key={l} className="bg-[#080b14] px-3 py-3">
                  <p className="text-[10.5px] text-muted">{l}</p>
                  <p className={`figure mt-1.5 text-[22px] ${c}`}>
                    <CountUp value={v} format={f} />
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <div className="flex items-start gap-2.5 rounded-xl border border-stamp/25 bg-stamp/[0.07] p-3">
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-stamp" />
                <p className="text-[11px] leading-snug text-ink-2">
                  <span className="font-semibold text-ink">Payment blocked:</span> PRE/5525 asks to be paid to ••••5530, but this vendor has always been paid to ••••1887.
                </p>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-wait/25 bg-wait/[0.07] p-3">
                <Landmark size={14} className="mt-0.5 shrink-0 text-wait" />
                <p className="text-[11px] leading-snug text-ink-2">
                  <span className="font-semibold text-ink">₹1,18,053 of ITC at risk.</span> 2 suppliers haven’t filed every invoice in GSTR-1.
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[1.3fr_1fr] gap-3 max-sm:grid-cols-1">
              <div className="rounded-xl border border-white/[0.06] p-3">
                <p className="text-[11.5px] font-semibold text-ink">Needs your attention</p>
                {[
                  ['DSP-0005', 'Om Sai Packaging', 'Rate above PO', '₹15,604'],
                  ['DSP-0007', 'Shree Ganesh Engg.', 'Wrong GST rate', '₹3,906'],
                  ['DSP-0009', 'Deccan Steel', 'Short delivery', '₹7,434'],
                ].map(([r, v, i, a]) => (
                  <div key={r} className="mt-2 flex items-center gap-2 border-t border-white/[0.05] pt-2 text-[11px]">
                    <span className="num font-semibold text-ink">{r}</span>
                    <span className="truncate text-muted">{v}</span>
                    <span className="ml-auto rounded-full bg-stamp/12 px-1.5 text-[10px] text-[#ff8f87]">{i}</span>
                    <span className="num w-14 text-right font-semibold text-ink">{a}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-white/[0.06] p-3">
                <p className="text-[11.5px] font-semibold text-ink">Flagged vs recovered</p>
                <div className="mt-3 flex h-[86px] items-end gap-1.5">
                  {BARS.map(([f, r], i) => (
                    <div key={i} className="flex flex-1 items-end gap-[2px]">
                      <span className="flex-1 rounded-t-[3px] bg-[#7B87F5]" style={{ height: f * 1.3 }} />
                      <span className="flex-1 rounded-t-[3px] bg-[#1FA58A]" style={{ height: r * 1.3 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* a real document, lit, sliding out of the product */}
      <div className="absolute -right-6 -bottom-10 hidden w-[250px] rotate-[4deg] rounded-xl bg-sheet-inv p-4 text-sheet-ink shadow-[0_40px_80px_-20px_rgba(0,0,0,0.95)] [animation:float_6s_ease-in-out_infinite] lg:block">
        <div className="flex justify-between border-b border-sheet-ink/10 pb-1.5 text-[10px] font-extrabold text-sheet-ink/70">
          <span>TAX INVOICE</span>
          <span className="num">SGE/1182</span>
        </div>
        <div className="mt-2 flex justify-between rounded bg-[#c3302b]/10 px-1 text-[12px] ring-1 ring-[#c3302b]/40">
          <span>MS Bracket 40×40</span>
          <span className="num font-bold text-[#c3302b]">500 × ₹48</span>
        </div>
        <div className="mt-1 flex justify-between px-1 text-[12px] text-sheet-ink/80">
          <span>Hex Bolt M10×50</span>
          <span className="num font-semibold text-sheet-ink">2,000 × ₹6.50</span>
        </div>
        <div className="mt-3 flex justify-end">
          <Stamp paper className="text-sm">
            Only 420 received
          </Stamp>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small, specific visuals for each leak                               */
/* ------------------------------------------------------------------ */
export function LeakVisual({ kind }) {
  if (kind === 'short')
    return (
      <div className="space-y-2 text-[11px]">
        {[
          ['Billed', 500, 'bg-[#7B87F5]'],
          ['Received', 420, 'bg-[#1FA58A]'],
        ].map(([l, v, c]) => (
          <div key={l} className="flex items-center gap-2">
            <span className="w-14 text-muted">{l}</span>
            <span className="h-2 rounded-full" style={{ width: `${(v / 500) * 70}%` }}>
              <span className={`grow-x block h-full rounded-full ${c}`} />
            </span>
            <span className="num text-ink-2">{v}</span>
          </div>
        ))}
        <p className="num pt-1 text-[11px] text-[#ff8f87]">80 × ₹48 + 18% GST = ₹4,531</p>
      </div>
    );
  if (kind === 'price')
    return (
      <svg viewBox="0 0 200 70" className="h-[70px] w-full overflow-visible">
        <line x1="0" x2="200" y1="50" y2="50" stroke="rgba(150,166,230,0.25)" strokeDasharray="3 4" />
        <text x="0" y="64" fontSize="9" fill="rgba(236,239,250,0.45)">
          PO rate ₹58
        </text>
        <polyline className="draw" style={{ '--len': 230 }} points="0,50 50,50 100,40 150,28 200,14" fill="none" stroke="#ff645a" strokeWidth="2" strokeLinejoin="round" />
        {[
          [0, 50],
          [50, 50],
          [100, 40],
          [150, 28],
          [200, 14],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="3" fill="#0a0e18" stroke="#ff645a" strokeWidth="1.5" />
        ))}
        <text x="200" y="8" fontSize="10" textAnchor="end" fill="#ff8f87">
          ₹65
        </text>
      </svg>
    );
  if (kind === 'dup')
    return (
      <div className="relative h-[70px]">
        {[0, 1].map((i) => (
          <div key={i} className={`absolute w-[78%] rounded-lg border px-3 py-2 text-[11px] ${i ? 'top-6 left-[18%] border-stamp/40 bg-[#1a0f14]' : 'top-0 left-0 border-white/10 bg-white/[0.03]'}`}>
            <span className="num text-ink">DST/2216</span>
            <span className="num float-right text-ink-2">₹49,843</span>
            {i === 1 && <span className="mt-0.5 block text-[10px] text-[#ff8f87]">Already received 11 Sep</span>}
          </div>
        ))}
      </div>
    );
  if (kind === 'gstin')
    return (
      <div className="pt-2">
        <p className="num text-[17px] tracking-[0.12em] text-ink-2">
          27AAJFV9042R1Z<span className="rounded bg-stamp/20 px-0.5 text-stamp">8</span>
        </p>
        <p className="mt-2 text-[11px] text-muted">Check digit should be 7. ITC on this bill can’t be claimed.</p>
      </div>
    );
  if (kind === 'bank')
    return (
      <div className="flex items-center gap-2 pt-2 text-[12px]">
        <span className="num rounded-lg border border-ok/30 bg-ok/10 px-2 py-1 text-ok">••••1887</span>
        <ArrowRight size={14} className="text-faint" />
        <span className="num rounded-lg border border-stamp/40 bg-stamp/10 px-2 py-1 text-[#ff8f87]">••••5530</span>
        <Lock size={14} className="ml-auto text-stamp" />
      </div>
    );
  if (kind === 'gst2b')
    return (
      <ul className="space-y-1.5 text-[11px]">
        {[
          ['OMS/3304', false],
          ['GAN/1183', true],
          ['KAV/735', true],
        ].map(([n, ok]) => (
          <li key={n} className="flex items-center gap-2">
            {ok ? <Check size={12} className="text-ok" /> : <X size={12} className="text-stamp" />}
            <span className="num text-ink-2">{n}</span>
            <span className={`ml-auto ${ok ? 'text-muted' : 'text-[#ff8f87]'}`}>{ok ? 'in GSTR-2B' : 'not filed'}</span>
          </li>
        ))}
      </ul>
    );
  if (kind === 'msme')
    return (
      <div className="flex items-center gap-4 pt-1">
        <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle className="ring-draw" cx="22" cy="22" r="18" fill="none" stroke="#f5b947" strokeWidth="4" strokeLinecap="round" style={{ '--off': `${113 - (42 / 45) * 113}` }} />
        </svg>
        <div className="text-[11px]">
          <p className="figure text-[22px] text-wait">3 days</p>
          <p className="text-muted">left of 45 on OSP/3307</p>
        </div>
      </div>
    );
  return null;
}

/* ------------------------------------------------------------------ */
/*  Rotating examples for the auth screens                              */
/* ------------------------------------------------------------------ */
const CATCHES = [
  { tone: 'text-stamp', amount: '₹4,531', title: 'Short delivery caught', body: 'Shree Ganesh billed 500 brackets; the challan shows 420 arrived.' },
  { tone: 'text-wait', amount: '₹37,743', title: 'ITC at risk', body: 'Om Sai Packaging hasn’t filed OMS/3304 in GSTR-1 yet.' },
  { tone: 'text-stamp', amount: '₹16,815', title: 'Payment blocked', body: 'Precision Fasteners’ invoice asks to be paid into a new bank account.' },
  { tone: 'text-ok', amount: '₹70,316', title: 'Recovered', body: 'Deccan Steel confirmed DEC/2216 was sent twice and withdrew it.' },
];

export function CatchTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % CATCHES.length), 3800);
    return () => clearInterval(t);
  }, []);
  const c = CATCHES[i];
  return (
    <div className="relative h-[108px]">
      <div key={i} className="absolute inset-0 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-xl [animation:fade-swap_3.8s_ease_both]">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-semibold text-ink">{c.title}</p>
          <p className={`figure text-[22px] ${c.tone}`}>{c.amount}</p>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-muted">{c.body}</p>
      </div>
    </div>
  );
}
