import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { session } from './lib/api';
import ErrorBoundary from './components/ErrorBoundary';
import ServerStatus from './components/ServerStatus';
import AppShell from './components/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorRespond from './pages/VendorRespond';
import Overview from './pages/app/Overview';
import InboxPage from './pages/app/Inbox';
import Purchases from './pages/app/Purchases';
import PurchaseDetail from './pages/app/PurchaseDetail';
import Disputes from './pages/app/Disputes';
import DisputeDetail from './pages/app/DisputeDetail';
import Vendors from './pages/app/Vendors';
import VendorDetail from './pages/app/VendorDetail';
import Payments from './pages/app/Payments';
import Gst from './pages/app/Gst';
import Ask from './pages/app/Ask';
import Settings from './pages/app/Settings';

// Pages are bundled with the app (no lazy chunks), so navigating never waits on,
// or breaks from, a missing file after a redeploy.

function RequireAuth({ children }) {
  const loc = useLocation();
  if (!session.token) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <ErrorBoundary resetKey={pathname}>
      <ServerStatus />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/respond/:token" element={<VendorRespond />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
