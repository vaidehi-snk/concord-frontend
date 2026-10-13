// Client-side mirror of the server's GSTIN check (format + mod-36 check digit)
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function gstinCheck(raw) {
  const g = String(raw || '').trim().toUpperCase();
  if (g.length !== 15) return { valid: false, reason: 'A GSTIN has exactly 15 characters.' };
  if (!FORMAT.test(g)) return { valid: false, reason: 'This doesn’t follow the GSTIN pattern (state code, PAN, entity, Z, check digit).' };
  const st = Number(g.slice(0, 2));
  if (st < 1 || st > 38) return { valid: false, reason: `State code ${g.slice(0, 2)} doesn’t exist.` };
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const p = CHARS.indexOf(g[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(p / 36) + (p % 36);
  }
  const check = CHARS[(36 - (sum % 36)) % 36];
  if (check !== g[14]) return { valid: false, reason: `Check digit should be ${check}, not ${g[14]} — likely a typo.` };
  return { valid: true };
}

export const GST_STATES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  10: 'Bihar', 11: 'Sikkim', 12: 'Arunachal Pradesh', 13: 'Nagaland', 14: 'Manipur', 15: 'Mizoram', 16: 'Tripura', 17: 'Meghalaya', 18: 'Assam', 19: 'West Bengal', 20: 'Jharkhand',
  21: 'Odisha', 22: 'Chhattisgarh', 23: 'Madhya Pradesh', 24: 'Gujarat', 26: 'Dadra & Nagar Haveli and Daman & Diu', 27: 'Maharashtra', 29: 'Karnataka', 30: 'Goa', 31: 'Lakshadweep',
  32: 'Kerala', 33: 'Tamil Nadu', 34: 'Puducherry', 35: 'Andaman & Nicobar', 36: 'Telangana', 37: 'Andhra Pradesh', 38: 'Ladakh',
};

// Pieces of a valid GSTIN a person recognises: state and PAN
export function gstinParts(raw) {
  const g = String(raw || '').trim().toUpperCase();
  return { state: GST_STATES[g.slice(0, 2)] || null, pan: g.slice(2, 12) };
}
