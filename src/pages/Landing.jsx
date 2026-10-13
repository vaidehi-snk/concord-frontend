import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ErrorNote } from '../components/ui';
import { PaperStack, AnnotatedInvoice } from '../components/marketing';
import { SiteHeader, SiteFooter } from '../components/site';
import { useDocumentTitle, useDemo } from '../lib/hooks';

const LEAKS = [
  ['Short deliveries billed in full', 'The challan says 420 arrived. The invoice charges for 500.', 'Checks every billed quantity against what the challan says was received.'],
  ['Rates that creep above the PO', '₹58 a box becomes ₹65 on the third order. Each invoice looks normal on its own.', 'Compares every rate with the PO, and keeps each vendor’s price history.'],
  ['Duplicate bills', 'The same invoice sent again a month later, or renumbered with the same amount.', 'Compares invoice numbers and amounts across everything that vendor has sent.'],
  ['Wrong GSTIN or GST rate', 'Input tax credit is denied, and you find out at the audit.', 'Verifies every GSTIN with the government check digit and the GST rate against the PO.'],
  ['Payment to a fraudster’s account', 'A genuine-looking “our bank details have changed” email, and the money goes somewhere else.', 'Holds the payment when a vendor’s account changes, until someone confirms it by phone.'],
  ['GST your supplier never filed', 'The supplier didn’t report the invoice in GSTR-1, so it never reaches your GSTR-2B and the credit is lost.', 'Reconciles your GSTR-2B and lists the suppliers to chase, with the rupees at stake.'],
  ['MSME suppliers paid late', 'Pay a micro or small supplier after 45 days (15 without a written agreement) and the expense isn’t deductible that year.', 'Gives every MSME invoice its legal deadline and puts it first in the pay run.'],
];

const STEPS = [
  ['Drop in the paperwork', 'POs, challans and GST invoices as PDFs or phone photos, in any order. Or forward them by email.'],
  ['Concord pairs them up', 'Each document is identified, its vendor found by GSTIN, and joined to its purchase by PO number.'],
  ['13 checks, line by line', 'Quantities, rates, GST, arithmetic, duplicates and GSTIN. Every amount shows how it was worked out.'],
  ['Settle with the vendor', 'A drafted email for your approval, a link the vendor can answer from their phone, and a debit note when they agree.'],
  ['Pay the right amount', 'A pay run that releases what’s verified, holds what’s disputed, and checks your bank statement afterwards.'],
];

const INDIA = [
  ['GSTR-2B', 'Since January 2022 you can claim input tax credit only on invoices that appear in your GSTR-2B. Upload it and Concord shows which suppliers haven’t filed and how much credit is at stake.'],
  ['MSME payment deadlines', 'Section 43B(h): pay micro and small suppliers within 45 days if you have a written agreement, or 15 days if you don’t, or lose the deduction for that year. Confirm the current section with your CA, as the Income-tax Act, 2025 now applies.'],
  ['GSTIN check digit', 'A mistyped or invented GSTIN fails the government’s check-digit formula. Concord catches it the moment the invoice arrives.'],
  ['TallyPrime debit notes', 'Settled disputes export as Debit Note vouchers, with the GST split out so your input credit is reversed correctly.'],
];

const COMPARE = [
  ['The challan shows 90 bearings, the invoice bills 100', 'Someone has to lay the two papers side by side. Usually nobody does, and ₹3,068 is paid.', 'Flagged as soon as both arrive, with the sum shown, and held from the payment.'],
  ['A vendor emails new bank details', 'The accountant updates the account and pays the next invoice to it.', 'The invoice is held until a manager confirms the new account by phone.'],
  ['A supplier hasn’t filed GSTR-1', 'Found at the annual audit, when the credit is already gone.', 'Shown the month you upload GSTR-2B, with the supplier to chase.'],
];

