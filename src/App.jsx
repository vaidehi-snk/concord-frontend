import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import DisputeDetail from './pages/DisputeDetail';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import VendorRespond from './pages/VendorRespond';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/respond/:token" element={<VendorRespond />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Upload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/disputes/:id" element={<DisputeDetail />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
