import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './ui';

export const NAV = [
  { id: 'catches', label: 'What it catches' },
  { id: 'how', label: 'How it works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
];

// Header for every public page. On the home page the links scroll to sections
// and the one in view is marked; elsewhere they go back to the home page.
export function SiteHeader() {
  const { pathname } = useLocation();
  const home = pathname === '/';
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!home || !('IntersectionObserver' in window)) return undefined;
    const seen = new Map();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = NAV.find((n) => seen.get(n.id));
        setActive(first ? first.id : null);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => {
      io.disconnect();
    };
  }, [home]);

  const href = (id) => (home ? `#${id}` : `/#${id}`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-desk/95 backdrop-blur-sm">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4 sm:px-8 lg:h-[72px]">
        <Link to="/" aria-label="Concord home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={href(n.id)}
              aria-current={active === n.id ? 'true' : undefined}
              className={`rounded-lg px-3 py-2.5 text-[15px] transition-colors ${active === n.id ? 'text-ink underline decoration-stamp decoration-2 underline-offset-[6px]' : 'text-muted hover:text-ink'}`}
            >
              {n.label}
            </a>
          ))}
        </nav>
        <Link to="/login" className="btn-secondary ml-2 hidden md:inline-flex">
          Log in
        </Link>
        <button
          type="button"
          className="btn-secondary ml-auto md:hidden"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((x) => !x)}
        >
          {open ? <X size={16} /> : <Menu size={16} />}
          Menu
        </button>
        <Link to="/register" className="btn-primary">
          Start free
        </Link>
      </div>
      {open && (
        <nav id="site-menu" aria-label="Main" className="animate-in border-t border-line bg-desk px-4 pt-2 pb-5 md:hidden">
          <ul className="divide-y divide-line-2">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={href(n.id)} onClick={() => setOpen(false)} className="block py-3.5 text-[17px] text-ink">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/login" className="block py-3.5 text-[17px] text-ink">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

const FOOT = [
  {
    title: 'Product',
    links: [
      ['What it catches', '/#catches'],
      ['How it works', '/#how'],
      ['Pricing', '/#pricing'],
      ['FAQ', '/#faq'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['Contact', '/contact'],
      ['Security', '/security'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['Privacy policy', '/privacy'],
      ['Terms of use', '/terms'],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-band">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-12 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-10 md:py-14">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">Purchase order, challan and invoice matching for Indian manufacturers and traders. Made in Pune.</p>
        </div>
        {FOOT.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold text-ink">{c.title}</p>
            <ul className="mt-2">
              {c.links.map(([label, to]) => (
                <li key={label}>
                  {to.startsWith('/#') ? (
                    <a href={to} className="inline-block py-2 text-sm text-muted hover:text-ink">
                      {label}
                    </a>
                  ) : (
                    <Link to={to} className="inline-block py-2 text-sm text-muted hover:text-ink">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1200px] px-4 py-5 text-[13px] text-muted sm:px-8">© 2026 Concord. Made in Pune.</p>
      </div>
    </footer>
  );
}

// Shell for the plain text pages (privacy, terms, security, contact, 404)
export function SitePage({ title, updated, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[760px] flex-1 px-4 py-14 sm:px-8 sm:py-20">
        <h1 className="text-[36px] leading-[1.08] text-ink sm:text-[48px]">{title}</h1>
        {updated && <p className="mt-3 text-sm text-muted">Last updated {updated}</p>}
        <div className="prose-ledger mt-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
