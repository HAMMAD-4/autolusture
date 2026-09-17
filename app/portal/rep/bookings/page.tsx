'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/portal-shell';

interface RepBooking {
  id: string;
  reference_code: string;
  scheduled_at: string;
  customer_name: string;
  customer_phone: string;
  customer_suburb: string;
  rego: string;
  vehicle_state: string;
  make: string;
  model: string;
  service_name: string;
  base_price: number;
  status: string;
  assigned_rep_id?: string;
  rep_name?: string;
}

export default function RepBookingsSchedule() {
  const router = useRouter();
  const [bookings, setBookings] = useState<RepBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rep/bookings');
      if (!res.ok) throw new Error('Failed to load upcoming bookings');
      const data = await res.json();
      setBookings(data.allBookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedule();
  }, []);

  const handleClaim = async (bookingId: string) => {
    try {
      setClaimingId(bookingId);
      const res = await fetch('/api/rep/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to claim');
      router.push(`/portal/rep/active?bookingId=${bookingId}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Unable to claim booking');
    } finally {
      setClaimingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!dateFilter) return true;
    if (!b.scheduled_at) return false;
    return b.scheduled_at.startsWith(dateFilter);
  });

  return (
    <PortalShell role="rep">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Studio Schedule & Dispatch</div>
          <h1>Upcoming Service Bookings</h1>
          <p>Day-wise roster of appointments. Open time slots are available for reps to claim and service.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="button" onClick={loadSchedule} style={{ background: '#e8ece7' }}>
            🔄 Refresh schedule
          </button>
        </div>
      </header>

      {/* Date Filter */}
      <section className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Filter by appointment date:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #dce2dc', borderRadius: 8 }}
          />
          {dateFilter && (
            <button
              type="button"
              className="button"
              onClick={() => setDateFilter('')}
              style={{ padding: '6px 12px', fontSize: 12, background: '#e8ece7' }}
            >
              Clear filter
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 style={{ marginBottom: 16 }}>Scheduled Appointments ({filtered.length})</h2>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
            ⏳ Loading live bookings from database…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
            No appointments scheduled for this date.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Scheduled Time Slot</th>
                  <th>Customer</th>
                  <th>Vehicle Details</th>
                  <th>Service Tier</th>
                  <th>Assigned Field Rep</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <b style={{ fontSize: 14 }}>
                        {b.scheduled_at
                          ? new Date(b.scheduled_at).toLocaleString('en-AU', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'On-Arrival Walk-in'}
                      </b>
                      <br />
                      <small style={{ color: '#778481', fontFamily: 'monospace' }}>{b.reference_code}</small>
                    </td>

                    <td>
                      <b>{b.customer_name}</b>
                      <br />
                      <span style={{ fontSize: 12, color: '#667376' }}>
                        {b.customer_phone} · {b.customer_suburb}
                      </span>
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
                      <br />
                      <small style={{ color: '#2e7d32', fontWeight: 700 }}>
                        ${Number(b.base_price).toFixed(2)} AUD
                      </small>
                    </td>

                    <td>
                      {b.rep_name ? (
                        <span style={{ fontWeight: 700, color: '#1d6960' }}>{b.rep_name}</span>
                      ) : (
                        <span style={{ color: '#be4635', fontStyle: 'italic' }}>Open / Unclaimed</span>
                      )}
                    </td>

                    <td>
                      <span className={`status ${b.status === 'in_progress' ? 'live' : ''}`}>
                        {b.status === 'in_progress' ? 'In Progress' : b.status.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {b.status === 'completed' ? (
                        <Link
                          href={`/portal/rep/active?bookingId=${b.id}`}
                          className="button"
                          style={{ padding: '6px 12px', fontSize: 11, background: '#e8ede7' }}
                        >
                          View details
                        </Link>
                      ) : b.status === 'in_progress' ? (
                        <Link
                          href={`/portal/rep/active?bookingId=${b.id}`}
                          className="button dark"
                          style={{ padding: '6px 12px', fontSize: 11 }}
                        >
                          Resume active →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="button dark"
                          disabled={claimingId === b.id}
                          onClick={() => handleClaim(b.id)}
                          style={{ padding: '6px 12px', fontSize: 11 }}
                        >
                          {claimingId === b.id ? 'Claiming…' : 'Claim & Open Job →'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PortalShell>
  );
}
