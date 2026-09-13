import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
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
        <Route path="/" element={<Landing />} />
        <Route path="/respond/:token" element={<VendorRespond />} />
        <Route path="/app" element={<Layout />}>
          <Route index element={<Upload />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="disputes/:id" element={<DisputeDetail />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
