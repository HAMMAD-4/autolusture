'use client';

import { useEffect, useState, useCallback } from 'react';
import { PortalShell } from '@/components/portal-shell';
import { ExportButton } from '@/components/export-button';
import { TaxReceiptModal, type TaxReceiptData } from '@/components/tax-receipt-modal';

interface BookingItem {
  id: string;
  reference_code: string;
  booking_type: string;
  scheduled_at: string;
  status: string;
  service_notes?: string;
  bill_amount?: number | string;
  payment_method?: string;
  completed_at?: string;
  created_at: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_suburb: string;
  customer_state: string;
  customer_postcode: string;
  rego: string;
  vehicle_state: string;
  make: string;
  model: string;
  service_name: string;
  service_slug: string;
  base_price: number;
  rep_name?: string;
  rep_email?: string;
  photos?: Array<{ id: string; type: string; url: string; title: string }>;
}

interface CustomerGroup {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  suburb: string;
  state: string;
  postcode: string;
  totalSpend: number;
  bookings: BookingItem[];
  vehicles: Array<{ rego: string; make: string; model: string; state: string }>;
}

export default function AdminBookings() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [customers, setCustomers] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'bookings' | 'customers'>('bookings');
  const [expandedCustomerEmail, setExpandedCustomerEmail] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [receiptData, setReceiptData] = useState<TaxReceiptData | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/bookings', window.location.origin);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      setItems(data.bookings || []);
      setCustomers(data.customers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadBookings();
    }, 200);
    return () => clearTimeout(timeout);
  }, [loadBookings]);

  const openReceipt = (b: BookingItem) => {
    const total = Number(b.bill_amount || b.base_price || 0);
    const gst = Number((total / 11).toFixed(2));
    const subtotal = Number((total - gst).toFixed(2));

    const receipt: TaxReceiptData = {
      receiptNumber: `TAX-${b.reference_code}`,
      title: 'TAX INVOICE / RECEIPT',
      abn: '48 612 345 678',
      businessName: 'AutoLustre Detailing Pty Ltd',
      businessAddress: '12-14 Industrial Circuit, Alexandria, NSW 2015',
      phone: '1300 288 678',
      email: 'accounts@autolustre.com.au',
      issueDate: b.completed_at ? new Date(b.completed_at).toLocaleString('en-AU') : new Date().toLocaleString('en-AU'),
      customer: {
        name: b.customer_name,
        email: b.customer_email,
        phone: b.customer_phone,
        address: `${b.customer_suburb}, ${b.customer_state} ${b.customer_postcode}`
      },
      vehicle: {
        rego: b.rego,
        state: b.vehicle_state,
        description: `${b.make} ${b.model}`
      },
      service: {
        name: b.service_name,
        notes: b.service_notes || 'Standard detailing procedure'
      },
      payment: {
        method: (b.payment_method || 'CARD').toUpperCase(),
        status: b.status === 'completed' ? 'PAID IN FULL' : 'PENDING SETTLEMENT',
        subtotalExGst: `$${subtotal.toFixed(2)} AUD`,
        gstAmount: `$${gst.toFixed(2)} AUD (10% GST)`,
        totalAmount: `$${total.toFixed(2)} AUD`
      },
      representative: {
        name: b.rep_name || 'Unassigned',
        id: b.id
      }
    };

    setReceiptData(receipt);
  };

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Studio Operations & Customer Accounts</div>
          <h1>Live Bookings & Client Registry</h1>
          <p>
            Unified database profiles: Multiple bookings by the same customer over time are grouped under their email & phone.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ExportButton />
        </div>
      </header>

      {/* View Mode Toggle & Search Filtering Bar */}
      <section className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {/* Search Bar */}
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search by customer email, phone, name, rego, or ref…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #dce2dc', borderRadius: 8, width: 340, maxWidth: '100%' }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #dce2dc', borderRadius: 8, width: 160 }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              className="button"
              onClick={loadBookings}
              style={{ background: '#e8ece7', padding: '10px 16px', fontSize: 13 }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#e8ede7', padding: 4, borderRadius: 10 }}>
            <button
              type="button"
              onClick={() => setViewMode('bookings')}
              style={{
                border: 0,
                background: viewMode === 'bookings' ? 'var(--ink)' : 'transparent',
                color: viewMode === 'bookings' ? '#fff' : 'inherit',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              📋 All Bookings ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('customers')}
              style={{
                border: 0,
                background: viewMode === 'customers' ? 'var(--ink)' : 'transparent',
                color: viewMode === 'customers' ? '#fff' : 'inherit',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              👤 Grouped by Customer ({customers.length})
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div style={{ padding: 14, background: '#fcebea', color: '#be4635', borderRadius: 10, marginBottom: 18 }}>
          {error}
        </div>
      )}

      {/* VIEW 1: GROUPED BY CUSTOMER ACCOUNT */}
      {viewMode === 'customers' ? (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>Registered Customer Profiles ({customers.length})</h2>
              <small style={{ color: '#667376' }}>Each customer profile consolidates all bookings over time under their unified email & phone.</small>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
              ⏳ Loading unified client accounts…
            </div>
          ) : customers.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
              No customer records match the search filter.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {customers.map((c) => {
                const isExpanded = expandedCustomerEmail === c.customerEmail || customers.length === 1;

                return (
                  <div
                    key={c.customerEmail}
                    style={{
                      border: '1px solid #d9e2da',
                      borderRadius: 14,
                      background: '#fafcf9',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Customer Summary Header */}
                    <div
                      style={{
                        padding: '18px 22px',
                        background: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedCustomerEmail(isExpanded ? null : c.customerEmail)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <b style={{ fontSize: 16 }}>{c.customerName}</b>
                          <span
                            style={{
                              background: '#d7ece8',
                              color: '#1d6960',
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 999
                            }}
                          >
                            {c.bookings.length} {c.bookings.length === 1 ? 'booking' : 'bookings'}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#556663', marginTop: 4 }}>
                          Email: <b>{c.customerEmail}</b> · Phone: <b>{c.customerPhone}</b> · Location: {c.suburb}, {c.state}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, color: '#7a8582', display: 'block' }}>Total Spend Across Bookings</span>
                          <b style={{ fontSize: 16, color: '#0d1517' }}>${c.totalSpend.toFixed(2)} AUD</b>
                        </div>
                        <button
                          type="button"
                          className="button"
                          style={{ padding: '6px 14px', fontSize: 12, background: '#e8ede7' }}
                        >
                          {isExpanded ? 'Hide Bookings ▲' : 'View Full Details ▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Bookings Details under this single customer */}
                    {isExpanded && (
                      <div style={{ padding: '16px 22px 22px', borderTop: '1px solid #e7ebe7' }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 13, color: '#546164', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          All Bookings Under {c.customerEmail}:
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {c.bookings.map((b, bIdx) => (
                            <div
                              key={b.id}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #dce2dc',
                                borderRadius: 10,
                                padding: '14px 18px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 12
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <b style={{ fontFamily: 'monospace', fontSize: 14 }}>{b.reference_code}</b>
                                  <span className={`status ${b.status === 'in_progress' ? 'live' : ''}`}>
                                    {b.status === 'in_progress' ? 'In Progress' : b.status.toUpperCase()}
                                  </span>
                                  <span style={{ fontSize: 12, color: '#667376' }}>
                                    Scheduled: {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' }) : 'On Arrival'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13, marginTop: 4 }}>
                                  <b>{b.service_name}</b> · Vehicle: <b>{b.make} {b.model}</b> ({b.rego.toUpperCase()}) · Rep: {b.rep_name || 'Unassigned'}
                                </div>
                                {b.service_notes && (
                                  <div style={{ fontSize: 12, color: '#667376', marginTop: 2 }}>
                                    Notes: {b.service_notes}
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <b style={{ fontSize: 14 }}>${Number(b.bill_amount || b.base_price).toFixed(2)} AUD</b>
                                  {b.payment_method && (
                                    <span style={{ display: 'block', fontSize: 11, color: '#667376' }}>
                                      {b.payment_method.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => setSelectedBooking(b)}
                                  style={{ padding: '6px 12px', fontSize: 11 }}
                                >
                                  Inspect Photos
                                </button>
                                <button
                                  type="button"
                                  className="button"
                                  onClick={() => openReceipt(b)}
                                  style={{ padding: '6px 12px', fontSize: 11, background: '#e8ede7' }}
                                >
                                  🧾 Receipt
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        /* VIEW 2: ALL BOOKINGS LIST VIEW */
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Bookings in Database ({items.length})</h2>
            <small style={{ color: '#667376' }}>Click any customer email to filter all bookings by that customer</small>
          </div>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
              ⏳ Fetching appointments from MySQL…
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
              No bookings found matching &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Ref & Time</th>
                    <th>Customer (Unified Email & Phone)</th>
                    <th>Vehicle</th>
                    <th>Service</th>
                    <th>Assigned Rep</th>
                    <th>Billed / Inflow</th>
                    <th>Photos</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <b style={{ fontFamily: 'monospace', fontSize: 13 }}>{b.reference_code}</b>
                        <br />
                        <small style={{ color: '#556663', fontWeight: 600 }}>
                          {b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' }) : 'On Arrival'}
                        </small>
                      </td>

                      <td>
                        <b>{b.customer_name}</b>
                        <br />
                        <span
                          style={{ color: '#1d6960', fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={() => setSearchTerm(b.customer_email)}
                          title="Click to view all bookings by this email"
                        >
                          {b.customer_email}
                        </span>
                        <br />
                        <small style={{ color: '#667376' }}>{b.customer_phone}</small>
                      </td>

                      <td>
                        <b>{b.make} {b.model}</b>
                        <br />
                        <span style={{ color: '#778481', fontSize: 12 }}>
                          {b.rego.toUpperCase()} ({b.vehicle_state})
                        </span>
                      </td>

                      <td>
                        <span>{b.service_name}</span>
                      </td>

                      <td>
                        {b.rep_name ? (
                          <span style={{ fontWeight: 700, color: '#1d6960' }}>{b.rep_name}</span>
                        ) : (
                          <span style={{ color: '#be4635', fontStyle: 'italic' }}>Open / Unassigned</span>
                        )}
                      </td>

                      <td>
                        <b>${Number(b.bill_amount || b.base_price).toFixed(2)} AUD</b>
                        {b.payment_method && (
                          <span style={{ display: 'block', fontSize: 11, color: '#667376' }}>
                            via {b.payment_method.toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td>
                        {b.photos && b.photos.length > 0 ? (
                          <span style={{ background: '#d7ece8', color: '#1d6960', padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                            📸 {b.photos.length} photos
                          </span>
                        ) : (
                          <span style={{ color: '#8b9895', fontSize: 11 }}>0 photos</span>
                        )}
                      </td>

                      <td>
                        <span className={`status ${b.status === 'in_progress' ? 'live' : ''}`}>
                          {b.status === 'in_progress' ? 'In Progress' : b.status.toUpperCase()}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          className="button"
                          onClick={() => setSelectedBooking(b)}
                          style={{ padding: '6px 12px', fontSize: 12, marginRight: 6 }}
                        >
                          Inspect
                        </button>

                        <button
                          type="button"
                          className="button"
                          onClick={() => openReceipt(b)}
                          style={{ padding: '6px 12px', fontSize: 12, background: '#e8ede7' }}
                          title="View ATO compliant Tax Invoice"
                        >
                          🧾 Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Booking Details & Photos Inspection Modal */}
      {selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 21, 23, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="modal-card"
            style={{
              width: '100%',
              maxWidth: 780,
              background: '#fff',
              borderRadius: 18,
              padding: '28px 32px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e7ebe7', paddingBottom: 16 }}>
              <div>
                <span className="eyebrow">Job Inspection & DB Record</span>
                <h2 style={{ margin: '4px 0 0', fontSize: 24 }}>
                  {selectedBooking.reference_code} · {selectedBooking.customer_name}
                </h2>
                <small style={{ color: '#667376' }}>
                  Unified Customer Account: <b>{selectedBooking.customer_email}</b> · {selectedBooking.customer_phone}
                </small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ background: '#e8ede7', border: 0, borderRadius: '50%', width: 32, height: 32, fontSize: 14, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="form-row-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18, fontSize: 13, background: '#f8faf7', padding: 16, borderRadius: 12 }}>
              <div><b>Contact:</b> {selectedBooking.customer_phone} · {selectedBooking.customer_email}</div>
              <div><b>Location:</b> {selectedBooking.customer_suburb}, {selectedBooking.customer_state} {selectedBooking.customer_postcode}</div>
              <div><b>Vehicle:</b> {selectedBooking.make} {selectedBooking.model} ({selectedBooking.rego.toUpperCase()} {selectedBooking.vehicle_state})</div>
              <div><b>Service Package:</b> {selectedBooking.service_name}</div>
              <div><b>Assigned Field Rep:</b> {selectedBooking.rep_name || 'Unassigned'}</div>
              <div><b>Scheduled Slot:</b> {selectedBooking.scheduled_at ? new Date(selectedBooking.scheduled_at).toLocaleString('en-AU') : 'On Arrival'}</div>
              <div><b>Billing:</b> ${Number(selectedBooking.bill_amount || selectedBooking.base_price).toFixed(2)} AUD ({selectedBooking.payment_method?.toUpperCase() || 'N/A'})</div>
              {selectedBooking.completed_at && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <b>Completed At:</b> {new Date(selectedBooking.completed_at).toLocaleString('en-AU')}
                </div>
              )}
              {selectedBooking.service_notes && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <b>Rep Service Notes:</b>
                  <p style={{ margin: '4px 0 0', color: '#455552' }}>{selectedBooking.service_notes}</p>
                </div>
              )}
            </div>

            {/* Photos Section */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>
                Before & After Inspection Photos ({selectedBooking.photos?.length || 0})
              </h3>
              {selectedBooking.photos && selectedBooking.photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: 14 }}>
                  {selectedBooking.photos.map((p) => (
                    <div key={p.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #d5dad4', background: '#f5f5f5' }}>
                      <div style={{ height: 120, position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: p.type === 'before' ? '#102021' : '#2e7d32',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            textTransform: 'uppercase'
                          }}
                        >
                          {p.type}
                        </span>
                      </div>
                      <div style={{ padding: '6px 8px', fontSize: 11, color: '#556663', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title || `${p.type} photo`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#8b9895', fontStyle: 'italic', fontSize: 13 }}>
                  No photos uploaded for this job yet.
                </p>
              )}
            </div>

            <div className="receipt-actions" style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="button dark"
                onClick={() => {
                  openReceipt(selectedBooking);
                }}
              >
                🧾 View Australian Tax Receipt
              </button>
              <button
                type="button"
                className="button"
                onClick={() => setSelectedBooking(null)}
                style={{ background: '#e8ede7' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Receipt Modal */}
      {receiptData && (
        <TaxReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
      )}
    </PortalShell>
  );
}
