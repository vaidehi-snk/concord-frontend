import { useEffect, useState } from 'react';
import { serverStatus } from '../lib/api';

// A small pill that appears only while the server is slow to answer (cold start)
export default function ServerStatus() {
  const [state, setState] = useState(serverStatus.state);
  useEffect(() => {
    const off = serverStatus.subscribe(setState);
    return () => {
      off();
    };
  }, []);
  if (state === 'ok') return null;
  return (
    <div role="status" className="animate-in fixed top-3 left-1/2 z-[70] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-line bg-raised/90 px-4 py-2 text-sm text-ink-2 shadow-2xl ">
        <span className="relative flex h-2.5 w-2.5">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${state === 'down' ? 'bg-stamp' : 'bg-wait'}`} />
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${state === 'down' ? 'bg-stamp' : 'bg-wait'}`} />
        </span>
        {state === 'down' ? 'Server unreachable — retry in a moment' : 'Waking the server — the first request after a quiet spell takes up to a minute'}
      </div>
    </div>
  );
}
