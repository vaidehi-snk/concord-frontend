import { useState } from 'react';
import { Link } from 'react-router-dom';

const SCENARIOS = {
  qty: {
    label: 'Partial shipment, billed in full',
    po: { qty: 500, unitPrice: 240, tax: 18, delivered: '500 units' },
    dn: { qty: 420, unitPrice: 240, tax: 18, delivered: '420 units (partial)' },
    invoice: { qty: 500, unitPrice: 240, tax: 18, delivered: '500 units' },
    flags: [{ sev: 'HIGH', text: 'Invoice bills for 500 units but Delivery Note confirms only 420 received — 80-unit shortfall, ₹19,200 overbilled before tax.' }],
    vendor: 'Meridian Components Pvt. Ltd.',
    poNum: 'PO-4471', invNum: 'INV-8823',
    sample: `Subject: Discrepancy on INV-8823 — Delivered Quantity vs Billed Quantity

Hi team,

While reconciling PO-4471 against the delivery note and invoice, we found the invoice bills for 500 units, but our delivery note confirms only 420 units were received to date. This is a shortfall of 80 units, amounting to an overbill of approximately ₹19,200 before tax.

Could you please confirm whether the remaining 80 units are still in transit, or issue a credit note for the shortfall so we can proceed with payment on the balance?

Best regards,
Accounts Payable Team`,
  },
  price: {
    label: 'Unit price mismatch vs PO',
    po: { qty: 300, unitPrice: 180, tax: 18, delivered: '300 units' },
    dn: { qty: 300, unitPrice: 180, tax: 18, delivered: '300 units' },
    invoice: { qty: 300, unitPrice: 205, tax: 18, delivered: '300 units' },
    flags: [{ sev: 'HIGH', text: 'Invoice unit price is ₹205 vs the agreed PO rate of ₹180 — a ₹25/unit variance across 300 units = ₹7,500 overcharge.' }],
    vendor: 'Orbit Industrial Supplies',
    poNum: 'PO-5190', invNum: 'INV-9042',
    sample: `Subject: Unit Price Discrepancy on INV-9042 (PO-5190)

Hi team,

Reconciling PO-5190 against INV-9042, we noticed the invoice reflects a unit price of ₹205, while the PO specifies an agreed rate of ₹180 — a variance of ₹25/unit across 300 units, totaling ₹7,500.

Could you please issue a revised invoice or credit note reflecting the agreed PO rate?

Best regards,
Accounts Payable Team`,
  },
  tax: {
    label: 'Duplicate charge + tax slab error',
    po: { qty: 150, unitPrice: 620, tax: 12, delivered: '150 units' },
    dn: { qty: 150, unitPrice: 620, tax: 12, delivered: '150 units' },
    invoice: { qty: 150, unitPrice: 620, tax: 18, delivered: '150 units (billed twice)' },
    flags: [
      { sev: 'HIGH', text: 'Line item appears twice on the invoice for the same delivery note — duplicate charge of ₹93,000.' },
      { sev: 'MED', text: 'Tax applied at 18% instead of the contracted 12% slab for this SKU category.' },
    ],
    vendor: 'Halcyon Textiles Ltd.',
    poNum: 'PO-3308', invNum: 'INV-7715',
    sample: `Subject: Duplicate Line Item & Tax Slab Query — INV-7715

Hi team,

We've identified two issues while reconciling INV-7715 against PO-3308: the 150-unit line item appears to be billed twice (duplicate charge of ₹93,000), and tax has been applied at 18% instead of the contracted 12% slab.

Could you issue a corrected invoice reflecting a single line item at the correct rate?

Best regards,
Accounts Payable Team`,
  },
};

