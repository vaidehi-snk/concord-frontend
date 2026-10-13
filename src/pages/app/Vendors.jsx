import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Plus, Search, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useApi, useDocumentTitle } from '../../lib/hooks';
import { money, pct } from '../../lib/format';
import { Badge, EmptyState, ErrorNote, LoadingRows, Meter, Modal, PageHeader } from '../../components/ui';
import VendorForm, { emptyVendor } from '../../components/VendorForm';
import { useToast } from '../../components/toast';

export default function Vendors() {
  useDocumentTitle('Vendors');
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useApi('/vendors');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(null);
  const [busy, setBusy] = useState(false);
  const [addError, setAddError] = useState(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data || []).filter((v) => !t || [v.name, v.gstin, v.contactName].some((x) => x?.toLowerCase().includes(t)));
  }, [data, q]);
  const msme = (data || []).filter((v) => v.msme).length;
  const badGst = (data || []).filter((v) => v.gstin && v.gstinValid === false).length;

  const add = async () => {
    setBusy(true);
    setAddError(null);
    try {
      const v = await api.post('/vendors', adding);
      toast(`${v.name} added`);
      navigate(`/app/vendors/${v._id}`);
    } catch (e) {
      setAddError(e);
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Vendors"
        subtitle="Vendors are added automatically from the GSTIN and name on their documents. Risk is scored from how often their bills don’t match, how much is involved, and how recently."
        actions={
          <button className="btn-primary" onClick={() => setAdding({ ...emptyVendor })}>
            <Plus size={16} /> Add vendor
          </button>
        }
      >
        {data && (
          <p className="mt-3 text-sm text-ink-2">
            {data.length} vendors. {msme} registered MSME{msme === 1 ? '' : 's'}
            {badGst > 0 && (
              <>
                , <span className="font-semibold text-stamp">{badGst} with an invalid GSTIN</span> — input tax credit on their invoices is at risk
              </>
            )}
            .
          </p>
        )}
      </PageHeader>

      <div className="sheet overflow-hidden">
        <div className="flex justify-end px-4 py-3">
          <label className="relative w-full sm:w-64">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Name or GSTIN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vendors" />
          </label>
        </div>
        {loading && !data ? (
          <LoadingRows />
        ) : error ? (
          <div className="p-5">
            <ErrorNote error={error} onRetry={reload} />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Building2} title="No vendors yet" body="They’ll appear as soon as you upload a document, or add one now." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-ledger min-w-[880px]">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>GSTIN</th>
                  <th className="text-right">Purchases</th>
                  <th className="text-right">Dispute rate</th>
                  <th className="text-right">Disputed</th>
                  <th className="text-right">Recovered</th>
                  <th className="w-40">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v._id} className="row-link" onClick={() => navigate(`/app/vendors/${v._id}`)}>
                    <td>
                      <Link to={`/app/vendors/${v._id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink hover:text-carbon-dark">
                        {v.name}
                      </Link>
                      <div className="mt-0.5 flex gap-1.5">
                        {v.msme && <Badge tone="blue">MSME {v.msmeCategory}</Badge>}
                        {v.risk.openDisputes > 0 && <Badge tone="red">{v.risk.openDisputes} open</Badge>}
                      </div>
                    </td>
                    <td className="num text-xs">
                      {v.gstin ? (
                        <span className={v.gstinValid === false ? 'font-semibold text-stamp' : 'text-ink-2'}>
                          {v.gstin}
                          {v.gstinValid === false && <span className="block font-sans font-normal">check digit fails</span>}
                        </span>
                      ) : (
                        <span className="text-faint">none on file</span>
                      )}
                    </td>
                    <td className="num text-right">{v.risk.purchases}</td>
                    <td className="num text-right">{v.risk.purchases ? pct(Math.min(1, v.risk.disputeRate)) : '—'}</td>
                    <td className="num text-right">{money(v.stats?.totalDisputedAmount || 0)}</td>
                    <td className="num text-right text-ok">{money(v.stats?.recoveredAmount || 0)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="num w-7 text-right text-sm font-bold">{v.risk.score}</span>
                        <Meter value={v.risk.score} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!adding}
        onClose={() => setAdding(null)}
        title="Add vendor"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAdding(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={add} disabled={busy || !adding?.name}>
              {busy && <Loader2 size={15} className="animate-spin" />} Add vendor
            </button>
          </>
        }
      >
        <ErrorNote error={addError} />
        {adding && <VendorForm value={adding} onChange={setAdding} />}
      </Modal>
    </div>
  );
}
