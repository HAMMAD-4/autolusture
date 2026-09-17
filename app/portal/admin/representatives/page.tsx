'use client';

import { useState, useEffect, useCallback } from 'react';
import { PortalShell } from '@/components/portal-shell';

interface RepAccount {
  id: string;
  full_name: string;
  email: string;
  is_active: number | boolean;
  created_at: string;
  total_assigned_jobs: number;
  completed_jobs: number;
  active_jobs: number;
}

export default function AdminRepresentativesPage() {
  const [reps, setReps] = useState<RepAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedRep, setSelectedRep] = useState<RepAccount | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadReps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reps');
      if (!res.ok) throw new Error('Failed to load representatives');
      const data = await res.json();
      setReps(data.representatives || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to load field representatives.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReps();
  }, [loadReps]);

  const openCreateModal = () => {
    setSelectedRep(null);
    setFormData({ full_name: '', email: '', password: '', is_active: true });
    setErrorMsg('');
    setSuccessMsg('');
    setModalMode('create');
  };

  const openEditModal = (rep: RepAccount) => {
    setSelectedRep(rep);
    setFormData({
      full_name: rep.full_name,
      email: rep.email,
      password: '',
      is_active: Boolean(rep.is_active)
    });
    setErrorMsg('');
    setSuccessMsg('');
    setModalMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/admin/reps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create representative');
        setSuccessMsg('Representative created successfully!');
      } else if (modalMode === 'edit' && selectedRep) {
        const payload: Record<string, unknown> = {
          id: selectedRep.id,
          full_name: formData.full_name,
          email: formData.email,
          is_active: formData.is_active
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        const res = await fetch('/api/admin/reps', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update representative');
        setSuccessMsg('Representative updated successfully!');
      }

      await loadReps();
      setTimeout(() => {
        setModalMode(null);
        setSuccessMsg('');
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rep: RepAccount) => {
    const confirmMsg = rep.total_assigned_jobs > 0
      ? `Representative "${rep.full_name}" has ${rep.total_assigned_jobs} linked job record(s). Deactivating will disable portal access while preserving job history. Proceed?`
      : `Are you sure you want to permanently delete representative "${rep.full_name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/reps', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rep.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete representative');
      await loadReps();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete representative');
    }
  };

  const filteredReps = reps.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Team & Field Operations</div>
          <h1>Representatives</h1>
          <p>Manage field detailing technician accounts, credentials, and live assignment status.</p>
        </div>
        <button className="button dark" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>+</span> Add Representative
        </button>
      </header>

      {/* KPI Stats Row */}
      <div className="kpis">
        <div className="kpi">
          <span>Total Technicians</span>
          <b>{reps.length} accounts</b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>
            {reps.filter((r) => Boolean(r.is_active)).length} active on roster
          </small>
        </div>
        <div className="kpi">
          <span>Active Detailing Bays</span>
          <b>{reps.reduce((acc, r) => acc + Number(r.active_jobs || 0), 0)} in progress</b>
          <small style={{ color: '#1d6960', fontWeight: 700, fontSize: 11 }}>Live bays active right now</small>
        </div>
        <div className="kpi">
          <span>Completed Detailing Jobs</span>
          <b>{reps.reduce((acc, r) => acc + Number(r.completed_jobs || 0), 0)} jobs</b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>Recorded in database</small>
        </div>
      </div>

      {/* Search & Representatives Table */}
      <section className="panel" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0 }}>Roster & Portal Accounts</h2>
            <span style={{ fontSize: 12, background: '#eef2ed', color: '#566662', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
              {filteredReps.length} of {reps.length}
            </span>
          </div>
          <div style={{ minWidth: 260 }}>
            <input
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>Loading representatives…</div>
        ) : filteredReps.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>
            {search ? 'No representatives match your search criteria.' : 'No representatives registered yet.'}
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="table" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Representative</th>
                  <th>Contact Email</th>
                  <th>Status</th>
                  <th>Active Jobs</th>
                  <th>Completed Jobs</th>
                  <th>Total Assigned</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReps.map((rep) => {
                  const isActive = Boolean(rep.is_active);
                  return (
                    <tr key={rep.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#243c3d',
                              color: '#c8f25d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 13
                            }}
                          >
                            {rep.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <b>{rep.full_name}</b>
                            <div style={{ fontSize: 11, color: '#778481' }}>ID: {rep.id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{rep.email}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isActive ? '#e8f5e9' : '#ffebee',
                            color: isActive ? '#2e7d32' : '#c62828'
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#2e7d32' : '#c62828' }} />
                          {isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td>
                        {Number(rep.active_jobs) > 0 ? (
                          <span style={{ fontWeight: 800, color: '#ed795e' }}>● {rep.active_jobs} live</span>
                        ) : (
                          <span style={{ color: '#889895' }}>0</span>
                        )}
                      </td>
                      <td>
                        <b>{rep.completed_jobs}</b>
                      </td>
                      <td>{rep.total_assigned_jobs}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="button"
                            onClick={() => openEditModal(rep)}
                            style={{ padding: '5px 10px', fontSize: 12 }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button"
                            onClick={() => handleDelete(rep)}
                            style={{
                              padding: '5px 10px',
                              fontSize: 12,
                              color: '#bd4939',
                              borderColor: 'rgba(189,73,57,0.3)'
                            }}
                          >
                            {isActive ? 'Deactivate' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Create or Edit Representative */}
      {modalMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(13, 21, 23, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            className="modal-card"
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#ffffff',
              borderRadius: 16,
              padding: '28px 32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              color: '#0d1517'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>
                {modalMode === 'create' ? 'Add New Representative' : `Edit Representative (${selectedRep?.full_name})`}
              </h2>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#667376' }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Kai Evans"
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rep@autolustre.local"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    {modalMode === 'create' ? 'Password *' : 'Reset Password (optional)'}
                  </label>
                  <input
                    type="password"
                    required={modalMode === 'create'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={modalMode === 'create' ? 'Minimum 6 characters' : 'Leave blank to keep existing password'}
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                  {modalMode === 'edit' && (
                    <small style={{ color: '#778481', fontSize: 11, marginTop: 2, display: 'block' }}>
                      Only enter a value if you wish to reset this representative’s login password.
                    </small>
                  )}
                </div>

                {modalMode === 'edit' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <input
                      type="checkbox"
                      id="rep_active_cb"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    <label htmlFor="rep_active_cb" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Account is active and permitted to login
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    className="button"
                    onClick={() => setModalMode(null)}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button dark"
                    disabled={saving}
                    style={{ padding: '8px 20px', fontSize: 13 }}
                  >
                    {saving ? 'Saving…' : modalMode === 'create' ? 'Create Representative' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
