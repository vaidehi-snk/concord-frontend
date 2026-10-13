import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/fraunces/opsz.css';
import '@fontsource-variable/hanken-grotesk';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/toast';
import { installReveal } from './lib/motion';

installReveal();

const el = document.getElementById('root');

// Last line of defence: if anything ever escapes React's error boundaries, show
// what happened and a way back instead of an empty screen.
function hardFallback(error) {
  console.error(error);
  const msg = String(error?.message || error || 'Unknown error').replace(/[<>&]/g, '');
  el.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;color:#1b2433;text-align:center"><div style="max-width:440px"><p style="font-size:22px;font-weight:700;margin:0">Something went wrong</p><p style="color:#5b6372;font-size:14px;margin:10px 0 18px">Reload to continue. If this keeps happening, send this message to the team:</p><pre style="white-space:pre-wrap;text-align:left;font-size:12px;background:#fffdf8;border:1px solid #d8cfbe;border-radius:10px;padding:10px;color:#3a4354">${msg.slice(0, 400)}</pre><button onclick="location.reload()" style="margin-top:16px;padding:10px 18px;border-radius:10px;border:0;background:#1b2433;color:#f6f2ea;font-weight:600;cursor:pointer">Reload</button></div></div>`;
}

const tree = (
  <StrictMode>
    <ErrorBoundary resetKey="root">
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

// The home page arrives pre-rendered (scripts/prerender.mjs): attach to it.
// Every other route starts from the empty shell.
if (location.pathname === '/' && el.firstElementChild) {
  hydrateRoot(el, tree, { onUncaughtError: hardFallback });
} else {
  createRoot(el, { onUncaughtError: hardFallback }).render(tree);
}
