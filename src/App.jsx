import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { session } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';
import ServerStatus from './components/ServerStatus';
import Landing from './pages/Landing';

// The home page ships on its own; everything else loads when first visited.
// After a redeploy an old tab can ask for a chunk that no longer exists, so a
// failed load reloads the page once to pick up the new build.
function load(factory) {
  return lazy(() =>
    factory().catch((err) => {
      const key = 'concord_chunk_reload';
      let tried = false;
      try {
        tried = sessionStorage.getItem(key) === '1';
        sessionStorage.setItem(key, '1');
      } catch {
        /* storage unavailable */
      }
      if (!tried) {
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    })
  );
}

const Login = load(() => import('./pages/Login'));
const Register = load(() => import('./pages/Register'));
const VendorRespond = load(() => import('./pages/VendorRespond'));
const AppShell = load(() => import('./components/AppShell'));
const Overview = load(() => import('./pages/app/Overview'));
const InboxPage = load(() => import('./pages/app/Inbox'));
const Purchases = load(() => import('./pages/app/Purchases'));
const PurchaseDetail = load(() => import('./pages/app/PurchaseDetail'));
const Disputes = load(() => import('./pages/app/Disputes'));
const DisputeDetail = load(() => import('./pages/app/DisputeDetail'));
const Vendors = load(() => import('./pages/app/Vendors'));
const VendorDetail = load(() => import('./pages/app/VendorDetail'));
const Payments = load(() => import('./pages/app/Payments'));
const Gst = load(() => import('./pages/app/Gst'));
const Ask = load(() => import('./pages/app/Ask'));
const Settings = load(() => import('./pages/app/Settings'));
const legal = (name) => load(() => import('./pages/Legal').then((m) => ({ default: m[name] })));
const Privacy = legal('Privacy');
const Terms = legal('Terms');
const Security = legal('Security');
const Contact = legal('Contact');
const NotFound = legal('NotFound');

function RequireAuth({ children }) {
  const loc = useLocation();
  if (!session.token) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}

function PageLoading() {
  return <div className="min-h-screen bg-desk" aria-busy="true" />;
}

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    try {
      sessionStorage.removeItem('concord_chunk_reload');
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return (
    <ErrorBoundary resetKey={pathname}>
      <ServerStatus />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/respond/:token" element={<VendorRespond />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchases/:id" element={<PurchaseDetail key={pathname} />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="disputes/:id" element={<DisputeDetail key={pathname} />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="vendors/:id" element={<VendorDetail key={pathname} />} />
            <Route path="payments" element={<Payments />} />
            <Route path="gst" element={<Gst />} />
            <Route path="ask" element={<Ask />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
