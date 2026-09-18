'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';

interface BookingRecord {
  id: string;
  reference_code: string;
  customer_name: string;
  service_name: string;
  rep_name?: string;
  bill_amount?: number;
  base_price?: number;
  status: string;
  scheduled_at: string;
  completed_at?: string;
}

interface RepLeader {
  id: string;
  full_name: string;
  email: string;
  is_active: number | boolean;
  total_assigned_jobs: number;
  completed_jobs: number;
  active_jobs: number;
}

export default function Analytics() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reps, setReps] = useState<RepLeader[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, repsRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/reps')
      ]);

      if (bookingsRes.ok) {
        const bData = await bookingsRes.json();
        if (bData.bookings) setBookings(bData.bookings);
      }

      if (repsRes.ok) {
        const rData = await repsRes.json();
        if (rData.representatives) setReps(rData.representatives);
      }
    } catch (err) {
      console.error('Failed to load studio analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completed = bookings.filter((b) => b.status === 'completed');
  const inProgress = bookings.filter((b) => b.status === 'in_progress');
  const totalSettledRevenue = completed.reduce((sum, b) => sum + Number(b.bill_amount || 0), 0);
  const avgTicket = completed.length > 0 ? (totalSettledRevenue / completed.length).toFixed(2) : '0.00';

  // Compute actual rep revenue from completed bookings
  const repRevenueMap: Record<string, number> = {};
  for (const b of completed) {
    if (b.rep_name) {
      repRevenueMap[b.rep_name] = (repRevenueMap[b.rep_name] || 0) + Number(b.bill_amount || 0);
    }
  }

  // Max completed jobs for scaling bar charts
  const maxCompleted = Math.max(...reps.map((r) => Number(r.completed_jobs || 0)), 1);

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Performance Telemetry · Live DB</div>
          <h1>Studio Analytics</h1>
          <p>Real-time revenue settlements, bay throughput, and field technician performance from MySQL.</p>
        </div>
        <button
          type="button"
          className="button"
          onClick={loadData}
          style={{ background: '#e8ede7', fontSize: 12 }}
        >
          🔄 Refresh Telemetry
        </button>
      </header>

      {/* Primary Telemetry KPIs from Database */}
      <div className="kpis">
        <div className="kpi">
          <span>Settled Revenue (AUD)</span>
          <b style={{ color: '#1b5e20' }}>
            ${totalSettledRevenue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>
            ✓ {completed.length} completed & archived jobs
          </small>
        </div>

        <div className="kpi">
          <span>Completed Services</span>
          <b>{completed.length} details</b>
          <small style={{ color: '#1d6960', fontWeight: 700, fontSize: 11 }}>
            Across all studio representatives
          </small>
        </div>

        <div className="kpi">
          <span>Average Detail Ticket</span>
          <b>${avgTicket} AUD</b>
          <small style={{ color: '#667376', fontSize: 11 }}>
            Mean gross billing per car
          </small>
        </div>

        <div className="kpi">
          <span>Active Detailing Bays</span>
          <b>{inProgress.length} underway</b>
          <small style={{ color: inProgress.length > 0 ? '#874d00' : '#667376', fontWeight: 700, fontSize: 11 }}>
            {inProgress.length > 0 ? '● In-progress right now' : 'Bays currently clear'}
          </small>
        </div>
      </div>

      {/* Real Representative Leaderboard from Database */}
      <section className="panel" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>Field Representative Leaderboard</h2>
            <small style={{ color: '#667376' }}>
              Real technician accounts and settled revenue credited from database jobs
            </small>
          </div>
          <Link
            href="/portal/admin/representatives"
            className="button"
            style={{ fontSize: 12, padding: '7px 14px', background: '#e8ede7' }}
          >
            Manage Representatives →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
            Loading representative performance…
          </div>
        ) : reps.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#667376' }}>
            No representatives found in database.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reps.map((rep) => {
              const compCount = Number(rep.completed_jobs || 0);
              const repRev = repRevenueMap[rep.full_name] || 0;
              const barWidthPct = Math.min(100, Math.max(8, Math.round((compCount / maxCompleted) * 100)));

              return (
                <div
                  key={rep.id}
                  style={{
                    padding: '14px 18px',
                    background: '#fafbf9',
                    border: '1px solid #e2e8e2',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#1d6960',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 13,
                          display: 'grid',
                          placeContent: 'center'
                        }}
                      >
                        {rep.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <b style={{ fontSize: 14, color: '#102021' }}>{rep.full_name}</b>
                        <span style={{ fontSize: 12, color: '#667376', marginLeft: 8 }}>
                          {rep.email}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <b style={{ fontSize: 15, color: '#1b5e20' }}>
                        ${repRev.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AUD
                      </b>
                      <div style={{ fontSize: 11, color: '#667376' }}>
                        {compCount} detail{compCount === 1 ? '' : 's'} completed
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 8, background: '#e4eae4', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidthPct}%`,
                        background: '#1d6960',
                        borderRadius: 4,
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PortalShell>
  );
}

