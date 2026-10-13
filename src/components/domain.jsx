import { useState } from 'react';
import { Check, X, Minus, ChevronDown } from 'lucide-react';
import { money, ISSUE } from '../lib/format';
import { Badge } from './ui';

const tokens = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
function sim(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let n = 0;
  A.forEach((t) => B.has(t) && n++);
  return n / Math.min(A.size, B.size);
}
const find = (it, list) => {
  let best = null;
  let score = 0;
  for (const c of list || []) {
    const s = sim(it.description, c.description);
    if (s > score) {
      best = c;
      score = s;
    }
  }
  return score >= 0.6 ? best : null;
};

/**
 * Line-by-line comparison of the three documents. Columns carry their
 * document's paper colour so the eye knows where each number came from.
 */
export function ThreeWayTable({ po, dn, invoice, flags = [] }) {
  const poItems = po?.extracted?.lineItems || [];
  const dnItems = dn?.extracted?.lineItems || [];
  const invItems = invoice?.extracted?.lineItems || [];
  const rows = invItems.map((it) => ({ inv: it, po: find(it, poItems), dn: find(it, dnItems) }));
  poItems.filter((p) => !invItems.some((i) => find(i, [p]))).forEach((p) => rows.push({ inv: null, po: p, dn: find(p, dnItems) }));

  const flagFor = (desc, codes) => flags.find((f) => codes.includes(f.code) && f.item && sim(f.item, desc) >= 0.6);

  if (!rows.length) {
    return <p className="px-4 py-6 text-sm text-muted">Line items couldn't be read from these documents, so only totals were compared.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-xs font-semibold tracking-wide text-muted">
            <th className="px-4 py-2.5 text-left">Item</th>
            <th className="border-b border-po-edge/40 bg-po px-4 py-2.5 text-right">
              Ordered <span className="font-normal text-muted">{po?.docNumber}</span>
            </th>
            <th className="border-b border-dn-edge/40 bg-dn px-4 py-2.5 text-right">
              Delivered <span className="font-normal text-muted">{dn?.docNumber || 'no challan yet'}</span>
            </th>
            <th className="border-b border-inv-edge/40 bg-inv px-4 py-2.5 text-right">
              Billed <span className="font-normal text-muted">{invoice?.docNumber}</span>
            </th>
            <th className="w-10 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const name = r.inv?.description || r.po?.description;
            const qtyFlag = r.inv && flagFor(name, ['SHORT_DELIVERY', 'QTY_OVER_PO']);
            const priceFlag = r.inv && flagFor(name, ['PRICE_MISMATCH']);
            const notOnPo = r.inv && !r.po;
            const bad = qtyFlag || priceFlag || notOnPo;
            return (
              <tr key={i} className={`border-t border-line-2 ${bad ? 'bg-stamp/[0.06]' : ''}`}>
                <td className="px-4 py-3 font-medium text-ink">
                  {name}
                  {!r.inv && <span className="ml-2 text-xs text-muted">(not billed)</span>}
                </td>
                <td className="num bg-po/40 px-4 py-3 text-right">
                  {r.po ? (
                    <>
                      {r.po.quantity} <span className="text-muted">× {money(r.po.unitPrice, { decimals: r.po.unitPrice % 1 ? 2 : 0 })}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-stamp">Not ordered</span>
                  )}
                </td>
                <td className={`num bg-dn/40 px-4 py-3 text-right ${qtyFlag?.code === 'SHORT_DELIVERY' ? 'font-bold text-stamp' : ''}`}>{r.dn ? r.dn.quantity : dn ? <span className="text-muted">not on challan</span> : '—'}</td>
                <td className="num bg-inv/40 px-4 py-3 text-right">
                  {r.inv ? (
                    <>
                      <span className={qtyFlag ? 'font-bold text-stamp' : ''}>{r.inv.quantity}</span>{' '}
                      <span className={priceFlag ? 'font-bold text-stamp' : 'text-muted'}>× {money(r.inv.unitPrice, { decimals: r.inv.unitPrice % 1 ? 2 : 0 })}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-2 py-3 text-center">{bad ? <X size={16} className="inline text-stamp" aria-label="Mismatch" /> : r.inv ? <Check size={16} className="inline text-ok" aria-label="Matches" /> : null}</td>
              </tr>
            );
          })}
          <tr className="border-t border-line font-semibold text-ink">
            <td className="px-4 py-3">Total incl. GST</td>
            <td className="num bg-po/40 px-4 py-3 text-right">{money(po?.extracted?.totalAmount)}</td>
            <td className="bg-dn/40 px-4 py-3" />
            <td className="num bg-inv/40 px-4 py-3 text-right">{money(invoice?.extracted?.totalAmount)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Checklist({ checks = [], compact = false }) {
  const passed = checks.filter((c) => c.status === 'pass').length;
  const run = checks.filter((c) => c.status !== 'skip').length;
  return (
    <div>
      {!compact && (
        <p className="mb-3 text-sm text-ink-2">
          <strong className="text-ink">
            {passed} of {run}
          </strong>{' '}
          checks passed{checks.length - run > 0 && <span className="text-muted"> ({checks.length - run} not applicable yet)</span>}
        </p>
      )}
      <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.code} className="flex items-start gap-2 text-sm" title={c.detail || ''}>
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                c.status === 'pass' ? 'bg-ok/15 text-ok ring-1 ring-ok/40' : c.status === 'fail' ? 'bg-stamp/15 text-stamp ring-1 ring-stamp/50' : 'border border-faint/50 text-faint'
              }`}
            >
              {c.status === 'pass' ? <Check size={11} strokeWidth={3} /> : c.status === 'fail' ? <X size={11} strokeWidth={3} /> : <Minus size={10} />}
            </span>
            <span className={c.status === 'skip' ? 'text-muted' : c.status === 'fail' ? 'font-semibold text-ink' : 'text-ink-2'}>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SEV = { HIGH: 'red', MED: 'amber', LOW: 'grey' };

export function FlagCard({ flag, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasEvidence = flag.expected !== undefined || flag.formula;
  return (
    <div className="border-b border-line-2 last:border-b-0">
      <button className="flex w-full items-start gap-3 px-4 py-3.5 text-left" onClick={() => hasEvidence && setOpen((o) => !o)} aria-expanded={open}>
        <Badge tone={SEV[flag.severity]}>{ISSUE[flag.code] || flag.field}</Badge>
        <span className="flex-1 text-sm text-ink">{flag.description}</span>
        {flag.financialImpact > 0 && <span className="num shrink-0 text-sm font-bold text-ink">{money(flag.financialImpact)}</span>}
        {hasEvidence && <ChevronDown size={16} className={`mt-0.5 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div className="animate-in mx-4 mb-4 grid gap-3 rounded-xl border border-line-2 bg-ink/[0.035] p-4 text-sm sm:grid-cols-3">
          {flag.expected !== undefined && (
            <div>
              <p className="text-xs text-muted">Should be{flag.expectedSource ? `, per ${flag.expectedSource}` : ''}</p>
              <p className="num mt-0.5 font-semibold text-ink">{String(flag.expected)}</p>
            </div>
          )}
          {flag.actual !== undefined && (
            <div>
              <p className="text-xs text-muted">Actually{flag.actualSource ? ` on ${flag.actualSource}` : ''}</p>
              <p className="num mt-0.5 font-semibold text-stamp">{String(flag.actual)}</p>
            </div>
          )}
          {flag.formula && (
            <div className="sm:col-span-3">
              <p className="text-xs text-muted">How the amount was worked out</p>
              <p className="num mt-0.5 font-medium text-carbon-dark">{flag.formula}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