const PLANS = [
  { name: 'Starter', price: 'Free', note: '', who: 'Trying Concord on real paperwork', items: '50 documents a month, all 13 checks, bank-change alerts, vendor reply links, 1 user', cta: 'Start free', to: '/register' },
  { name: 'Growth', price: '₹4,999', note: 'a month + 18% GST', who: 'Teams paying vendors every week', items: '1,000 documents a month, photo reading, GSTR-2B, pay run and MSME tracking, approvals, TallyPrime export, 5 users', cta: 'Start free, upgrade later', to: '/register' },
  { name: 'Scale', price: 'Priced per group', note: '', who: 'Multi-plant and multi-entity groups', items: 'Unlimited documents, API and email intake, custom rules', cta: 'Talk to us', to: '/contact' },
];

const FAQ = [
  ['Do we need an ERP or any integration?', 'No. Concord works from the PDFs and photos your vendors already send. Upload them, forward them to your Concord email address, or push them from another system with an API key. Settled disputes export to TallyPrime as debit-note vouchers.'],
  ['What does the AI do, and what do rules do?', 'Every flag and every rupee amount comes from fixed checks you can read, with the calculation shown. AI reads unusual layouts and photos, drafts vendor emails, sorts vendor replies and answers questions about your data. An AI-drafted email always waits for a person to approve it.'],
  ['What about scanned or photographed invoices?', 'Digital PDFs are read by rules. Scans and phone photos, like a challan sent on WhatsApp, are read by a vision model. The checks that follow are the same either way.'],
  ['How accurate is it on handwritten challans?', 'We haven’t published accuracy figures yet; we’re measuring them with pilot companies. A photo is never treated as certain: anything the model isn’t sure of is marked for a person to confirm before its checks count.'],
  ['What happens after the free plan?', 'Starter stays free up to 50 documents a month. Growth is ₹4,999 a month plus GST. Prices are indicative while we run pilots, and nothing changes without notice.'],
  ['Where is our data stored?', 'In a MongoDB Atlas database, with the app running on Render and Vercel. Uploaded files are read in memory and not kept; only the fields Concord extracts are stored. If you need data held in India, ask us before you start.'],
  ['Can we delete our data?', 'Yes. Email us from your admin account and we will delete your workspace and everything in it.'],
  ['Who can see vendor bank details?', 'Only people in your workspace. Account numbers are masked in alerts, and a vendor only ever sees their own dispute.'],
  ['Which Tally version works?', 'Debit notes export as an XML file you import into TallyPrime. The ledger names default to Purchase Returns and Input GST, and you can change them.'],
  ['How is our data kept separate from other companies?', 'Every request is tied to your company by a signed login token, and every database query is limited to your company. Vendors reach their dispute only through a private, unguessable link.'],
];


const faqSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

function DemoButton({ demo, className, children }) {
  return (
    <button type="button" className={className} onClick={() => demo.start('admin')} disabled={!!demo.busy}>
      {demo.busy && <Loader2 size={16} className="animate-spin" />}
      {demo.busy ? 'Setting up your copy…' : children}
    </button>
  );
}

function Heading({ children, sub, className = '' }) {
  return (
    <div className={className}>
      <h2 className="max-w-[18em] text-[32px] leading-[1.08] text-ink sm:text-[44px]">{children}</h2>
      {sub && <p className="mt-4 max-w-[36em] text-[16px] leading-relaxed text-muted sm:text-[18px]">{sub}</p>}
    </div>
  );
}

