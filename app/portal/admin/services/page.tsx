'use client';

import { useEffect, useState, useCallback } from 'react';
import { PortalShell } from '@/components/portal-shell';

interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  description_md: string;
  base_price: number | string;
  duration_minutes: number | string;
  category: string;
  is_active: number | boolean;
}

const emptyService: ServiceItem = {
  id: '',
  name: '',
  slug: '',
  description_md: '',
  base_price: 199,
  duration_minutes: 90,
  category: 'Detailing',
  is_active: 1
};

export default function AdminServices() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [editItem, setEditItem] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/services');
      if (!res.ok) throw new Error('Failed to load services');
      const data = await res.json();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editItem.name.trim() || !editItem.slug.trim()) {
      setError('Name and URL slug are required.');
      return;
    }
    const price = Number(editItem.base_price);
    if (isNaN(price) || price < 0) {
      setError('Please provide a valid price.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const isNew = !editItem.id;
      const method = isNew ? 'POST' : 'PATCH';
      const payload = {
        id: editItem.id,
        name: editItem.name.trim(),
        slug: editItem.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        category: editItem.category.trim() || 'General',
        price: Number(editItem.base_price),
        duration: Number(editItem.duration_minutes) || 60,
        description: editItem.description_md.trim(),
        active: Boolean(editItem.is_active)
      };

      const res = await fetch('/api/admin/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || 'Failed to save service');
      }

      setSuccess(isNew ? 'New service created successfully.' : 'Service updated successfully.');
      setEditItem(null);
      await loadServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Failed to delete service');
      setSuccess(`"${name}" was deleted successfully.`);
      await loadServices();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting service');
    }
  };

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Service Catalogue</div>
          <h1>Services & offers</h1>
          <p>Add new service packages, update pricing, edit descriptions, or remove services.</p>
        </div>
        <button
          className="button dark"
          onClick={() => {
            setError('');
            setSuccess('');
            setEditItem({ ...emptyService });
          }}
        >
          + Add new service
        </button>
      </header>

      {success && (
        <div style={{ padding: '12px 16px', background: '#d7ece8', color: '#1d6960', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
          ✓ {success}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fcebea', color: '#be4635', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 700 }}>
          ✕ {error}
        </div>
      )}

      {editItem && (
        <form onSubmit={handleSave} className="panel" style={{ marginBottom: 24, border: '2px solid #243c3d' }}>
          <h2>{editItem.id ? `Edit Service: ${editItem.name}` : 'Add New Service Package'}</h2>
          <div className="fields">
            <div className="field">
              <label>Service Name *</label>
              <input
                required
                value={editItem.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditItem({
                    ...editItem,
                    name: val,
                    slug: editItem.id ? editItem.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  });
                }}
                placeholder="e.g. Paint Correction & Sealant"
              />
            </div>

            <div className="field">
              <label>URL Slug *</label>
              <input
                required
                value={editItem.slug}
                onChange={(e) => setEditItem({ ...editItem, slug: e.target.value })}
                placeholder="e.g. paint-correction-sealant"
              />
            </div>

            <div className="field">
              <label>Category</label>
              <input
                value={editItem.category}
                onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                placeholder="e.g. Complete care, Finish work, Cabin care"
              />
            </div>

            <div className="field">
              <label>Base Price (AUD $) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={editItem.base_price}
                onChange={(e) => setEditItem({ ...editItem, base_price: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Estimated Duration (Minutes)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={editItem.duration_minutes}
                onChange={(e) => setEditItem({ ...editItem, duration_minutes: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Status</label>
              <select
                value={editItem.is_active ? '1' : '0'}
                onChange={(e) => setEditItem({ ...editItem, is_active: e.target.value === '1' ? 1 : 0 })}
              >
                <option value="1">Active / Published</option>
                <option value="0">Draft / Inactive</option>
              </select>
            </div>

            <div className="field full">
              <label>Description (Markdown supported)</label>
              <textarea
                value={editItem.description_md}
                onChange={(e) => setEditItem({ ...editItem, description_md: e.target.value })}
                placeholder="Detailed description of what is included in this service..."
                rows={3}
              />
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="submit" className="button dark" disabled={saving}>
              {saving ? 'Saving service…' : editItem.id ? 'Save changes' : 'Create service'}
            </button>
            <button
              type="button"
              className="button"
              style={{ background: '#e8ece7' }}
              onClick={() => {
                setEditItem(null);
                setError('');
              }}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="panel">
        <h2>Catalogue Services ({items.length})</h2>
        {loading ? (
          <p style={{ color: '#667376' }}>Loading services catalogue…</p>
        ) : items.length === 0 ? (
          <p style={{ color: '#667376' }}>No services found. Click "+ Add new service" above to create one.</p>
        ) : (
          <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="table" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Service Details</th>
                  <th>Category</th>
                  <th>Starting Price</th>
                  <th>Est. Duration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b style={{ fontSize: 14 }}>{s.name}</b>
                      <br />
                      <span style={{ color: '#778481', fontSize: 12 }}>slug: /{s.slug}</span>
                      {s.description_md && (
                        <p style={{ margin: '4px 0 0', color: '#667376', fontSize: 12, maxWidth: 360 }}>
                          {s.description_md}
                        </p>
                      )}
                    </td>
                    <td>
                      <span style={{ background: '#eef2ee', padding: '4px 8px', borderRadius: 6, fontSize: 12 }}>
                        {s.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <b>${Number(s.base_price).toFixed(2)}</b>
                    </td>
                    <td>{s.duration_minutes} mins</td>
                    <td>
                      <span className={`status ${s.is_active ? 'live' : ''}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="button"
                        onClick={() => {
                          setError('');
                          setSuccess('');
                          setEditItem({ ...s });
                        }}
                        style={{ padding: '6px 12px', fontSize: 12, marginRight: 6 }}
                      >
                        Edit
                      </button>
                      <button
                        className="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        style={{ padding: '6px 12px', fontSize: 12, background: '#fcdcd9', color: '#be4635' }}
                      >
                        Delete
                      </button>
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
