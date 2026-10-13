import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus, ArrowRight, Loader2, FileStack, GitCompareArrows, ShieldCheck, Handshake, Landmark, MessageCircle, BadgeIndianRupee, Clock4, Camera, ShieldAlert, FileSpreadsheet, Bot, Sparkles } from 'lucide-react';
import { Logo, Stamp, ErrorNote } from '../components/ui';
import Triplicate from '../components/Triplicate';
import { AppMockup, LeakVisual } from '../components/marketing';
import { CountUp } from '../lib/motion';
import { Checklist, FlagCard } from '../components/domain';
import { useDocumentTitle, useDemo } from '../lib/hooks';

const LEAKS = [
  {
    title: 'Short deliveries billed in full',
    body: 'The challan says 420 arrived. The invoice charges for 500. Nobody compares the two before paying.',
    how: 'Every billed quantity is checked against what the challan says was received.',
  },
  {
    title: 'Rates that creep above the PO',
    body: '₹58 a box becomes ₹65 on the third order. Each invoice looks normal on its own.',
    how: 'Each line is compared with the agreed PO rate, and every vendor’s price history is tracked.',
  },
  {
    title: 'Duplicate bills',
    body: 'The same invoice re-sent a month later, or re-numbered with the same amount.',
    how: 'Invoice numbers and amounts are compared across everything that vendor has sent.',
  },
  {
    title: 'GST you can’t claim back',
    body: 'A wrong GSTIN or the wrong tax rate means input tax credit gets denied — found at audit, too late.',
    how: 'Every GSTIN is verified with the government check-digit formula, and the GST rate is checked against the PO.',
  },
  {
    title: 'Payments sent to a fraudster’s account',
    body: 'A genuine-looking invoice, or a “please note our new bank details” email, and the money goes somewhere else. It’s the costliest invoice fraud there is.',
    how: 'Every payee account a vendor has used is remembered. A new one blocks payment until someone verifies it by phone.',
  },
  {
    title: 'GST your supplier never filed',
    body: 'You paid the GST on the invoice, but the supplier didn’t report it in GSTR-1, so it never reaches your GSTR-2B and the credit is lost.',
    how: 'Upload your GSTR-2B and Concord shows every invoice the supplier hasn’t filed, and who to chase.',
  },
  {
    title: 'Paying MSME suppliers late',
    body: 'Since FY 2023-24, a payment to a micro or small supplier made after 45 days isn’t tax-deductible that year (Income Tax Act §43B(h)).',
    how: 'Every MSME invoice gets a statutory deadline, and the pay run puts it first.',
  },
];

const STEPS = [
  { icon: FileStack, title: 'Drop in the paperwork', body: 'POs, delivery challans and GST invoices as PDFs or phone photos — any order, as many as you like. Or forward them by email.' },
  { icon: GitCompareArrows, title: 'Concord pairs them up', body: 'Each document is identified, its vendor found by GSTIN, and joined to its purchase by PO number.' },
  { icon: ShieldCheck, title: '13 checks, line by line', body: 'Quantities, rates, GST, arithmetic, duplicates, GSTIN. Every rupee flagged shows how it was worked out.' },
  { icon: Handshake, title: 'Settle with the vendor', body: 'A drafted email for approval, a link the vendor can answer from their phone, and a debit note when they agree.' },
  { icon: BadgeIndianRupee, title: 'Pay the right amount', body: 'A pay run that releases what’s verified, holds what’s disputed, and checks the bank statement afterwards.' },
];

const SAMPLE_FLAGS = [
  {
    code: 'SHORT_DELIVERY',
    severity: 'HIGH',
    description: '"MS Bracket 40x40": billed for 500, but DC-8842 shows only 420 received.',
    expected: 420,
    actual: 500,
    expectedSource: 'DC-8842',
    actualSource: 'SGE/1182',
    formula: '(500 − 420) × ₹48 = ₹3,840 + 18% GST = ₹4,531.20',
    financialImpact: 4531.2,
  },
  {
    code: 'TAX_RATE_MISMATCH',
    severity: 'HIGH',
    description: 'GST charged at 28% on SGE/1182; PO-4471 specifies 18%. Check the HSN rate before paying.',
    expected: '18%',
    actual: '28%',
    expectedSource: 'PO-4471',
    actualSource: 'SGE/1182',
    formula: '(28% − 18%) × ₹43,600 = ₹4,360',
    financialImpact: 4360,
  },
];
const SAMPLE_CHECKS = [
  ['Invoice is backed by a purchase order', 'pass'],
  ['Every billed item was ordered', 'pass'],
  ['Billed quantity was actually delivered', 'fail'],
  ['Unit prices match the agreed PO rates', 'pass'],
  ['GST rate matches the PO', 'fail'],
  ['Each line: quantity × rate = amount', 'pass'],
  ['Invoice totals add up', 'pass'],
  ['Supplier GSTIN passes the check digit', 'pass'],
  ['Not a duplicate of an earlier invoice', 'pass'],
  ['Delivery challan readable for every item', 'pass'],
].map(([label, status], i) => ({ code: String(i), label, status }));

