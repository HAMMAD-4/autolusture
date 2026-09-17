'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@autolustre.local');
  const [password, setPassword] = useState('Admin!2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, next: '/portal/admin' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      router.push('/portal/admin');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="booking-shell" style={{ maxWidth: 520, margin: '60px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Link className="brand" href="/" style={{ fontSize: 28 }}>
          auto<i>lustre</i>
        </Link>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="eyebrow" style={{ color: '#102021' }}>Administrative Access</div>
        <h1 style={{ fontSize: 32, margin: '8px 0' }}>Admin Portal Login</h1>
        <p style={{ color: '#667376', fontSize: 13, marginBottom: 24 }}>
          Access studio operations, bookings export, service catalogue, and financial analytics.
        </p>

        <div className="fields">
          <div className="field full">
            <label>Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="field full">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}

        <button
          className="button dark"
          type="submit"
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: '15px' }}
        >
          {loading ? 'Signing into Admin Portal…' : 'Sign in to Admin Portal →'}
        </button>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: '#778481' }}>
          Need field representative access? <Link href="/rep" style={{ fontWeight: 700, color: 'var(--ink)' }}>Rep Login Portal</Link>
        </div>
      </form>
    </main>
  );
}
