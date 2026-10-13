import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource/saira-condensed/700.css';
import '@fontsource/saira-condensed/800.css';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/toast';
import { warmUp } from './lib/api';
import { installSpotlight } from './lib/spotlight';
import { installReveal } from './lib/motion';

warmUp();
installSpotlight();
installReveal();

const el = document.getElementById('root');

// Last line of defence: if anything ever escapes React's error boundaries, show
// what happened and a way back instead of an empty screen.
function hardFallback(error) {
  console.error(error);
  const msg = String(error?.message || error || 'Unknown error').replace(/[<>&]/g, '');
  el.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;color:#eceffa;text-align:center"><div style="max-width:440px"><p style="font-size:22px;font-weight:700;margin:0">Something went wrong</p><p style="color:rgba(236,239,250,.55);font-size:14px;margin:10px 0 18px">Reload to continue. If this keeps happening, send this message to the team:</p><pre style="white-space:pre-wrap;text-align:left;font-size:12px;background:rgba(0,0,0,.35);border:1px solid rgba(150,166,230,.15);border-radius:10px;padding:10px;color:rgba(236,239,250,.6)">${msg.slice(0, 400)}</pre><button onclick="location.reload()" style="margin-top:16px;padding:10px 18px;border-radius:10px;border:0;background:#6f7dff;color:#fff;font-weight:600;cursor:pointer">Reload</button></div></div>`;
}

createRoot(el, { onUncaughtError: hardFallback }).render(
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
