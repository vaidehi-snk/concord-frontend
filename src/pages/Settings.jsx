import { useState } from 'react';
import { getSettings, saveSettings } from '../api/settings';

export default function Settings() {
  const [settings, setSettings] = useState(getSettings());
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-ink tracking-tight mb-2">Settings</h1>
      <p className="text-muted text-sm mb-7 leading-relaxed">
        Run <code className="bg-navy-tint text-navy px-1.5 py-0.5 rounded font-mono text-xs">node seed.js</code> in
        the backend to generate a demo Company and Vendor, then paste their IDs here. This stands in for
        login until real auth is built.
      </p>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Company ID</label>
          <input
            className="w-full border border-line rounded-lg px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
            value={settings.companyId}
            onChange={(e) => setSettings({ ...settings, companyId: e.target.value })}
            placeholder="paste companyId from seed.js output"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Vendor ID</label>
          <input
            className="w-full border border-line rounded-lg px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-shadow"
            value={settings.vendorId}
            onChange={(e) => setSettings({ ...settings, vendorId: e.target.value })}
            placeholder="paste vendorId from seed.js output"
          />
        </div>
        <button
          className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-light transition-colors shadow-sm"
          type="submit"
        >
          Save
        </button>
        {saved && <span className="ml-3 text-sm text-success font-medium">Saved.</span>}
      </form>
    </div>
  );
}