const PLATFORM = [
  {
    category: 'Core Reconciliation',
    items: [
      { name: 'Line-Item Ingestion', live: true, desc: 'Reads real PO, Delivery Note, and Invoice PDFs — including multi-item tables — into structured, comparable data.' },
      { name: 'Line-Item Reconciliation', live: true, desc: 'Matches items by name across documents and flags mismatches individually, with exact financial impact per item.' },
      { name: 'AI Negotiation Agent', live: true, desc: 'Drafts the vendor settlement email itself, citing exact figures — generated per dispute, not a template.' },
    ],
  },
  {
    category: 'Intelligence & Trust',
    items: [
      { name: 'Vendor Risk Scorecard', live: true, desc: 'Transparent scoring by dispute frequency, amount, and recency — explainable, not a black box.' },
      { name: 'Explain This Flag', live: true, desc: "Every flagged number traces back to its exact source values and the arithmetic behind it." },
      { name: 'Negotiation Loop', live: true, desc: "The agent reads the vendor's actual reply and decides to close or escalate." },
      { name: 'Fraud & Anomaly Detection', live: false, desc: 'Catching deliberate duplicate-billing patterns across vendors, once enough dispute history exists.' },
      { name: 'Predictive Risk Flagging', live: false, desc: 'Flagging a risky vendor at PO creation, before money is on the line.' },
    ],
  },
  {
    category: 'Workflow & Reach',
    items: [
      { name: 'Batched Negotiation', live: true, desc: "One consolidated email for a vendor's multiple open disputes." },
      { name: 'Vendor Response Link', live: true, desc: 'A one-click, no-login link a vendor opens straight from the email.' },
      { name: 'Savings & Impact Reports', live: true, desc: 'Monthly breakdown of what was flagged versus actually resolved and recovered.' },
      { name: 'Email / WhatsApp Intake', live: false, desc: 'Forward an invoice instead of uploading it — built for inbox-first teams.' },
      { name: 'Approval Workflows', live: false, desc: 'Manager review before an AI-drafted email goes out, with multi-user roles.' },
    ],
  },
  {
    category: 'Compliance & Scale',
    items: [
      { name: 'Auto-Generated Credit Notes', live: false, desc: 'A compliant, formatted credit note document once a dispute is confirmed.' },
      { name: 'Tally Integration', live: false, desc: 'The first real ERP connector for Indian SMB finance teams.' },
      { name: 'Bank / UPI Reconciliation', live: false, desc: 'True 4-way match — verifying the actual payment against the settled invoice.' },
      { name: 'Full Vendor Portal', live: false, desc: "The response link's bigger sibling — real vendor accounts and network effects." },
      { name: 'Built for No-ERP Teams', live: true, desc: 'No SAP or NetSuite required — the segment enterprise tools were never built for.' },
    ],
  },
];

function MockCard({ className, children }) {
  return <div className={`absolute bg-white border border-line rounded-2xl shadow-[0_20px_50px_rgba(20,23,31,0.12)] ${className}`}>{children}</div>;
}

