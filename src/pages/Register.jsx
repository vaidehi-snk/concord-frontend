import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowLeft, ArrowRight, Check, PackageX, TrendingUp, Landmark, Clock4, Copy, MessageCircle, ShieldAlert, Building2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { ErrorNote } from '../components/ui';
import { api, session } from '../lib/api';
import { useDocumentTitle } from '../lib/hooks';
import { gstinCheck, gstinParts } from '../lib/gstin';

const PAINS = [
  { value: 'short_delivery', goal: 'Catch short deliveries', label: 'Short deliveries', body: 'Billed for more than arrived', icon: PackageX },
  { value: 'price_creep', goal: 'Hold every rate to the PO', label: 'Rates above the PO', body: 'Prices creeping up', icon: TrendingUp },
  { value: 'gst_itc', goal: 'Protect your GST credit', label: 'GST and ITC', body: 'Suppliers not filing, wrong rates', icon: Landmark },
  { value: 'msme', goal: 'Never miss an MSME deadline', label: 'MSME payment deadlines', body: 'Paying small suppliers late', icon: Clock4 },
  { value: 'duplicates', goal: 'Stop duplicate payments', label: 'Duplicate bills', body: 'Paying the same invoice twice', icon: Copy },
  { value: 'vendor_followup', goal: 'Put vendor follow-ups on autopilot', label: 'Chasing vendors', body: 'Credit notes that never come', icon: MessageCircle },
  { value: 'bank_fraud', goal: 'Block payments to changed accounts', label: 'Payment fraud', body: 'Changed bank details', icon: ShieldAlert },
];
const INDUSTRIES = ['Auto components', 'Engineering & fabrication', 'Pharma & chemicals', 'Textiles & apparel', 'FMCG & food processing', 'Electronics', 'Construction & infra', 'Trading & distribution', 'Other'];
const SIZES = ['1–10', '11–50', '51–200', '200+'];
const VOLUMES = ['Under 50', '50–300', '300–1,000', '1,000+'];
const SOFTWARE = ['TallyPrime', 'Zoho Books', 'BUSY', 'Marg', 'SAP / Oracle', 'Excel', 'Other'];

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

