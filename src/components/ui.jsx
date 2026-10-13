import { useEffect, useRef } from 'react';
import { X, AlertTriangle, RotateCw } from 'lucide-react';
import { DOC, STATUS, initials } from '../lib/format';

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display text-ink ${className}`}>
      <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0 -rotate-12 text-stamp" aria-hidden>
        <circle cx="14" cy="14" r="11.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="14" cy="14" r="5" fill="currentColor" />
      </svg>
      <span className="text-[1.3rem] font-semibold tracking-[-0.01em]">Concord</span>
    </span>
  );
}

const DOC_STYLE = {
  PO: 'bg-po text-ink border-po-edge',
  DN: 'bg-dn text-ink border-dn-edge',
  INVOICE: 'bg-inv text-ink border-inv-edge',
};

export function DocChip({ type, number, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs font-semibold ${DOC_STYLE[type] || ''} ${className}`}>
      <span className="opacity-70">{DOC[type]?.short}</span>
      {number && <span className="num">{number}</span>}
    </span>
  );
}

// The three slots of a purchase: filled sheet if that document has arrived
export function TriplicateSlots({ po, dn, invoice, size = 'md' }) {
  const box = size === 'sm' ? 'h-5 w-4' : 'h-6 w-5';
  const slot = (present, type, label) => (
    <span
      title={`${label}: ${present ? 'received' : 'missing'}`}
      className={`${box} inline-block rounded-[3px] border ${present ? DOC_STYLE[type] : 'border-dashed border-faint bg-transparent'}`}
    />
  );
  return (
    <span className="inline-flex items-center gap-1" aria-label={`PO ${po ? 'received' : 'missing'}, challan ${dn ? 'received' : 'missing'}, invoice ${invoice ? 'received' : 'missing'}`}>
      {slot(po, 'PO', 'Purchase order')}
      {slot(dn, 'DN', 'Delivery challan')}
      {slot(invoice, 'INVOICE', 'Invoice')}
    </span>
  );
}

const TONES = {
  red: 'bg-stamp-tint text-stamp ring-1 ring-inset ring-stamp/20',
  green: 'bg-ok-tint text-ok ring-1 ring-inset ring-ok/20',
  amber: 'bg-wait-tint text-wait ring-1 ring-inset ring-wait/20',
  blue: 'bg-carbon-tint text-carbon-dark ring-1 ring-inset ring-carbon/25',
  grey: 'bg-ink/[0.05] text-ink-2 ring-1 ring-inset ring-ink/[0.06]',
};

export function Badge({ tone = 'grey', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>{children}</span>;
}

export function StatusBadge({ status, map = STATUS }) {
  const s = map[status] || { label: status, tone: 'grey' };
  return (
    <Badge tone={s.tone}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </Badge>
  );
}

export function PriorityMark({ priority }) {
  const map = { high: ['bg-stamp', 'High'], medium: ['bg-wait', 'Medium'], low: ['bg-faint', 'Low'] };
  const [c, l] = map[priority] || map.low;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-2" title={`${l} priority`}>
      <span className={`h-2 w-2 rounded-sm ${c}`} aria-hidden />
      {l}
    </span>
  );
}

export function Stamp({ tone = 'red', children, land = false, paper = false, className = '' }) {
  return <span className={`stamp ${tone === 'green' ? 'stamp-green' : 'stamp-red'} ${paper ? 'stamp-paper' : ''} ${land ? 'stamp-land' : ''} ${className}`}>{children}</span>;
}

export function Avatar({ name, className = '' }) {
  return (
    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carbon-tint text-xs font-bold text-carbon-dark ring-1 ring-ink/10 ${className}`} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-[1.1] text-ink">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-ink/[0.03] text-carbon-dark">
          <Icon size={22} />
        </span>
      )}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />;
}

export function LoadingRows({ rows = 5 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-stamp/30 bg-stamp-tint px-4 py-3 text-sm text-stamp">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <span className="flex-1">{error.message || String(error)}</span>
      {onRetry && (
        <button className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline" onClick={onRetry}>
          <RotateCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Focus once when the modal opens. Depending only on `open` matters: callers pass a
  // new onClose on every render, which used to re-run this and steal focus on each keystroke.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    const el = ref.current?.querySelector('input:not([type=hidden]),textarea,select') || ref.current?.querySelector('button');
    el?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0  sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`animate-in max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-raised shadow-[0_18px_40px_-18px_rgba(27,36,51,0.35)] sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line-2 bg-raised/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg text-ink">{title}</h2>
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line-2 bg-raised/95 px-5 py-3 backdrop-blur">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line-2">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
            value === t.value ? 'border-carbon text-ink' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t.label}
          {t.count != null && <span className={`num rounded-full px-1.5 text-xs ${value === t.value ? 'bg-carbon-tint text-carbon-dark' : 'bg-ink/[0.05] text-muted'}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, error }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-stamp">{error}</span> : hint ? <span className="hint block">{hint}</span> : null}
    </label>
  );
}

export function Meter({ value, max = 100, tone = 'auto', label }) {
  const v = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === 'auto' ? (value >= 60 ? 'bg-stamp' : value >= 30 ? 'bg-wait' : 'bg-ok') : tone;
  return (
    <div className="flex items-center gap-2" title={label}>
      <div className="h-1 w-full min-w-12 overflow-hidden rounded-full bg-ink/[0.06]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
