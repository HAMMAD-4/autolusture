'use client';

import { useState, useEffect } from 'react';

export interface TaxReceiptData {
  receiptNumber: string;
  title: string;
  abn: string;
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  issueDate: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  vehicle: {
    rego: string;
    state: string;
    description: string;
  };
  service: {
    name: string;
    notes: string;
  };
  payment: {
    method: string;
    status: string;
    subtotalExGst: string;
    gstAmount: string;
    totalAmount: string;
    rawTotal?: number;
  };
  representative: {
    name: string;
    id: string;
  };
}

export interface ReceiptCustomizationSettings {
  business_name?: string;
  abn?: string;
  business_address?: string;
  phone?: string;
  email?: string;
  invoice_title?: string;
  terms_conditions?: string | null;
  signature_image_data?: string | null;
  signatory_name?: string;
  signatory_title?: string;
}

export function TaxReceiptModal({
  receipt,
  onClose,
  customSettings
}: {
  receipt: TaxReceiptData;
  onClose: () => void;
  customSettings?: ReceiptCustomizationSettings;
}) {
  const [dbSettings, setDbSettings] = useState<ReceiptCustomizationSettings | null>(customSettings || null);

  useEffect(() => {
    if (customSettings) {
      setDbSettings(customSettings);
      return;
    }

    let isMounted = true;
    fetch('/api/admin/receipt-settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.settings) {
          setDbSettings(data.settings);
        }
      })
      .catch(() => {
        // Fallback gracefully to default receipt values
      });

    return () => {
      isMounted = false;
    };
  }, [customSettings]);

  const handlePrint = () => {
    window.print();
  };

  const businessName = dbSettings?.business_name?.trim() || receipt.businessName;
  const abn = dbSettings?.abn?.trim() || receipt.abn;
  const address = dbSettings?.business_address?.trim() || receipt.businessAddress;
  const phone = dbSettings?.phone?.trim() || receipt.phone;
  const email = dbSettings?.email?.trim() || receipt.email;
  const invoiceTitle = dbSettings?.invoice_title?.trim() || receipt.title;
  const termsText = dbSettings?.terms_conditions ?? `1. Payment is strictly settled upon completion of detailing services.
2. 30-Day studio workmanship warranty on all ceramic protection & paint correction applications.
3. AutoLustre is not liable for pre-existing vehicle wear or loose trim recorded prior to service.
4. All tax invoices comply with Australian Taxation Office (ATO) GST requirements under A New Tax System (Goods and Services Tax) Act 1999.`;
  const signatureData = dbSettings?.signature_image_data;
  const signatoryName = dbSettings?.signatory_name?.trim() || 'Hammad Saifullah';
  const signatoryTitle = dbSettings?.signatory_title?.trim() || 'Quality Assurance & Studio Director';

  return (
    <div
      className="receipt-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 21, 23, 0.82)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
    >
      <div
        id="tax-receipt-printable"
        className="tax-receipt-card"
        style={{
          background: '#ffffff',
          color: '#0d1517',
          borderRadius: 16,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e7ebe7',
          padding: '30px 26px',
          width: '100%',
          maxWidth: 520,
          position: 'relative',
          zIndex: 10001,
          overflowY: 'auto',
          maxHeight: '94vh',
          boxSizing: 'border-box'
        }}
      >
        {/* Receipt Top Header */}
        <div className="receipt-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d1517', paddingBottom: 18 }}>
          <div className="receipt-header-left">
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1, color: '#0d1517' }}>
              auto<i style={{ fontFamily: 'Playfair Display, serif' }}>lustre</i>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: '#1a2729' }}>{businessName}</div>
            <div style={{ fontSize: 11, color: '#556663', lineHeight: 1.5, marginTop: 2 }}>
              ABN: <b>{abn}</b><br />
              {address}<br />
              Ph: {phone} · {email}
            </div>
          </div>

          <div className="receipt-header-right" style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#0d1517', color: '#c8f25d', padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>
              {invoiceTitle}
            </span>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6, fontFamily: 'monospace', color: '#0d1517' }}>
              {receipt.receiptNumber}
            </div>
            <div style={{ fontSize: 11, color: '#667376', marginTop: 3 }}>
              Date: {receipt.issueDate}
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Info Grid */}
        <div className="receipt-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '16px 0', borderBottom: '1px solid #e7ebe7' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
              Billed To
            </span>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3, color: '#0d1517' }}>{receipt.customer.name}</div>
            <div style={{ fontSize: 12, color: '#556663', lineHeight: 1.5, marginTop: 2 }}>
              {receipt.customer.phone}<br />
              {receipt.customer.email}<br />
              {receipt.customer.address}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
              Vehicle Details
            </span>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3, color: '#0d1517' }}>{receipt.vehicle.description}</div>
            <div style={{ fontSize: 12, color: '#556663', lineHeight: 1.5, marginTop: 2 }}>
              Plate: <b>{receipt.vehicle.rego.toUpperCase()}</b> ({receipt.vehicle.state})<br />
              Service Technician: <b>{receipt.representative.name}</b>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ padding: '16px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dcdfdc', textAlign: 'left' }}>
                <th style={{ padding: '6px 0', fontSize: 10, textTransform: 'uppercase', color: '#7a8582' }}>Service Description</th>
                <th style={{ padding: '6px 0', fontSize: 10, textTransform: 'uppercase', color: '#7a8582', textAlign: 'right' }}>Amount (AUD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px 0', verticalAlign: 'top' }}>
                  <b style={{ fontSize: 13, color: '#0d1517' }}>{receipt.service.name}</b>
                  {receipt.service.notes && (
                    <div style={{ fontSize: 11, color: '#667376', marginTop: 3, maxWidth: 380 }}>
                      Notes: {receipt.service.notes}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0d1517' }}>
                  {receipt.payment.totalAmount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Australian GST Breakdown */}
        <div className="receipt-summary-row" style={{ borderTop: '2px solid #0d1517', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="receipt-summary-left" style={{ maxWidth: 240 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#d7ece8', color: '#1d6960', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
              <span>✓</span> {receipt.payment.status}
            </div>
            <div style={{ fontSize: 11, color: '#667376', marginTop: 6, lineHeight: 1.4 }}>
              Payment Method: <b>{receipt.payment.method}</b><br />
              Generated compliant with ATO requirements.
            </div>
          </div>

          <div className="receipt-summary-right" style={{ width: 220, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#667376' }}>Subtotal (excl. GST):</span>
              <span style={{ fontWeight: 600 }}>{receipt.payment.subtotalExGst}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#667376' }}>
              <span>GST (10%):</span>
              <span style={{ fontWeight: 600 }}>{receipt.payment.gstAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0d1517', paddingTop: 6, fontSize: 14, fontWeight: 800, color: '#0d1517' }}>
              <span>Total Paid:</span>
              <span>{receipt.payment.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions Section */}
        {termsText && (
          <div style={{ borderTop: '1px dashed #dce2dc', marginTop: 16, paddingTop: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582', display: 'block', marginBottom: 4 }}>
              Terms & Conditions / Studio Warranty
            </span>
            <div style={{ fontSize: 10, color: '#6b7976', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
              {termsText}
            </div>
          </div>
        )}

        {/* Verification Signature Section */}
        <div style={{ borderTop: '1px solid #0d1517', marginTop: 14, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
              Verified & Quality Audited
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, background: '#eef4ed', color: '#27522b', padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
              <span>✓</span> ATO Compliant · Officially Issued
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: 150 }}>
            {signatureData ? (
              <div style={{ marginBottom: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureData}
                  alt="Authorized Verification Signature"
                  style={{ height: 42, maxWidth: 150, objectFit: 'contain', display: 'inline-block' }}
                />
              </div>
            ) : (
              <div style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 15, color: '#1d3432', borderBottom: '1px solid #223735', paddingBottom: 2, marginBottom: 4, display: 'inline-block' }}>
                {signatoryName}
              </div>
            )}
            <div style={{ fontSize: 11, fontWeight: 800, color: '#0d1517' }}>{signatoryName}</div>
            <div style={{ fontSize: 10, color: '#778482' }}>{signatoryTitle}</div>
          </div>
        </div>

        {/* Footer Actions (Hidden when printing) */}
        <div className="receipt-actions no-print" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            type="button"
            className="button dark"
            onClick={handlePrint}
            style={{ padding: '9px 18px', fontSize: 12, borderRadius: 8, whiteSpace: 'nowrap' }}
          >
            🖨 Print / Save PDF
          </button>
          <button
            type="button"
            className="button"
            onClick={onClose}
            style={{ background: '#e8ede7', padding: '9px 18px', fontSize: 12, borderRadius: 8, whiteSpace: 'nowrap' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