export default function Landing() {
  useDocumentTitle();
  const demo = useDemo();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main">
        {/* hero */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 pt-10 pb-12 sm:px-8 lg:grid-cols-[5fr_7fr] lg:gap-14 lg:pt-20 lg:pb-20">
          <div>
            <h1 className="text-[40px] leading-[1.04] text-ink sm:text-[56px] lg:text-[64px]">
              Pay only for what you ordered and received.
            </h1>
            <p className="mt-5 max-w-[30em] text-[17px] leading-relaxed text-muted sm:text-[19px]">
              Concord reads your purchase orders, delivery challans and GST invoices, checks every line against each other, and holds back the rupees that don’t add up.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary h-12 px-6 text-base">
                Start free
              </Link>
              <DemoButton demo={demo} className="btn-secondary h-12 px-6 text-base">
                Try a sample company
              </DemoButton>
            </div>
            {demo.error && (
              <div className="mt-4">
                <ErrorNote error={demo.error} onRetry={() => demo.start('admin')} />
              </div>
            )}
            <p className="mt-4 text-sm text-muted">50 documents a month free. No card, no IT project.</p>
          </div>
          <PaperStack />
        </section>

        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <p className="border-t border-line py-5 text-[15px] text-muted">
            <span className="font-semibold text-ink">Fits how you work today.</span> Reads PDFs, scans and phone photos, takes invoices forwarded by email, and exports debit notes to TallyPrime.
          </p>
        </div>

        {/* what it catches */}
        <div className="perf mt-6" aria-hidden />
        <section id="catches" className="scroll-mt-20 bg-band">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:py-24">
            <Heading sub="Each problem comes with the documents it came from and the sum behind the amount, so your vendor can check it too.">Every line checked against the order and the delivery</Heading>
            <div className="mt-10 lg:mt-12">
              <AnnotatedInvoice />
            </div>

            <h3 className="mt-20 font-display text-[24px] font-semibold text-ink sm:text-[28px]">Seven ways money leaks out of accounts payable</h3>
            <div className="mt-6 border-t border-ink">
              <div className="hidden grid-cols-[1.1fr_1.4fr_1.4fr] gap-8 border-b border-line py-3 text-sm font-semibold text-muted md:grid">
                <span>The leak</span>
                <span>How it happens</span>
                <span>What Concord does</span>
              </div>
              <ul>
                {LEAKS.map(([t, how, does]) => (
                  <li key={t} className="grid gap-1 border-b border-line py-4 md:grid-cols-[1.1fr_1.4fr_1.4fr] md:gap-8">
                    <p className="font-semibold text-ink">{t}</p>
                    <p className="text-[15px] text-muted">{how}</p>
                    <p className="text-[15px] text-ink-2">{does}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-16 sm:px-8 lg:py-24">
          <Heading>From a pile of paperwork to the right payment</Heading>
          <ol className="relative mt-10 grid gap-0 lg:mt-14 lg:grid-cols-5 lg:gap-6">
            <span aria-hidden className="absolute top-[15px] right-[10%] left-[3%] hidden h-px bg-line lg:block" />
            {STEPS.map(([t, b], i) => (
              <li key={t} className="relative grid grid-cols-[32px_1fr] gap-4 border-b border-line-2 py-4 last:border-0 lg:block lg:border-0 lg:py-0">
                <span className="relative z-10 grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-desk text-sm font-bold text-ink">{i + 1}</span>
                <div className="lg:mt-5">
                  <p className="font-semibold text-ink">{t}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* India */}
        <section className="border-y border-line bg-paper">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[5fr_7fr] lg:gap-16 lg:py-24">
            <Heading sub="Concord was built for Indian purchase paperwork from the first line of code: GSTINs, challans, GSTR-2B and the MSME payment rule.">Built around Indian tax rules</Heading>
            <dl className="divide-y divide-line border-y border-line">
              {INDIA.map(([t, b]) => (
                <div key={t} className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                  <dt className="font-semibold text-ink">{t}</dt>
                  <dd className="text-[15px] leading-relaxed text-muted">{b}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* compare */}
        <section id="compare" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-16 sm:px-8 lg:py-24">
          <Heading sub="Most of our future customers check invoices with a spreadsheet and their inbox. Here is what changes.">Concord, or Excel and email</Heading>
          <div className="mt-10 border-t border-ink">
            <div className="hidden grid-cols-[1.1fr_1.4fr_1.4fr] gap-8 border-b border-line py-3 text-sm font-semibold text-muted md:grid">
              <span>When</span>
              <span>With Excel and email</span>
              <span>With Concord</span>
            </div>
            {COMPARE.map(([when, before, after]) => (
              <div key={when} className="grid gap-3 border-b border-line py-5 md:grid-cols-[1.1fr_1.4fr_1.4fr] md:gap-8">
                <p className="font-semibold text-ink">{when}</p>
                <p className="text-[15px] text-muted">
                  <span className="font-semibold text-ink-2 md:hidden">With Excel and email: </span>
                  {before}
                </p>
                <p className="text-[15px] text-ink-2">
                  <span className="font-semibold text-ink md:hidden">With Concord: </span>
                  {after}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[48em] text-[15px] leading-relaxed text-muted">
            Where others are stronger today: enterprise document-AI tools read more invoice layouts and connect to large ERPs. Concord is built for the 10 to 200 person business that runs on TallyPrime, email and paper challans.
          </p>
        </section>

        {/* pricing */}
        <section id="pricing" className="scroll-mt-20 bg-band">
          <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:py-24">
            <Heading sub="One catch like the bearings above, ₹4,130, covers most of a month of Growth.">Pricing</Heading>
            <div className="mt-10 border-t border-ink">
              {PLANS.map((p) => (
                <div key={p.name} className="grid items-start gap-3 border-b border-line py-6 md:grid-cols-[1fr_1.1fr_2fr_210px] md:gap-8">
                  <div>
                    <p className="font-display text-[24px] font-semibold text-ink">{p.name}</p>
                    <p className="text-sm text-muted">{p.who}</p>
                  </div>
                  <p>
                    <span className="figure text-[26px] text-ink">{p.price}</span>
                    {p.note && <span className="ml-2 text-sm text-muted">{p.note}</span>}
                  </p>
                  <p className="text-[15px] leading-relaxed text-ink-2">{p.items}</p>
                  <Link to={p.to} className={`${p.name === 'Growth' ? 'btn-primary' : 'btn-secondary'} md:w-full`}>
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[13px] text-muted">Prices are indicative while we run pilots.</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[900px] scroll-mt-20 px-4 py-16 sm:px-8 lg:py-24">
          <Heading>Questions buyers ask us</Heading>
          <div className="mt-8 border-t border-ink">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-xl text-muted transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="-mt-1 pb-5 text-[15px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
        </section>

        {/* founder */}
        <section id="team" className="scroll-mt-20 border-t border-line bg-paper">
          <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[7fr_5fr] lg:py-24">
            <div>
              <Heading>Who builds Concord</Heading>
              <p className="mt-5 max-w-[38em] text-[17px] leading-relaxed text-ink-2">
                Concord is built in Pune by Vaidehi Kakad, a computer engineer who designed and wrote it end to end. It is built for the paperwork Indian factories run on: purchase orders, challans signed at the stores counter, and invoices that don’t always match.
              </p>
              <p className="mt-4 max-w-[38em] text-[17px] leading-relaxed text-ink-2">
                I’m looking for five manufacturers and traders around Pune to run Concord on their real invoices, free, and tell me what’s wrong with it.
              </p>
              <Link to="/contact" className="btn-primary mt-7 h-12 px-6 text-base">
                Become a pilot company
              </Link>
            </div>
            <div className="flex items-center gap-4 lg:justify-self-center">
              <span aria-hidden className="grid h-20 w-20 shrink-0 -rotate-6 place-items-center rounded-full border-[3px] border-double border-stamp font-display text-2xl font-semibold text-stamp">
                VK
              </span>
              <div>
                <p className="font-display text-[22px] font-semibold text-ink">Vaidehi Kakad</p>
                <p className="text-[15px] text-muted">Founder, Concord</p>
              </div>
            </div>
          </div>
        </section>

        {/* last call */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 lg:py-24">
          <div className="grid items-center gap-8 border-y border-ink py-10 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-[30px] leading-[1.1] text-ink sm:text-[40px]">Try it on a sample company</h2>
              <p className="mt-3 max-w-[40em] text-[16px] leading-relaxed text-muted">A Pune auto-components maker with six suppliers and nine weeks of purchases. Every flag comes from the same 13 checks you’d run on your own invoices.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <DemoButton demo={demo} className="btn-primary h-12 px-6 text-base">
                Explore the sample company
              </DemoButton>
              <Link to="/register" className="btn-secondary h-12 px-6 text-base">
                Start free
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
