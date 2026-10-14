import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Inbox, Layers, FileWarning, Building2, Wallet, MessageSquareText, Settings, Search, Menu, X, LogOut, Upload, CornerDownLeft, Landmark } from 'lucide-react';
import { api, session, warmUp } from '../lib/api';
import { Logo, Avatar, DocChip, Skeleton } from './ui';
import ThemeToggle from './ThemeToggle';
import { money } from '../lib/format';

const ShellCtx = createContext({ kpis: null, refresh: () => {} });
export const useShell = () => useContext(ShellCtx);

const NAV = [
  { to: '/app', end: true, label: 'Overview', icon: LayoutDashboard, group: 'Workspace' },
  { to: '/app/inbox', label: 'Inbox', icon: Inbox, group: 'Work' },
  { to: '/app/purchases', label: 'Purchases', icon: Layers, count: (k) => k?.awaitingDocuments, countLabel: 'waiting for documents' },
  { to: '/app/disputes', group: 'Work', label: 'Disputes', icon: FileWarning, count: (k) => k?.openDisputes, countLabel: 'open', alert: true },
  { to: '/app/vendors', label: 'Vendors', icon: Building2 },
  { to: '/app/payments', group: 'Money', label: 'Payments', icon: Wallet, count: (k) => k?.paymentHolds, countLabel: 'payments on hold', alert: true },
  { to: '/app/gst', label: 'GST & ITC', icon: Landmark, count: (k) => k?.gstVendorsToChase, countLabel: 'suppliers to chase', warn: true },
  { to: '/app/ask', label: 'Ask Concord', icon: MessageSquareText, group: 'Insight' },
];

