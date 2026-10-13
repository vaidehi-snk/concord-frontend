import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Mail, KeyRound, ShieldCheck, UserCog, User, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { ErrorNote, Modal } from '../components/ui';
import { api, session } from '../lib/api';
import { useDemo, useDocumentTitle } from '../lib/hooks';

const ROLES = [
  { value: 'admin', label: 'Owner', icon: ShieldCheck, body: 'Sees everything, sets rules, approves.' },
  { value: 'manager', label: 'Manager', icon: UserCog, body: 'Approves vendor emails and payments.' },
  { value: 'member', label: 'Accountant', icon: User, body: 'Uploads, drafts, chases vendors.' },
];

export default function Login() {
  useDocumentTitle('Log in');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [role, setRole] = useState('admin');
  const [error, setError] = useState(params.get('expired') ? { message: 'Your session expired. Log in again to continue.' } : null);
  const demo = useDemo();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await api.post('/auth/login', form, { auth: false });
      session.save(s);
      navigate(params.get('next') || '/app');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="animate-rise">
        <h1 className="text-[34px] leading-[1.05] font-semibold tracking-[-0.04em] text-ink">Welcome back</h1>
        <p className="mt-2 text-[15px] text-muted">Log in to pick up where your team left off.</p>
      </div>

      <form onSubmit={submit} className="animate-rise mt-9 space-y-4 [animation-delay:80ms]">
        <ErrorNote error={error || demo.error} />
        <label className="block">
          <span className="label">Work email</span>
          <span className="relative block">
            <Mail size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
            <input className="input h-11 pl-10" type="email" autoComplete="email" required placeholder="you@company.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </span>
        </label>
        <label className="block">
          <span className="label flex items-center justify-between">
            Password
            <button type="button" className="text-[12.5px] font-medium text-carbon-dark transition-colors hover:text-ink" onClick={() => setForgot(true)}>
              Forgot password?
            </button>
          </span>
          <span className="relative block">
            <KeyRound size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
            <input
              className="input h-11 pr-11 pl-10"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock'))}
            />
            <button type="button" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-faint transition-colors hover:text-ink" onClick={() => setShow((x) => !x)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {caps && <span className="mt-1.5 block text-xs text-wait">Caps Lock is on</span>}
        </label>
        <button className="btn-primary h-11 w-full text-[15px]" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : null} Log in
        </button>
      </form>

      <div className="animate-rise my-9 flex items-center gap-3 text-xs text-faint [animation-delay:160ms]">
        <span className="h-px flex-1 bg-white/[0.07]" />
        or explore the sample company
        <span className="h-px flex-1 bg-white/[0.07]" />
      </div>

      <div className="animate-rise [animation-delay:200ms]">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Explore as">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              onClick={() => setRole(r.value)}
              className={`rounded-xl border p-3 text-left transition-all duration-200 ${role === r.value ? 'border-carbon/60 bg-carbon-tint shadow-[0_0_30px_-12px_rgba(111,125,255,0.9)]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'}`}
            >
              <r.icon size={16} className={role === r.value ? 'text-carbon-dark' : 'text-muted'} />
              <p className="mt-2 text-[13px] font-semibold text-ink">{r.label}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{r.body}</p>
            </button>
          ))}
        </div>
        <button className="btn-secondary mt-3 h-11 w-full" onClick={() => demo.start(role)} disabled={!!demo.busy}>
          {demo.busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {demo.busy ? 'Setting up your copy…' : `Explore as ${ROLES.find((r) => r.value === role).label.toLowerCase()}`}
          {!demo.busy && <ArrowRight size={15} />}
        </button>
        <p className="mt-2 text-center text-xs text-faint">A private, fully loaded copy. Nothing you do affects anyone else.</p>
      </div>

      <p className="mt-10 text-sm text-muted">
        New to Concord?{' '}
        <Link to="/register" className="font-semibold text-carbon-dark transition-colors hover:text-ink">
          Create a workspace
        </Link>
      </p>

      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset your password">
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>For security, Concord doesn’t send reset links by email yet. The admin of your workspace can set a temporary password for you in a few seconds:</p>
          <ol className="list-decimal space-y-1 pl-5 text-ink-2">
            <li>They open Settings → Team.</li>
            <li>They choose “Reset password” next to your name.</li>
            <li>You log in with the temporary password and change it in Settings.</li>
          </ol>
          <p>If you’re the only admin, ask whoever set up Concord for your company, or create a fresh workspace.</p>
        </div>
      </Modal>
    </AuthLayout>
  );
}
