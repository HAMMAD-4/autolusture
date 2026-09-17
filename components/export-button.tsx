'use client';

import { useState, useRef, useEffect } from 'react';

export function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type: 'bookings' | 'finance') => {
    try {
      setLoading(true);
      setDropdownOpen(false);
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `autolustre-${type === 'finance' ? 'finance-ledger' : 'bookings'}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err: unknown) {
      console.error('Export CSV failed:', err);
      alert(err instanceof Error ? err.message : 'Unable to export CSV. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="button dark"
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Exporting…
          </>
        ) : (
          <>
            <span>Export CSV</span>
            <span style={{ fontSize: 10 }}>▼</span>
          </>
        )}
      </button>

      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 6,
            background: '#ffffff',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1px solid #e7ebe7',
            zIndex: 1000,
            width: 220,
            overflow: 'hidden',
            padding: 4
          }}
        >
          <button
            type="button"
            onClick={() => handleExport('finance')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '9px 12px',
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              fontWeight: 700,
              color: '#0d1517',
              cursor: 'pointer',
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f6f3')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>💰 Financial Ledger CSV</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#778481' }}>
              Cash Inflows & Operating Expenses
            </span>
          </button>

          <div style={{ height: 1, background: '#edf1ed', margin: '4px 0' }} />

          <button
            type="button"
            onClick={() => handleExport('bookings')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '9px 12px',
              border: 'none',
              background: 'transparent',
              fontSize: 12,
              fontWeight: 700,
              color: '#0d1517',
              cursor: 'pointer',
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f6f3')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span>📅 Customer Bookings CSV</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#778481' }}>
              All appointments, vehicles & details
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
