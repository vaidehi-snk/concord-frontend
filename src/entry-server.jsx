// Renders the home page to HTML at build time (see scripts/prerender.mjs), so
// link previews, search engines and slow phones get real content immediately.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/toast';

export function render(url) {
  return renderToString(
    <StrictMode>
      <ErrorBoundary resetKey="root">
        <StaticRouter location={url}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StaticRouter>
      </ErrorBoundary>
    </StrictMode>
  );
}
