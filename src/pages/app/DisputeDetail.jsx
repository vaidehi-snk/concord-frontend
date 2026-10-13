import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Copy, Check, Send, MessageCircle, FileDown, Link2, RotateCcw, CheckCircle2, XCircle, Bot, StickyNote, ShieldCheck, Sparkles, UserRound, Building2 } from 'lucide-react';
import { api, download } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, date, dateTime, daysFromNow, ISSUE } from '../../lib/format';
import { ErrorNote, Field, Modal, PriorityMark, Skeleton, Stamp, StatusBadge, DocChip, Badge } from '../../components/ui';
import { ThreeWayTable, Checklist, FlagCard } from '../../components/domain';
import { useToast } from '../../components/toast';
import { useShell } from '../../components/AppShell';

const TONES = [
  { value: 'collaborative', label: 'Collaborative', body: 'Assumes a mistake. Asks for a credit note.' },
  { value: 'firm', label: 'Firm', body: 'States the facts and the amount to be adjusted.' },
  { value: 'final', label: 'Final notice', body: 'Short-pays the disputed amount unless corrected.' },
];

const OUTCOMES = {
  credit_note: 'Credit note received',
  revised_invoice: 'Revised invoice received',
  short_payment: 'Short-paid the difference',
  vendor_justified: 'Vendor was right',
  written_off: 'Written off',
  other: 'Other',
};

const STEPS = ['Found', 'Drafted', 'Approved', 'Sent', 'Vendor replied', 'Settled'];
function stepOf(d) {
  if (['resolved', 'dismissed'].includes(d.status)) return 5;
  const has = (dir) => (d.thread || []).some((t) => t.direction === dir);
  if (has('vendor_reply')) return 4;
  if (d.status === 'awaiting_vendor') return 3;
  if (d.status === 'email_drafted') return 2;
  if (d.status === 'pending_approval') return 1;
  return 0;
}

const THREAD = {
  outbound_draft: { icon: Bot, label: 'Draft email', tone: 'bg-carbon-tint text-carbon-dark ring-1 ring-carbon/30' },
  approved: { icon: ShieldCheck, label: 'Approved', tone: 'bg-ok-tint text-ok ring-1 ring-ok/30' },
  outbound_sent: { icon: Send, label: 'Sent', tone: 'bg-ink/[0.05] text-ink-2 ring-1 ring-ink/10' },
  vendor_reply: { icon: Building2, label: 'Vendor reply', tone: 'bg-dn text-wait ring-1 ring-dn-edge/40' },
  note: { icon: StickyNote, label: 'Note', tone: 'bg-ink/[0.05] text-ink-2 ring-1 ring-ink/10' },
  system: { icon: Sparkles, label: 'Concord', tone: 'bg-ink/[0.05] text-ink-2 ring-1 ring-ink/10' },
};

function CopyButton({ text, label = 'Copy', className = 'btn-secondary' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={className}
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <Check size={15} /> : <Copy size={15} />} {done ? 'Copied' : label}
    </button>
  );
}

