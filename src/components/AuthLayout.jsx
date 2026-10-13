import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { Logo } from './ui';
import { INVOICE_NOTES } from './marketing';
import { warmUp } from '../lib/api';

// Form on the left; on the right, one real catch on paper, so the screen says
// what Concord does while someone signs in.
export default function AuthLayout({ children, aside }) {
  useEffect(() => {
    // the free server sleeps; wake it while the person types
    warmUp();
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative flex flex-col px-4 py-5 sm:px-10 lg:px-16">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Concord home" className="rounded-md">
            <Logo />
          </Link>
          <Link to="/" className="rounded-md px-2 py-2 text-sm text-muted transition-colors hover:text-ink">
            Back to site
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={13} /> Encrypted in transit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={13} /> Only your workspace sees your data
          </span>
          <Link to="/privacy" className="py-2 underline-offset-2 hover:text-ink hover:underline">
            Privacy
          </Link>
          <Link to="/terms" className="py-2 underline-offset-2 hover:text-ink hover:underline">
            Terms
          </Link>
        </div>
      </div>

      <aside className="hidden border-l border-line bg-band lg:block">
        <div className="flex h-full flex-col justify-center px-12 py-16 xl:px-20">
          {aside || (
            <>
              <p className="max-w-[16em] font-display text-[34px] leading-[1.12] text-ink">Every invoice checked against what you ordered and what arrived, before you pay it.</p>
              <div className="relative mt-10 max-w-[460px] rotate-[-1deg] rounded-[3px] bg-sheet-inv px-7 pt-6 pb-8 text-sheet-ink shadow-[0_16px_34px_-18px_rgba(27,36,51,0.35)]">
                <p className="font-display text-[18px] font-semibold">INV-5860, Shree Ganesh Engineering</p>
                <p className="mt-0.5 text-[13px] text-[#5a6170]">Checked against PO-2760 and challan DC-5860</p>
                <ul className="mt-4">
                  {INVOICE_NOTES.map((x) => (
                    <li key={x.n} className="flex items-baseline justify-between gap-4 border-t border-dashed border-sheet-ink/20 py-2.5 text-[14px]">
                      <span>{x.title}</span>
                      <span className={`num font-semibold ${x.ok ? 'text-ok' : 'text-stamp'}`}>{x.amount || (x.ok ? 'Passed' : 'On hold')}</span>
                    </li>
                  ))}
                </ul>
                <span className="lp-stamp stamp-land" style={{ right: '-18px', bottom: '-22px' }}>
                  <small>Held</small>
                  <b>₹4,130</b>
                </span>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
