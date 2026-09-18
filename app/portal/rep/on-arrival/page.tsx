'use client';

import { useState, useEffect } from 'react';
import { PortalShell } from '@/components/portal-shell';

interface ServiceOption {
  slug: string;
  name: string;
  price: number;
  isActive?: boolean;
}

export default function OnArrival() {
  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);
  const [form, setForm] = useState({
    rego: '',
    vehicleState: 'NSW',
    make: '',
    model: '',
    service: 'signature-detail',
    name: '',
    phone: '',
    email: '',
    suburb: '',
    state: 'NSW',
    postcode: ''
  });
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/services')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.services && Array.isArray(data.services)) {
          const active = data.services.filter((s: ServiceOption) => s.isActive !== false);
          setServicesList(active);
          if (active.length > 0 && !active.some((s: ServiceOption) => s.slug === form.service)) {
            setForm((f) => ({ ...f, service: active[0].slug }));
          }
        }
      })
      .catch(() => {});
  }, [form.service]);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/rep/on-arrival', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setReference(data.reference);
  };

  return (
    <PortalShell role="rep">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Walk-in workflow · Live DB Services</div>
          <h1>New on-arrival</h1>
          <p>Create this only when the customer is physically here. It is assigned to you immediately.</p>
        </div>
      </header>

      <form className="panel" onSubmit={submit} style={{ maxWidth: 780 }}>
        {reference ? (
          <div className="success">
            <div className="eyebrow">Arrival registered</div>
            <h1>You own this service.</h1>
            <p>
              Reference <b>{reference}</b>. Open Active service to capture before photos and begin.
            </p>
          </div>
        ) : (
          <>
            <div className="fields">
              <Field label="Customer name" name="name" value={form.name} onChange={change} />
              <Field label="Mobile" name="phone" value={form.phone} onChange={change} />
              <Field label="Email" name="email" type="email" value={form.email} onChange={change} />
              <Field label="Suburb" name="suburb" value={form.suburb} onChange={change} />
              <Select label="Customer state" name="state" value={form.state} onChange={change} />
              <Field label="Postcode" name="postcode" value={form.postcode} onChange={change} />
              <Field label="Registration" name="rego" value={form.rego} onChange={change} />
              <Select label="Issuing state" name="vehicleState" value={form.vehicleState} onChange={change} />
              <Field label="Make" name="make" value={form.make} onChange={change} />
              <Field label="Model" name="model" value={form.model} onChange={change} />
              <div className="field full">
                <label>Service (Active in Database)</label>
                <select name="service" value={form.service} onChange={change}>
                  {servicesList.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} · ${s.price} AUD
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && <p className="error">{error}</p>}
            <button className="button dark" style={{ marginTop: 24 }} disabled={busy}>
              {busy ? 'Saving…' : 'Register & take service →'}
            </button>
          </>
        )}
      </form>
    </PortalShell>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label>{label}</label>
      <input required {...props} />
    </div>
  );
}

function Select({ label, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="field">
      <label>{label}</label>
      <select {...props}>
        {['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}
