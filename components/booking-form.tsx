'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { services } from '@/lib/data';
import { isValidEmail, isValidPostcodeForState, isValidRego, normaliseAuMobile } from '@/lib/validation/au';

const states = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'];
const steps = ['Vehicle', 'Service', 'When', 'Your details', 'Review'];

interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
  reason?: string;
}

type Form = {
  rego: string;
  vehicleState: string;
  make: string;
  model: string;
  service: string;
  when: 'Pre-book a time';
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  suburb: string;
  state: string;
  postcode: string;
};

export function BookingForm() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading booking engine…</div>}>
      <BookingFormContent />
    </Suspense>
  );
}

function BookingFormContent() {
  const searchParams = useSearchParams();
  const initialService = searchParams.get('service') || 'signature-detail';

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  // Slots state
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<Form>({
    rego: '',
    vehicleState: 'NSW',
    make: '',
    model: '',
    service: initialService,
    when: 'Pre-book a time',
    date: todayStr,
    time: '',
    name: '',
    phone: '',
    email: '',
    suburb: '',
    state: 'NSW',
    postcode: ''
  });

  // Sync initial service from query param if changed
  useEffect(() => {
    const s = searchParams.get('service');
    if (s && services.some((x) => x.slug === s)) {
      setForm((prev) => ({ ...prev, service: s }));
    }
  }, [searchParams]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Fetch slots whenever the selected date changes
  useEffect(() => {
    if (!form.date) {
      setSlots([]);
      return;
    }

    let live = true;
    setLoadingSlots(true);
    setSlotsError('');

    fetch(`/api/availability?date=${encodeURIComponent(form.date)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        if (data.error) {
          setSlotsError(data.error);
          setSlots([]);
        } else {
          setSlots(data.slots || []);
          // If current selected time is now unavailable on this date, clear it
          if (form.time) {
            const currentSlot = data.slots?.find((s: TimeSlot) => s.time === form.time);
            if (!currentSlot || !currentSlot.available) {
              setForm((prev) => ({ ...prev, time: '' }));
            }
          }
        }
      })
      .catch(() => {
        if (live) setSlotsError('Failed to load available time slots for this date.');
      })
      .finally(() => {
        if (live) setLoadingSlots(false);
      });

    return () => {
      live = false;
    };
  }, [form.date]);

  const next = () => {
    let message = '';
    if (step === 0) {
      if (!isValidRego(form.rego, form.vehicleState)) {
        message = 'Please enter a valid registration for the issuing state.';
      } else if (!form.make.trim() || !form.model.trim()) {
        message = 'Please enter both vehicle make and model.';
      }
    }

    if (step === 2) {
      if (!form.date) {
        message = 'Please select a preferred appointment date.';
      } else if (!form.time) {
        message = 'Please select one of the available 1-hour time slots below.';
      } else {
        const selectedSlot = slots.find((s) => s.time === form.time);
        if (selectedSlot && !selectedSlot.available) {
          message = 'The selected time slot is already booked. Please choose an available slot.';
        }
      }
    }

    if (step === 3) {
      if (!form.name.trim()) {
        message = 'Please enter your full name.';
      } else if (!normaliseAuMobile(form.phone)) {
        message = 'Please enter a valid Australian mobile number (e.g. 0412 345 678).';
      } else if (!isValidEmail(form.email)) {
        message = 'Please enter a valid email address.';
      } else if (!isValidPostcodeForState(form.postcode, form.state)) {
        message = `Postcode ${form.postcode} does not match the state ${form.state}.`;
      }
    }

    if (message) {
      setError(message);
      return;
    }

    setError('');
    setStep((s) => Math.min(4, s + 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit booking');
      setReference(data.reference);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unable to complete your booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="form-card success">
        <div className="eyebrow" style={{ color: '#2e7d32' }}>✓ Booking Confirmed</div>
        <h1>We’re looking forward to it.</h1>
        <p style={{ fontSize: 16, maxWidth: 520, margin: '14px auto 28px' }}>
          Your appointment is locked in and guaranteed. Your studio reference code is{' '}
          <b style={{ color: 'var(--ink)', fontSize: 18 }}>{reference}</b>.
        </p>
        <div style={{ background: '#f4f6f2', padding: 20, borderRadius: 14, maxWidth: 440, margin: '0 auto 24px', textAlign: 'left', fontSize: 13 }}>
          <div><b>Scheduled Slot:</b> {form.date} at {form.time}</div>
          <div><b>Vehicle:</b> {form.rego.toUpperCase()} · {form.make} {form.model}</div>
          <div><b>Contact:</b> {form.name} · {form.phone}</div>
        </div>
        <a href="/" className="button dark">Return to homepage →</a>
      </div>
    );
  }

  const selectedService = services.find((s) => s.slug === form.service);

  return (
    <>
      <div className="progress">
        {steps.map((_, i) => (
          <span key={i} className={i <= step ? 'active' : ''} />
        ))}
      </div>

      <div className="form-card">
        <div className="eyebrow">Step {step + 1} of 5</div>
        <h1>{steps[step]}</h1>
        <p>
          {[
            'Tell us about the vehicle to be detailed.',
            'Choose the level of automotive care.',
            'Pick your preferred date and available 1-hour slot (8 AM – 5 PM).',
            'Your contact information for notifications and arrival.',
            'Review all booking details before confirmation.'
          ][step]}
        </p>

        {/* Step 0: Vehicle */}
        {step === 0 && (
          <div className="fields">
            <Field label="Registration plate *" name="rego" value={form.rego} onChange={change} placeholder="e.g. ABC 123" required />
            <Select label="Issuing state *" name="vehicleState" value={form.vehicleState} onChange={change} options={states} />
            <Field label="Make *" name="make" value={form.make} onChange={change} placeholder="e.g. Porsche, Audi, BMW" required />
            <Field label="Model *" name="model" value={form.model} onChange={change} placeholder="e.g. 911 GT3, Q5, M3" required />
          </div>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="fields">
            {services.map((s) => (
              <label
                className="field full"
                key={s.slug}
                style={{
                  border: form.service === s.slug ? '2px solid var(--ink)' : '1px solid #d6dcd5',
                  padding: 16,
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: form.service === s.slug ? '#fafcf9' : '#ffffff',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="radio"
                      name="service"
                      value={s.slug}
                      checked={form.service === s.slug}
                      onChange={change}
                      style={{ width: 'auto' }}
                    />
                    <b style={{ fontSize: 16 }}>{s.name}</b>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>from ${s.price}</span>
                </div>
                <small style={{ display: 'block', marginLeft: 27, color: '#667376', marginTop: 6, lineHeight: 1.5 }}>
                  {s.duration} · {s.description}
                </small>
              </label>
            ))}
          </div>
        )}

        {/* Step 2: Date & Available 1-Hour Time Slots */}
        {step === 2 && (
          <div className="fields">
            <div className="field full">
              <label>Booking type</label>
              <input value="Pre-booked appointment" disabled style={{ background: '#f5f7f4' }} />
            </div>

            <div className="field full">
              <Field
                label="Select appointment date *"
                type="date"
                name="date"
                min={todayStr}
                value={form.date}
                onChange={change}
                required
              />
            </div>

            {/* Time Slot Selection Grid */}
            <div className="field full" style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ margin: 0 }}>Available time slots for {form.date} *</label>
                <small style={{ color: '#667376' }}>Morning 8:00 AM to 5:00 PM (Mon–Sun)</small>
              </div>

              {loadingSlots ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#667376', background: '#f9faf8', borderRadius: 12 }}>
                  ⏳ Checking live studio bay availability…
                </div>
              ) : slotsError ? (
                <div style={{ padding: 14, background: '#fcebea', color: '#be4635', borderRadius: 10 }}>
                  {slotsError}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: 10
                    }}
                  >
                    {slots.map((slot) => {
                      const isSelected = form.time === slot.time;
                      const isAvailable = slot.available;

                      return (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isAvailable) {
                              setForm({ ...form, time: slot.time });
                              setError('');
                            }
                          }}
                          style={{
                            padding: '14px 10px',
                            borderRadius: 12,
                            border: isSelected
                              ? '2px solid var(--ink)'
                              : isAvailable
                              ? '1px solid #c2cdc2'
                              : '1px solid #e7ebe7',
                            background: isSelected
                              ? 'var(--ink)'
                              : isAvailable
                              ? '#ffffff'
                              : '#f5f5f5',
                            color: isSelected
                              ? '#ffffff'
                              : isAvailable
                              ? 'var(--ink)'
                              : '#a0aaa7',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(13,21,23,0.18)' : 'none'
                          }}
                        >
                          <b style={{ fontSize: 14, textDecoration: isAvailable ? 'none' : 'line-through' }}>
                            {slot.label}
                          </b>
                          <small
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: isSelected
                                ? '#c8f25d'
                                : isAvailable
                                ? '#2e7d32'
                                : '#b55a4e'
                            }}
                          >
                            {isSelected ? 'Selected ✓' : isAvailable ? 'Available' : 'Booked ✕'}
                          </small>
                        </button>
                      );
                    })}
                  </div>

                  {form.time ? (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: '#d7ece8', borderRadius: 10, color: '#1d6960', fontSize: 13, fontWeight: 700 }}>
                      ✓ Selected Slot: {slots.find((s) => s.time === form.time)?.label || form.time} on {form.date}
                    </div>
                  ) : (
                    <small style={{ display: 'block', marginTop: 10, color: '#778481' }}>
                      Click on any green available slot above to lock in your booking time.
                    </small>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {step === 3 && (
          <div className="fields">
            <Field label="Full name *" name="name" value={form.name} onChange={change} placeholder="e.g. David Tremaine" required />
            <Field label="Mobile phone *" name="phone" placeholder="04XX XXX XXX" value={form.phone} onChange={change} required />
            <Field label="Email address *" type="email" name="email" value={form.email} onChange={change} placeholder="david@example.com" required />
            <Field label="Suburb *" name="suburb" value={form.suburb} onChange={change} placeholder="e.g. Mosman, Surry Hills" required />
            <Select label="State *" name="state" value={form.state} onChange={change} options={states} />
            <Field label="Postcode *" name="postcode" value={form.postcode} onChange={change} placeholder="e.g. 2088" required />
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="panel" style={{ margin: 0, background: '#f2f5ef', border: '1px solid #d9e2da' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <b style={{ fontSize: 18 }}>{selectedService?.name}</b>
              <span style={{ fontWeight: 800, fontSize: 16 }}>From ${selectedService?.price} AUD</span>
            </div>
            <div style={{ lineHeight: 1.8, fontSize: 14 }}>
              <div><b>Vehicle:</b> {form.rego.toUpperCase()} ({form.vehicleState}) · {form.make} {form.model}</div>
              <div><b>Reserved Time Slot:</b> {form.date} at {slots.find((s) => s.time === form.time)?.label || form.time}</div>
              <div><b>Contact:</b> {form.name} · {normaliseAuMobile(form.phone)} · {form.email}</div>
              <div><b>Service Location:</b> {form.suburb}, {form.state} {form.postcode}</div>
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button
            className="button"
            type="button"
            style={{ background: '#e8ece7' }}
            onClick={() => {
              setError('');
              setStep((s) => Math.max(0, s - 1));
            }}
            disabled={step === 0 || submitting}
          >
            ← Back
          </button>

          {step < 4 ? (
            <button
              className="button dark"
              type="button"
              onClick={next}
              disabled={step === 2 && (!form.time || loadingSlots)}
            >
              Continue →
            </button>
          ) : (
            <button
              className="button dark"
              type="button"
              onClick={submit}
              disabled={submitting || !form.time}
            >
              {submitting ? 'Confirming booking…' : 'Confirm & lock in appointment →'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label>{label}</label>
      <input {...props} />
    </div>
  );
}

function Select({
  label,
  options,
  ...props
}: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="field">
      <label>{label}</label>
      <select {...props}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