const COMPARE = [
  ['Reads invoices and extracts the data', true, true, true, false],
  ['Matches PO, delivery challan and invoice line by line', true, false, true, false],
  ['Works without an ERP or IT project', true, 'partly', false, true],
  ['Checks GSTIN validity and GST rate per invoice', true, false, 'partly', false],
  ['Tracks MSME 45-day payment deadlines (§43B(h))', true, false, false, false],
  ['Drafts and follows up the vendor dispute', true, false, false, false],
  ['Vendor can respond from a link, no login', true, false, 'partly', false],
  ['Checks the bank statement for wrong or double payments', true, false, 'partly', false],
  ['Reads phone photos of challans and scanned bills', true, true, 'partly', false],
  ['Reconciles GSTR-2B: which suppliers haven’t filed', true, false, 'partly', false],
  ['Blocks payment when a vendor’s bank account changes', true, false, 'partly', false],
  ['Exports debit notes straight into Tally', true, false, false, false],
  ['Priced for a 10–200 person business', true, false, false, true],
];

function Cell({ v, lit }) {
  if (v === true) return <Check size={18} className={`mx-auto ${lit ? 'text-ok drop-shadow-[0_0_8px_rgba(63,217,154,0.8)]' : 'text-ink-2'}`} aria-label="Yes" />;
  if (v === false) return <Minus size={16} className="mx-auto text-faint/60" aria-label="No" />;
  return <span className="text-[11px] font-semibold text-wait/80">Partly</span>;
}

const PLANS = [
  { name: 'Starter', price: 'Free', per: '', blurb: 'For trying Concord on real paperwork.', items: ['50 documents a month', 'All 13 checks', 'Bank-detail change alerts', 'Vendor response links', '1 user'], cta: 'Start free', to: '/register' },
  {
    name: 'Growth',
    price: '₹4,999',
    per: '/month',
    blurb: 'For finance teams paying vendors every week.',
    items: ['1,000 documents a month', 'Photo and scanned-bill reading', 'GSTR-2B reconciliation', 'Pay run, MSME tracking, bank checks', 'Approval workflow, autopilot follow-ups', 'Tally export, Ask Concord', '5 users'],
    cta: 'Start free, upgrade later',
    to: '/register',
    featured: true,
  },
  { name: 'Scale', price: 'Talk to us', per: '', blurb: 'For multi-plant and multi-entity groups.', items: ['Unlimited documents', 'API and email intake', 'ERP connectors', 'Custom rules and SSO'], cta: 'Book a walkthrough', to: '/register' },
];

const FAQ = [
  ['Do we need an ERP or any integration?', 'No. Concord works from the PDFs your vendors already send you. Upload them, forward them to your Concord email address, or push them from any system with an API key. Settled disputes export to Tally as debit-note vouchers.'],
  ['What does the AI do, and what do rules do?', 'Every money decision — every flag and every rupee amount — comes from deterministic checks you can read, with the calculation shown. AI is used for reading unusual document layouts, drafting vendor emails, judging vendor replies, and answering questions about your data. AI-drafted emails always wait for a human approval.'],
  ['What about scanned or photographed invoices?', 'Digital PDFs are read by deterministic rules. Scanned pages and phone photos (a challan on WhatsApp, say) are read by a vision model, then marked for a quick human glance rather than trusted blindly. The checks that follow are the same rules either way.'],
  ['How is our data kept separate?', 'Every request is tied to your company through a signed login token, and every database query is scoped to your company. Vendors only see their own dispute, through a private unguessable link.'],
];

