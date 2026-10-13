import { useEffect, useState } from 'react';
import { Stamp } from './ui';

// Four real failure modes, each shown as the three documents a buyer receives.
const SCENARIOS = [
  {
    id: 'short',
    label: 'Short delivery',
    po: 'PO-4471',
    dn: 'DC-8842',
    inv: 'SGE/1182',
    rows: [
      { item: 'MS Bracket 40×40', po: '500 × ₹48', dn: '420', inv: '500 × ₹48', bad: true },
      { item: 'Hex Bolt M10×50', po: '2,000 × ₹6.50', dn: '2,000', inv: '2,000 × ₹6.50' },
      { item: 'EPDM Gasket 65mm', po: '300 × ₹22', dn: '300', inv: '300 × ₹22' },
    ],
    stamp: '₹4,531 overbilled',
    note: '80 brackets never arrived, all 500 were billed. Includes 18% GST.',
  },
  {
    id: 'price',
    label: 'Price above PO',
    po: 'PO-4502',
    dn: 'DC-8861',
    inv: 'OSP/3307',
    rows: [
      { item: '5-Ply Box 600×400', po: '800 × ₹58', dn: '800', inv: '800 × ₹65', bad: true },
      { item: 'Stretch Film 23mic', po: '40 × ₹310', dn: '40', inv: '40 × ₹310' },
      { item: 'Wooden Pallet', po: '25 × ₹940', dn: '25', inv: '25 × ₹940' },
    ],
    stamp: '₹6,608 over rate',
    note: 'Box rate crept up 12% versus the agreed PO price.',
  },
  {
    id: 'gstin',
    label: 'Invalid GSTIN',
    po: 'PO-4519',
    dn: 'DC-8870',
    inv: 'VE/0415',
    rows: [
      { item: 'FR Cable 2.5 sqmm', po: '12 × ₹2,650', dn: '12', inv: '12 × ₹2,650' },
      { item: 'MCB 32A DP', po: '40 × ₹465', dn: '40', inv: '40 × ₹465' },
      { item: 'GSTIN 27AAJFV9042R1Z8', po: '', dn: '', inv: 'check digit fails', bad: true, wide: true },
    ],
    stamp: '₹9,072 ITC at risk',
    note: 'A one-character typo in the supplier GSTIN — input tax credit can’t be claimed on this invoice.',
  },
  {
    id: 'dup',
    label: 'Duplicate bill',
    po: 'PO-4530',
    dn: 'DC-8879',
    inv: 'DST/2216',
    rows: [
      { item: 'CR Sheet 1.2mm', po: '8 × ₹3,150', dn: '8', inv: '8 × ₹3,150' },
      { item: 'HR Coil 2mm', po: '6 × ₹2,840', dn: '6', inv: '6 × ₹2,840' },
      { item: 'Invoice DST/2216', po: '', dn: '', inv: 'already received 11 Sep', bad: true, wide: true },
    ],
    stamp: '₹49,843 duplicate',
    note: 'Same invoice number, sent again. Paying it would be paying twice.',
  },
];

function Sheet({ tone, title, number, children, className = '' }) {
  const bg = { po: 'bg-sheet-po', dn: 'bg-sheet-dn', inv: 'bg-sheet-inv' }[tone];
  return (
    <div className={`absolute w-[86%] rounded-xl ${bg} p-4 text-sheet-ink shadow-[0_40px_70px_-25px_rgba(0,0,0,0.95),inset_0_0_0_1px_rgba(255,255,255,0.5)] transition-transform duration-500 sm:p-5 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between border-b border-sheet-ink/10 pb-2">
        <span className="text-[11px] font-extrabold tracking-wide text-sheet-ink/70">{title}</span>
        <span className="num text-xs font-semibold text-sheet-ink/60">{number}</span>
      </div>
      {children}
    </div>
  );
}

export default function Triplicate({ auto = false }) {
  const [i, setI] = useState(0);
  const [touched, setTouched] = useState(false);
  // Cycle through the cases on its own until someone picks one
  useEffect(() => {
    if (!auto || touched) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % SCENARIOS.length), 5200);
    return () => clearInterval(t);
  }, [auto, touched]);
  const s = SCENARIOS[i];
  const rows = (col) => (
    <div className="space-y-1.5 text-[12px] sm:text-[13px]">
      {s.rows.map((r, k) => (
        <div key={k} className={`flex items-baseline justify-between gap-3 rounded px-1 ${r.bad ? 'bg-[#c3302b]/10 ring-1 ring-[#c3302b]/40' : ''}`}>
          <span className={`truncate ${r.wide && col !== 'inv' ? 'opacity-0' : 'text-sheet-ink/80'}`}>{r.item}</span>
          <span className={`num shrink-0 font-semibold ${r.bad && col !== 'po' ? 'text-[#c3302b]' : 'text-sheet-ink'}`}>{r[col]}</span>
        </div>
      ))}
    </div>
  );
  return (
    <div>
      <div className="relative mx-auto h-[360px] w-full max-w-[520px] sm:h-[390px]" aria-label={`Example: ${s.label}. ${s.note}`}>
        <div key={`beam-${s.id}`} className="beam pointer-events-none absolute -inset-x-6 top-0 z-40 h-1/2 rounded-3xl mix-blend-screen" />
        <Sheet tone="po" title="PURCHASE ORDER" number={s.po} className="top-0 left-0 z-10 -rotate-2">
          {rows('po')}
        </Sheet>
        <Sheet tone="dn" title="DELIVERY CHALLAN" number={s.dn} className="top-[86px] left-[7%] z-20 rotate-1">
          {rows('dn')}
        </Sheet>
        <Sheet tone="inv" title="TAX INVOICE" number={s.inv} className="top-[172px] left-[14%] z-30 -rotate-1 pb-16 sm:pb-16">
          {rows('inv')}
          <div className="pointer-events-none absolute right-4 bottom-3">
            <Stamp key={s.id} land paper className="text-lg sm:text-xl">
              {s.stamp}
            </Stamp>
          </div>
        </Sheet>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Example discrepancies">
        {SCENARIOS.map((x, k) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={k === i}
            onClick={() => {
              setTouched(true);
              setI(k);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all duration-200 ${k === i ? 'border-transparent bg-ink text-desk shadow-[0_0_24px_-4px_rgba(236,239,250,0.5)]' : 'border-line bg-white/[0.03] text-ink-2 hover:border-carbon/40 hover:text-ink'}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-md text-center text-sm text-muted">{s.note}</p>
    </div>
  );
}
