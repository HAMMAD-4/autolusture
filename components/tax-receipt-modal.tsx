'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  tax_mode?: 'inclusive' | 'exclusive' | string;
  tax_type?: 'percentage' | 'fixed' | string;
  tax_rate?: number | string;
  tax_label?: string;
}

export function TaxReceiptModal({
  receipt,
  onClose,
  customSettings,
  autoPrint
}: {
  receipt: TaxReceiptData;
  onClose: () => void;
  customSettings?: ReceiptCustomizationSettings;
  autoPrint?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [dbSettings, setDbSettings] = useState<ReceiptCustomizationSettings | null>(customSettings || null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (mounted && autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [mounted, autoPrint]);

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
4. All prices in AUD. Issued in accordance with Australian Consumer Law and Division 29 of A New Tax System (Goods and Services Tax) Act 1999.`;
  const signatureData = dbSettings?.signature_image_data;
  const signatoryName = dbSettings?.signatory_name?.trim() || 'Hammad Saifullah';
  const signatoryTitle = dbSettings?.signatory_title?.trim() || 'Quality Assurance & Studio Director';

  // Dynamic Tax Calculation
  const taxMode = (dbSettings?.tax_mode || 'inclusive') as 'inclusive' | 'exclusive';
  const taxType = (dbSettings?.tax_type || 'percentage') as 'percentage' | 'fixed';
  const taxRate = Number(dbSettings?.tax_rate ?? 10);
  const taxLabel = dbSettings?.tax_label?.trim() || 'GST';

  const rawTotal = receipt.payment.rawTotal !== undefined && receipt.payment.rawTotal > 0
    ? Number(receipt.payment.rawTotal)
    : (parseFloat(receipt.payment.totalAmount.replace(/[^0-9.]/g, '')) || 0);

  let subtotal = 0;
  let taxAmount = 0;
  let total = 0;
  let taxLabelDisplay = '';

  if (taxMode === 'exclusive') {
    if (taxType === 'percentage') {
      subtotal = rawTotal;
      taxAmount = (rawTotal * taxRate) / 100;
      total = subtotal + taxAmount;
      taxLabelDisplay = `${taxLabel} (${taxRate}% excl.):`;
    } else {
      subtotal = rawTotal;
      taxAmount = taxRate;
      total = subtotal + taxAmount;
      taxLabelDisplay = `${taxLabel} ($${taxRate.toFixed(2)} excl.):`;
    }
  } else {
    // Inclusive
    if (taxType === 'percentage') {
      subtotal = rawTotal / (1 + (taxRate / 100));
      taxAmount = rawTotal - subtotal;
      total = rawTotal;
      taxLabelDisplay = `${taxLabel} (${taxRate}% incl.):`;
    } else {
      taxAmount = Math.min(rawTotal, taxRate);
      subtotal = Math.max(0, rawTotal - taxAmount);
      total = rawTotal;
      taxLabelDisplay = `${taxLabel} ($${taxRate.toFixed(2)} incl.):`;
    }
  }

  const displaySubtotal = `$${subtotal.toFixed(2)} AUD`;
  const displayTax = `$${taxAmount.toFixed(2)} AUD`;
  const displayTotal = `$${total.toFixed(2)} AUD`;

  if (!mounted) return null;

  return createPortal(
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
          borderRadius: 14,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.1)',
          border: '1px solid #dce2dc',
          padding: '24px 20px',
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 10001,
          overflowY: 'auto',
          maxHeight: '94vh',
          boxSizing: 'border-box'
        }}
      >
        {/* Receipt Top Header */}
        <div className="receipt-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d1517', paddingBottom: 14 }}>
          <div className="receipt-header-left">
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -1, color: '#0d1517' }}>
              auto<i style={{ fontFamily: 'Playfair Display, serif' }}>lustre</i>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, color: '#1a2729' }}>{businessName}</div>
            <div style={{ fontSize: 10, color: '#556663', lineHeight: 1.4, marginTop: 2 }}>
              ABN: <b>{abn}</b><br />
              {address}<br />
              Ph: {phone} · {email}
            </div>
          </div>

          <div className="receipt-header-right" style={{ textAlign: 'right' }}>
            <span style={{ display: 'inline-block', background: '#0d1517', color: '#c8f25d', padding: '4px 8px', borderRadius: 5, fontSize: 9, fontWeight: 800, letterSpacing: 0.5, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              {invoiceTitle}
            </span>
            <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, fontFamily: 'monospace', color: '#0d1517' }}>
              {receipt.receiptNumber}
            </div>
            <div style={{ fontSize: 10, color: '#667376', marginTop: 2 }}>
              Date: {receipt.issueDate}
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Info Grid */}
        <div className="receipt-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '12px 0', borderBottom: '1px solid #e7ebe7' }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
              Billed To
            </span>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, color: '#0d1517' }}>{receipt.customer.name}</div>
            <div style={{ fontSize: 11, color: '#556663', lineHeight: 1.4, marginTop: 1 }}>
              {receipt.customer.phone}<br />
              {receipt.customer.email}<br />
              {receipt.customer.address}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
              Vehicle Details
            </span>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, color: '#0d1517' }}>{receipt.vehicle.description}</div>
            <div style={{ fontSize: 11, color: '#556663', lineHeight: 1.4, marginTop: 1 }}>
              Plate: <b>{receipt.vehicle.rego.toUpperCase()}</b> ({receipt.vehicle.state})<br />
              Technician: <b>{receipt.representative.name}</b>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ padding: '12px 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #dcdfdc', textAlign: 'left' }}>
                <th style={{ padding: '5px 0', fontSize: 9, textTransform: 'uppercase', color: '#7a8582' }}>Service Description</th>
                <th style={{ padding: '5px 0', fontSize: 9, textTransform: 'uppercase', color: '#7a8582', textAlign: 'right' }}>Amount (AUD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', verticalAlign: 'top' }}>
                  <b style={{ fontSize: 11, color: '#0d1517' }}>{receipt.service.name}</b>
                  {receipt.service.notes && (
                    <div style={{ fontSize: 10, color: '#667376', marginTop: 2 }}>
                      {receipt.service.notes}
                    </div>
                  )}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0d1517' }}>
                  {displayTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Australian GST Breakdown */}
        <div className="receipt-summary-row" style={{ borderTop: '2px solid #0d1517', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="receipt-summary-left" style={{ maxWidth: 180 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#d7ece8', color: '#1d6960', padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 800, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <span>✓</span> {receipt.payment.status}
            </div>
            <div style={{ fontSize: 10, color: '#667376', marginTop: 4, lineHeight: 1.3 }}>
              Method: <b>{receipt.payment.method}</b><br />
              Valid Tax Invoice issued in compliance with Division 29 of A New Tax System (Goods and Services Tax) Act 1999.
            </div>
          </div>

          <div className="receipt-summary-right" style={{ width: 170, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: '#667376' }}>Subtotal:</span>
              <span>{displaySubtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#667376' }}>
              <span>{taxLabelDisplay}</span>
              <span>{displayTax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0d1517', paddingTop: 4, fontSize: 12, fontWeight: 800, color: '#0d1517' }}>
              <span>Total Paid:</span>
              <span>{displayTotal}</span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions Section */}
        {termsText && (
          <div style={{ borderTop: '1px dashed #dce2dc', marginTop: 12, paddingTop: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582', display: 'block', marginBottom: 2 }}>
              Terms & Conditions / Studio Warranty
            </span>
            <div style={{ fontSize: 9, color: '#6b7976', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
              {termsText}
            </div>
          </div>
        )}

        {/* Verification Signature Section */}
        <div style={{ borderTop: '1px solid #0d1517', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
              Verified & Audited
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, background: '#eef4ed', color: '#27522b', padding: '2px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <span>✓</span> Division 29 GST Act Compliant · Official Seal
            </div>
          </div>

          <div style={{ textAlign: 'right', minWidth: 140 }}>
            {signatureData ? (
              <div style={{ marginBottom: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureData}
                  alt="Authorized Verification Signature"
                  style={{ height: 58, maxWidth: 190, objectFit: 'contain', display: 'inline-block' }}
                />
              </div>
            ) : (
              <div style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 13, color: '#1d3432', borderBottom: '1px solid #223735', paddingBottom: 1, marginBottom: 2, display: 'inline-block' }}>
                {signatoryName}
              </div>
            )}
            <div style={{ fontSize: 10, fontWeight: 800, color: '#0d1517' }}>{signatoryName}</div>
            <div style={{ fontSize: 9, color: '#778482' }}>{signatoryTitle}</div>
          </div>
        </div>

        {/* Footer Actions (Hidden when printing) */}
        <div className="receipt-actions no-print" style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
    </div>,
    document.body
  );
}
