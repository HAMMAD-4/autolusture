'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { TaxReceiptModal, type TaxReceiptData } from '@/components/tax-receipt-modal';

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
  started_at?: string;
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

interface PhotoItem {
  id: string;
  type: 'before' | 'after';
  dataUrl: string;
  title?: string;
  timestamp?: string;
}

// Client-side image compression
async function compressImage(source: string | File, maxDimension = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof source === 'string' ? source : '');
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve('');

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') img.src = reader.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    }
  });
}

function parseTimestampMs(ts?: string | Date | null): number | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.getTime();
  let str = String(ts).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    str = str + 'Z';
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : parsed;
}

function formatElapsed(startedAt?: string): string {
  if (!startedAt) return '00:00:00';
  const startMs = parseTimestampMs(startedAt);
  if (!startMs) return '00:00:00';
  const diffSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  const hrs = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
  const s = String(diffSecs % 60).padStart(2, '0');
  return `${hrs}:${mins}:${s}`;
}

export default function AdminActiveJobsPage() {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [filterRep, setFilterRep] = useState<string>('all');

  // Takeover Modal State
  const [takeoverJob, setTakeoverJob] = useState<ActiveJob | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<PhotoItem[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<PhotoItem[]>([]);
  const [billAmount, setBillAmount] = useState<string>('189.00');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [serviceNotes, setServiceNotes] = useState<string>('');
  const [submittingTakeover, setSubmittingTakeover] = useState(false);
  const [takeoverError, setTakeoverError] = useState<string>('');

  // Tax receipt modal
  const [receipt, setReceipt] = useState<TaxReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Periodic timer ticker for live update
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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
    const interval = setInterval(loadActiveJobs, 15000);
    return () => clearInterval(interval);
  }, [loadActiveJobs]);

  const uniqueReps = Array.from(
    new Set(activeJobs.map((j) => j.rep_name).filter(Boolean))
  ) as string[];

  const filtered = activeJobs.filter((j) => {
    if (filterRep !== 'all' && j.rep_name !== filterRep) return false;
    return true;
  });

  // Open inspection / emergency takeover modal
  const handleOpenTakeover = async (job: ActiveJob) => {
    setTakeoverJob(job);
    setBillAmount(String(job.bill_amount || job.base_price || 189));
    setPaymentMethod('card');
    setServiceNotes(job.service_notes || `Emergency takeover finalized by studio administrator. Quality verified.`);
    setTakeoverError('');
    setBeforePhotos([]);
    setAfterPhotos([]);

    try {
      setLoadingPhotos(true);
      const res = await fetch(`/api/booking-photos?bookingId=${job.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.photos && Array.isArray(data.photos)) {
          setBeforePhotos(data.photos.filter((p: PhotoItem) => p.type === 'before'));
          setAfterPhotos(data.photos.filter((p: PhotoItem) => p.type === 'after'));
        }
      }
    } catch (err) {
      console.error('Failed to load booking photos for takeover:', err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Add after photos via file picker (Admin can only add after photos)
  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    if (type === 'before') return; // Strict: Admin can never add before photos
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 1200, 0.75);
        if (!compressed) continue;
        const newPhoto: PhotoItem = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'after',
          dataUrl: compressed,
          title: `Admin Upload - ${file.name}`,
          timestamp: new Date().toLocaleTimeString()
        };
        setAfterPhotos((prev) => [...prev, newPhoto]);
      } catch (err) {
        console.error('Photo processing error:', err);
      }
    }
    e.target.value = '';
  };

  // Submit emergency takeover
  const handleSubmitTakeover = async () => {
    if (!takeoverJob) return;
    if (afterPhotos.length === 0) {
      setTakeoverError('At least one after photo is required to end the job and complete the takeover.');
      return;
    }
    setSubmittingTakeover(true);
    setTakeoverError('');

    try {
      const res = await fetch('/api/admin/emergency-takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: takeoverJob.id,
          billAmount: Number(billAmount),
          paymentMethod,
          serviceNotes,
          afterPhotos
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete emergency takeover');
      }

      setTakeoverJob(null);
      await loadActiveJobs();

      if (data.receipt) {
        setReceipt(data.receipt);
        setShowReceiptModal(true);
      }
    } catch (err: unknown) {
      console.error('Takeover submission error:', err);
      setTakeoverError(err instanceof Error ? err.message : 'Error completing emergency takeover');
    } finally {
      setSubmittingTakeover(false);
    }
  };

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
            Field representatives are currently standing by. When a representative claims an upcoming booking and taps &quot;Conduct Service / Start Detailing&quot;, it will appear here in real time.
          </p>
          <Link href="/portal/admin/bookings" className="button dark" style={{ display: 'inline-block', padding: '8px 16px', fontSize: 13 }}>
            Check Upcoming Bookings Schedule
          </Link>
        </section>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
          {filtered.map((job) => (
            <section
              key={job.id}
              className="panel"
              style={{
                margin: 0,
                border: '2px solid rgba(237, 121, 94, 0.4)',
                background: '#ffffff',
                boxShadow: '0 8px 24px rgba(237, 121, 94, 0.08)',
                display: 'flex',
                flexDirection: 'column'
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
                  {job.started_at && (
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#1d6960', fontWeight: 700, marginTop: 3 }}>
                      ⏱ Live: {formatElapsed(job.started_at)}
                    </div>
                  )}
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

              <div style={{ background: '#f7faf7', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 14 }}>
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
              <div style={{ borderTop: '1px solid #edf1ed', paddingTop: 12, marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                <button
                  type="button"
                  onClick={() => handleOpenTakeover(job)}
                  className="button dark"
                  style={{
                    padding: '7px 12px',
                    fontSize: 12,
                    background: '#be4635',
                    color: '#fff',
                    borderRadius: 8,
                    fontWeight: 700
                  }}
                >
                  ⚡ Inspect & Takeover →
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Admin Inspection & Emergency Takeover Modal */}
      {takeoverJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 21, 23, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(4px)'
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 760,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf1ed', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      background: '#fff2ee',
                      color: '#be4635',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.5
                    }}
                  >
                    ⚡ EMERGENCY TAKEOVER & INSPECTION
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 800 }}>
                    {takeoverJob.reference_code}
                  </span>
                </div>
                <h2 style={{ margin: '8px 0 2px', fontSize: 22 }}>
                  {takeoverJob.make} {takeoverJob.model} · {takeoverJob.service_name}
                </h2>
                <div style={{ fontSize: 13, color: '#667376' }}>
                  Customer: <b>{takeoverJob.customer_name}</b> ({takeoverJob.customer_phone}) · Plate: <b>{takeoverJob.rego.toUpperCase()}</b> ({takeoverJob.vehicle_state})
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTakeoverJob(null)}
                style={{
                  background: '#f0f3f0',
                  border: 0,
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'grid',
                  placeContent: 'center'
                }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Rep Credit Protection Banner */}
            <div
              style={{
                background: '#eef8f6',
                border: '1px solid #bce4dc',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span style={{ fontSize: 24 }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 800, color: '#10564d', fontSize: 13 }}>
                  Representative Credit Guarantee: {takeoverJob.rep_name || 'Assigned Representative'}
                </div>
                <div style={{ color: '#16695e', fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>
                  Completing this emergency takeover preserves <b>{takeoverJob.rep_name || 'the original technician'}</b> as the credited technician in the studio database. The job count and earnings will be credited to their account.
                </div>
              </div>
            </div>

            {/* Live Bay Timer Banner */}
            <div
              style={{
                background: '#102021',
                color: '#c8f25d',
                borderRadius: 12,
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 22
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#9bb1ad', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
                  Active Detailing Stopwatch
                </span>
                <div style={{ fontSize: 12, color: '#e8ede7' }}>
                  Started: {takeoverJob.started_at ? new Date(takeoverJob.started_at).toLocaleTimeString() : 'Not recorded'}
                </div>
              </div>
              <div style={{ fontSize: 32, fontFamily: 'monospace', fontWeight: 800 }}>
                ⏱ {formatElapsed(takeoverJob.started_at)}
              </div>
            </div>

            {/* Photos Inspection & Addition Section */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Before & After Detailing Inspection Photos</h3>

              {loadingPhotos ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#667376', background: '#f8faf8', borderRadius: 10 }}>
                  Loading recorded photos from database…
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Before Photos Column (Strictly Read-Only: Admin can NEVER add before photos) */}
                  <div style={{ background: '#fafbf9', padding: 14, borderRadius: 12, border: '1px solid #e2e8e2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <b style={{ fontSize: 13 }}>
                        1. Before Photos ({beforePhotos.length})
                      </b>
                      <span style={{ fontSize: 11, background: '#e0e8e0', color: '#165b4c', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                        🔒 Recorded by Rep at Start (Read-Only)
                      </span>
                    </div>

                    {beforePhotos.length === 0 ? (
                      <div style={{ padding: '16px 12px', background: '#f5f7f4', color: '#667774', borderRadius: 8, fontSize: 12, textAlign: 'center' }}>
                        No before photos recorded at start. Admin cannot add before photos.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
                        {beforePhotos.map((p) => (
                          <div key={p.id} style={{ height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #d0d7cf' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.dataUrl} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* After Photos Column */}
                  <div style={{ background: '#fafbf9', padding: 14, borderRadius: 12, border: '1px solid #e2e8e2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <b style={{ fontSize: 13 }}>
                        2. After Photos ({afterPhotos.length}) <span style={{ color: '#be4635' }}>*</span>
                      </b>
                      <label className="button" style={{ padding: '5px 10px', fontSize: 11, background: '#1d6960', color: '#fff', cursor: 'pointer' }}>
                        + Add After Photo
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleUploadPhotos(e, 'after')}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    {afterPhotos.length === 0 ? (
                      <div style={{ padding: '16px 12px', background: '#fff8eb', color: '#945318', borderRadius: 8, fontSize: 12, textAlign: 'center' }}>
                        📸 Upload finish after photos to verify completed work and unlock End Job.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
                        {afterPhotos.map((p) => (
                          <div key={p.id} style={{ height: 60, borderRadius: 6, overflow: 'hidden', border: '1px solid #d0d7cf' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.dataUrl} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Billing & Completion Scope Form */}
            <div className="fields" style={{ marginBottom: 20 }}>
              <div className="field">
                <label>Total Bill Amount (AUD $)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  style={{ padding: '10px 12px', fontSize: 14 }}
                />
              </div>

              <div className="field">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ padding: '10px 12px', fontSize: 14 }}
                >
                  <option value="card">Card / EFTPOS / Tap & Go</option>
                  <option value="invoice">Send Official Tax Invoice via Email</option>
                  <option value="cash">Cash In Hand (AUD)</option>
                  <option value="direct_deposit">Direct Bank Transfer (EFT)</option>
                </select>
              </div>

              <div className="field full">
                <label>Administrator Takeover Notes & Scope</label>
                <textarea
                  rows={2}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  style={{ padding: '10px 12px', fontSize: 13 }}
                  placeholder="Detail completion notes or any rectifications made..."
                />
              </div>
            </div>

            {takeoverError && (
              <div style={{ padding: 12, background: '#fcebea', color: '#be4635', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
                ✕ {takeoverError}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #edf1ed', paddingTop: 16 }}>
              <button
                type="button"
                className="button"
                onClick={() => setTakeoverJob(null)}
                disabled={submittingTakeover}
                style={{ padding: '12px 20px' }}
              >
                Cancel / Return
              </button>

              <button
                type="button"
                className="button dark"
                onClick={handleSubmitTakeover}
                disabled={submittingTakeover || afterPhotos.length === 0}
                style={{
                  padding: '12px 24px',
                  background: submittingTakeover || afterPhotos.length === 0 ? '#889895' : '#be4635',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: submittingTakeover || afterPhotos.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingTakeover
                  ? 'Finalizing emergency takeover…'
                  : afterPhotos.length === 0
                  ? '⚡ End Job (Locked: Please upload After Photos first)'
                  : `⚡ End Job & Process Takeover (Credit ${takeoverJob.rep_name || 'Rep'}) →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Receipt Modal */}
      {showReceiptModal && receipt && (
        <TaxReceiptModal receipt={receipt} onClose={() => setShowReceiptModal(false)} />
      )}
    </PortalShell>
  );
}
