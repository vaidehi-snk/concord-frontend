// Paper pieces for the public site. One worked example runs through all of them:
// PO-2760 orders 100 bearings at ₹250, challan DC-5860 shows 90 received, and
// invoice INV-5860 bills 100 at ₹260 (plus two correct lines) with 18% GST.
//   short delivery (100 − 90) × ₹260 × 1.18 = ₹3,068
//   price above PO (₹260 − ₹250) × 90 × 1.18 = ₹1,062
//   held ₹4,130; invoice ₹35,223, so ₹31,093 is safe to pay

export function PaperStack({ className = '' }) {
  return (
    <figure className={`lp-desk-wrap ${className}`}>
      <div className="lp-desk" role="img" aria-label="A purchase order for 100 bearings at ₹250, a challan showing 90 received, and an invoice billing 100 at ₹260, stamped held for ₹4,130">
        <div className="lp-sheet lp-po" aria-hidden>
          <p className="lp-sheet-title">Purchase order</p>
          <p className="lp-sheet-meta">PO-2760, agreed rates</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="r">Qty</th>
                <th className="r">Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bearing 6204</td>
                <td className="r">100</td>
                <td className="r">₹250</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="lp-sheet lp-dc" aria-hidden>
          <p className="lp-sheet-title">Delivery challan</p>
          <p className="lp-sheet-meta">DC-5860, counted at stores</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="r">Received</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bearing 6204</td>
                <td className="r">
                  <span className="hi">90</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="lp-sheet lp-inv" aria-hidden>
          <p className="lp-sheet-title">Tax invoice</p>
          <p className="lp-sheet-meta">INV-5860, Shree Ganesh</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="r">Qty</th>
                <th className="r">Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bearing 6204</td>
                <td className="r">
                  <span className="hi">100</span>
                </td>
                <td className="r">
                  <span className="hi">₹260</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="lp-sheet-more">+ 2 more lines</p>
          <p className="lp-sheet-total">
            <span>Total with GST</span>
            <span>₹35,223</span>
          </p>
          <span className="lp-stamp stamp-land">
            <small>Held</small>
            <b>₹4,130</b>
          </span>
        </div>
      </div>
      <figcaption className="lp-note">10 bearings never arrived, and the rate is ₹10 above the PO. Pay ₹31,093 now and hold the rest.</figcaption>
    </figure>
  );
}

function Pin({ n, ok = false }) {
  return (
    <span className={`lp-pin ${ok ? 'ok' : ''}`} aria-label={`note ${n}`}>
      {n}
    </span>
  );
}

export const INVOICE_NOTES = [
  { n: 1, title: 'Short delivery', amount: '₹3,068', body: 'Billed 100, but challan DC-5860 shows 90 received. (100 − 90) × ₹260, plus 18% GST.' },
  { n: 2, title: 'Price above the PO', amount: '₹1,062', body: '₹260 against ₹250 agreed on PO-2760, charged only on the 90 that arrived, plus GST.' },
  { n: 3, title: 'Bank account changed', body: 'Shree Ganesh has always been paid to ••••8812. Payment stays on hold until you call them on a number you already have.' },
  { n: 4, title: 'GSTIN is valid', ok: true, body: 'The check digit matches the government formula, so input tax credit can be claimed.' },
];

export function AnnotatedInvoice() {
  return (
    <div className="lp-audit">
      <div className="lp-invoice">
        <div className="lp-inv-head">
          <div>
            <p className="lp-inv-vendor">Shree Ganesh Engineering Works Pvt. Ltd.</p>
            <p className="lp-inv-meta">
              GSTIN 27AAKCS4821M1ZW <Pin n={4} ok />
            </p>
          </div>
          <p className="lp-inv-meta lp-inv-ref">
            Tax invoice INV-5860
            <br />
            Against PO-2760
            <br />
            Dated 2 Oct 2026
          </p>
        </div>
        <div className="lp-inv-scroll">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th className="r">Qty</th>
                <th className="r">Rate (₹)</th>
                <th className="r">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ball bearing 6204-2RS</td>
                <td className="r nowrap">
                  <span className="hi">100</span>
                  <Pin n={1} />
                </td>
                <td className="r nowrap">
                  <span className="hi">260.00</span>
                  <Pin n={2} />
                </td>
                <td className="r">26,000.00</td>
              </tr>
              <tr>
                <td>Hex bolt M8 × 40, SS</td>
                <td className="r">500</td>
                <td className="r">6.50</td>
                <td className="r">3,250.00</td>
              </tr>
              <tr>
                <td>Spring washer M8</td>
                <td className="r">500</td>
                <td className="r">1.20</td>
                <td className="r">600.00</td>
              </tr>
            </tbody>
          </table>
        </div>
        <dl className="lp-inv-totals">
          <div>
            <dt>Taxable value</dt>
            <dd>29,850.00</dd>
          </div>
          <div>
            <dt>GST at 18%</dt>
            <dd>5,373.00</dd>
          </div>
          <div className="g">
            <dt>Total</dt>
            <dd>₹35,223.00</dd>
          </div>
        </dl>
        <p className="lp-inv-foot">
          Pay to A/c <span className="hi">7781 0045 0457</span>, IFSC KKBK0000958 <Pin n={3} />
        </p>
      </div>
      <div>
        <ol className="lp-notes">
          {INVOICE_NOTES.map((x) => (
            <li key={x.n}>
              <Pin n={x.n} ok={x.ok} />
              <div>
                <p className="lp-note-title">
                  {x.title} {x.amount && <span className="text-stamp">{x.amount}</span>}
                </p>
                <p className="lp-note-body">{x.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="lp-held">
          <span>Hold on this invoice</span>
          <span className="figure text-[30px] text-stamp">₹4,130</span>
        </p>
      </div>
    </div>
  );
}
