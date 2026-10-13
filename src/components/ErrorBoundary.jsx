import { Component } from 'react';
import { RotateCw } from 'lucide-react';

const CHUNK = /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk|Unexpected token '<'/i;

// Catches render errors so a bug never leaves a blank screen. A stale-deploy
// asset error reloads once automatically; anything else shows a way out.
export default class ErrorBoundary extends Component {
  state = { failed: false, error: null };
  static getDerivedStateFromError(error) {
    return { failed: true, error: error || new Error('Unknown error') };
  }
  componentDidCatch(error) {
    if (CHUNK.test(String(error?.message))) {
      try {
        const last = Number(sessionStorage.getItem('concord_reloaded') || 0);
        if (Date.now() - last > 15000) {
          sessionStorage.setItem('concord_reloaded', String(Date.now()));
          window.location.reload();
        }
      } catch {
        /* storage blocked: fall through to the panel */
      }
    }
    console.error(error);
  }
  componentDidUpdate(prev) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false, error: null }); // eslint-disable-line react/no-did-update-set-state
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-2xl font-bold text-ink">This page hit a snag</p>
        <p className="mt-2 text-sm text-muted">Nothing was lost. Reload to pick up where you were — if Concord was just updated, this fetches the new version.</p>
        <p className="num mt-4 max-w-full rounded-lg border border-line-2 bg-ink/[0.035] px-3 py-2 text-left text-xs break-words text-faint">{String(this.state.error?.message || this.state.error).slice(0, 300)}</p>
        <div className="mt-6 flex gap-2">
          <button className="btn-primary" onClick={() => window.location.reload()}>
            <RotateCw size={15} /> Reload
          </button>
          <a className="btn-secondary" href="/app">
            Go to overview
          </a>
        </div>
      </div>
    );
  }
}
