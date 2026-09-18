'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { TaxReceiptModal, type TaxReceiptData } from '@/components/tax-receipt-modal';

interface CompletedJob {
  id: string;
  reference_code: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_suburb: string;
  customer_state: string;
  rego: string;
  vehicle_state: string;
  make: string;
  model: string;
  service_name: string;
  bill_amount: number;
  payment_method?: string;
  service_notes?: string;
  completed_at: string;
  assigned_rep_id?: string;
  rep_name?: string;
}

interface CustomerHistoryGroup {
  email: string;
  name: string;
  phone: string;
  location: string;
  totalSpent: number;
  jobs: CompletedJob[];
}

export default function RepHistory() {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [currentRepName, setCurrentRepName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'customers' | 'list'>('customers');
  const [selectedReceipt, setSelectedReceipt] = useState<TaxReceiptData | null>(null);

  useEffect(() => {
    fetch('/api/rep/bookings')
      .then((r) => r.json())
      .then((data) => {
        if (data.repName) setCurrentRepName(data.repName);
        setCompletedJobs(data.completedBookings || []);
      })
      .catch((err) => console.error('Failed to load rep history:', err))
      .finally(() => setLoading(false));
  }, []);

  const openReceipt = (job: CompletedJob) => {
    const total = Number(job.bill_amount || 0);
    const gst = Number((total / 11).toFixed(2));
    const subtotal = Number((total - gst).toFixed(2));

    const receipt: TaxReceiptData = {
      receiptNumber: `TAX-${job.reference_code}`,
      title: 'TAX INVOICE / RECEIPT',
      abn: '48 612 345 678',
      businessName: 'AutoLustre Detailing Pty Ltd',
      businessAddress: '12-14 Industrial Circuit, Alexandria, NSW 2015',
      phone: '1300 288 678',
      email: 'accounts@autolustre.com.au',
      issueDate: job.completed_at ? new Date(job.completed_at).toLocaleString('en-AU') : new Date().toLocaleString('en-AU'),
      customer: {
        name: job.customer_name,
        email: job.customer_email || 'client@example.com',
        phone: job.customer_phone,
        address: `${job.customer_suburb || 'Sydney'}, ${job.customer_state || 'NSW'}`
      },
      vehicle: {
        rego: job.rego,
        state: job.vehicle_state || 'NSW',
        description: `${job.make} ${job.model}`
      },
      service: {
        name: job.service_name,
        notes: job.service_notes || 'Completed automotive detail'
      },
      payment: {
        method: (job.payment_method || 'CARD').toUpperCase(),
        status: 'PAID IN FULL',
        subtotalExGst: `$${subtotal.toFixed(2)} AUD`,
        gstAmount: `$${gst.toFixed(2)} AUD (10% GST)`,
        totalAmount: `$${total.toFixed(2)} AUD`
      },
      representative: {
        name: `${job.rep_name || currentRepName || 'Field Representative'}`,
        id: job.assigned_rep_id || job.id
      }
    };

    setSelectedReceipt(receipt);
  };

  // Group by customer email
  const customerMap = new Map<string, CustomerHistoryGroup>();
  for (const job of completedJobs) {
    const key = (job.customer_email || job.customer_phone).toLowerCase();
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        email: job.customer_email,
        name: job.customer_name,
        phone: job.customer_phone,
        location: `${job.customer_suburb || 'Sydney'}, ${job.customer_state || 'NSW'}`,
        totalSpent: 0,
        jobs: []
      });
    }
    const grp = customerMap.get(key)!;
    grp.jobs.push(job);
    grp.totalSpent += Number(job.bill_amount || 0);
  }

  const customerGroups = Array.from(customerMap.values());

  // Search filtering
  const filteredCustomers = customerGroups.filter((g) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.name.toLowerCase().includes(term) ||
      g.email.toLowerCase().includes(term) ||
      g.phone.includes(term) ||
      g.jobs.some((j) => j.rego.toLowerCase().includes(term) || j.reference_code.toLowerCase().includes(term))
    );
  });

  const filteredJobs = completedJobs.filter((j) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.customer_name.toLowerCase().includes(term) ||
      j.customer_email.toLowerCase().includes(term) ||
      j.customer_phone.includes(term) ||
      j.rego.toLowerCase().includes(term) ||
      j.reference_code.toLowerCase().includes(term)
    );
  });

  const totalEarned = completedJobs.reduce((sum, j) => sum + Number(j.bill_amount || 0), 0);

  return (
    <PortalShell role="rep">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Client Relationship Archive</div>
          <h1>Customer History & Accounts</h1>
          <p>
            All bookings made by a single customer over time are unified under their email & phone number.
          </p>
        </div>
        <div className="kpi" style={{ padding: '12px 20px', minWidth: 200, textAlign: 'right' }}>
          <span style={{ fontSize: 11, color: '#667376' }}>Total Cash Settled</span>
          <b style={{ fontSize: 20, color: '#1d6960' }}>${totalEarned.toFixed(2)} AUD</b>
        </div>
      </header>

      {/* Search & View Mode Bar */}
      <section className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <input
            placeholder="Search by customer email, phone, name, or vehicle plate…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #dce2dc', borderRadius: 8, width: 380, maxWidth: '100%' }}
          />

          <div style={{ display: 'flex', background: '#e8ede7', padding: 4, borderRadius: 10 }}>
            <button
              type="button"
              onClick={() => setViewMode('customers')}
              style={{
                border: 0,
                background: viewMode === 'customers' ? 'var(--ink)' : 'transparent',
                color: viewMode === 'customers' ? '#fff' : 'inherit',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              👤 Grouped by Customer ({customerGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                border: 0,
                background: viewMode === 'list' ? 'var(--ink)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'inherit',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              📋 All Jobs List ({completedJobs.length})
            </button>
          </div>
        </div>
      </section>

      {viewMode === 'customers' ? (
        <section className="panel">
          <h2 style={{ marginBottom: 16 }}>Unified Client Accounts ({filteredCustomers.length})</h2>

          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
              ⏳ Loading client history from MySQL database…
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
              {customerGroups.length === 0
                ? 'No client history recorded yet. Completed jobs will appear here.'
                : 'No customers match your search.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredCustomers.map((c) => (
                <div
                  key={c.email || c.phone}
                  style={{
                    border: '1px solid #dce2dc',
                    borderRadius: 14,
                    background: '#ffffff',
                    padding: '20px 24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #f0f3ee', paddingBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <b style={{ fontSize: 16 }}>{c.name}</b>
                        <span style={{ background: '#d7ece8', color: '#1d6960', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999 }}>
                          {c.jobs.length} {c.jobs.length === 1 ? 'service completed' : 'services completed'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#556663', marginTop: 4 }}>
                        Email: <b>{c.email}</b> · Phone: <b>{c.phone}</b> · Location: {c.location}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: '#7a8582', display: 'block' }}>Total Lifetime Value</span>
                      <b style={{ fontSize: 16, color: '#1d6960' }}>${c.totalSpent.toFixed(2)} AUD</b>
                    </div>
                  </div>

                  {/* All services under this customer */}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {c.jobs.map((job) => (
                      <div
                        key={job.id}
                        style={{
                          background: '#fafcf9',
                          border: '1px solid #eef2ec',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                          fontSize: 13
                        }}
                      >
                        <div>
                          <b style={{ fontFamily: 'monospace' }}>{job.reference_code}</b> ·{' '}
                          <b>{job.service_name}</b> · Vehicle:{' '}
                          <span>{job.make} {job.model} (<b>{job.rego.toUpperCase()}</b>)</span>
                          <span style={{ color: '#778481', marginLeft: 8 }}>
                            · Completed {new Date(job.completed_at).toLocaleDateString('en-AU')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <b>${Number(job.bill_amount).toFixed(2)} AUD</b>
                          <button
                            type="button"
                            className="button"
                            onClick={() => openReceipt(job)}
                            style={{ padding: '5px 10px', fontSize: 11, background: '#e8ede7' }}
                          >
                            🧾 Tax Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <h2 style={{ marginBottom: 16 }}>Completed Details List ({filteredJobs.length})</h2>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer (Email & Phone)</th>
                  <th>Vehicle</th>
                  <th>Service Performed</th>
                  <th>Completed Date</th>
                  <th>Bill Paid (AUD)</th>
                  <th style={{ textAlign: 'right' }}>Tax Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <b style={{ fontFamily: 'monospace' }}>{j.reference_code}</b>
                    </td>
                    <td>
                      <b>{j.customer_name}</b>
                      <br />
                      <span style={{ color: '#1d6960', fontSize: 12 }}>{j.customer_email}</span>
                      <br />
                      <small style={{ color: '#667376' }}>{j.customer_phone}</small>
                    </td>
                    <td>
                      <b>{j.make} {j.model}</b>
                      <br />
                      <span style={{ color: '#778481', fontSize: 12 }}>
                        {j.rego.toUpperCase()} ({j.vehicle_state || 'NSW'})
                      </span>
                    </td>
                    <td>{j.service_name}</td>
                    <td>
                      {j.completed_at
                        ? new Date(j.completed_at).toLocaleDateString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'Today'}
                    </td>
                    <td>
                      <b>${Number(j.bill_amount).toFixed(2)} AUD</b>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="button"
                        onClick={() => openReceipt(j)}
                        style={{ padding: '6px 12px', fontSize: 12, background: '#e8ede7' }}
                      >
                        🧾 Tax Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tax Receipt Modal */}
      {selectedReceipt && (
        <TaxReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
    </PortalShell>
  );
}
