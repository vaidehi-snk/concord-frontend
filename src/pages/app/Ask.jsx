import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Loader2, MessageSquareText } from 'lucide-react';
import { api, session } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { Avatar } from '../../components/ui';

const SUGGESTIONS = [
  'Which vendor overbills us the most?',
  'How much have we recovered this quarter?',
  'Which disputes are overdue?',
  'What should I pay this week?',
  'Are any MSME payments at risk?',
  'Which suppliers haven’t filed GST?',
  'Is any payment on hold for changed bank details?',
];

// Turn DSP-0004 into a link to that dispute
function Answer({ text, refs }) {
  const parts = text.split(/(DSP-\d{4,})/g);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        refs[p] ? (
          <Link key={i} to={`/app/disputes/${refs[p]}`} className="num font-semibold text-carbon-dark underline-offset-2 hover:underline">
            {p}
          </Link>
        ) : (
          p
        )
      )}
    </p>
  );
}

export default function Ask() {
  useDocumentTitle('Ask Concord');
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const disputes = useApi('/disputes');
  const refs = Object.fromEntries((disputes.data || []).map((d) => [d.reference, d._id]));
  const me = session.data?.user?.name;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, busy]);

  const send = async (question) => {
    const text = (question ?? q).trim();
    if (!text || busy) return;
    const history = msgs.map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: 'user', content: text }]);
    setQ('');
    setBusy(true);
    try {
      const res = await api.post('/ask', { question: text, history });
      setMsgs((m) => [...m, { role: 'assistant', content: res.answer, generatedBy: res.generatedBy }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: 'assistant', content: e.message, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col">
      <div className="flex-1">
        {msgs.length === 0 ? (
          <div className="pt-6 sm:pt-12">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-carbon/40 bg-carbon-tint text-carbon-dark shadow-[0_0_40px_-6px_rgba(111,125,255,0.8)]">
              <MessageSquareText size={22} />
            </span>
            <h1 className="mt-6 text-[30px] leading-[1.05] font-semibold tracking-[-0.04em] text-ink">Ask about your payables</h1>
            <p className="mt-3 max-w-lg text-[15px] text-muted">Answers come only from your own invoices, disputes, vendors and payments — with references you can click through to.</p>
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="sheet px-4 py-3.5 text-left text-sm text-ink-2 transition-colors hover:text-ink">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-6 py-4">
            {msgs.map((m, i) => (
              <li key={i} className="animate-in flex gap-3">
                {m.role === 'user' ? (
                  <Avatar name={me} />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carbon-tint text-carbon-dark ring-1 ring-carbon/40">
                    <MessageSquareText size={15} />
                  </span>
                )}
                <div className={`min-w-0 flex-1 pt-1 text-[15px] leading-relaxed ${m.error ? 'text-stamp' : 'text-ink'}`}>
                  {m.role === 'assistant' ? <Answer text={m.content} refs={refs} /> : <p className="font-semibold">{m.content}</p>}
                  {m.generatedBy === 'template' && <p className="mt-1 text-xs text-muted">Quick summary from your data. The AI model isn’t configured or is busy.</p>}
                </div>
              </li>
            ))}
            {busy && (
              <li className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-carbon-tint text-carbon-dark ring-1 ring-carbon/40">
                  <Loader2 size={15} className="animate-spin" />
                </span>
                <p className="pt-1 text-sm text-muted">Looking through your records…</p>
              </li>
            )}
            <li ref={end} />
          </ul>
        )}
      </div>
      <form
        className="sticky bottom-4 mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-raised/90 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all focus-within:border-carbon/60 focus-within:shadow-[0_0_0_4px_rgba(111,125,255,0.12),0_20px_60px_-15px_rgba(0,0,0,0.9)]">
          <textarea
            rows={1}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything about your vendors, disputes or payments"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-faint"
            aria-label="Question"
          />
          <button className="btn-primary h-10 w-10 shrink-0 rounded-xl p-0" disabled={!q.trim() || busy} aria-label="Ask">
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