function CloseModal({ d, mode, onClose, onDone }) {
  const [f, setF] = useState({ outcome: mode === 'dismiss' ? 'vendor_justified' : 'credit_note', recoveredAmount: d.totalFinancialImpact, note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true);
    try {
      onDone(await api.post(`/disputes/${d._id}/${mode}`, { ...f, recoveredAmount: Number(f.recoveredAmount) }));
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'dismiss' ? `Dismiss ${d.reference}` : `Mark ${d.reference} resolved`}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className={mode === 'dismiss' ? 'btn-ink' : 'btn-primary'} onClick={submit} disabled={busy}>
            {busy && <Loader2 size={15} className="animate-spin" />} {mode === 'dismiss' ? 'Dismiss dispute' : 'Mark resolved'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorNote error={error} />
        <Field label={mode === 'dismiss' ? 'Why are you dismissing it?' : 'How was it settled?'}>
          <select className="input" value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })}>
            {Object.entries(OUTCOMES)
              .filter(([k]) => (mode === 'dismiss' ? ['vendor_justified', 'written_off', 'other'].includes(k) : k !== 'vendor_justified'))
              .map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
          </select>
        </Field>
        {mode === 'resolve' && (
          <Field label="Amount recovered (₹)" hint={`Up to ${money(d.totalFinancialImpact)}, the full disputed amount.`}>
            <input className="input num" type="number" min={0} max={d.totalFinancialImpact} step="0.01" value={f.recoveredAmount} onChange={(e) => setF({ ...f, recoveredAmount: e.target.value })} />
          </Field>
        )}
        <Field label="Note (optional)" hint="Shown in the audit trail.">
          <textarea className="input min-h-20" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={mode === 'dismiss' ? 'e.g. Rate revision agreed on call with vendor, 12 Sep' : 'e.g. Credit note CN-118 received'} />
        </Field>
      </div>
    </Modal>
  );
}

