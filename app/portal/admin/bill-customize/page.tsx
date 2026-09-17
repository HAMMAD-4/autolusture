'use client';

import { useState, useEffect, useRef } from 'react';
import { PortalShell } from '@/components/portal-shell';
import type { ReceiptCustomizationSettings, TaxReceiptData } from '@/components/tax-receipt-modal';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export default function BillCustomizePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ReceiptCustomizationSettings>({
    business_name: 'AutoLustre Detailing Pty Ltd',
    abn: '48 612 345 678',
    business_address: '12-14 Industrial Circuit, Alexandria, NSW 2015',
    phone: '1300 288 678',
    email: 'accounts@autolustre.com.au',
    invoice_title: 'TAX INVOICE / RECEIPT',
    terms_conditions: `1. Payment is strictly settled upon completion of detailing services.
2. 30-Day studio workmanship warranty on all ceramic protection & paint correction applications.
3. AutoLustre is not liable for pre-existing vehicle wear or loose trim recorded prior to service.
4. All tax invoices comply with Australian Taxation Office (ATO) GST requirements under A New Tax System (Goods and Services Tax) Act 1999.`,
    signature_image_data: null,
    signatory_name: 'Hammad Saifullah',
    signatory_title: 'Quality Assurance & Studio Director'
  });

  // Mock receipt data for live preview
  const sampleReceipt: TaxReceiptData = {
    receiptNumber: 'TAX-AL-DEMO1',
    title: form.invoice_title || 'TAX INVOICE / RECEIPT',
    abn: form.abn || '48 612 345 678',
    businessName: form.business_name || 'AutoLustre Detailing Pty Ltd',
    businessAddress: form.business_address || '12-14 Industrial Circuit, Alexandria, NSW 2015',
    phone: form.phone || '1300 288 678',
    email: form.email || 'accounts@autolustre.com.au',
    issueDate: new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    customer: {
      name: 'James Harrison',
      phone: '+61 412 345 678',
      email: 'james.harrison@example.com.au',
      address: 'Paddington, NSW 2021'
    },
    vehicle: {
      rego: 'NSW-988',
      state: 'NSW',
      description: 'Porsche 911 GT3 RS'
    },
    service: {
      name: 'Ceramic Protection · Stage 2 Paint Correction',
      notes: 'Gtechniq Crystal Serum Ultra applied. Wheels-off ceramic coating.'
    },
    payment: {
      method: 'CARD',
      status: 'PAID IN FULL',
      subtotalExGst: '$817.27 AUD',
      gstAmount: '$81.73 AUD (10% GST)',
      totalAmount: '$899.00 AUD',
      rawTotal: 899
    },
    representative: {
      name: 'Kai Evans',
      id: 'REP-01'
    }
  };

  useEffect(() => {
    fetch('/api/admin/receipt-settings')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load receipt settings');
        return res.json();
      })
      .then((data) => {
        if (data?.settings) {
          setForm({
            business_name: data.settings.business_name || '',
            abn: data.settings.abn || '',
            business_address: data.settings.business_address || '',
            phone: data.settings.phone || '',
            email: data.settings.email || '',
            invoice_title: data.settings.invoice_title || 'TAX INVOICE / RECEIPT',
            terms_conditions: data.settings.terms_conditions || '',
            signature_image_data: data.settings.signature_image_data || null,
            signatory_name: data.settings.signatory_name || '',
            signatory_title: data.settings.signatory_title || ''
          });
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMsg('Invalid file format. Please upload a PNG, JPEG, or WebP signature image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate File Size (≤ 2MB)
    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMsg(`Image exceeds maximum allowed size of 2MB (Selected size: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result && (result.startsWith('data:image/png;base64,') || result.startsWith('data:image/jpeg;base64,') || result.startsWith('data:image/webp;base64,'))) {
        setForm((prev) => ({
          ...prev,
          signature_image_data: result
        }));
        setSuccessMsg('Signature loaded into preview. Click "Save Customizations" to persist.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to process image payload.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading selected image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = () => {
    setForm((prev) => ({
      ...prev,
      signature_image_data: null
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/receipt-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setSuccessMsg('Bill & Receipt customization saved successfully! All printed receipts and customer preview modals will now reflect these details.');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save receipt settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Studio Finance & Documentation</div>
          <h1>Bill & Receipt Customization</h1>
          <p>Configure tax invoice headers, registered business credentials, terms & conditions, and authorized verification signature.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="button"
            onClick={handleTestPrint}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px', borderRadius: 8 }}
          >
            <span>🖨</span> Test Print Docket
          </button>
        </div>
      </header>

      {successMsg && (
        <div style={{ background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9', padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600 }}>
          ✓ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '12px 16px', borderRadius: 10, marginBottom: 18, fontSize: 13, fontWeight: 600 }}>
          ✕ {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>Loading receipt configuration…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 24, alignItems: 'start' }}>
          {/* Left Column: Form Customization Controls */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Panel 1: Company Header Details */}
            <section className="panel" style={{ margin: 0 }}>
              <div style={{ borderBottom: '1px solid #edf1ed', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>1. Business & Tax Header</h2>
                <small style={{ color: '#667376' }}>Information printed on the top section of the receipt</small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Business Legal Name *
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={form.business_name || ''}
                    onChange={handleTextChange}
                    required
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                    placeholder="e.g. AutoLustre Detailing Pty Ltd"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Australian Business Number (ABN) *
                    </label>
                    <input
                      type="text"
                      name="abn"
                      value={form.abn || ''}
                      onChange={handleTextChange}
                      required
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                      placeholder="e.g. 48 612 345 678"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Invoice Badge Title *
                    </label>
                    <input
                      type="text"
                      name="invoice_title"
                      value={form.invoice_title || ''}
                      onChange={handleTextChange}
                      required
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                      placeholder="e.g. TAX INVOICE / RECEIPT"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Registered Studio Address *
                  </label>
                  <input
                    type="text"
                    name="business_address"
                    value={form.business_address || ''}
                    onChange={handleTextChange}
                    required
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                    placeholder="e.g. 12-14 Industrial Circuit, Alexandria, NSW 2015"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Support & Billing Phone *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone || ''}
                      onChange={handleTextChange}
                      required
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                      placeholder="e.g. 1300 288 678"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Accounts & Billing Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email || ''}
                      onChange={handleTextChange}
                      required
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                      placeholder="e.g. accounts@autolustre.com.au"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Panel 2: Terms & Conditions */}
            <section className="panel" style={{ margin: 0 }}>
              <div style={{ borderBottom: '1px solid #edf1ed', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>2. Terms, Conditions & Warranty Disclaimer</h2>
                <small style={{ color: '#667376' }}>Printed on the lower section of the customer receipt docket</small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                  Receipt Terms & Policy Notice
                </label>
                <textarea
                  name="terms_conditions"
                  value={form.terms_conditions || ''}
                  onChange={handleTextChange}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #dce2dc',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                  placeholder="Enter terms, warranty conditions, payment clauses..."
                />
                <small style={{ color: '#667376', fontSize: 11, marginTop: 4, display: 'block' }}>
                  Each line appears formatted in the receipt&apos;s legal disclaimer block.
                </small>
              </div>
            </section>

            {/* Panel 3: Authorized Signature Upload */}
            <section className="panel" style={{ margin: 0 }}>
              <div style={{ borderBottom: '1px solid #edf1ed', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>3. Verification Signature & Stamp</h2>
                <small style={{ color: '#667376' }}>Official manager signature image printed on the receipt for ATO validation</small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Upload Signature Image (PNG, JPEG, WebP · Max 2MB)
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleSignatureUpload}
                      accept="image/png,image/jpeg,image/webp"
                      style={{ fontSize: 12 }}
                    />
                    {form.signature_image_data && (
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        style={{
                          background: '#fff0ef',
                          color: '#bd4939',
                          border: '1px solid #f9d6d2',
                          borderRadius: 6,
                          padding: '5px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Remove Signature
                      </button>
                    )}
                  </div>
                  <small style={{ color: '#667376', fontSize: 11, marginTop: 4, display: 'block' }}>
                    A transparent PNG signature or studio stamp image gives the highest visual quality.
                  </small>
                </div>

                {/* Signature Preview Box */}
                {form.signature_image_data && (
                  <div style={{ background: '#f8faf8', border: '1px dashed #d5ded8', borderRadius: 8, padding: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#667376', marginBottom: 6, fontWeight: 600 }}>Signature Preview:</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.signature_image_data}
                      alt="Uploaded Signature Preview"
                      style={{ maxHeight: 60, maxWidth: 220, objectFit: 'contain', margin: '0 auto' }}
                    />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Authorized Signatory Name
                    </label>
                    <input
                      type="text"
                      name="signatory_name"
                      value={form.signatory_name || ''}
                      onChange={handleTextChange}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                      placeholder="e.g. Hammad Saifullah"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Signatory Professional Title
                    </label>
                    <input
                      type="text"
                      name="signatory_title"
                      value={form.signatory_title || ''}
                      onChange={handleTextChange}
                      style={{ width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #dce2dc' }}
                      placeholder="e.g. Quality Assurance & Studio Director"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                className="button dark"
                disabled={saving}
                style={{ padding: '12px 24px', fontSize: 14, borderRadius: 8 }}
              >
                {saving ? 'Saving Customizations…' : '✓ Save Bill Customizations'}
              </button>
            </div>
          </form>

          {/* Right Column: Real-time Live Receipt Docket Preview */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#556663', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Live Docket Preview (Screen & Print)
              </div>
              <span style={{ fontSize: 11, background: '#eaf3cf', color: '#3d5218', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
                ● Real-time sync
              </span>
            </div>

            {/* Live Receipt Card */}
            <div
              id="tax-receipt-printable"
              className="tax-receipt-card"
              style={{
                background: '#ffffff',
                color: '#0d1517',
                borderRadius: 14,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: '1px solid #dce2dc',
                padding: '24px 20px',
                width: '100%',
                maxWidth: 420,
                margin: '0 auto',
                boxSizing: 'border-box'
              }}
            >
              {/* Receipt Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d1517', paddingBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -1, color: '#0d1517' }}>
                    auto<i style={{ fontFamily: 'Playfair Display, serif' }}>lustre</i>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3, color: '#1a2729' }}>
                    {form.business_name || sampleReceipt.businessName}
                  </div>
                  <div style={{ fontSize: 10, color: '#556663', lineHeight: 1.4, marginTop: 2 }}>
                    ABN: <b>{form.abn || sampleReceipt.abn}</b><br />
                    {form.business_address || sampleReceipt.businessAddress}<br />
                    Ph: {form.phone || sampleReceipt.phone} · {form.email || sampleReceipt.email}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', background: '#0d1517', color: '#c8f25d', padding: '4px 8px', borderRadius: 5, fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>
                    {form.invoice_title || sampleReceipt.title}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, fontFamily: 'monospace', color: '#0d1517' }}>
                    {sampleReceipt.receiptNumber}
                  </div>
                  <div style={{ fontSize: 10, color: '#667376', marginTop: 2 }}>
                    Date: {sampleReceipt.issueDate}
                  </div>
                </div>
              </div>

              {/* Customer & Vehicle Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '12px 0', borderBottom: '1px solid #e7ebe7' }}>
                <div>
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
                    Billed To
                  </span>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, color: '#0d1517' }}>{sampleReceipt.customer.name}</div>
                  <div style={{ fontSize: 11, color: '#556663', lineHeight: 1.4, marginTop: 1 }}>
                    {sampleReceipt.customer.phone}<br />
                    {sampleReceipt.customer.email}<br />
                    {sampleReceipt.customer.address}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
                    Vehicle Details
                  </span>
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2, color: '#0d1517' }}>{sampleReceipt.vehicle.description}</div>
                  <div style={{ fontSize: 11, color: '#556663', lineHeight: 1.4, marginTop: 1 }}>
                    Plate: <b>{sampleReceipt.vehicle.rego}</b> ({sampleReceipt.vehicle.state})<br />
                    Technician: <b>{sampleReceipt.representative.name}</b>
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
                        <b style={{ fontSize: 11, color: '#0d1517' }}>{sampleReceipt.service.name}</b>
                        <div style={{ fontSize: 10, color: '#667376', marginTop: 2 }}>
                          {sampleReceipt.service.notes}
                        </div>
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 700, color: '#0d1517' }}>
                        {sampleReceipt.payment.totalAmount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Summary & Australian GST Breakdown */}
              <div style={{ borderTop: '2px solid #0d1517', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: 180 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#d7ece8', color: '#1d6960', padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 800 }}>
                    <span>✓</span> {sampleReceipt.payment.status}
                  </div>
                  <div style={{ fontSize: 10, color: '#667376', marginTop: 4, lineHeight: 1.3 }}>
                    Method: <b>{sampleReceipt.payment.method}</b><br />
                    ATO Compliant.
                  </div>
                </div>

                <div style={{ width: 170, fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: '#667376' }}>Subtotal:</span>
                    <span>{sampleReceipt.payment.subtotalExGst}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#667376' }}>
                    <span>GST (10%):</span>
                    <span>{sampleReceipt.payment.gstAmount}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #0d1517', paddingTop: 4, fontSize: 12, fontWeight: 800, color: '#0d1517' }}>
                    <span>Total Paid:</span>
                    <span>{sampleReceipt.payment.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Section */}
              {form.terms_conditions && (
                <div style={{ borderTop: '1px dashed #dce2dc', marginTop: 12, paddingTop: 8 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582', display: 'block', marginBottom: 2 }}>
                    Terms & Conditions / Studio Warranty
                  </span>
                  <div style={{ fontSize: 9, color: '#6b7976', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                    {form.terms_conditions}
                  </div>
                </div>
              )}

              {/* Verification Signature Section */}
              <div style={{ borderTop: '1px solid #0d1517', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, color: '#7a8582' }}>
                    Verified & Audited
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, background: '#eef4ed', color: '#27522b', padding: '2px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>
                    <span>✓</span> Officially Issued
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  {form.signature_image_data ? (
                    <div style={{ marginBottom: 2 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.signature_image_data}
                        alt="Authorized Verification Signature"
                        style={{ height: 36, maxWidth: 130, objectFit: 'contain', display: 'inline-block' }}
                      />
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 13, color: '#1d3432', borderBottom: '1px solid #223735', paddingBottom: 1, marginBottom: 2, display: 'inline-block' }}>
                      {form.signatory_name || 'Hammad Saifullah'}
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#0d1517' }}>{form.signatory_name || 'Hammad Saifullah'}</div>
                  <div style={{ fontSize: 9, color: '#778482' }}>{form.signatory_title || 'Quality Assurance & Studio Director'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
