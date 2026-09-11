// Stand-in for real auth (Week 1-7 scope explicitly doesn't build multi-tenant auth).
// The seed.js script prints a demo companyId/vendorId — paste them into Settings once,
// and every page reads them from here.

const KEY = 'concord_settings';

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { companyId: '', vendorId: '' };
  } catch {
    return { companyId: '', vendorId: '' };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings));
}
