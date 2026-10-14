import { useEffect, useState } from 'react';
import { Loader2, UserPlus, CheckCircle2, AlertCircle, Cpu, KeyRound, Mail, Trash2, Copy, Bot } from 'lucide-react';
import { api, session, API_URL } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, date, ago } from '../../lib/format';
import { Avatar, Badge, ErrorNote, Field, Modal, PageHeader, Skeleton } from '../../components/ui';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';
import { gstinCheck } from '../../lib/gstin';

const RULES = [
  ['priceTolerancePct', 'Price tolerance', '%', 'Invoice rates up to this much above the PO rate are accepted (rounding, freight adjustments).'],
  ['qtyTolerancePct', 'Quantity tolerance', '%', 'Billed quantity may exceed the ordered or received quantity by this much before it’s flagged.'],
  ['amountToleranceAbs', 'Ignore differences under', '₹', 'Totals that differ by less than this are treated as rounding.'],
  ['autoApproveBelow', 'Auto-approve emails under', '₹', 'Disputes smaller than this skip manager approval. 0 means every email needs approval.'],
  ['duplicateWindowDays', 'Duplicate window', 'days', 'An invoice with the same number or same vendor and total within this window is flagged as a duplicate.'],
  ['defaultPaymentTermsDays', 'Default payment terms', 'days', 'Used when a vendor has no terms on file.'],
];

const ROLES = {
  admin: 'Everything, including rules, team and company settings',
  manager: 'Approves emails to vendors and releases purchases',
  member: 'Uploads documents, drafts disputes, logs replies',
};

