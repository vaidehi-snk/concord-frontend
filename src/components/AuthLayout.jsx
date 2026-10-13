import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Server } from 'lucide-react';
import { Logo, Stamp } from './ui';
import { CatchTicker } from './marketing';

// Form on the left; on the right, a lit "night desk" that shows what Concord
// actually does — the three documents, the stamp, and real catches cycling by.
export default function AuthLayout({ children, aside }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/" className="text-[13px] text-muted transition-colors hover:text-ink">
            Back to site
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">{children}</div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-faint">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={12} /> Encrypted in transit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={12} /> Your data is visible only to your workspace
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Server size={12} /> Hosted on secure cloud
          </span>
        </div>
      </div>

      <aside className="relative m-3 hidden overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#070a12] lg:block">
        <div className="aurora pointer-events-none absolute -inset-20 opacity-70" />
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          {aside || (
            <>
              <div>
                <p className="kicker">What Concord caught this week, in the sample company</p>
                <div className="mt-4 max-w-md">
                  <CatchTicker />
                </div>
              </div>
              <div className="relative mx-auto h-[290px] w-full max-w-[460px]">
                {[
                  ['bg-sheet-po', 'PURCHASE ORDER', 'PO-4471', '500 × ₹48', '-rotate-[5deg] top-0 left-0'],
                  ['bg-sheet-dn', 'DELIVERY CHALLAN', 'DC-8842', '420 received', 'rotate-[2deg] top-16 left-10'],
                  ['bg-sheet-inv', 'TAX INVOICE', 'SGE/1182', '500 × ₹48', '-rotate-[1deg] top-32 left-20'],
                ].map(([bg, t, n, v, pos]) => (
                  <div key={t} className={`absolute w-[300px] rounded-xl ${bg} p-4 text-sheet-ink shadow-[0_40px_80px_-20px_rgba(0,0,0,0.95)] ${pos}`}>
                    <div className="flex justify-between border-b border-sheet-ink/10 pb-2 text-[11px] font-extrabold text-sheet-ink/70">
                      <span>{t}</span>
                      <span className="num">{n}</span>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-sheet-ink/70">MS Bracket 40×40</span>
                      <span className={`num font-semibold ${t === 'DELIVERY CHALLAN' ? 'text-[#c3302b]' : ''}`}>{v}</span>
                    </div>
                  </div>
                ))}
                <div className="absolute top-[228px] left-[250px]">
                  <Stamp land className="text-xl">
                    ₹4,531 held
                  </Stamp>
                </div>
              </div>
              <div>
                <p className="max-w-md font-display text-[28px] leading-[1.12] font-semibold tracking-[-0.03em] text-ink">Every invoice checked against what you ordered and what actually arrived — before you pay it.</p>
                <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                  {[
                    ['13', 'checks per purchase'],
                    ['45-day', 'MSME deadline tracking'],
                    ['GSTR-2B', 'ITC reconciliation'],
                  ].map(([a, b]) => (
                    <div key={b} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 backdrop-blur">
                      <p className="figure text-[19px] text-ink">{a}</p>
                      <p className="mt-1 text-[11.5px] leading-snug text-muted">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
