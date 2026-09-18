'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';

interface CompletedJob {
  id: string;
  reference_code: string;
  customer_name: string;
  rego: string;
  make: string;
  model: string;
  service_name: string;
  bill_amount: number;
  scheduled_at: string;
  completed_at?: string;
}

export default function Performance() {
  const [data, setData] = useState<{
    repName: string;
    repEmail?: string;
    completedBookings: CompletedJob[];
    stats: { completedCount: number; cashInflow: number; openCount: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rep/bookings');
      if (!res.ok) throw new Error('Failed to load rep performance');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completed = data?.completedBookings || [];
  const completedCount = data?.stats?.completedCount || completed.length || 0;
  const cashInflow = Number(data?.stats?.cashInflow || 0);
  const avgTicket = completedCount > 0 ? (cashInflow / completedCount).toFixed(2) : '0.00';

  // Aggregate real day-of-week breakdown from actual completed jobs in DB
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayCounts: Record<string, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0
  };

  for (const job of completed) {
    const date = new Date(job.completed_at || job.scheduled_at);
    if (!isNaN(date.getTime())) {
      const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon ...
      const key = dayIndex === 0 ? 'Sun' : dayNames[dayIndex - 1];
      if (key && dayCounts[key] !== undefined) {
        dayCounts[key]++;
      }
    }
  }

  const maxDayCount = Math.max(...Object.values(dayCounts), 1);

  return (
    <PortalShell role="rep">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Technician Analytics · Live DB</div>
          <h1>Performance Record: {data?.repName || 'Representative'}</h1>
          {data?.repEmail && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#e8ede7', padding: '3px 10px', borderRadius: 6, fontSize: 12, margin: '4px 0 8px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2e7d32' }} />
              <span>Signed in: <b>{data.repName}</b> ({data.repEmail})</span>
            </div>
          )}
          <p>Verified detailing jobs and cash inflows credited directly to your profile in the studio database.</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={loadData}
          style={{ background: '#e8ede7', fontSize: 12 }}
        >
          🔄 Refresh
        </button>
      </header>

      {/* Real KPIs from Database */}
      <div className="kpis">
        <div className="kpi">
          <span>Services Completed by You</span>
          <b style={{ color: '#102021' }}>{completedCount} details</b>
          <small style={{ color: '#1d6960', fontWeight: 700, fontSize: 11 }}>
            ✓ Verified in studio records
          </small>
        </div>

        <div className="kpi">
          <span>Your Total Settled Cash Inflow</span>
          <b style={{ color: '#1b5e20' }}>
            ${cashInflow.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AUD
          </b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>
            Credited to your technician profile
          </small>
        </div>

        <div className="kpi">
          <span>Average Billing per Vehicle</span>
          <b>${avgTicket} AUD</b>
          <small style={{ color: '#667376', fontSize: 11 }}>
            Mean value of details delivered
          </small>
        </div>

        <div className="kpi">
          <span>Open Bookings on Studio Floor</span>
          <b>{data?.stats?.openCount || 0} available</b>
          <small style={{ color: '#667376', fontSize: 11 }}>
            Appointments ready to claim
          </small>
        </div>
      </div>

      {/* Real Day-of-Week Completed Volume from Database */}
      <section className="panel" style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 6 }}>Services Completed by Day of Week</h2>
        <small style={{ color: '#667376', display: 'block', marginBottom: 18 }}>
          Aggregated strictly from your {completedCount} completed appointments in MySQL
        </small>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dayNames.map((d) => {
            const count = dayCounts[d] || 0;
            const barWidthPct = count > 0 ? Math.max(10, Math.round((count / maxDayCount) * 100)) : 0;

            return (
              <div key={d} className="barrow" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 40, fontWeight: 700, fontSize: 13, color: '#243c3d' }}>{d}</span>
                <div style={{ flex: 1, height: 22, background: '#eef3ee', borderRadius: 6, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidthPct}%`,
                      background: count > 0 ? '#1d6960' : 'transparent',
                      borderRadius: 6,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
                <b style={{ width: 45, textAlign: 'right', fontSize: 13, color: count > 0 ? '#102021' : '#889895' }}>
                  {count}
                </b>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Completed Appointments Table from DB */}
      <section className="panel" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Your Completed Service History</h2>
            <small style={{ color: '#667376' }}>
              Real-time records from bookings table credited to your user ID
            </small>
          </div>
          <Link href="/portal/rep/history" className="button" style={{ fontSize: 12, padding: '7px 14px', background: '#e8ede7' }}>
            View Full Customer History →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#667376' }}>Loading records…</div>
        ) : completed.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#667376' }}>
            No completed services recorded yet. Claim an open appointment to begin.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="table" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Service Tier</th>
                  <th style={{ textAlign: 'right' }}>Credited Bill (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {completed.slice(0, 8).map((job) => (
                  <tr key={job.id}>
                    <td>
                      <b style={{ fontFamily: 'monospace' }}>{job.reference_code}</b>
                    </td>
                    <td>{job.customer_name}</td>
                    <td>
                      {job.make} {job.model} · <span style={{ color: '#667376' }}>{job.rego?.toUpperCase()}</span>
                    </td>
                    <td>{job.service_name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#1b5e20' }}>
                      ${Number(job.bill_amount || 0).toFixed(2)}
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

