'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';

interface ActiveJob {
  id: string;
  reference_code: string;
  booking_type: string;
  scheduled_at: string;
  status: string;
  service_notes?: string;
  bill_amount?: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_suburb: string;
  customer_state: string;
  rego: string;
  vehicle_state: string;
  make: string;
  model: string;
  service_name: string;
  service_slug: string;
  base_price: number;
  duration_minutes: number;
  rep_id?: string;
  rep_name?: string;
  rep_email?: string;
}

export default function AdminActiveJobsPage() {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [filterRep, setFilterRep] = useState<string>('all');

  const loadActiveJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/active-jobs');
      if (!res.ok) throw new Error('Failed to load active jobs');
      const data = await res.json();
      setActiveJobs(data.activeJobs || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveJobs();
    const interval = setInterval(loadActiveJobs, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [loadActiveJobs]);

  const uniqueReps = Array.from(
    new Set(activeJobs.map((j) => j.rep_name).filter(Boolean))
  ) as string[];

  const filtered = activeJobs.filter((j) => {
    if (filterRep !== 'all' && j.rep_name !== filterRep) return false;
    return true;
  });

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Studio Floor Dispatch</div>
          <h1>Active Detailing Jobs</h1>
          <p>Real-time monitor of live detailing bays and in-progress jobs across all field representatives.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#778481' }}>
            Auto-refreshes · Last: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            type="button"
            className="button"
            onClick={loadActiveJobs}
            disabled={loading}
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh Now'}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpis">
        <div className="kpi">
          <span>Active Detailing Bays</span>
          <b style={{ color: activeJobs.length > 0 ? '#ed795e' : 'inherit' }}>
            {activeJobs.length} live
          </b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>
            {activeJobs.length > 0 ? '● Real-time detailing underway' : 'No bays active right now'}
          </small>
        </div>
        <div className="kpi">
          <span>Reps on Detailing Floor</span>
          <b>{uniqueReps.length} technicians</b>
          <small style={{ color: '#1d6960', fontWeight: 700, fontSize: 11 }}>
            {uniqueReps.join(', ') || 'All standing by'}
          </small>
        </div>
        <div className="kpi">
          <span>In-Progress Value</span>
          <b>
            ${activeJobs.reduce((acc, j) => acc + Number(j.bill_amount || j.base_price || 0), 0).toFixed(2)} AUD
          </b>
          <small style={{ color: '#667376', fontSize: 11 }}>Settles into cash inflow on job completion</small>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 14px', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#52615e' }}>Filter by Representative:</span>
          <select
            value={filterRep}
            onChange={(e) => setFilterRep(e.target.value)}
            style={{ padding: '5px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #dcdfdc' }}
          >
            <option value="all">All Field Representatives ({activeJobs.length})</option>
            {uniqueReps.map((rep) => (
              <option key={rep} value={rep}>
                {rep} ({activeJobs.filter((j) => j.rep_name === rep).length})
              </option>
            ))}
          </select>
        </div>

        <Link href="/portal/admin/bookings" className="button" style={{ padding: '8px 14px', fontSize: 12, borderRadius: 8, whiteSpace: 'nowrap' }}>
          View All Bookings & History →
        </Link>
      </div>

      {/* Active Jobs Grid / Cards */}
      {loading && activeJobs.length === 0 ? (
        <section className="panel" style={{ padding: 40, textAlign: 'center', color: '#667376' }}>
          Querying live detailing bays…
        </section>
      ) : filtered.length === 0 ? (
        <section className="panel" style={{ padding: 50, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
          <h3 style={{ margin: '0 0 6px' }}>No Active Detailing Jobs in Progress</h3>
          <p style={{ color: '#667376', maxWidth: 460, margin: '0 auto 16px', fontSize: 13 }}>
            Field representatives are currently standing by. When a representative claims an upcoming booking and taps "Conduct Service / Start Detailing", it will appear here in real time.
          </p>
          <Link href="/portal/admin/bookings" className="button dark" style={{ display: 'inline-block', padding: '8px 16px', fontSize: 13 }}>
            Check Upcoming Bookings Schedule
          </Link>
        </section>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {filtered.map((job) => (
            <section
              key={job.id}
              className="panel"
              style={{
                margin: 0,
                border: '2px solid rgba(237, 121, 94, 0.4)',
                background: '#ffffff',
                boxShadow: '0 8px 24px rgba(237, 121, 94, 0.08)'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf1ed', paddingBottom: 12, marginBottom: 12 }}>
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#fff2ee',
                      color: '#c83f21',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.5
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#ed795e',
                        animation: 'pulse 1.5s infinite'
                      }}
                    />
                    IN PROGRESS
                  </span>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, marginTop: 6 }}>
                    {job.reference_code}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                    ${Number(job.bill_amount || job.base_price).toFixed(2)} AUD
                  </div>
                  <small style={{ color: '#778481', fontSize: 11 }}>
                    {job.duration_minutes} min service
                  </small>
                </div>
              </div>

              {/* Vehicle & Customer Details */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0d1517' }}>
                  {job.make} {job.model}
                </div>
                <div style={{ fontSize: 12, color: '#556663', marginTop: 2 }}>
                  Plate: <b style={{ letterSpacing: 0.5 }}>{job.rego.toUpperCase()}</b> ({job.vehicle_state})
                </div>
              </div>

              <div style={{ background: '#f7faf7', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#667376' }}>Service Package:</span>
                  <b>{job.service_name}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#667376' }}>Customer:</span>
                  <span>{job.customer_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#667376' }}>Phone:</span>
                  <a href={`tel:${job.customer_phone}`} style={{ color: '#1d6960', fontWeight: 700 }}>
                    {job.customer_phone}
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#667376' }}>Location:</span>
                  <span>{job.customer_suburb}, {job.customer_state}</span>
                </div>
              </div>

              {/* Assigned Rep & Live Status */}
              <div style={{ borderTop: '1px solid #edf1ed', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: '#1d6960',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 11
                    }}
                  >
                    {job.rep_name ? job.rep_name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#778481', display: 'block', lineHeight: 1 }}>Technician</span>
                    <b style={{ fontSize: 12, color: 'var(--ink)' }}>{job.rep_name || 'Unassigned'}</b>
                  </div>
                </div>

                <Link
                  href="/portal/admin/bookings"
                  className="button"
                  style={{ padding: '5px 10px', fontSize: 11 }}
                >
                  Inspect details →
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
