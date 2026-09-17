'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PortalShell } from '@/components/portal-shell';
import { TaxReceiptModal, type TaxReceiptData } from '@/components/tax-receipt-modal';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
}

interface ActiveBooking {
  id: string;
  reference_code: string;
  scheduled_at: string;
  customer_name: string;
  customer_phone: string;
  rego: string;
  vehicle_state: string;
  make: string;
  model: string;
  service_name: string;
  base_price: number | string;
  status: string;
  bill_amount?: number | string;
  service_notes?: string;
  payment_method?: string;
}

export type ServiceStage = 'before_inspection' | 'service_in_progress' | 'after_inspection' | 'completed';

// Client-side image compression to fit well within MySQL packets and optimize performance
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
    img.onerror = () => {
      resolve(typeof source === 'string' ? source : '');
    };

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

export default function ActivePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading active bay assignment…</div>}>
      <ActiveServiceContent />
    </Suspense>
  );
}

function ActiveServiceContent() {
  const searchParams = useSearchParams();
  const paramBookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState<ActiveBooking | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);

  // 4-stage Detailing Lifecycle
  const [stage, setStage] = useState<ServiceStage>('before_inspection');
  const [started, setStarted] = useState(false);
  const [secs, setSecs] = useState(0);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [startingService, setStartingService] = useState(false);
  const [finished, setFinished] = useState(false);
  const [receipt, setReceipt] = useState<TaxReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [completionError, setCompletionError] = useState('');

  // Photos state
  const [beforePhotos, setBeforePhotos] = useState<CapturedPhoto[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<CapturedPhoto[]>([]);

  // Billing & completion details state
  const [notes, setNotes] = useState('Standard complete detailing performed to studio specifications.');
  const [bill, setBill] = useState('189.00');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [customerPresent, setCustomerPresent] = useState(true);

  // Camera modal state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'before' | 'after'>('before');
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Load active booking from DB
  const loadBooking = useCallback(async () => {
    try {
      setLoadingBooking(true);
      const res = await fetch('/api/rep/bookings');
      if (!res.ok) throw new Error('Failed to load rep bookings');
      const data = await res.json();

      let target: ActiveBooking | null = null;
      if (paramBookingId) {
        target =
          data.allBookings?.find((b: ActiveBooking) => b.id === paramBookingId) ||
          data.openBookings?.find((b: ActiveBooking) => b.id === paramBookingId);
      } else if (data.activeBooking) {
        target = data.activeBooking;
      } else if (data.openBookings && data.openBookings.length > 0) {
        target = data.openBookings[0];
      }

      if (target) {
        setBooking(target);
        if (target.base_price) {
          setBill(Number(target.base_price).toFixed(2));
        }

        if (target.status === 'completed') {
          setFinished(true);
          setStage('completed');
          if (target.bill_amount) setBill(Number(target.bill_amount).toFixed(2));
          if (target.service_notes) setNotes(target.service_notes);
          if (target.payment_method) setPaymentMethod(target.payment_method);
        } else if (target.status === 'in_progress') {
          setStage('service_in_progress');
          setStarted(true);
        } else {
          // Brand new scheduled or claimed appointment: Rep starts at before_inspection!
          setStage('before_inspection');
          setStarted(false);
          setSecs(0);
        }
      } else {
        setBooking(null);
      }
    } catch (err) {
      console.error('Failed to load active job:', err);
    } finally {
      setLoadingBooking(false);
    }
  }, [paramBookingId]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  // Active service timer - strictly ticks only while in service_in_progress
  useEffect(() => {
    if (stage !== 'service_in_progress' || !started || finished) return;
    const interval = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage, started, finished]);

  const formattedTime = `${String(Math.floor(secs / 3600)).padStart(2, '0')}:${String(
    Math.floor((secs % 3600) / 60)
  ).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  // Start Detailing Service stopwatch
  const handleStartService = async () => {
    if (!booking) return;
    setStartingService(true);
    setStage('service_in_progress');
    setStarted(true);
    try {
      await fetch('/api/rep/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, action: 'start' })
      });
    } catch (err) {
      console.error('Failed to record service start:', err);
    } finally {
      setStartingService(false);
    }
  };

  // Complete Detailing & Move to After Photos
  const handleFinishDetailing = () => {
    setStage('after_inspection');
  };

  // Validation rules for ending service
  const hasAfterPhotos = afterPhotos.length > 0;
  const hasValidBill = Number(bill) > 0 && !isNaN(Number(bill));
  const hasPaymentMethod = paymentMethod.trim().length > 0;
  const hasNotes = notes.trim().length > 0;

  const canFinish =
    (stage === 'after_inspection' || stage === 'service_in_progress') &&
    hasAfterPhotos &&
    hasValidBill &&
    hasPaymentMethod &&
    hasNotes &&
    !savingCompletion;

  // Stop camera tracks helper
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const openCamera = (target: 'before' | 'after') => {
    setCameraTarget(target);
    setCameraError('');
    setCameraOpen(true);
  };

  const closeCamera = useCallback(() => {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError('');
  }, [stopCameraStream]);

  // Camera video stream
  useEffect(() => {
    if (!cameraOpen) return;
    let active = true;

    async function initCamera() {
      stopCameraStream();
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera device API is not supported on this device.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        if (active) {
          setCameraError(
            err instanceof Error
              ? err.message
              : 'Could not access camera. Please allow camera permissions or use "Choose files".'
          );
        }
      }
    }

    void initCamera();

    return () => {
      active = false;
      stopCameraStream();
    };
  }, [cameraOpen, facingMode, stopCameraStream]);

  // Click pic from camera with client-side compression
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawData = canvas.toDataURL('image/jpeg', 0.88);
    const compressed = await compressImage(rawData, 1200, 0.75);

    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dataUrl: compressed,
      timestamp: new Date().toLocaleTimeString()
    };

    if (cameraTarget === 'before') {
      setBeforePhotos((prev) => [...prev, newPhoto]);
    } else {
      setAfterPhotos((prev) => [...prev, newPhoto]);
    }
  };

  // Choose files with client-side compression
  const handleFilesChosen = async (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 1200, 0.75);
        if (!compressed) continue;
        const newPhoto: CapturedPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: compressed,
          timestamp: new Date().toLocaleTimeString()
        };
        if (target === 'before') {
          setBeforePhotos((prev) => [...prev, newPhoto]);
        } else {
          setAfterPhotos((prev) => [...prev, newPhoto]);
        }
      } catch (err) {
        console.error('Photo compression error:', err);
      }
    }
    e.target.value = '';
  };

  const removePhoto = (id: string, target: 'before' | 'after') => {
    if (target === 'before') {
      setBeforePhotos((prev) => prev.filter((p) => p.id !== id));
    } else {
      setAfterPhotos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Submit completion to Database & generate Tax Receipt
  const handleCompleteJob = async () => {
    if (!booking) return;
    setSavingCompletion(true);
    setCompletionError('');

    try {
      const res = await fetch('/api/rep/complete-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          billAmount: Number(bill),
          paymentMethod,
          serviceNotes: notes,
          beforePhotos,
          afterPhotos
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete job in database.');
      }

      setFinished(true);
      if (data.receipt) {
        setReceipt(data.receipt);
        setShowReceiptModal(true);
      }
    } catch (err: unknown) {
      console.error('Job completion error:', err);
      setCompletionError(err instanceof Error ? err.message : 'Error completing job');
    } finally {
      setSavingCompletion(false);
    }
  };

  if (loadingBooking) {
    return (
      <PortalShell role="rep">
        <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>
          Loading active service assignment…
        </div>
      </PortalShell>
    );
  }

  if (!booking) {
    return (
      <PortalShell role="rep">
        <div className="panel" style={{ maxWidth: 640, margin: '40px auto', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ marginBottom: 10 }}>No Active Booking Selected</h2>
          <p style={{ color: '#667376', marginBottom: 24, lineHeight: 1.6 }}>
            You do not currently have a detailing appointment open in your active bay.
            Select a job from your schedule to conduct the vehicle inspection and begin detailing.
          </p>
          <Link href="/portal/rep/bookings" className="button dark" style={{ padding: '12px 24px' }}>
            View Scheduled Appointments →
          </Link>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell role="rep">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Active bay assignment</div>
          <h1>
            {booking.customer_name}&apos;s {booking.make} {booking.model}
          </h1>
          <p>
            {booking.service_name} · Rego: {booking.rego.toUpperCase()} ({booking.vehicle_state}) · Ref: {booking.reference_code}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`status ${finished ? '' : stage === 'service_in_progress' ? 'live' : ''}`}>
            {finished
              ? '✓ COMPLETED & SAVED TO DB'
              : stage === 'service_in_progress'
              ? '● DETAILING IN PROGRESS'
              : stage === 'after_inspection'
              ? '● QUALITY CHECK & BILLING'
              : '● PRE-SERVICE INSPECTION'}
          </span>
        </div>
      </header>

      <section className="panel" style={{ maxWidth: 840 }}>
        {/* 4-Step Progress Stepper */}
        <div
          className="stepper-grid"
          style={{
            marginBottom: 24,
            borderBottom: '1px solid #e8ede7',
            paddingBottom: 16
          }}
        >
          <div
            style={{
              padding: '10px 8px',
              borderRadius: 10,
              textAlign: 'center',
              background: stage === 'before_inspection' ? '#102021' : '#f0f4ef',
              color: stage === 'before_inspection' ? '#c8f25d' : '#667376',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            1. Before Photos {beforePhotos.length > 0 ? '✓' : ''}
          </div>

          <div
            style={{
              padding: '10px 8px',
              borderRadius: 10,
              textAlign: 'center',
              background: stage === 'service_in_progress' ? '#102021' : '#f0f4ef',
              color: stage === 'service_in_progress' ? '#c8f25d' : '#667376',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            2. Detailing Timer {stage === 'after_inspection' || stage === 'completed' ? '✓' : ''}
          </div>

          <div
            style={{
              padding: '10px 8px',
              borderRadius: 10,
              textAlign: 'center',
              background: stage === 'after_inspection' ? '#102021' : '#f0f4ef',
              color: stage === 'after_inspection' ? '#c8f25d' : '#667376',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            3. After Photos {afterPhotos.length > 0 ? '✓' : ''}
          </div>

          <div
            style={{
              padding: '10px 8px',
              borderRadius: 10,
              textAlign: 'center',
              background: stage === 'completed' ? '#102021' : '#f0f4ef',
              color: stage === 'completed' ? '#c8f25d' : '#667376',
              fontSize: 12,
              fontWeight: 700
            }}
          >
            4. Tax Invoice {finished ? '✓' : ''}
          </div>
        </div>

        {finished ? (
          <div className="success">
            <div className="eyebrow" style={{ color: '#2e7d32' }}>✓ Service Successfully Completed & Saved</div>
            <h1>Job finalized & archived.</h1>
            <p style={{ maxWidth: 540, margin: '14px auto 26px', fontSize: 16 }}>
              This detail has been permanently recorded against your representative profile. Cash inflow of{' '}
              <b style={{ color: '#0d1517' }}>${Number(bill).toFixed(2)} AUD</b> was credited to studio revenue.
            </p>

            <div style={{ background: '#f2f6f1', padding: 24, borderRadius: 16, maxWidth: 520, margin: '0 auto 26px', textAlign: 'left', fontSize: 13, lineHeight: 1.8 }}>
              <div><b>Booking Reference:</b> {booking.reference_code}</div>
              <div><b>Vehicle:</b> {booking.rego.toUpperCase()} · {booking.make} {booking.model}</div>
              <div><b>Total Bill Paid:</b> ${Number(bill).toFixed(2)} AUD ({paymentMethod.toUpperCase()})</div>
              <div><b>Australian GST (10% Included):</b> ${(Number(bill) / 11).toFixed(2)} AUD</div>
              <div><b>Service Scope / Notes:</b> {notes}</div>
              <div><b>Photos Saved:</b> {beforePhotos.length} before / {afterPhotos.length} after</div>
              <div><b>Recorded Duration:</b> {formattedTime}</div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {receipt && (
                <button
                  type="button"
                  className="button dark"
                  onClick={() => setShowReceiptModal(true)}
                  style={{ padding: '13px 24px' }}
                >
                  🧾 View & Print Australian Tax Receipt
                </button>
              )}
              <Link href="/portal/rep/bookings" className="button" style={{ background: '#e8ede7', padding: '13px 20px' }}>
                View upcoming appointments →
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Live Detailing Stopwatch */}
            <div
              style={{
                background: stage === 'service_in_progress' ? '#102021' : '#f0f3ef',
                color: stage === 'service_in_progress' ? '#c8f25d' : '#455552',
                borderRadius: 18,
                padding: '24px 20px',
                textAlign: 'center',
                marginBottom: 26,
                transition: 'all 0.3s ease'
              }}
            >
              <div className="eyebrow" style={{ color: stage === 'service_in_progress' ? '#a0b8b2' : '#71827e', marginBottom: 4 }}>
                {stage === 'service_in_progress'
                  ? '⏱ Live Detailing In Progress · Elapsed Stopwatch Duration'
                  : stage === 'after_inspection'
                  ? '⏱ Detailing Completed · Total Service Time'
                  : '⏱ Detailing Stopwatch (Ready to Begin)'}
              </div>
              <div style={{ fontSize: 56, letterSpacing: -3, fontWeight: 800, fontFamily: 'monospace' }}>
                {formattedTime}
              </div>
              {stage === 'before_inspection' && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#687774' }}>
                  Capture initial Before inspection photos below. When ready, click &quot;Start Detailing Service&quot; to begin the stopwatch.
                </p>
              )}
              {stage === 'service_in_progress' && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#c8f25d' }}>
                  Detailing stopwatch is running. Carry out detailing work, wash, machine polish, or coating.
                </p>
              )}
              {stage === 'after_inspection' && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#2e7d32', fontWeight: 600 }}>
                  ✓ Detailing finished. Capture After photos and finalize billing to generate the ATO Tax Invoice.
                </p>
              )}
            </div>

            {/* Before & After Photo Management */}
            <div className="fields">
              {/* Step 1: Before Photos Section */}
              <div
                className="field full"
                style={{
                  background: stage === 'before_inspection' ? '#fbfdfa' : '#fafbf9',
                  padding: 18,
                  borderRadius: 14,
                  border: stage === 'before_inspection' ? '2px solid #b8dbb8' : '1px solid #e2e8e2'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 14, margin: 0, fontWeight: 800 }}>
                      1. Before Inspection Photos{' '}
                      {beforePhotos.length > 0 ? (
                        <span style={{ color: '#2e7d32' }}>✓ ({beforePhotos.length} recorded)</span>
                      ) : (
                        <span style={{ color: '#be4635' }}>* Inspect vehicle & take photos first</span>
                      )}
                    </label>
                    <small style={{ color: '#667376' }}>Document pre-existing scratches, swirl marks, paint condition or interior stains.</small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <button
                    type="button"
                    className="button"
                    onClick={() => openCamera('before')}
                    style={{ background: '#102021', color: '#fff', fontSize: 12, padding: '10px 16px' }}
                  >
                    📷 Open camera & click pic
                  </button>

                  <label className="button" style={{ background: '#e8ede7', fontSize: 12, padding: '10px 16px', cursor: 'pointer' }}>
                    📁 Choose files
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFilesChosen(e, 'before')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {beforePhotos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                    {beforePhotos.map((photo) => (
                      <div key={photo.id} style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #d0d7cf' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.dataUrl} alt="Before inspection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id, 'before')}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(0,0,0,0.75)',
                            color: '#fff',
                            border: 0,
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            fontSize: 11,
                            display: 'grid',
                            placeContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Delete photo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#889895', fontStyle: 'italic' }}>
                    No before photos added yet. Use the camera or upload files.
                  </div>
                )}
              </div>

              {/* Step 2: Detailing Start Button if in before_inspection */}
              {stage === 'before_inspection' && (
                <div className="field full" style={{ marginTop: 6, marginBottom: 12 }}>
                  <button
                    className="button dark"
                    type="button"
                    onClick={handleStartService}
                    disabled={startingService}
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: 16,
                      fontSize: 15,
                      fontWeight: 700,
                      background: '#1d6960'
                    }}
                  >
                    {startingService ? 'Starting detailing…' : '▶ Start Detailing Service (Start Stopwatch) →'}
                  </button>
                  <small style={{ display: 'block', textAlign: 'center', color: '#667376', marginTop: 8 }}>
                    Once vehicle inspection is complete, click above to start the stopwatch. The After Photos section will unlock upon service progress.
                  </small>
                </div>
              )}

              {/* Step 3: After Photos Section (Locked during before_inspection) */}
              {stage === 'before_inspection' ? (
                <div
                  className="field full"
                  style={{
                    background: '#f8faf8',
                    padding: 18,
                    borderRadius: 14,
                    border: '1px dashed #cdd8cd',
                    opacity: 0.75
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: 14, margin: 0, fontWeight: 700, color: '#778885' }}>
                        🔒 3. After Finish Photos (Locked)
                      </label>
                      <small style={{ color: '#889895' }}>
                        Unlocks once detailing service is underway. Capture Before photos first and click &quot;Start Detailing Service&quot; above.
                      </small>
                    </div>
                    <span style={{ fontSize: 11, background: '#e0e8e0', padding: '4px 8px', borderRadius: 6, fontWeight: 700, color: '#556663' }}>
                      Step 3
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="field full"
                  style={{
                    background: stage === 'after_inspection' ? '#fbfdfa' : '#fafbf9',
                    padding: 18,
                    borderRadius: 14,
                    border: stage === 'after_inspection' ? '2px solid #b8dbb8' : '1px solid #e2e8e2'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 14, margin: 0, fontWeight: 800 }}>
                        3. After Finish Photos{' '}
                        {afterPhotos.length > 0 ? (
                          <span style={{ color: '#2e7d32' }}>✓ ({afterPhotos.length} recorded)</span>
                        ) : (
                          <span style={{ color: '#be4635' }}>* Required before checkout</span>
                        )}
                      </label>
                      <small style={{ color: '#667376' }}>High-res finish photos showing glossy, completed surfaces (saved to DB and gallery).</small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                    <button
                      type="button"
                      className="button"
                      onClick={() => openCamera('after')}
                      style={{ background: '#102021', color: '#fff', fontSize: 12, padding: '10px 16px' }}
                    >
                      📷 Open camera & click pic
                    </button>

                    <label className="button" style={{ background: '#e8ede7', fontSize: 12, padding: '10px 16px', cursor: 'pointer' }}>
                      📁 Choose files
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFilesChosen(e, 'after')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>

                  {afterPhotos.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                      {afterPhotos.map((photo) => (
                        <div key={photo.id} style={{ position: 'relative', height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #d0d7cf' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.dataUrl} alt="After detail completed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id, 'after')}
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              background: 'rgba(0,0,0,0.75)',
                              color: '#fff',
                              border: 0,
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              fontSize: 11,
                              display: 'grid',
                              placeContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Delete photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#889895', fontStyle: 'italic' }}>
                      Please click or upload at least one after photo to show completed detailing.
                    </div>
                  )}
                </div>
              )}

              {/* Service Completion Notes */}
              <div className="field full">
                <label>
                  Service Notes / Completed Scope <span style={{ color: '#be4635' }}>*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail what was completed: e.g. Two-stage machine polish completed, leather cleaned & conditioned with UV guard, glass sealed."
                  disabled={stage === 'before_inspection'}
                  rows={3}
                />
              </div>

              {/* Billing Details */}
              <div className="field">
                <label>
                  Total Bill Amount (AUD $) <span style={{ color: '#be4635' }}>*</span>
                </label>
                <input
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  disabled={stage === 'before_inspection'}
                  placeholder="189.00"
                />
              </div>

              <div className="field">
                <label>
                  Payment Method (Australian Standard) <span style={{ color: '#be4635' }}>*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={stage === 'before_inspection'}
                >
                  <option value="card">Card / EFTPOS / Tap & Go</option>
                  <option value="invoice">Send Official Tax Invoice via Email</option>
                  <option value="cash">Cash In Hand (AUD)</option>
                  <option value="direct_deposit">Direct Bank Transfer (EFT)</option>
                </select>
              </div>

              <div className="field full">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={customerPresent}
                    onChange={(e) => setCustomerPresent(e.target.checked)}
                    disabled={stage === 'before_inspection'}
                    style={{ width: 'auto' }}
                  />
                  <span>Customer was present for final inspection and signed off on quality.</span>
                </label>
              </div>
            </div>

            {/* In-Progress Transition Controls */}
            {stage === 'service_in_progress' && (
              <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => setStarted((s) => !s)}
                  style={{ flex: 1, minWidth: 130, justifyContent: 'center', padding: 14, background: '#e8ede7' }}
                >
                  {started ? '⏸ Pause Timer' : '▶ Resume Timer'}
                </button>
                <button
                  type="button"
                  className="button dark"
                  onClick={handleFinishDetailing}
                  style={{ flex: 2, minWidth: 200, justifyContent: 'center', padding: 14, background: '#1d6960' }}
                >
                  🏁 Finish Detailing & Begin After Photos →
                </button>
              </div>
            )}

            {/* Checklist of Prerequisites to End Service */}
            {(stage === 'after_inspection' || stage === 'service_in_progress') && (
              <div
                style={{
                  marginTop: 20,
                  padding: '16px 20px',
                  background: canFinish ? '#edf8ed' : '#fff9f4',
                  borderRadius: 14,
                  border: `1px solid ${canFinish ? '#c0dec0' : '#f0d9c4'}`
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8, color: canFinish ? '#1e5e22' : '#945318' }}>
                  {canFinish
                    ? '✓ All completion requirements satisfied. Ready to end service and record into DB.'
                    : 'Prerequisites required to unlock "End service":'}
                </div>
                <div className="checklist-grid">
                  <span style={{ color: hasAfterPhotos ? '#1e5e22' : '#be4635', fontWeight: 600 }}>
                    {hasAfterPhotos ? '✓' : '✕'} After photo(s) captured ({afterPhotos.length})
                  </span>
                  <span style={{ color: hasValidBill ? '#1e5e22' : '#be4635', fontWeight: 600 }}>
                    {hasValidBill ? '✓' : '✕'} Valid bill amount entered (${Number(bill || 0).toFixed(2)})
                  </span>
                  <span style={{ color: hasPaymentMethod ? '#1e5e22' : '#be4635', fontWeight: 600 }}>
                    {hasPaymentMethod ? '✓' : '✕'} Payment method selected ({paymentMethod})
                  </span>
                  <span style={{ color: hasNotes ? '#1e5e22' : '#be4635', fontWeight: 600 }}>
                    {hasNotes ? '✓' : '✕'} Service notes entered ({notes.trim().length > 0 ? 'Done' : 'Empty'})
                  </span>
                </div>
              </div>
            )}

            {completionError && (
              <div style={{ padding: 12, background: '#fcebea', color: '#be4635', borderRadius: 10, marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                ✕ {completionError}
              </div>
            )}

            {/* Final Action Button */}
            {(stage === 'after_inspection' || stage === 'service_in_progress') && (
              <div className="form-actions" style={{ marginTop: 24 }}>
                <button
                  className="button dark"
                  type="button"
                  onClick={handleCompleteJob}
                  disabled={!canFinish}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: 16,
                    background: canFinish ? '#102021' : '#b2bebc',
                    cursor: canFinish ? 'pointer' : 'not-allowed',
                    fontSize: 15
                  }}
                >
                  {savingCompletion
                    ? 'Recording job completion in database…'
                    : canFinish
                    ? '✓ End Service & Generate Australian Tax Receipt →'
                    : 'End service (locked until at least 1 after photo & all billing details completed)'}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Interactive Camera Modal */}
      {cameraOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 640,
              background: '#1a2729',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: '#102021',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <b style={{ fontSize: 16 }}>
                  {cameraTarget === 'before' ? 'Before Photos Camera' : 'After Photos Camera'}
                </b>
                <span style={{ fontSize: 12, color: '#a0b4b0', display: 'block' }}>
                  Point camera at the vehicle surface and click the shutter.
                </span>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 0,
                  color: '#fff',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            {/* Live Camera Viewfinder */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 380,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cameraError ? (
                <div style={{ color: '#ff7b72', padding: 24, textAlign: 'center', maxWidth: 440 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
                  <p style={{ margin: 0, fontSize: 14 }}>{cameraError}</p>
                  <small style={{ display: 'block', marginTop: 10, color: '#aaa' }}>
                    Tip: You can close this and click &quot;Choose files&quot; to upload existing photos instead.
                  </small>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}

              <div
                style={{
                  position: 'absolute',
                  inset: 20,
                  border: '1px dashed rgba(255,255,255,0.25)',
                  borderRadius: 12,
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* Camera Controls */}
            <div
              style={{
                padding: '20px',
                background: '#102021',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <button
                type="button"
                onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
                className="button"
                style={{ background: '#243c3d', color: '#fff', fontSize: 12, padding: '9px 14px' }}
                title="Switch front/rear camera"
              >
                🔄 Flip camera
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                disabled={Boolean(cameraError)}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: '#c8f25d',
                  border: '4px solid #fff',
                  cursor: cameraError ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: '0 4px 15px rgba(200,242,93,0.4)'
                }}
                title="Capture Photo"
              >
                📸
              </button>

              <button
                type="button"
                onClick={closeCamera}
                className="button"
                style={{ background: '#36494a', color: '#fff', fontSize: 12, padding: '9px 16px' }}
              >
                Done ({cameraTarget === 'before' ? beforePhotos.length : afterPhotos.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Australian Standard Tax Receipt Modal */}
      {showReceiptModal && receipt && (
        <TaxReceiptModal receipt={receipt} onClose={() => setShowReceiptModal(false)} />
      )}
    </PortalShell>
  );
}
