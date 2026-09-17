'use client';

import { useState, useEffect } from 'react';
import { PortalShell } from '@/components/portal-shell';

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setFullName(data.profile.full_name);
          setEmail(data.profile.email);
        }
      })
      .catch((err) => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsMsg(null);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update details');
      setDetailsMsg({ type: 'success', text: 'Profile details saved successfully!' });
      if (data.profile) {
        setProfile((prev) => (prev ? { ...prev, ...data.profile } : data.profile));
      }
    } catch (err: unknown) {
      setDetailsMsg({ type: 'error', text: err instanceof Error ? err.message : 'Update failed' });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully! Keep your new credentials safe.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordMsg({ type: 'error', text: err instanceof Error ? err.message : 'Password update failed' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Account & Security</div>
          <h1>Admin Profile & Settings</h1>
          <p>Update administrator credentials, name, email address, and security keys.</p>
        </div>
      </header>

      {loading ? (
        <section className="panel" style={{ padding: 40, textAlign: 'center', color: '#667376' }}>
          Loading profile telemetry…
        </section>
      ) : !profile ? (
        <section className="panel" style={{ padding: 40, textAlign: 'center', color: '#bd4939' }}>
          Unable to retrieve profile. Please ensure you are logged in.
        </section>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20 }}>
          {/* Card 1: Administrator Overview & General Info */}
          <section className="panel" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: 'var(--lime)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 800
                }}
              >
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>{profile.full_name}</h2>
                <div style={{ fontSize: 12, color: '#667376', marginTop: 2 }}>{profile.email}</div>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 800,
                    marginTop: 6
                  }}
                >
                  SYSTEM ADMINISTRATOR
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #edf1ed', paddingTop: 16, marginBottom: 20, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#778481' }}>Account ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{profile.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#778481' }}>Access Tier:</span>
                <b>Full Studio Superadmin</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#778481' }}>Member Since:</span>
                <span>{new Date(profile.created_at).toLocaleDateString('en-AU', { dateStyle: 'long' })}</span>
              </div>
            </div>

            {/* Edit Personal Details Form */}
            <h3 style={{ margin: '0 0 14px', fontSize: 15, borderTop: '1px solid #edf1ed', paddingTop: 16 }}>
              Update Personal Details
            </h3>

            {detailsMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 14,
                  background: detailsMsg.type === 'success' ? '#e8f5e9' : '#ffebee',
                  color: detailsMsg.type === 'success' ? '#2e7d32' : '#c62828'
                }}
              >
                {detailsMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateDetails}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div style={{ marginTop: 6 }}>
                  <button type="submit" className="button dark" disabled={savingDetails} style={{ padding: '8px 18px', fontSize: 13 }}>
                    {savingDetails ? 'Saving…' : 'Save Details'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Card 2: Security & Password Update */}
          <section className="panel" style={{ margin: 0 }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Security & Password</h2>
            <p style={{ color: '#667376', fontSize: 13, margin: '0 0 18px' }}>
              Ensure your studio administrator account uses a strong, complex passphrase.
            </p>

            {passwordMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 14,
                  background: passwordMsg.type === 'success' ? '#e8f5e9' : '#ffebee',
                  color: passwordMsg.type === 'success' ? '#2e7d32' : '#c62828'
                }}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password to verify"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
                  <button type="submit" className="button dark" disabled={savingPassword} style={{ padding: '8px 20px', fontSize: 13 }}>
                    {savingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </div>
            </form>

            <div style={{ marginTop: 24, padding: 14, background: '#f5f8f5', borderRadius: 10, fontSize: 12, color: '#556663', lineHeight: 1.5 }}>
              <b>💡 Security Tip:</b> Changing your password will update your credentials immediately. Your active session will be seamlessly refreshed.
            </div>
          </section>
        </div>
      )}
    </PortalShell>
  );
}
