import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, session } from './api';

// Fetch on mount (and when deps change). Returns { data, error, loading, reload, setData }.
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const alive = useRef(true);
  const lastPath = useRef(path);
  const load = useCallback(async () => {
    if (!path) return;
    // A different record (e.g. /disputes/A → /disputes/B) must not show the old one while loading
    const changed = lastPath.current !== path;
    lastPath.current = path;
    setState((s) => ({ data: changed ? null : s.data, loading: true, error: null }));
    try {
      const data = await api.get(path);
      if (alive.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (alive.current) setState((s) => ({ ...s, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);
  const setData = (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  return { ...state, reload: load, setData };
}

// Wrap an async action with busy/error state.
export function useAction(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = useCallback(
    async (...args) => {
      setBusy(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn]
  );
  return { run, busy, error, setError };
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Concord` : 'Concord — Pay only for what you ordered and received';
  }, [title]);
}

// One click → a fully populated sample company
export function useDemo() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const start = async (role = 'admin') => {
    setBusy(role);
    setError(null);
    try {
      const s = await api.post('/auth/demo', { role }, { auth: false });
      session.save(s);
      navigate('/app');
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };
  return { start, busy, error };
}