export default function Landing() {
  const [current, setCurrent] = useState('qty');
  const [showDraft, setShowDraft] = useState(false);
  const scenario = SCENARIOS[current];

  function selectScenario(key) {
    setCurrent(key);
    setShowDraft(false);
  }

  const fields = [
    { label: 'Quantity', key: 'qty', suffix: '' },
    { label: 'Unit Price', key: 'unitPrice', suffix: '/unit' },
    { label: 'Tax %', key: 'tax', suffix: '%' },
    { label: 'Delivery Status', key: 'delivered', suffix: '' },
  ];

  return (
    <div className="bg-white text-ink">
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white/92 backdrop-blur border-b border-line">
        <div className="max-w-[1080px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold text-lg tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="w-6.5 h-6.5 rounded-md bg-navy flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M4 12L10 18L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            Concord
          </div>
          <div className="hidden md:flex gap-7 text-sm font-medium text-muted">
            <a href="#demo" className="hover:text-ink">Live Demo</a>
            <a href="#pipeline" className="hover:text-ink">How it works</a>
            <a href="#platform" className="hover:text-ink">Platform</a>
          </div>
          <Link to="/app" className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors">
            Launch App
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative border-b border-line overflow-hidden pt-16 pb-10">
        <div className="max-w-[1080px] mx-auto px-8 grid md:grid-cols-[1.1fr_.9fr] gap-10 items-center">
          <div>
            <div className="inline-block font-mono text-xs uppercase tracking-wide text-amber bg-amber-tint px-2.5 py-1.5 rounded-md mb-5 border border-amber/25">
              B2B Fintech · Autonomous Settlement
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.08] mb-5 max-w-xl" style={{ fontFamily: 'Georgia, serif' }}>
              Invoice disputes shouldn't take <span className="text-navy">15 days</span> and three inboxes.
            </h1>
            <p className="text-lg text-muted max-w-md mb-8 leading-relaxed">
              Concord ingests your invoices, purchase orders and delivery notes, catches the mismatch in seconds, and drafts the vendor settlement email itself.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#demo" className="bg-navy text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors shadow-sm">
                Run a live reconciliation ↓
              </a>
              <a href="#platform" className="border border-line text-ink px-5 py-3 rounded-lg text-sm font-semibold hover:border-ink transition-colors">
                See the full platform
              </a>
            </div>
          </div>

          <div className="relative hidden md:block h-[380px]">
            <MockCard className="w-[190px] p-3.5 top-[-10px] right-[230px] z-10">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Vendor Risk</div>
              <div className="flex items-center gap-2.5">
                <div className="text-2xl font-bold text-danger" style={{ fontFamily: 'Georgia, serif' }}>78</div>
                <div className="text-[11px] text-muted leading-tight">high risk<br />Meridian Components</div>
              </div>
            </MockCard>
            <MockCard className="w-80 p-5 top-2.5 right-5 z-20">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2.5">Invoice INV-8823 vs PO-4471</div>
              {[
                ['Item', 'Ergonomic Chair', ''],
                ['PO Quantity', '500', ''],
                ['Invoice Quantity', '500', 'text-danger'],
                ['Delivered', '420', 'text-danger'],
              ].map(([label, val, cls], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-line last:border-0 text-xs">
                  <span className="text-muted">{label}</span>
                  <span className={`font-mono font-semibold ${cls}`}>{val}</span>
                </div>
              ))}
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full bg-danger-tint text-danger">
                  ⚠ 80-unit shortfall — ₹19,200
                </span>
              </div>
            </MockCard>
            <MockCard className="w-[210px] p-3.5 top-[220px] right-[170px] z-30">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Agent Status</div>
              {[
                ['Email drafted', '✓', 'text-success'],
                ['Vendor replied', '✓', 'text-success'],
                ['Status', 'Escalated', 'text-amber'],
              ].map(([label, val, cls], i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-line last:border-0 text-xs">
                  <span className="text-muted">{label}</span>
                  <span className={`font-mono font-semibold ${cls}`}>{val}</span>
                </div>
              ))}
            </MockCard>
          </div>
        </div>

        <div className="max-w-[1080px] mx-auto px-8 mt-11">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-line rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(20,23,31,0.04)]">
            {[
              ['10–15 days', 'avg. manual dispute resolution today'],
              ['2–3 hrs', 'spent daily per finance team, per company'],
              ['<60 sec', 'Concord: ingest → flag → draft'],
              ['₹0', 'extra headcount needed to scale'],
            ].map(([num, lbl], i) => (
              <div key={i} className="p-5 border-r border-b md:border-b-0 border-line last:border-r-0 bg-white">
                <div className="text-2xl font-semibold text-navy" style={{ fontFamily: 'Georgia, serif' }}>{num}</div>
                <div className="text-xs text-muted mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section id="demo" className="bg-navy-tint border-b border-line py-16">
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="font-mono text-xs uppercase tracking-wide text-amber mb-2">Live, not mocked</div>
          <h2 className="text-3xl font-semibold tracking-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>Watch it reconcile a real dispute</h2>
          <p className="text-muted max-w-lg mb-8">Pick a scenario — each is a Purchase Order, Delivery Note and Invoice for the same order.</p>

          <div className="flex flex-wrap gap-2.5 mb-7">
            {Object.entries(SCENARIOS).map(([key, s]) => (
              <button
                key={key}
                onClick={() => selectScenario(key)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  current === key ? 'border-navy text-navy bg-navy-tint' : 'border-line text-muted bg-white hover:border-navy/40'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-line rounded-xl overflow-hidden">
            <div className="grid grid-cols-4 px-5 py-3.5 bg-ink text-white font-mono text-xs uppercase tracking-wide">
              <div>Field</div><div>Purchase Order</div><div>Delivery Note</div><div>Invoice</div>
            </div>
            {fields.map((f) => {
              const poVal = scenario.po[f.key];
              const dnVal = scenario.dn[f.key];
              const invVal = scenario.invoice[f.key];
              const isMismatch = !(poVal === dnVal && dnVal === invVal);
              const cellClass = (val) => {
                if (f.key === 'delivered') return val === poVal ? 'text-success' : 'text-danger font-semibold';
                return isMismatch && val !== poVal ? 'text-danger font-semibold' : isMismatch ? '' : 'text-success';
              };
              return (
                <div key={f.key} className="grid grid-cols-4 px-5 py-3.5 border-t border-line font-mono text-sm items-center">
                  <div className="text-muted font-sans font-semibold text-xs">{f.label}</div>
                  <div>{poVal}{f.suffix}</div>
                  <div className={cellClass(dnVal)}>{dnVal}{f.suffix}</div>
                  <div className={cellClass(invVal)}>{invVal}{f.suffix}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 space-y-2.5">
            {scenario.flags.map((f, i) => (
              <div key={i} className="flex gap-3 bg-danger-tint border border-danger/20 rounded-lg px-4 py-3.5">
                <span className="font-mono text-[10.5px] uppercase font-bold px-2 py-1 rounded bg-danger text-white h-fit">{f.sev}</span>
                <span className="text-sm text-ink">{f.text}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowDraft(true)}
            className="mt-6 bg-navy text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors shadow-sm"
          >
            Draft settlement email with AI →
          </button>

          {showDraft && (
            <div className="mt-5 bg-white border border-line rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-line flex justify-between items-center">
                <strong className="text-sm">Negotiation Agent — Draft Output</strong>
                <span className="font-mono text-xs text-success bg-success-tint px-2.5 py-1 rounded-full">Sample output</span>
              </div>
              <div className="p-6 text-sm whitespace-pre-wrap leading-relaxed">{scenario.sample}</div>
            </div>
          )}
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="py-16">
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="font-mono text-xs uppercase tracking-wide text-amber mb-2">Architecture</div>
          <h2 className="text-3xl font-semibold tracking-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>Three engines, one resolution</h2>
          <p className="text-muted max-w-lg mb-10">Not another OCR tool. Concord is the layer that sits after extraction and actually closes the dispute.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              ['01 — Ingestion Engine', 'Any format in, one schema out', 'Text and layout-aware parsing standardizes documents into structured line items, with an LLM fallback for table-heavy layouts.'],
              ['02 — Reconciliation Engine', 'Line-item cross-check', 'Every item is matched and compared individually, with each discrepancy scored by exact financial impact.'],
              ['03 — Negotiation Agent', 'Drafts the resolution, and follows through', "Drafts the settlement email, reads the vendor's reply, and decides whether to close or escalate."],
            ].map(([num, title, desc], i) => (
              <div key={i} className="border border-line rounded-xl p-6">
                <div className="font-mono text-xs text-amber mb-3.5">{num}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Georgia, serif' }}>{title}</h3>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FULL PLATFORM */}
      <section id="platform" className="bg-navy-tint border-t border-b border-line py-16">
        <div className="max-w-[1080px] mx-auto px-8">
          <div className="font-mono text-xs uppercase tracking-wide text-amber mb-2">The Full Platform</div>
          <h2 className="text-3xl font-semibold tracking-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Everything Concord does — and everything it's becoming
          </h2>
          <p className="text-muted max-w-lg mb-11">
            Built in stages, on top of one core loop. Live capabilities and roadmap items are marked clearly below.
          </p>

          {PLATFORM.map((cat) => (
            <div key={cat.category} className="mb-11 last:mb-0">
              <h4 className="text-lg font-semibold mb-4.5" style={{ fontFamily: 'Georgia, serif' }}>{cat.category}</h4>
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
                {cat.items.map((item) => (
                  <div key={item.name} className="bg-white border border-line rounded-xl p-4.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h5 className="text-sm font-bold">{item.name}</h5>
                      <span className={`font-mono text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                        item.live ? 'bg-success-tint text-success' : 'bg-amber-tint text-amber'
                      }`}>
                        {item.live ? 'Live' : 'Roadmap'}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line py-9">
        <div className="max-w-[1080px] mx-auto px-8 flex flex-wrap justify-between items-center gap-3.5">
          <div className="font-semibold text-base" style={{ fontFamily: 'Georgia, serif' }}>Concord</div>
          <div className="text-sm text-muted">Anantrao Pawar College of Engineering &amp; Research · Major Project 2026–27</div>
        </div>
      </footer>
    </div>
  );
}
