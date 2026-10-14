import { money } from '../lib/format';

// Series colours come from the theme (index.css), so charts follow light and dark:
// ink-blue, ochre, stamp red
export const SERIES = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)'];
export const GRID = 'var(--color-line-2)';
export const AXIS = { fontSize: 12, fill: 'var(--color-muted)' };

export function ChartTooltip({ active, payload, label, labelFormat = (l) => l, valueFormat = money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-raised/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      <p className="mb-1 font-semibold text-ink">{labelFormat(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-ink-2">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.fill }} />
          <span className="flex-1">{p.name}</span>
          <span className="num font-semibold text-ink">{valueFormat(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-ink-2">
      {items.map(([label, color]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}