export default function Settings() {
  useDocumentTitle('Settings');
  const toast = useToast();
  const { refresh } = useShell();
  const { data, error, loading, reload } = useApi('/settings');
  const team = useApi('/auth/team');
  const [company, setCompany] = useState(null);
  const [rules, setRules] = useState(null);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(null);
  const [inviteErr, setInviteErr] = useState(null);
  const isAdmin = session.data?.user?.role === 'admin';
  const [newKey, setNewKey] = useState(null);
  const [keyName, setKeyName] = useState('');
  const createKey = async () => {
    try {
      const res = await api.post('/settings/api-keys', { name: keyName || 'Integration' });
      setNewKey(res);
      setKeyName('');
      reload();
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  };
  const revokeKey = async (k) => {
    if (!window.confirm(`Revoke “${k.name}”? Anything using it stops working immediately.`)) return;
    try {
      await api.del(`/settings/api-keys/${k.prefix}`);
      reload();
      toast('Key revoked');
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  };

  useEffect(() => {
    if (data) {
      setCompany(data.company);
      setRules(data.settings);
    }
  }, [data]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.put('/settings', { company, settings: rules });
      const s = session.data;
      session.save({ user: s.user, company: { ...s.company, name: company.name, gstin: company.gstin } });
      toast(res.rechecked ? `Saved. ${res.rechecked} open purchases re-checked against the new rules.` : 'Saved');
      reload();
      refresh();
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    setInviteErr(null);
    try {
      await api.post('/auth/invite', invite);
      toast(`${invite.name} added. Share their email and temporary password with them.`);
      setInvite(null);
      team.reload();
    } catch (e) {
      setInviteErr(e);
    }
  };

  const [resetFor, setResetFor] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '' });
  const resetPassword = async () => {
    try {
      await api.patch(`/auth/team/${resetFor.user._id}/password`, { password: resetFor.password });
      toast(`Temporary password set for ${resetFor.user.name}. Share it with them directly.`);
      setResetFor(null);
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  };
  const changeOwnPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', pw);
      setPw({ current: '', next: '' });
      toast('Password changed');
    } catch (err) {
      toast(err.message, { tone: 'error' });
    }
  };
  const changeRole = async (u, role) => {
    try {
      await api.patch(`/auth/team/${u._id}`, { role });
      team.reload();
      toast(`${u.name} is now ${role}`);
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  };

  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading || !company)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-60" />
      </div>
    );

  const g = company.gstin && company.gstin.length === 15 ? gstinCheck(company.gstin) : null;

  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" subtitle={isAdmin ? 'Changes to matching rules re-check every open purchase immediately.' : 'Only an admin can change these settings.'} />

      <div className="space-y-6">
        <section className="sheet p-5 sm:p-6">
          <h2 className="text-[17px] text-ink">Company</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Company name">
              <input className="input" disabled={!isAdmin} value={company.name || ''} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
            </Field>
            <Field label="GSTIN" error={g && !g.valid ? g.reason : null} hint="Invoices are checked to make sure they’re billed to this GSTIN.">
              <div className="relative">
                <input className="input num pr-9" maxLength={15} disabled={!isAdmin} value={company.gstin || ''} onChange={(e) => setCompany({ ...company, gstin: e.target.value.toUpperCase() })} />
                {g && <span className="absolute top-1/2 right-3 -translate-y-1/2">{g.valid ? <CheckCircle2 size={16} className="text-ok" /> : <AlertCircle size={16} className="text-stamp" />}</span>}
              </div>
            </Field>
            <Field label="State">
              <input className="input" disabled={!isAdmin} value={company.state || ''} onChange={(e) => setCompany({ ...company, state: e.target.value })} />
            </Field>
            <Field label="Industry">
              <input className="input" disabled={!isAdmin} value={company.industry || ''} onChange={(e) => setCompany({ ...company, industry: e.target.value })} placeholder="Auto components" />
            </Field>
          </div>
        </section>

        <section className="sheet p-5 sm:p-6">
          <h2 className="text-[17px] text-ink">Matching rules</h2>
          <p className="mt-1 text-sm text-muted">How strict the 13 checks are. Tight by default — loosen only where your vendors have agreed variances.</p>
          <div className="mt-5 divide-y divide-line-2">
            {RULES.map(([k, label, unit, hint]) => (
              <div key={k} className="grid gap-2 py-3.5 sm:grid-cols-[1fr_180px] sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-xs text-muted">{hint}</p>
                </div>
                <label className="flex items-center gap-2">
                  {unit === '₹' && <span className="text-sm text-muted">₹</span>}
                  <input className="input num" type="number" min={0} step="any" disabled={!isAdmin} value={rules[k] ?? 0} onChange={(e) => setRules({ ...rules, [k]: e.target.value })} aria-label={label} />
                  {unit !== '₹' && <span className="text-sm whitespace-nowrap text-muted">{unit}</span>}
                </label>
              </div>
            ))}
          </div>
          <label className="mt-2 flex items-start gap-3 border-t border-line-2 pt-4">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-carbon" disabled={!isAdmin} checked={rules.autopilotFollowUps !== false} onChange={(e) => setRules({ ...rules, autopilotFollowUps: e.target.checked })} />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Bot size={15} className="text-carbon-dark" /> Autopilot follow-ups
              </span>
              <span className="block text-xs text-muted">When a vendor hasn’t replied by the due date, draft a firmer follow-up automatically and put it in the approval queue.</span>
            </span>
          </label>
          {isAdmin && (
            <div className="mt-4 flex justify-end">
              <button className="btn-primary" onClick={save} disabled={busy}>
                {busy && <Loader2 size={15} className="animate-spin" />} Save and re-check
              </button>
            </div>
          )}
        </section>

        <section className="sheet overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[17px] text-ink">Team</h2>
              <p className="text-sm text-muted">Separate who raises disputes from who approves what goes to vendors.</p>
            </div>
            {isAdmin && (
              <button className="btn-secondary" onClick={() => setInvite({ name: '', email: '', password: '', role: 'member' })}>
                <UserPlus size={15} /> Add member
              </button>
            )}
          </header>
          <ul>
            {(team.data || []).map((u) => (
              <li key={u._id} className="flex flex-wrap items-center gap-3 border-b border-line-2 px-5 py-3 last:border-0 sm:px-6">
                <Avatar name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{u.name}</p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                {isAdmin && String(u._id) !== String(session.data?.user?.id) ? (
                  <select className="input w-auto py-1.5" value={u.role} onChange={(e) => changeRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                    {Object.keys(ROLES).map((r) => (
                      <option key={r} value={r}>
                        {r[0].toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={u.role === 'admin' ? 'blue' : 'grey'}>{u.role}</Badge>
                )}
                {isAdmin && String(u._id) !== String(session.data?.user?.id) && (
                  <button className="btn-ghost btn-sm" onClick={() => setResetFor({ user: u, password: '' })}>
                    Reset password
                  </button>
                )}
              </li>
            ))}
          </ul>
          <dl className="grid gap-2 border-t border-line-2 bg-ink/[0.035] px-5 py-4 text-xs sm:grid-cols-3 sm:px-6">
            {Object.entries(ROLES).map(([r, d]) => (
              <div key={r}>
                <dt className="font-semibold text-ink capitalize">{r}</dt>
                <dd className="text-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="sheet p-5 sm:p-6">
          <h2 className="text-[17px] text-ink">Your password</h2>
          <form onSubmit={changeOwnPassword} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Current password">
              <input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="New password">
              <input className="input" type="password" autoComplete="new-password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <button className="btn-secondary h-[38px]" disabled={!pw.current || pw.next.length < 8}>
              Change password
            </button>
          </form>
        </section>

        <section className="sheet overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-[17px] text-ink">Integrations</h2>
              <p className="text-sm text-muted">Let documents arrive without anyone opening Concord: from your ERP, a script, or an email address vendors send bills to.</p>
            </div>
          </header>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <input className="input max-w-xs" placeholder="Key name, e.g. Tally connector" value={keyName} onChange={(e) => setKeyName(e.target.value)} aria-label="Key name" />
                <button className="btn-primary" onClick={createKey}>
                  <KeyRound size={15} /> Create API key
                </button>
              </div>
            )}
            {newKey && (
              <div className="animate-in rounded-xl border border-ok/30 bg-ok-tint p-4">
                <p className="text-sm font-semibold text-ink">Copy this key now — it won’t be shown again.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="num rounded-lg bg-ink/[0.035] px-3 py-2 text-sm break-all text-ok">{newKey.key}</code>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(newKey.key);
                      toast('Key copied');
                    }}
                  >
                    <Copy size={13} /> Copy
                  </button>
                </div>
              </div>
            )}
            {data.apiKeys?.length > 0 ? (
              <ul className="divide-y divide-line-2 rounded-xl border border-line-2">
                {data.apiKeys.map((k) => (
                  <li key={k.prefix} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <KeyRound size={15} className="text-muted" />
                    <span className="font-medium text-ink">{k.name}</span>
                    <code className="num text-xs text-muted">{k.prefix}…</code>
                    <span className="ml-auto text-xs text-muted">
                      Created {date(k.createdAt)}
                      {k.createdBy ? ` by ${k.createdBy}` : ''}. {k.lastUsedAt ? `Last used ${ago(k.lastUsedAt)}` : 'Never used'}
                    </span>
                    {isAdmin && (
                      <button className="btn-ghost btn-sm" onClick={() => revokeKey(k)} aria-label={`Revoke ${k.name}`}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No API keys yet.</p>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-line-2 bg-ink/[0.035] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <KeyRound size={15} className="text-carbon-dark" /> Push from any system
                </p>
                <pre className="num mt-3 overflow-x-auto text-xs leading-relaxed text-ink-2">{`curl -X POST ${API_URL}/v1/documents \\
  -H "X-API-Key: cnc_live_…" \\
  -F "files=@invoice.pdf" -F "files=@challan.jpg"`}</pre>
              </div>
              <div className="rounded-xl border border-line-2 bg-ink/[0.035] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Mail size={15} className="text-carbon-dark" /> Forward bills by email
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">Point an inbound-email service (SendGrid Inbound Parse, Mailgun Routes or Postmark) at this webhook. Every PDF or photo attached to a forwarded email is read and matched.</p>
                <pre className="num mt-2 overflow-x-auto text-xs text-ink-2">{`${API_URL}/inbound/email?key=cnc_live_…`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section className="sheet flex flex-wrap items-start gap-4 p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-2 bg-ink/[0.03] text-carbon-dark">
            <Cpu size={18} />
          </span>
          <div className="flex-1">
            <h2 className="text-[17px] text-ink">AI agent</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Checks are rules, not AI — the same documents always give the same result. The AI model is used for reading unusual layouts, scanned bills and phone photos, drafting emails to vendors, reading their replies, and answering questions. If it’s unavailable, digital PDFs are still read by rules and emails fall back to templates.
            </p>
          </div>
          <Badge tone={data.ai.configured ? 'green' : 'amber'}>{data.ai.configured ? 'Connected' : 'Templates only'}</Badge>
        </section>
        <p className="text-xs text-faint">
          Plan: <span className="capitalize">{company.plan || 'free'}</span>. Auto-approve threshold currently {money(Number(rules.autoApproveBelow) || 0)}.
        </p>
      </div>

      <Modal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title={`Reset password for ${resetFor?.user?.name || ''}`}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setResetFor(null)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={(resetFor?.password || '').length < 8} onClick={resetPassword}>
              Set temporary password
            </button>
          </>
        }
      >
        <Field label="Temporary password" hint="At least 8 characters. They can change it in Settings after logging in.">
          <input className="input" value={resetFor?.password || ''} onChange={(e) => setResetFor({ ...resetFor, password: e.target.value })} />
        </Field>
      </Modal>

      <Modal
        open={!!invite}
        onClose={() => setInvite(null)}
        title="Add a team member"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setInvite(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={sendInvite} disabled={!invite?.name || !invite?.email || (invite?.password || '').length < 8}>
              Add member
            </button>
          </>
        }
      >
        {invite && (
          <div className="space-y-4">
            <ErrorNote error={inviteErr} />
            <Field label="Name">
              <input className="input" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
            </Field>
            <Field label="Work email">
              <input className="input" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
            </Field>
            <Field label="Temporary password" hint="At least 8 characters. Share it with them directly.">
              <input className="input" type="text" value={invite.password} onChange={(e) => setInvite({ ...invite, password: e.target.value })} />
            </Field>
            <Field label="Role">
              <select className="input" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })}>
                {Object.entries(ROLES).map(([r, d]) => (
                  <option key={r} value={r}>
                    {r[0].toUpperCase() + r.slice(1)}: {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
