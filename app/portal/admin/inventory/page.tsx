'use client';

import { useState, useEffect, useCallback } from 'react';
import { PortalShell } from '@/components/portal-shell';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  on_hand: number;
  min_stock: number;
  unit: string;
  category: string;
  updated_at: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    on_hand: 10,
    min_stock: 5,
    unit: 'units',
    category: 'Supplies'
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/inventory');
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load inventory supplies from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleQuickAdjust = async (id: string, delta: number) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.on_hand + delta);
          return { ...item, on_hand: newQty };
        }
        return item;
      })
    );

    setAdjustingId(id);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, delta })
      });
      if (!res.ok) {
        throw new Error('Quick adjust failed');
      }
      const data = await res.json();
      if (data.item) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? data.item : item))
        );
      }
    } catch (err) {
      console.error('Failed to sync stock change:', err);
      // Rollback on failure
      loadInventory();
    } finally {
      setAdjustingId(null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add item');

      await loadInventory();
      setModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        on_hand: 10,
        min_stock: 5,
        unit: 'units',
        category: 'Supplies'
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from inventory?`)) return;

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
      if (!res.ok) throw new Error('Failed to delete item');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      console.error(err);
      alert('Could not delete inventory item.');
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = items.filter((i) => Number(i.on_hand) <= Number(i.min_stock)).length;
  const totalStockUnits = items.reduce((sum, i) => sum + Number(i.on_hand || 0), 0);

  return (
    <PortalShell role="admin">
      <header className="portal-title">
        <div>
          <div className="eyebrow">Studio Supplies & Chemicals</div>
          <h1>Inventory</h1>
          <p>Real-time stock tracking, minimum thresholds, and instant quick adjustments.</p>
        </div>
        <button
          className="button dark"
          onClick={() => setModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>+</span> Add item
        </button>
      </header>

      {/* KPI Row */}
      <div className="kpis">
        <div className="kpi">
          <span>Tracked SKU Catalog</span>
          <b>{items.length} product lines</b>
          <small style={{ color: '#1d6960', fontWeight: 700, fontSize: 11 }}>
            Across studio detailing chemicals & cloths
          </small>
        </div>
        <div className="kpi">
          <span>Total Units on Hand</span>
          <b>{totalStockUnits} units</b>
          <small style={{ color: '#2e7d32', fontWeight: 700, fontSize: 11 }}>
            Available in bays & supply shelves
          </small>
        </div>
        <div className="kpi">
          <span>Low Stock Alerts</span>
          <b style={{ color: lowStockCount > 0 ? '#bd4939' : '#2e7d32' }}>
            {lowStockCount} items low
          </b>
          <small style={{ color: lowStockCount > 0 ? '#bd4939' : '#2e7d32', fontWeight: 700, fontSize: 11 }}>
            {lowStockCount > 0 ? '⚠ Reordering recommended' : '✓ All levels above minimum'}
          </small>
        </div>
      </div>

      {/* Main Inventory Panel */}
      <section className="panel" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0 }}>Stock On Hand</h2>
            <span style={{ fontSize: 12, background: '#eef2ed', color: '#566662', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
              {filteredItems.length} items
            </span>
          </div>
          <div style={{ minWidth: 260 }}>
            <input
              type="search"
              placeholder="Search by item, SKU, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', fontSize: 13 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>
            Loading live inventory levels…
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>
            {search ? 'No inventory supplies match your search.' : 'No inventory items in database yet.'}
          </div>
        ) : (
          <div className="table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table className="table" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>On Hand</th>
                  <th>Minimum</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Quick adjust</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow = Number(item.on_hand) <= Number(item.min_stock);
                  const isOut = Number(item.on_hand) === 0;
                  const isPending = adjustingId === item.id;

                  return (
                    <tr key={item.id} style={{ background: isOut ? '#fff5f5' : isLow ? '#fffdf7' : 'inherit' }}>
                      <td>
                        <b>{item.name}</b>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#556663', background: '#eef1ee', padding: '2px 6px', borderRadius: 4 }}>
                          {item.sku}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#667376' }}>{item.category}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <b
                          style={{
                            fontSize: 16,
                            color: isOut ? '#bd4939' : isLow ? '#d97706' : '#0d1517'
                          }}
                        >
                          {item.on_hand}
                        </b>{' '}
                        <small style={{ color: '#778481', fontSize: 11 }}>{item.unit}</small>
                      </td>
                      <td>
                        <span style={{ color: '#667376' }}>{item.min_stock} {item.unit}</span>
                      </td>
                      <td>
                        {isOut ? (
                          <span style={{ background: '#ffebee', color: '#c62828', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                            OUT OF STOCK
                          </span>
                        ) : isLow ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                            LOW STOCK
                          </span>
                        ) : (
                          <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>
                            OPTIMAL
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {/* Decrement Button */}
                          <button
                            type="button"
                            className="button"
                            disabled={item.on_hand <= 0 || isPending}
                            onClick={() => handleQuickAdjust(item.id, -1)}
                            style={{
                              width: 32,
                              height: 32,
                              padding: 0,
                              fontSize: 16,
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6,
                              opacity: item.on_hand <= 0 ? 0.4 : 1
                            }}
                            title="Decrease by 1"
                          >
                            −
                          </button>

                          {/* Increment Button */}
                          <button
                            type="button"
                            className="button"
                            disabled={isPending}
                            onClick={() => handleQuickAdjust(item.id, 1)}
                            style={{
                              width: 32,
                              height: 32,
                              padding: 0,
                              fontSize: 16,
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 6
                            }}
                            title="Increase by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#bd4939',
                            fontSize: 12,
                            cursor: 'pointer',
                            padding: '4px 8px'
                          }}
                          title="Delete item"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Add New Inventory Item */}
      {modalOpen && (
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
              maxWidth: 460,
              background: '#ffffff',
              borderRadius: 16,
              padding: '28px 32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              color: '#0d1517'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Add Inventory Item</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
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

            <form onSubmit={handleAddItem}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Iron & Fallout Decontaminant 5L"
                    style={{ width: '100%', padding: '9px 12px' }}
                  />
                </div>

                <div className="form-row-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                      placeholder="e.g. AUTO-505"
                      style={{ width: '100%', padding: '9px 12px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Chemicals / Cloths"
                      style={{ width: '100%', padding: '9px 12px' }}
                    />
                  </div>
                </div>

                <div className="form-row-3col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      On Hand *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.on_hand}
                      onChange={(e) => setFormData({ ...formData, on_hand: Number(e.target.value) })}
                      style={{ width: '100%', padding: '9px 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Min Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.min_stock}
                      onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                      style={{ width: '100%', padding: '9px 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                      Unit Label
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="bottles / kits"
                      style={{ width: '100%', padding: '9px 12px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                  <button
                    type="button"
                    className="button"
                    onClick={() => setModalOpen(false)}
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
                    {saving ? 'Adding…' : 'Add Item to Inventory'}
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
