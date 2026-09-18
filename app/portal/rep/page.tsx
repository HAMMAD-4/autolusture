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
  rego: string;
  make: string;
  model: string;
  service_name: string;
  base_price: number;
  status: string;
  assigned_rep_id?: string;
  rep_name?: string;
  bill_amount?: number;
}

export default function RepDashboard() {
  const router = useRouter();
  const [data, setData] = useState<{
    repName: string;
    repEmail?: string;
    activeBooking: RepBooking | null;
    openBookings: RepBooking[];
    completedBookings: RepBooking[];
    stats: { completedCount: number; cashInflow: number; openCount: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rep/bookings');
      if (!res.ok) throw new Error('Failed to load rep telemetry');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
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
      // Redirect to active service page with this booking!
      router.push(`/portal/rep/active?bookingId=${bookingId}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Unable to claim booking');
    } finally {
      setClaimingId(null);
    }
  };

  const todayDateStr = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <PortalShell role="rep">
      <header className="portal-title">
        <div>
          <div className="eyebrow">{todayDateStr}</div>
          <h1>Good day, {data?.repName || 'Representative'}.</h1>
          {data?.repEmail && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8ede7', padding: '3px 10px', borderRadius: 6, fontSize: 12, margin: '4px 0 8px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2e7d32' }} />
              <span>Signed in: <b>{data.repName}</b> ({data.repEmail})</span>
            </div>
          )}
          <p>
            {data?.activeBooking
              ? 'You have 1 active detail currently underway.'
              : 'No service currently in progress. Select an open appointment below to begin.'}
          </p>
        </div>
        {data?.activeBooking ? (
          <Link className="button dark" href={`/portal/rep/active?bookingId=${data.activeBooking.id}`}>
            Resume active service ({data.activeBooking.reference_code}) →
          </Link>
        ) : (
          <Link className="button dark" href="/portal/rep/on-arrival">
            + New on-arrival check-in
          </Link>
        )}
      </header>

      {/* Rep KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>Jobs Completed by You</span>
          <b>{data?.stats?.completedCount || 0} details</b>
          <small style={{ color: '#1d6960', fontWeight: 700, fontSize: 11 }}>Saved to your profile</small>
        </div>
        <div className="kpi">
          <span>Your Cash Inflows</span>
          <b>${Number(data?.stats?.cashInflow || 0).toFixed(2)} AUD</b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>Settled in studio finance</small>
        </div>
        <div className="kpi">
          <span>Open Bookings for Today</span>
          <b>{data?.openBookings?.length || 0} available</b>
          <small style={{ color: '#667376', fontSize: 11 }}>Ready for reps to claim</small>
        </div>
        <div className="kpi">
          <span>Technician Rating</span>
          <b>4.95 ★</b>
          <small style={{ color: '#1d6960', fontSize: 11 }}>Certified Master Detailer</small>
        </div>
      </div>

      {/* Available Jobs Scheduled for Today (Open for reps to claim) */}
      <section className="panel" style={{ marginTop: 22 }}>
        <div className="panel-head-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Appointments Scheduled for Today (Day-Wise Dispatch)</h2>
            <small style={{ color: '#667376' }}>Available jobs for representatives to avail, start service, and complete</small>
          </div>
          <div className="panel-head-actions">
            <Link href="/portal/rep/bookings" className="button" style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}>
              All upcoming dates →
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#667376' }}>Loading schedule from DB…</div>
        ) : data?.openBookings?.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#667376' }}>
            No open bookings remaining for today. Great job!
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Scheduled Slot</th>
                  <th>Customer</th>
                  <th>Vehicle Details</th>
                  <th>Service Package</th>
                  <th>Assignment Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.openBookings?.map((b) => {
                  const isMine = b.assigned_rep_id === data.repName || (b.status === 'in_progress');
                  return (
                    <tr key={b.id}>
                      <td>
                        <b>{b.scheduled_at ? new Date(b.scheduled_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'On Arrival'}</b>
                        <br />
                        <small style={{ color: '#778481', fontFamily: 'monospace' }}>{b.reference_code}</small>
                      </td>
                      <td>
                        <b>{b.customer_name}</b>
                        <br />
                        <span style={{ fontSize: 12, color: '#667376' }}>{b.customer_phone}</span>
                      </td>
                      <td>
                        <b>{b.make} {b.model}</b>
                        <br />
                        <span style={{ color: '#778481', fontSize: 12 }}>{b.rego.toUpperCase()}</span>
                      </td>
                      <td>
                        <span>{b.service_name}</span>
                        <br />
                        <small style={{ color: '#2e7d32', fontWeight: 700 }}>${Number(b.base_price).toFixed(2)} AUD</small>
                      </td>
                      <td>
                        <span className={`status ${b.status === 'in_progress' ? 'live' : ''}`}>
                          {b.status === 'in_progress' ? 'In Progress (You)' : 'Open to Avail'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {b.status === 'in_progress' ? (
                          <Link
                            href={`/portal/rep/active?bookingId=${b.id}`}
                            className="button dark"
                            style={{ padding: '7px 14px', fontSize: 12 }}
                          >
                            Open active service →
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="button dark"
                            disabled={claimingId === b.id}
                            onClick={() => handleClaim(b.id)}
                            style={{ padding: '7px 14px', fontSize: 12 }}
                          >
                            {claimingId === b.id ? 'Claiming…' : 'Claim & Open Job →'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rep's Completed Jobs History */}
      {data?.completedBookings && data.completedBookings.length > 0 && (
        <section className="panel" style={{ marginTop: 22 }}>
          <div className="panel-head-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>Jobs Completed by You (Archived in DB)</h2>
              <small style={{ color: '#667376' }}>Permanent records associated with your technician profile</small>
            </div>
            <div className="panel-head-actions">
              <Link href="/portal/rep/history" className="button" style={{ fontSize: 12, padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                Full customer history →
              </Link>
            </div>
          </div>

          <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="table" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer & Vehicle</th>
                  <th>Service Performed</th>
                  <th>Bill Paid (AUD)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.completedBookings.slice(0, 5).map((b) => (
                  <tr key={b.id}>
                    <td>
                      <b style={{ fontFamily: 'monospace' }}>{b.reference_code}</b>
                    </td>
                    <td>
                      <b>{b.customer_name}</b> · {b.make} {b.model} ({b.rego.toUpperCase()})
                    </td>
                    <td>{b.service_name}</td>
                    <td>
                      <b>${Number(b.bill_amount || b.base_price).toFixed(2)} AUD</b>
                    </td>
                    <td>
                      <span className="status">✓ COMPLETED</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/portal/rep/active?bookingId=${b.id}`}
                        className="button"
                        style={{ padding: '6px 12px', fontSize: 11, background: '#e8ede7' }}
                      >
                        Inspect receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </PortalShell>
  );
}