function Chips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-all ${value === o ? 'border-carbon/60 bg-carbon-tint text-ink' : 'border-ink/[0.08] text-muted hover:border-ink/20 hover:text-ink'}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// Right-hand panel: the workspace taking shape as the form is filled in
function Preview({ f }) {
  const g = f.gstin.length === 15 ? gstinCheck(f.gstin) : null;
  const parts = g?.valid ? gstinParts(f.gstin) : null;
  const pains = PAINS.filter((p) => f.painPoints.includes(p.value));
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="kicker">Your workspace</p>
      <div className="ring-aurora mt-4 max-w-md rounded-2xl bg-paper p-6 ">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-carbon-tint font-display text-lg font-bold text-carbon-dark ring-1 ring-ink/10">
            {(f.companyName || 'C').trim()[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-[20px] font-semibold tracking-[-0.02em] text-ink">{f.companyName || 'Your company'}</p>
            <p className="mt-0.5 text-[13px] text-muted">{[f.industry, f.teamSize && `${f.teamSize} people`].filter(Boolean).join(', ') || 'Industry and team size'}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2 border-t border-ink/[0.06] pt-5 text-[13px]">
          <div className="flex justify-between gap-3">
            <span className="text-muted">GSTIN</span>
            {g ? (
              g.valid ? (
                <span className="inline-flex items-center gap-1.5 text-ok">
                  <CheckCircle2 size={13} /> <span className="num">{f.gstin}</span>
                </span>
              ) : (
                <span className="text-stamp">Check digit fails</span>
              )
            ) : (
              <span className="text-faint">Not added</span>
            )}
          </div>
          {parts && (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-muted">State</span>
                <span className="text-ink-2">{parts.state}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted">PAN</span>
                <span className="num text-ink-2">{parts.pan}</span>
              </div>
            </>
          )}
          <div className="flex justify-between gap-3">
            <span className="text-muted">Invoices a month</span>
            <span className="text-ink-2">{f.monthlyInvoices || '—'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Books kept in</span>
            <span className="text-ink-2">{f.accountingSoftware || '—'}</span>
          </div>
        </div>
        <div className="mt-5 border-t border-ink/[0.06] pt-5">
          <p className="text-[13px] font-semibold text-ink">Your first week</p>
          <ul className="mt-3 space-y-2 text-[13px]">
            {(pains.length ? pains : PAINS.slice(0, 3)).slice(0, 4).map((p) => (
              <li key={p.value} className={`flex items-center gap-2.5 ${pains.length ? 'text-ink-2' : 'text-faint'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${pains.length ? 'bg-ok/15 text-ok ring-1 ring-ok/30' : 'border border-ink/10'}`}>
                  <Check size={11} />
                </span>
                {p.goal}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 max-w-md text-[13px] leading-relaxed text-muted">Free for your first 50 documents a month. No card, no install — upload your first PO, challan and invoice and see the check in seconds.</p>
    </div>
  );
}

export default function Register() {
  useDocumentTitle('Create your workspace');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: '', email: '', password: '', companyName: '', gstin: '', industry: '', teamSize: '', monthlyInvoices: '', accountingSoftware: '', painPoints: [] });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: k === 'gstin' ? e.target.value.toUpperCase().replace(/\s/g, '') : e.target.value });
  const pw = strength(f.password);
  const g = f.gstin.length === 15 ? gstinCheck(f.gstin) : null;

  const valid = useMemo(
    () => [
      f.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && f.password.length >= 8,
      f.companyName.trim() && (!f.gstin || (f.gstin.length === 15 && g?.valid)),
      true,
    ],
    [f, g]
  );

  const next = (e) => {
    e?.preventDefault();
    if (!valid[step]) return;
    if (step < 2) setStep(step + 1);
    else create();
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const s = await api.post('/auth/register', f, { auth: false });
      session.save(s);
      navigate('/app/inbox?welcome=1');
    } catch (err) {
      setError(err);
      setBusy(false);
      if (/email/i.test(err.message)) setStep(0);
      if (/GSTIN/i.test(err.message)) setStep(1);
    }
  };

  const STEPS = ['You', 'Company', 'Priorities'];

  return (
    <AuthLayout aside={<Preview f={f} />}>
      {/* progress */}
      <div className="mb-10">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-[3px] rounded-full transition-all duration-500 ${i <= step ? 'bg-ink' : 'bg-ink/[0.08]'}`} />
              <p className={`mt-2 text-[12px] ${i === step ? 'font-semibold text-ink' : 'text-faint'}`}>
                {i + 1}. {s}
              </p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={next} key={step} className="animate-rise">
        {step === 0 && (
          <>
            <h1 className="text-[34px] leading-[1.05] text-ink">Create your workspace</h1>
            <p className="mt-2 text-[15px] text-muted">Start with you. You’ll be the admin and can invite your team later.</p>
            <div className="mt-8 space-y-4">
              <ErrorNote error={error} />
              <label className="block">
                <span className="label">Full name</span>
                <input className="input h-11" autoFocus autoComplete="name" value={f.name} onChange={set('name')} placeholder="Priya Deshpande" />
              </label>
              <label className="block">
                <span className="label">Work email</span>
                <input className="input h-11" type="email" autoComplete="email" value={f.email} onChange={set('email')} placeholder="priya@company.in" />
              </label>
              <label className="block">
                <span className="label">Password</span>
                <span className="relative block">
                  <input className="input h-11 pr-11" type={show ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={set('password')} />
                  <button type="button" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-faint hover:text-ink" onClick={() => setShow((x) => !x)} aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
                <span className="mt-2 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < pw ? (pw <= 1 ? 'bg-stamp' : pw === 2 ? 'bg-wait' : 'bg-ok') : 'bg-ink/[0.08]'}`} />
                  ))}
                </span>
                <span className="mt-1.5 block text-xs text-muted">{f.password ? (f.password.length < 8 ? 'At least 8 characters' : ['Weak', 'Weak', 'Okay', 'Strong', 'Very strong'][pw]) : 'At least 8 characters. A mix of letters, numbers and symbols is best.'}</span>
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-[34px] leading-[1.05] text-ink">Your company</h1>
            <p className="mt-2 text-[15px] text-muted">So Concord can check that invoices are billed to you, and set sensible rules.</p>
            <div className="mt-8 space-y-5">
              <ErrorNote error={error} />
              <label className="block">
                <span className="label">Company name</span>
                <span className="relative block">
                  <Building2 size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
                  <input className="input h-11 pl-10" autoFocus autoComplete="organization" value={f.companyName} onChange={set('companyName')} placeholder="Sahyadri Auto Components Pvt. Ltd." />
                </span>
              </label>
              <label className="block">
                <span className="label">GSTIN (optional)</span>
                <span className="relative block">
                  <input className="input num h-11 pr-10 tracking-[0.08em]" maxLength={15} value={f.gstin} onChange={set('gstin')} placeholder="27AAPFU0939F1ZV" />
                  {g && <span className="absolute top-1/2 right-3 -translate-y-1/2">{g.valid ? <CheckCircle2 size={16} className="text-ok" /> : <AlertCircle size={16} className="text-stamp" />}</span>}
                </span>
                <span className={`mt-1.5 block text-xs ${g && !g.valid ? 'text-stamp' : 'text-muted'}`}>{g ? (g.valid ? `Valid. Registered in ${gstinParts(f.gstin).state}.` : g.reason) : 'Checked instantly with the government check-digit formula.'}</span>
              </label>
              <div>
                <span className="label">Industry</span>
                <select className="input h-11" value={f.industry} onChange={set('industry')}>
                  <option value="">Choose one</option>
                  {INDUSTRIES.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="label">Team size</span>
                <Chips options={SIZES} value={f.teamSize} onChange={(v) => setF({ ...f, teamSize: v })} />
              </div>
              <div>
                <span className="label">Supplier invoices a month</span>
                <Chips options={VOLUMES} value={f.monthlyInvoices} onChange={(v) => setF({ ...f, monthlyInvoices: v })} />
              </div>
              <div>
                <span className="label">Where you keep your books</span>
                <Chips options={SOFTWARE} value={f.accountingSoftware} onChange={(v) => setF({ ...f, accountingSoftware: v })} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-[34px] leading-[1.05] text-ink">What costs you most?</h1>
            <p className="mt-2 text-[15px] text-muted">Pick any. Concord sets up your first week around them — every check still runs on every purchase.</p>
            <ErrorNote error={error} />
            <div className="mt-8 grid grid-cols-2 gap-2.5">
              {PAINS.map((p) => {
                const on = f.painPoints.includes(p.value);
                return (
                  <button
                    type="button"
                    key={p.value}
                    onClick={() => setF({ ...f, painPoints: on ? f.painPoints.filter((x) => x !== p.value) : [...f.painPoints, p.value] })}
                    className={`relative rounded-xl border p-3.5 text-left transition-all duration-200 ${on ? 'border-carbon/60 bg-carbon-tint' : 'border-ink/[0.07] bg-ink/[0.02] hover:border-ink/15'}`}
                  >
                    {on && (
                      <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-carbon text-white">
                        <Check size={11} />
                      </span>
                    )}
                    <p.icon size={17} className={on ? 'text-carbon-dark' : 'text-muted'} />
                    <p className="mt-2.5 text-[13.5px] font-semibold text-ink">{p.label}</p>
                    <p className="mt-0.5 text-[12px] text-muted">{p.body}</p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-9 flex items-center gap-3">
          {step > 0 && (
            <button type="button" className="btn-ghost h-11" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <button className="btn-primary h-11 flex-1 text-[15px]" disabled={!valid[step] || busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {step < 2 ? 'Continue' : 'Create workspace'}
            {!busy && step < 2 && <ArrowRight size={15} />}
          </button>
        </div>
      </form>

      <p className="mt-10 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-carbon-dark transition-colors hover:text-ink">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