export default function DisputeDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { refresh } = useShell();
  const { data, error, loading, reload, setData } = useApi(`/disputes/${id}`);
  const [tone, setTone] = useState('collaborative');
  const [busy, setBusy] = useState(null);
  const [reply, setReply] = useState('');
  const [note, setNote] = useState('');
  const [closing, setClosing] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const d = data?.dispute;
  useDocumentTitle(d?.reference || 'Dispute');

  const apply = (res) => {
    const dispute = res.dispute || res;
    setData((prev) => ({ ...prev, dispute }));
    refresh();
    // re-fetch to refresh the live checklist without blocking the UI
    reload();
  };
  const act = async (path, body, msg) => {
    setBusy(path);
    try {
      const res = await api.post(`/disputes/${id}/${path}`, body);
      apply(res);
      if (res.assessment) setAssessment(res.assessment);
      if (msg) toast(msg);
      return res;
    } catch (e) {
      toast(e.message, { tone: 'error' });
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorNote error={error} onRetry={reload} />;
  if (loading && !d)
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );

  const step = stepOf(d);
  const closed = ['resolved', 'dismissed'].includes(d.status);
  const lastDraft = [...d.thread].reverse().find((t) => t.direction === 'outbound_draft');
  const portal = d.publicToken ? `${window.location.origin}/respond/${d.publicToken}` : null;
  // Drafts may open with their own "Subject:" line; lift it into the subject field
  const subj = lastDraft?.body.match(/^\s*Subject:\s*(.+)\n+/i);
  const draftText = subj ? lastDraft.body.slice(subj[0].length) : lastDraft?.body;
  const subject = subj ? `${subj[1].trim()} [${d.reference}]` : `${d.reference}: discrepancy on invoice ${d.invoice?.docNumber || ''} (PO ${d.po?.docNumber || ''})`;
  const emailBody = lastDraft ? `${draftText}${portal ? `\n\nSee the line-by-line comparison and respond here: ${portal}` : ''}` : '';
  const due = d.dueDate ? daysFromNow(d.dueDate) : null;

  return (
    <div>
      <Link to="/app/disputes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={15} /> Disputes
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="num text-[30px] leading-none text-ink">{d.reference}</h1>
            <StatusBadge status={d.status} />
            {!closed && due != null && due < 0 && <Badge tone="red">{d.status === 'awaiting_vendor' ? 'Vendor reply ' : ''}{-due}d overdue</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            <Link to={`/app/vendors/${d.vendor?._id}`} className="font-semibold text-ink-2 hover:text-carbon-dark">
              {d.vendor?.name}
            </Link>{' '}
            billed <span className="num">{money(d.invoice?.extracted?.totalAmount)}</span> on invoice <span className="num">{d.invoice?.docNumber}</span>. Raised {date(d.createdAt)}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">{d.status === 'resolved' ? 'Recovered' : closed ? 'Was disputed' : 'At stake'}</p>
          <p className={`figure lit mt-1 text-[38px] ${d.status === 'resolved' ? 'text-ok' : closed ? 'text-muted' : 'text-stamp'}`}>{money(d.status === 'resolved' ? d.recoveredAmount : d.totalFinancialImpact)}</p>
          {d.status === 'resolved' && d.recoveredAmount < d.totalFinancialImpact && <p className="text-xs text-muted">of {money(d.totalFinancialImpact)} disputed</p>}
        </div>
      </div>

      {/* progress */}
      <ol className="mb-6 grid grid-cols-6 gap-1" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="min-w-0">
            <div className={`h-[3px] rounded-full transition-all ${i <= step ? (d.status === 'dismissed' && i === 5 ? 'bg-faint' : 'bg-carbon') : 'bg-ink/[0.07]'}`} />
            <p className={`mt-1.5 truncate text-xs ${i === step ? 'font-bold text-ink' : i < step ? 'text-ink-2' : 'text-faint'}`}>{i === 5 && d.status === 'dismissed' ? 'Dismissed' : s}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* NEXT STEP */}
          <section className="sheet overflow-hidden border-carbon/35">
            <header className="border-b border-line-2 bg-carbon-tint px-5 py-3.5">
              <h2 className="text-[17px] text-ink">
                {d.status === 'open' && 'Next: draft the email to the vendor'}
                {d.status === 'pending_approval' && (data.canApprove ? 'Next: review and approve the draft' : 'Waiting for a manager to approve')}
                {d.status === 'email_drafted' && 'Next: send it from your mailbox'}
                {d.status === 'awaiting_vendor' && 'Waiting on the vendor'}
                {d.status === 'resolved' && 'Settled'}
                {d.status === 'dismissed' && 'Dismissed'}
              </h2>
            </header>
            <div className="p-5">
              {d.status === 'open' && (
                <>
                  <p className="mb-4 text-sm text-muted">The agent writes the email using the evidence below. Nothing goes to the vendor until a manager approves it.</p>
                  <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tone">
                    {TONES.map((t) => (
                      <button key={t.value} role="radio" aria-checked={tone === t.value} onClick={() => setTone(t.value)} className={`rounded-xl border p-3.5 text-left transition-all ${tone === t.value ? 'border-carbon/70 bg-carbon-tint' : 'border-line-2 bg-ink/[0.02] hover:border-line'}`}>
                        <span className="block text-sm font-semibold text-ink">{t.label}</span>
                        <span className="mt-0.5 block text-xs text-muted">{t.body}</span>
                      </button>
                    ))}
                  </div>
                  <button className="btn-primary mt-4" onClick={() => act('draft', { tone }, 'Draft ready for approval')} disabled={!!busy}>
                    {busy === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Draft settlement email
                  </button>
                </>
              )}

              {['pending_approval', 'email_drafted'].includes(d.status) && lastDraft && (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      Written by {lastDraft.generatedBy === 'llm' ? 'the AI agent' : 'Concord’s templates'} {dateTime(lastDraft.createdAt)}
                    </span>
                    <span className="num">To: {d.vendor?.contactEmail || 'no email on file'}</span>
                  </div>
                  <div className="rounded-xl border border-line-2 bg-ink/[0.035]">
                    <p className="border-b border-line-2 px-4 py-2.5 text-sm">
                      <span className="text-muted">Subject </span>
                      <span className="font-semibold text-ink">{subject}</span>
                    </p>
                    <pre className="max-h-80 overflow-y-auto px-4 py-3 font-sans text-sm leading-relaxed whitespace-pre-wrap text-ink">{draftText}</pre>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {d.status === 'pending_approval' && data.canApprove && (
                      <button className="btn-primary" onClick={() => act('approve', {}, 'Approved — ready to send')} disabled={!!busy}>
                        {busy === 'approve' ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Approve
                      </button>
                    )}
                    {d.status === 'email_drafted' && (
                      <>
                        <a className="btn-primary" href={`mailto:${d.vendor?.contactEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`}>
                          <Mail size={15} /> Open in email
                        </a>
                        <a className="btn-secondary" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${subject}\n\n${emailBody}`)}`}>
                          <MessageCircle size={15} /> WhatsApp
                        </a>
                        <CopyButton text={`Subject: ${subject}\n\n${emailBody}`} />
                        <button className="btn-ink" onClick={() => act('mark-sent', {}, 'Marked as sent — reply due in 7 days')} disabled={!!busy}>
                          {busy === 'mark-sent' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Mark as sent
                        </button>
                      </>
                    )}
                    <select className="input w-auto" value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone for redraft">
                      {TONES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button className="btn-ghost" onClick={() => act('draft', { tone }, 'Redrafted')} disabled={!!busy}>
                      {busy === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Redraft
                    </button>
                  </div>
                  {d.status === 'pending_approval' && !data.canApprove && <p className="mt-3 text-sm text-muted">Only a manager or admin can approve emails to vendors. They’ll see this in their queue.</p>}
                </>
              )}

              {d.status === 'awaiting_vendor' && (
                <>
                  <p className="mb-3 text-sm text-muted">
                    Sent to {d.vendor?.name}. {due != null && (due >= 0 ? `Reply due in ${due} day${due === 1 ? '' : 's'}.` : `Reply was due ${-due} day${due === -1 ? '' : 's'} ago.`)} If they answered by email or phone, paste it here — the agent reads it and decides whether it’s settled.
                  </p>
                  <textarea className="input min-h-28" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="e.g. Apologies, we’ll issue a credit note for the 80 brackets by Friday." />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="btn-primary"
                      disabled={!reply.trim() || !!busy}
                      onClick={async () => {
                        const r = await act('reply', { text: reply });
                        if (r) setReply('');
                      }}
                    >
                      {busy === 'reply' ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />} Log reply and assess
                    </button>
                    <button className="btn-secondary" onClick={() => act('draft', { tone: 'firm' }, 'Follow-up drafted')} disabled={!!busy}>
                      Draft a follow-up
                    </button>
                  </div>
                </>
              )}

              {closed && (
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-ink">
                      <strong>{OUTCOMES[d.resolution?.outcome] || 'Closed'}</strong>
                      {d.resolution?.resolvedBy && <> by {d.resolution.resolvedBy}</>}
                      {d.resolution?.resolvedAt && <> on {date(d.resolution.resolvedAt, { year: true })}</>}.
                    </p>
                    {d.resolution?.note && <p className="mt-1 text-sm text-muted">{d.resolution.note}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {d.status === 'resolved' && (
                        <button className="btn-secondary" onClick={() => download(`/disputes/${d._id}/credit-note`, `${d.reference}-debit-note.pdf`)}>
                          <FileDown size={15} /> Debit note PDF
                        </button>
                      )}
                      <button className="btn-ghost" onClick={() => act('reopen', {}, 'Reopened')} disabled={!!busy}>
                        <RotateCcw size={15} /> Reopen
                      </button>
                    </div>
                  </div>
                  <Stamp tone={d.status === 'resolved' ? 'green' : 'red'} land className="text-xl">
                    {d.status === 'resolved' ? `${money(d.recoveredAmount)} recovered` : 'Dismissed'}
                  </Stamp>
                </div>
              )}

              {assessment && (
                <div className="animate-in mt-4 rounded-xl border border-line-2 bg-ink/[0.035] p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <Bot size={16} className="text-carbon-dark" /> Agent’s read:{' '}
                    <Badge tone={assessment.decision === 'RESOLVED' ? 'green' : assessment.decision === 'PARTIAL' ? 'amber' : 'red'}>{assessment.decision === 'ESCALATE' ? 'Pushback' : assessment.decision.toLowerCase()}</Badge>
                  </p>
                  <p className="mt-1 text-ink-2">{assessment.summary}</p>
                  {assessment.recoveredAmount > 0 && <p className="mt-1 text-ink-2">Agreed: <strong className="num">{money(assessment.recoveredAmount)}</strong></p>}
                </div>
              )}
            </div>
            {!closed && (
              <footer className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
                <button className="btn-ghost btn-sm" onClick={() => setClosing('resolve')}>
                  <CheckCircle2 size={14} /> Mark resolved
                </button>
                <button className="btn-ghost btn-sm" onClick={() => setClosing('dismiss')}>
                  <XCircle size={14} /> Dismiss
                </button>
              </footer>
            )}
          </section>

          <section className="sheet overflow-hidden">
            <header className="border-b border-line-2 px-5 py-4">
              <h2 className="text-[17px] text-ink">
                {(d.flags || []).length} issue{(d.flags || []).length === 1 ? '' : 's'} found
              </h2>
              <p className="text-sm text-muted">Open one to see which document says what, and how the amount was worked out.</p>
            </header>
            {(d.flags || []).map((f, i) => (
              <FlagCard key={i} flag={f} defaultOpen={i === 0} />
            ))}
          </section>

          <section className="sheet overflow-hidden">
            <header className="border-b border-line-2 px-5 py-4">
              <h2 className="text-[17px] text-ink">Line by line</h2>
            </header>
            <ThreeWayTable po={d.po} dn={d.deliveryNote} invoice={d.invoice} flags={d.flags} />
          </section>

          {data.checks?.length > 0 && (
            <section className="sheet p-5">
              <h2 className="mb-4 text-[17px] text-ink">All checks</h2>
              <Checklist checks={data.checks} />
            </section>
          )}

          <section className="sheet overflow-hidden">
            <header className="border-b border-line-2 px-5 py-4">
              <h2 className="text-[17px] text-ink">History</h2>
              <p className="text-sm text-muted">Everything that happened, in order. Included in the audit-trail export.</p>
            </header>
            <ol className="px-5 py-4">
              <li className="flex gap-3 pb-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stamp-tint text-stamp ring-1 ring-stamp/30">
                  <Sparkles size={14} />
                </span>
                <div className="text-sm">
                  <p className="text-ink">
                    Concord found {(d.flags || []).length} issue{(d.flags || []).length === 1 ? '' : 's'} worth <span className="num font-semibold">{money(d.totalFinancialImpact)}</span>
                  </p>
                  <p className="text-xs text-muted">{dateTime(d.createdAt)}</p>
                </div>
              </li>
              {(d.thread || []).map((t, i) => {
                const meta = THREAD[t.direction] || THREAD.system;
                const long = ['outbound_draft', 'vendor_reply', 'note'].includes(t.direction);
                return (
                  <li key={i} className="flex gap-3 border-t border-line-2 py-4">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                      <meta.icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="text-ink">
                        <strong>{meta.label}</strong>
                        {t.actorName && <span className="text-muted"> by {t.actorName}</span>}
                        {t.generatedBy && <span className="text-muted"> ({t.generatedBy === 'llm' ? 'AI' : 'template'})</span>}
                      </p>
                      {long ? (
                        <details className="mt-1" open={t.direction !== 'outbound_draft'}>
                          <summary className="cursor-pointer text-xs text-carbon-dark">{t.direction === 'outbound_draft' ? 'Show email' : 'Show'}</summary>
                          <p className="mt-2 rounded-lg border border-line-2 bg-ink/[0.035] px-3 py-2 whitespace-pre-wrap text-ink-2">{t.body}</p>
                        </details>
                      ) : (
                        <p className="text-ink-2">{t.body}</p>
                      )}
                      <p className="mt-1 text-xs text-muted">{dateTime(t.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex gap-2 border-t border-line px-5 py-3">
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note — the vendor never sees these" onKeyDown={(e) => e.key === 'Enter' && note.trim() && act('note', { text: note }).then((r) => r && setNote(''))} />
              <button className="btn-secondary" disabled={!note.trim() || !!busy} onClick={() => act('note', { text: note }).then((r) => r && setNote(''))}>
                Add
              </button>
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          <section className="sheet p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">Documents</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <DocChip type="PO" number={d.po?.docNumber || 'missing'} />
                <span className="num text-ink-2">{money(d.po?.extracted?.totalAmount)}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <DocChip type="DN" number={d.deliveryNote?.docNumber || 'missing'} />
                <span className="text-xs text-muted">{d.deliveryNote ? date(d.deliveryNote.docDate || d.deliveryNote.createdAt) : ''}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <DocChip type="INVOICE" number={d.invoice?.docNumber} />
                <span className="num text-ink-2">{money(d.invoice?.extracted?.totalAmount)}</span>
              </li>
            </ul>
            {d.match && (
              <Link to={`/app/purchases/${d.match}`} className="mt-3 inline-block text-sm font-semibold text-carbon-dark transition-colors hover:text-ink">
                View purchase
              </Link>
            )}
          </section>

          <section className="sheet p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted">Priority</dt>
                <dd>
                  {closed ? (
                    <PriorityMark priority={d.priority} />
                  ) : (
                    <select
                      className="rounded-md border border-line bg-paper px-2 py-1 text-xs"
                      value={d.priority}
                      onChange={async (e) => {
                        await api.patch(`/disputes/${d._id}`, { priority: e.target.value });
                        setData((p) => ({ ...p, dispute: { ...p.dispute, priority: e.target.value } }));
                      }}
                      aria-label="Priority"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Vendor contact</dt>
                <dd className="truncate text-right text-ink-2">{d.vendor?.contactName || d.vendor?.contactEmail || <Link to={`/app/vendors/${d.vendor?._id}`} className="text-carbon-dark">Add contact</Link>}</dd>
              </div>
              {!closed && d.dueDate && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Reply due</dt>
                  <dd className={due < 0 ? 'font-semibold text-stamp' : 'text-ink-2'}>{date(d.dueDate)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Issues</dt>
                <dd className="text-right text-ink-2">{[...new Set((d.flags || []).map((f) => ISSUE[f.code] || f.code))].join(', ')}</dd>
              </div>
            </dl>
          </section>

          {portal && !closed && (
            <section className="sheet p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                <Link2 size={15} /> Vendor link
              </h3>
              <p className="mt-1 text-sm text-muted">The vendor sees the same comparison and can accept or contest it — no login. Already included in the email.</p>
              <div className="mt-3 flex gap-2">
                <CopyButton text={portal} label="Copy link" className="btn-secondary btn-sm flex-1" />
                <a className="btn-ghost btn-sm" href={portal} target="_blank" rel="noreferrer">
                  <UserRound size={14} /> Preview
                </a>
              </div>
            </section>
          )}

          {!closed && (
            <section className="sheet p-4">
              <h3 className="text-sm font-bold text-ink">Paying this invoice?</h3>
              <p className="mt-1 text-sm text-muted">
                Pay <span className="num font-semibold text-ink">{money(Math.max(0, (d.invoice?.extracted?.totalAmount || 0) - d.totalFinancialImpact))}</span> now and hold the disputed <span className="num font-semibold text-stamp">{money(d.totalFinancialImpact)}</span>. The pay run does this automatically.
              </p>
              <Link to="/app/payments" className="mt-2 inline-block text-sm font-semibold text-carbon-dark transition-colors hover:text-ink">
                Open pay run
              </Link>
            </section>
          )}
        </aside>
      </div>

      {closing && (
        <CloseModal
          d={d}
          mode={closing}
          onClose={() => setClosing(null)}
          onDone={(res) => {
            setClosing(null);
            apply(res);
            toast(closing === 'dismiss' ? 'Dispute dismissed' : 'Dispute resolved');
          }}
        />
      )}
    </div>
  );
}