function Sidebar({ kpis, onNavigate }) {
  const navigate = useNavigate();
  const s = session.data;
  const link = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition-all duration-200 ${
      isActive
        ? 'bg-ink/[0.06] text-ink before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-carbon before:'
        : 'text-muted hover:bg-ink/[0.035] hover:text-ink'
    }`;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link to="/app" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>
      <div className="px-3 pb-2">
        <Link to="/app/inbox" onClick={onNavigate} className="btn-primary w-full">
          <Upload size={16} /> Upload documents
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main">
        {NAV.map((n, i) => {
          const c = n.count?.(kpis);
          const label = i > 0 && n.group && n.group !== 'Workspace' && NAV.slice(0, i).every((x) => x.group !== n.group) ? n.group : null;
          return (
            <div key={n.to}>
            {label && <p className="px-3 pt-5 pb-1.5 text-xs font-medium text-faint">{label}</p>}
            <NavLink to={n.to} end={n.end} className={link} onClick={onNavigate}>
              <n.icon size={17} strokeWidth={1.8} className="shrink-0 opacity-90" />
              <span className="flex-1">{n.label}</span>
              {c > 0 && (
                <span title={`${c} ${n.countLabel}`} className={`num min-w-5 rounded-full px-1.5 text-center text-xs font-semibold ${n.alert ? 'bg-stamp/15 text-stamp ring-1 ring-stamp/40' : n.warn ? 'bg-wait-tint text-wait ring-1 ring-wait/30' : 'bg-ink/[0.06] text-ink-2'}`}>
                  {c}
                </span>
              )}
            </NavLink>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line-2 p-3">
        <NavLink to="/app/settings" className={link} onClick={onNavigate}>
          <Settings size={17} strokeWidth={1.8} className="opacity-90" /> Settings
        </NavLink>
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar name={s?.user?.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{s?.user?.name}</p>
            <p className="truncate text-xs text-muted">
              <span className="capitalize">{s?.user?.role}</span> at {s?.company?.name}
            </p>
          </div>
          <button
            className="btn-ghost btn-sm"
            aria-label="Log out"
            title="Log out"
            onClick={() => {
              session.clear();
              navigate('/');
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setActive(0);
    inputRef.current?.focus();
    Promise.all([api.get('/disputes'), api.get('/vendors'), api.get('/matches')])
      .then(([disputes, vendors, matches]) => setData({ disputes, vendors, matches }))
      .catch(() => setData({ disputes: [], vendors: [], matches: [] }));
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pages = [...NAV, { to: '/app/settings', label: 'Settings', icon: Settings }].map((n) => ({ key: n.to, group: 'Go to', label: n.label, to: n.to, icon: n.icon }));
    if (!term) return pages;
    const has = (...s) => s.some((x) => x && String(x).toLowerCase().includes(term));
    const out = pages.filter((p) => has(p.label));
    (data?.disputes || [])
      .filter((d) => has(d.reference, d.vendor?.name, d.invoice?.docNumber, d.po?.docNumber))
      .slice(0, 6)
      .forEach((d) => out.push({ key: d._id, group: 'Disputes', label: `${d.reference}  ${d.vendor?.name}`, meta: money(d.totalFinancialImpact), to: `/app/disputes/${d._id}` }));
    (data?.matches || [])
      .filter((m) => has(m.poNumber, m.vendor?.name, m.invoice?.docNumber))
      .slice(0, 6)
      .forEach((m) => out.push({ key: m._id, group: 'Purchases', label: `${m.poNumber}  ${m.vendor?.name || ''}`, doc: 'PO', to: `/app/purchases/${m._id}` }));
    (data?.vendors || [])
      .filter((v) => has(v.name, v.gstin))
      .slice(0, 5)
      .forEach((v) => out.push({ key: v._id, group: 'Vendors', label: v.name, meta: v.gstin, to: `/app/vendors/${v._id}` }));
    return out;
  }, [q, data]);

  if (!open) return null;
  const go = (r) => {
    navigate(r.to);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[12vh] " onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animate-in w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-raised/95 shadow-[0_18px_40px_-18px_rgba(27,36,51,0.35)] " role="dialog" aria-label="Search">
        <div className="flex items-center gap-3 border-b border-line-2 px-4">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1));
              if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
            placeholder="Search disputes, PO numbers, invoices, vendors…"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
            aria-label="Search"
          />
          <kbd className="rounded border border-line px-1.5 text-xs text-muted">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{q}”.</li>}
          {results.map((r, i) => (
            <li key={r.key}>
              {(i === 0 || results[i - 1].group !== r.group) && <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted">{r.group}</p>}
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${i === active ? 'bg-carbon-tint text-ink' : 'text-ink-2'}`}
              >
                {r.icon && <r.icon size={16} className="opacity-70" />}
                {r.doc && <DocChip type={r.doc} />}
                <span className="flex-1 truncate font-medium">{r.label}</span>
                {r.meta && <span className="num text-xs text-muted">{r.meta}</span>}
                {i === active && <CornerDownLeft size={14} className="text-muted" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { pathname } = useLocation();
  const [kpis, setKpis] = useState(null);
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const s = session.data;
  const refresh = useCallback(() => {
    api
      .get('/overview?weeks=1')
      .then((o) => setKpis(o.kpis))
      .catch(() => {});
  }, []);
  useEffect(() => {
    warmUp();
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ShellCtx.Provider value={{ kpis, refresh }}>
      <div className="min-h-screen lg:pl-64">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line-2 bg-paper  lg:block">
          <Sidebar kpis={kpis} />
        </aside>
        {menu && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-ink/40 " onClick={() => setMenu(false)} />
            <aside className="animate-in absolute inset-y-0 left-0 w-72 border-r border-line bg-paper shadow-2xl">
              <button className="btn-ghost btn-sm absolute top-4 right-3" onClick={() => setMenu(false)} aria-label="Close menu">
                <X size={18} />
              </button>
              <Sidebar kpis={kpis} onNavigate={() => setMenu(false)} />
            </aside>
          </div>
        )}

        {s?.company?.isDemo && (
          <div className="border-b border-wait/20 bg-wait-tint px-4 py-2 text-center text-[13px] text-ink-2">
            You're exploring a sample company, <strong className="text-ink">{s.company.name.replace(/\.$/, '')}</strong>. Everything works: try approving a dispute or uploading documents.{' '}
            <Link to="/register" className="font-semibold text-wait underline decoration-wait/40 underline-offset-4 hover:decoration-wait">
              Create your own workspace
            </Link>
          </div>
        )}

        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line-2 bg-desk/95 px-4 sm:px-6">
          <button className="btn-ghost btn-sm lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="lg:hidden">
            <Logo />
          </span>
          <button
            onClick={() => setPalette(true)}
            className="ml-auto flex h-10 w-full max-w-md items-center gap-3 rounded-[10px] border border-line bg-paper px-3 text-sm text-muted transition-all hover:border-line lg:ml-0"
          >
            <Search size={16} />
            <span className="hidden flex-1 text-left sm:block">Search disputes, POs, invoices, vendors</span>
            <kbd className="hidden rounded-md border border-line bg-ink/[0.04] px-1.5 py-0.5 text-xs font-semibold text-muted sm:block">Ctrl K</kbd>
          </button>
          <div className="hidden flex-1 lg:block" />
          <ThemeToggle />
          {kpis && (
            <div className="hidden items-center gap-5 text-sm xl:flex">
              <span className="flex items-center gap-2 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-stamp" />
                At risk <strong className="num font-display text-[15px] font-semibold text-ink">{money(kpis.moneyAtRisk)}</strong>
              </span>
              <span className="flex items-center gap-2 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                Recovered <strong className="num font-display text-[15px] font-semibold text-ink">{money(kpis.moneyRecovered)}</strong>
              </span>
            </div>
          )}
        </header>

        <main id="main" className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-8 lg:py-10">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <div key={pathname} className="page-enter">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </ShellCtx.Provider>
  );
}
