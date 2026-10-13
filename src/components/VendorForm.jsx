import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Field } from './ui';
import { gstinCheck } from '../lib/gstin';

export const emptyVendor = { name: '', contactName: '', contactEmail: '', phone: '', gstin: '', paymentTermsDays: 30, msme: false, msmeCategory: 'micro', udyamNumber: '', hasWrittenAgreement: true };

export default function VendorForm({ value, onChange }) {
  const v = value;
  const set = (k, x) => onChange({ ...v, [k]: x });
  const g = v.gstin && v.gstin.length === 15 ? gstinCheck(v.gstin) : null;
  return (
    <div className="space-y-4">
      <Field label="Vendor name">
        <input className="input" required value={v.name} onChange={(e) => set('name', e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact person">
          <input className="input" value={v.contactName || ''} onChange={(e) => set('contactName', e.target.value)} />
        </Field>
        <Field label="Email for disputes">
          <input className="input" type="email" value={v.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} />
        </Field>
        <Field label="Phone / WhatsApp">
          <input className="input" value={v.phone || ''} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Payment terms (days)">
          <input className="input num" type="number" min={0} value={v.paymentTermsDays ?? ''} onChange={(e) => set('paymentTermsDays', e.target.value === '' ? '' : Number(e.target.value))} />
        </Field>
      </div>
      <Field label="GSTIN" error={g && !g.valid ? g.reason : null}>
        <div className="relative">
          <input className="input num pr-9" maxLength={15} value={v.gstin || ''} onChange={(e) => set('gstin', e.target.value.toUpperCase())} />
          {g && <span className="absolute top-1/2 right-3 -translate-y-1/2">{g.valid ? <CheckCircle2 size={16} className="text-ok" /> : <AlertCircle size={16} className="text-stamp" />}</span>}
        </div>
      </Field>
        <fieldset className="rounded-xl border border-line p-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#6f7dff]" checked={!!v.msme} onChange={(e) => set('msme', e.target.checked)} />
            <span>
              <span className="block text-sm font-semibold text-ink">Registered MSME (Udyam)</span>
              <span className="block text-xs text-muted">Micro and small suppliers must be paid within 45 days, or the expense isn’t tax-deductible this year (Income Tax Act §43B(h)).</span>
            </span>
          </label>
          {v.msme && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select className="input" value={v.msmeCategory || 'micro'} onChange={(e) => set('msmeCategory', e.target.value)}>
                  <option value="micro">Micro</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium (not covered by 43B(h))</option>
                </select>
              </Field>
              <Field label="Udyam number">
                <input className="input num" value={v.udyamNumber || ''} onChange={(e) => set('udyamNumber', e.target.value.toUpperCase())} placeholder="UDYAM-MH-26-0012345" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-2">
                <input type="checkbox" className="h-4 w-4 accent-[#6f7dff]" checked={v.hasWrittenAgreement !== false} onChange={(e) => set('hasWrittenAgreement', e.target.checked)} />
                We have a written agreement on payment terms (otherwise the limit is 15 days)
              </label>
            </div>
          )}
        </fieldset>
    </div>
  );
}
