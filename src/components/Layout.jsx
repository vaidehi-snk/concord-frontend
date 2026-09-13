import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/app', end: true, label: 'Upload',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M12 4v12m0-12l-4 4m4-4l4 4M4 18v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/app/dashboard', label: 'Disputes',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 9h18M8 4v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/app/vendors', label: 'Vendors',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/app/reports', label: 'Reports',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <path d="M3 3v18h18M7 15l4-5 3 3 5-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/app/settings', label: 'Settings',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="none" {...props}>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Layout() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-navy text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-navy-tint'
    }`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      <aside className="w-60 shrink-0 bg-white border-r border-line flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
          <div className="w-7 h-7 rounded-md bg-navy flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
              <path d="M4 12L10 18L20 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] text-ink tracking-tight">Concord</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-line">
          <div className="text-[11px] text-muted leading-relaxed">
            Autonomous B2B invoice dispute &amp; settlement platform
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main className="max-w-4xl mx-auto px-10 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