const LEAK_KIND = ['short', 'price', 'dup', 'gstin', 'bank', 'gst2b', 'msme'];
const SOURCES = ['Tally Prime', 'Zoho Books', 'Busy', 'Marg ERP', 'SAP Business One', 'Excel', 'Handwritten challans'];

function Section({ id, kicker, title, intro, children, className = '', center = false }) {
  return (
    <section id={id} className={`relative mx-auto max-w-[1200px] scroll-mt-24 px-5 py-24 sm:px-8 lg:py-32 ${className}`}>
      <div data-reveal className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
        {kicker && <p className="kicker">{kicker}</p>}
        <h2 className="mt-3 text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-ink sm:text-[48px]">{title}</h2>
        {intro && <p className={`mt-5 text-[16px] leading-relaxed text-muted ${center ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>{intro}</p>}
      </div>
      <div className="mt-14">{children}</div>
    </section>
  );
}

export default function Landing() {
  useDocumentTitle();
  const demo = useDemo();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const DemoButton = ({ className = 'btn-primary h-12 px-6 text-[15px]' }) => (
    <button className={className} onClick={() => demo.start()} disabled={demo.busy}>
      {demo.busy ? (
        <>
          <Loader2 size={17} className="animate-spin" /> Setting up a sample company…
        </>
      ) : (
        <>Open the live demo</>
      )}
    </button>
  );

  return (
    <div className="overflow-x-clip text-ink">
      {/* NAV */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? 'border-b border-white/[0.06] bg-desk/75 backdrop-blur-xl' : 'border-b border-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-5 sm:px-8">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden gap-7 text-[14px] text-muted md:flex" aria-label="Sections">
            <a href="#leaks" className="transition-colors hover:text-ink">Product</a>
            <a href="#how" className="transition-colors hover:text-ink">How it works</a>
            <a href="#compare" className="transition-colors hover:text-ink">Compare</a>
            <a href="#pricing" className="transition-colors hover:text-ink">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-ink">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/login" className="btn-ghost text-[14px]">
              Log in
            </Link>
            <Link to="/register" className="btn-ink hidden h-9 px-4 text-[14px] sm:inline-flex">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-36 sm:pt-44">
        <div className="grid-lines pointer-events-none absolute inset-x-0 top-0 h-[900px]" />
        <div className="pointer-events-none absolute top-[-200px] left-1/2 h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(111,125,255,0.22),transparent)]" />
        <div className="relative mx-auto max-w-[1200px] px-5 text-center sm:px-8">
          <a href="#leaks" className="chip animate-rise mx-auto transition-colors hover:border-carbon/40 hover:text-ink">
            <Sparkles size={13} className="text-carbon-dark" /> Now reads challan photos and reconciles GSTR-2B
            <ArrowRight size={13} className="text-faint" />
          </a>
          <h1 className="text-gradient animate-rise mx-auto mt-7 max-w-5xl text-[48px] leading-[0.98] font-semibold tracking-[-0.05em] [animation-delay:80ms] sm:text-[82px]">
            Pay only for what you ordered and actually received.
          </h1>
          <p className="animate-rise mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-muted [animation-delay:160ms] sm:text-[19px]">
            Concord reads your purchase orders, delivery challans and GST invoices, matches them line by line, and settles every difference with the vendor — before the money leaves your account.
          </p>
          <div className="animate-rise mt-10 flex flex-wrap items-center justify-center gap-3 [animation-delay:240ms]">
            <DemoButton />
            <Link to="/register" className="btn-secondary h-12 px-6 text-[15px]">
              Start free
            </Link>
          </div>
          {demo.error && (
            <div className="mx-auto mt-4 max-w-md text-left">
              <ErrorNote error={demo.error} onRetry={() => demo.start()} />
            </div>
          )}
          <p className="animate-rise mt-6 text-[13px] text-faint [animation-delay:300ms]">No ERP or IT project needed. Works on the PDFs you already get. Every flagged rupee is explained.</p>
        </div>
        <div className="animate-rise relative mt-20 px-5 [animation-delay:380ms] sm:px-8">
          <AppMockup />
        </div>
        {/* sources strip */}
        <div className="relative mx-auto mt-28 max-w-[1200px] px-5 sm:px-8">
          <p className="text-center text-[13px] text-faint">Reads the documents your suppliers already send, from</p>
          <div className="marquee mt-6 overflow-hidden">
            <div className="flex w-max gap-14">
              {[...SOURCES, ...SOURCES].map((x, i) => (
                <span key={i} className="font-display text-[19px] font-semibold tracking-[-0.02em] whitespace-nowrap text-white/30">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LEAKS */}
      <Section
        id="leaks"
        kicker="What it catches"
        title="Seven ways a growing business overpays its suppliers."
        intro="Big companies have accounts-payable teams and ERP systems that do three-way matching. A 40-person manufacturer has one accountant and a WhatsApp group. The money leaks quietly, one invoice at a time."
      >
        <div className="grid gap-4 md:grid-cols-6">
          {LEAKS.map((l, i) => (
            <article key={l.title} data-reveal style={{ '--d': `${(i % 3) * 90}ms` }} className={`sheet flex flex-col p-6 ${i < 2 || i > 4 ? 'md:col-span-3' : 'md:col-span-2'}`}>
              <div>
                <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em] text-ink">{l.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-muted">{l.body}</p>
              </div>
              <div className="my-6 rounded-xl border border-white/[0.05] bg-black/25 p-4">
                <LeakVisual kind={LEAK_KIND[i]} />
              </div>
              <p className="mt-auto flex gap-2.5 border-t border-white/[0.06] pt-4 text-[13.5px] leading-relaxed text-ink-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ok" />
                {l.how}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* SEE A CATCH */}
      <section className="relative border-y border-white/[0.06] bg-[linear-gradient(180deg,rgba(111,125,255,0.06),transparent_70%)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:py-32">
          <div data-reveal>
            <p className="kicker">Try it</p>
            <h2 className="mt-3 text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-[48px]">Three documents. One catch. Every time.</h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-muted">Pick a case. These are the same three papers your stores team staples together today — Concord reads them the moment they arrive and stamps the difference.</p>
            <ul className="mt-8 space-y-3 text-[14px] text-ink-2">
              {['Matched by PO number, in any order', 'Checked line by line, with GST on top', 'Evidence ready for the vendor in one click'].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ok/15 text-ok ring-1 ring-ok/30">
                    <Check size={13} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal style={{ '--d': '120ms' }}>
            <Triplicate auto />
          </div>
        </div>
      </section>

      {/* HOW */}
      <Section id="how" kicker="How it works" title="From a pile of PDFs to the right payment, without a spreadsheet.">
        <div className="flow-line mb-6 hidden h-px w-full lg:block" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((st, i) => (
            <li key={st.title} data-reveal style={{ '--d': `${i * 100}ms` }} className="sheet relative p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-carbon/30 bg-carbon-tint text-carbon-dark shadow-[0_0_30px_-8px_rgba(111,125,255,0.9)]">
                  <st.icon size={18} />
                </span>
                <span className="figure text-[28px] text-white/[0.08]">0{i + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-[17px] font-semibold text-ink">{st.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{st.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* EVIDENCE */}
      <Section kicker="Explainable by design" title="Nothing is flagged without the working shown." className="pt-0 lg:pt-0">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal className="space-y-5 text-[16px] leading-relaxed text-muted">
            <p>Finance people don’t trust a black box, and they shouldn’t. Every flag says what the documents should have said, what they actually say, which document each number came from, and how the rupee amount was calculated — including the GST on top.</p>
            <p>The same evidence goes to the vendor through their response link, and onto the debit note when they agree.</p>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                [13, 'checks on every purchase'],
                [0, 'emails sent without approval'],
                ['1 link', 'for the vendor, no login'],
              ].map(([a, b]) => (
                <div key={b} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="figure text-[26px] text-ink">{typeof a === 'number' ? <CountUp value={a} /> : a}</p>
                  <p className="mt-1 text-[12px] leading-snug text-muted">{b}</p>
                </div>
              ))}
            </div>
          </div>
          <div data-reveal className="relative">
            <div className="aurora pointer-events-none absolute -inset-8 -z-10 opacity-60" />
            <div className="sheet ring-aurora overflow-hidden bg-[#080b14]/90">
              <div className="flex items-center justify-between border-b border-line-2 px-5 py-4">
                <div>
                  <p className="text-xs text-muted">DSP-0014, Shree Ganesh Engineering Works</p>
                  <p className="font-display text-[17px] font-semibold">2 issues on invoice SGE/1182</p>
                </div>
                <Stamp className="text-base">₹8,891</Stamp>
              </div>
              {SAMPLE_FLAGS.map((f, i) => (
                <FlagCard key={f.code} flag={f} defaultOpen={i === 0} />
              ))}
              <div className="border-t border-line-2 px-5 py-5">
                <Checklist checks={SAMPLE_CHECKS} />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* INDIA */}
      <section className="border-y border-white/[0.06] bg-white/[0.012]">
        <Section kicker="Made for India" title="Built around how Indian businesses actually buy.">
          <div className="grid gap-4 md:grid-cols-3">
            <div data-reveal className="sheet ring-aurora relative overflow-hidden p-8 md:col-span-2 md:row-span-2">
              <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(245,185,71,0.18),transparent)]" />
              <Clock4 size={22} className="text-wait" />
              <h3 className="mt-5 font-display text-[26px] font-semibold tracking-[-0.03em]">MSME payment deadlines, tracked per invoice</h3>
              <p className="mt-3 max-w-xl leading-relaxed text-muted">
                Under Income Tax Act §43B(h), a payment to a micro or small enterprise made more than 45 days after acceptance — or 15 days without a written agreement — can’t be deducted that year. You pay tax on money you spent.
              </p>
              <p className="mt-3 max-w-xl leading-relaxed text-muted">Concord marks MSME vendors, starts the clock from the delivery challan date, warns you a week before the deadline, and shows the deduction at stake.</p>
              <div className="mt-8 flex max-w-md items-center gap-5 rounded-2xl border border-wait/25 bg-wait/[0.07] p-5">
                <LeakVisual kind="msme" />
                <p className="text-[13px] text-ink-2">Om Sai Packaging is a registered micro enterprise. Pay ₹1,02,660 by 16 Oct to keep the expense deductible.</p>
              </div>
            </div>
            {[
              [ShieldAlert, 'Bank-detail change alerts', 'When an invoice asks to be paid into a new account, payment is blocked until someone confirms it by phone — the check that stops invoice fraud.'],
              [Landmark, 'GSTR-2B reconciliation', 'Upload your GSTR-2B: see every invoice a supplier hasn’t filed, the input tax credit at risk, and a ready message to chase them.'],
              [Camera, 'Reads phone photos', 'A challan photographed at the gate or a scanned bill on WhatsApp is read by a vision model and checked like any PDF.'],
              [MessageCircle, 'Vendors answer from their phone', 'Each dispute has a private link you can send by email or WhatsApp. Your supplier sees the line-by-line comparison and accepts or explains — no account, no app.'],
              [Bot, 'Autopilot follow-ups', 'When a vendor goes quiet past the reply date, a firmer follow-up is drafted and waiting for approval.'],
              [FileSpreadsheet, 'Straight into Tally', 'Settled disputes export as debit-note vouchers Tally Prime imports, with GST split out so the credit reverses correctly.'],
              [Landmark, 'GST checks on every invoice', 'GSTIN verified with the government check-digit formula, compared with the vendor’s registered GSTIN, and the GST rate compared with the PO — so input tax credit isn’t lost to a typo.'],
            ].map(([Icon, t, b], i) => (
              <div key={t} data-reveal style={{ '--d': `${(i % 3) * 90}ms` }} className="sheet p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-carbon-dark">
                  <Icon size={18} />
                </span>
                <h3 className="mt-5 font-display text-[17px] font-semibold">{t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{b}</p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* COMPARE */}
      <Section id="compare" kicker="Compare" title="Document AI reads invoices. Concord gets your money back." intro="Extraction is where most tools stop. The value is in what happens after — and in being usable by a business that doesn’t run SAP.">
        <div data-reveal className="sheet overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-5" />
                <th className="relative bg-carbon/[0.08] px-4 py-5 text-center">
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#8592ff,#2ed3b7)]" />
                  <Logo className="scale-90" />
                </th>
                <th className="px-4 py-5 text-center text-[13px] font-medium text-muted">Document AI tools</th>
                <th className="px-4 py-5 text-center text-[13px] font-medium text-muted">Enterprise AP suites</th>
                <th className="px-4 py-5 text-center text-[13px] font-medium text-muted">Excel + email</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([label, ...vals]) => (
                <tr key={label} className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 text-ink-2">{label}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`px-4 py-4 text-center ${i === 0 ? 'bg-carbon/[0.08]' : ''}`}>
                      <Cell v={v} lit={i === 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-faint">Categories, not individual products: “Document AI tools” such as invoice-capture platforms; “Enterprise AP suites” such as ERP-integrated payables software. Capabilities vary by vendor and plan.</p>
      </Section>

      {/* PRICING */}
      <section className="border-t border-white/[0.06]">
        <Section id="pricing" kicker="Pricing" title="One recovered short delivery usually pays for the year." center>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p, i) => (
              <div key={p.name} data-reveal style={{ '--d': `${i * 110}ms` }} className={`relative flex flex-col rounded-2xl p-8 text-left ${p.featured ? 'ring-aurora bg-[linear-gradient(180deg,rgba(111,125,255,0.16),rgba(111,125,255,0.03))] shadow-[0_0_90px_-25px_rgba(111,125,255,0.7)]' : 'sheet'}`}>
                {p.featured && <span className="absolute top-6 right-6 rounded-full bg-carbon/20 px-2.5 py-0.5 text-[11px] font-semibold text-carbon-dark">Most teams</span>}
                <p className="font-display text-lg font-semibold text-ink">{p.name}</p>
                <p className="mt-5">
                  <span className="figure text-[44px] text-ink">{p.price}</span>
                  <span className="ml-1 text-muted">{p.per}</span>
                </p>
                <p className="mt-2 text-sm text-muted">{p.blurb}</p>
                <ul className="mt-7 flex-1 space-y-3 text-[14px] text-ink-2">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2.5">
                      <Check size={16} className={`mt-0.5 shrink-0 ${p.featured ? 'text-carbon-dark' : 'text-ok'}`} /> {it}
                    </li>
                  ))}
                </ul>
                <Link to={p.to} className={`mt-9 h-11 ${p.featured ? 'btn-primary' : 'btn-secondary'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-faint">Launch pricing, indicative. Taxes extra.</p>
        </Section>
      </section>

      {/* FAQ */}
      <Section id="faq" kicker="FAQ" title="Questions finance teams ask first" className="max-w-[880px]">
        <div className="space-y-3">
          {FAQ.map(([q, a], i) => (
            <details key={q} data-reveal style={{ '--d': `${i * 70}ms` }} className="sheet group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-ink">
                {q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted transition-transform duration-300 group-open:rotate-45 group-open:text-carbon-dark">+</span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="relative overflow-hidden px-5 pb-24 sm:px-8">
        <div data-reveal className="ring-aurora relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-[#080b14] px-6 py-20 text-center sm:py-28">
          <div className="aurora pointer-events-none absolute inset-0 opacity-70" />
          <div className="grid-lines pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-[36px] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-[58px]">See it on a real-looking company in ten seconds.</h2>
            <p className="mx-auto mt-5 max-w-xl text-muted">A sample auto-components maker in Pune, nine weeks of purchases, six suppliers. Click anything.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <DemoButton />
              <Link to="/register" className="btn-secondary h-12 px-6 text-[15px]">
                Create your workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-faint">Three-way matching, dispute settlement and payment control for Indian businesses. Made in Pune for businesses that buy from other businesses.</p>
          </div>
          {[
            ['Product', [['What it catches', '#leaks'], ['How it works', '#how'], ['Compare', '#compare'], ['Pricing', '#pricing']]],
            ['Get started', [['Live demo', '/login'], ['Create a workspace', '/register'], ['Log in', '/login']]],
            ['Built for', [['MSME compliance', '#leaks'], ['GST and ITC', '#leaks'], ['Vendor disputes', '#how']]],
          ].map(([h, links]) => (
            <div key={h}>
              <p className="text-sm font-semibold text-ink">{h}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-faint">
                {links.map(([l, to]) => (
                  <li key={l}>
                    {to.startsWith('#') ? (
                      <a href={to} className="transition-colors hover:text-ink">
                        {l}
                      </a>
                    ) : (
                      <Link to={to} className="transition-colors hover:text-ink">
                        {l}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.05] py-6 text-center text-xs text-faint">© {new Date().getFullYear()} Concord. Made in Pune, India.</div>
      </footer>
    </div>
  );
}
