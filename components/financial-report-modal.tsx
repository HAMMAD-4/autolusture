'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReportData {
  from: string;
  to: string;
  totalInflow: number;
  totalExpense: number;
  netCashflow: number;
  inflowsCount: number;
  expensesCount: number;
  inflows: Array<{
    id: string;
    reference_code: string;
    completed_at: string;
    bill_amount: number;
    payment_method?: string;
    customer_name: string;
    service_name: string;
  }>;
  expenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    notes?: string;
    vendor?: string;
  }>;
}

export function FinancialReportModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<'today' | '7d' | '30d' | 'all'>('30d');

  const fetchReport = useCallback(async (fromDate?: string, toDate?: string) => {
    try {
      setLoading(true);
      let url = '/api/admin/export?type=finance&format=json';
      if (fromDate) url += `&from=${fromDate}`;
      if (toDate) url += `&to=${toDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchReport(from, to);
    }
  }, [isOpen, from, to, fetchReport]);

  if (!isOpen) return null;

  const handlePreset = (preset: 'today' | '7d' | '30d' | 'all') => {
    setActivePreset(preset);
    const now = new Date();
    const nowStr = now.toISOString().slice(0, 10);

    if (preset === 'today') {
      setFrom(nowStr);
      setTo(nowStr);
    } else if (preset === '7d') {
      const d7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setFrom(d7);
      setTo(nowStr);
    } else if (preset === '30d') {
      const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setFrom(d30);
      setTo(nowStr);
    } else if (preset === 'all') {
      setFrom('');
      setTo('');
    }
  };

  const handleDownloadCsv = () => {
    let url = '/api/admin/export?type=finance';
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    window.location.href = url;
  };

  const handlePrint = () => {
    window.print();
  };

  const totalInflow = report?.totalInflow || 0;
  const totalExpense = report?.totalExpense || 0;
  const netProfit = report?.netCashflow || 0;
  const marginPct = totalInflow > 0 ? ((netProfit / totalInflow) * 100).toFixed(1) : '0.0';

  return (
    <div
      className="receipt-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 21, 23, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        overflowY: 'auto'
      }}
    >
      <div
        id="tax-receipt-printable"
        className="financial-report-modal-card"
      >
        {/* Top Header & Range Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0d1517', paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              auto<i style={{ fontFamily: 'Playfair Display, serif' }}>lustre</i>
            </div>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 0' }}>Financial Performance & Cashflow Statement</h1>
            <div style={{ fontSize: 12, color: '#667376', marginTop: 2 }}>
              AutoLustre Detailing Pty Ltd · ABN 48 612 345 678
            </div>
          </div>

          <div style={{ textAlign: 'right' }} className="no-print">
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#667376' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Date Presets & Custom Selectors */}
        <div className="financial-report-controls no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #e7ebe7', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['today', '7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePreset(p)}
                style={{
                  border: '1px solid #dcdfdc',
                  background: activePreset === p ? '#0d1517' : '#ffffff',
                  color: activePreset === p ? '#ffffff' : '#0d1517',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {p === 'today' ? 'Today' : p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="financial-date-picker" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 700 }}>From:</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setActivePreset('all');
              }}
              style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #dcdfdc' }}
            />
            <label style={{ fontWeight: 700 }}>To:</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setActivePreset('all');
              }}
              style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #dcdfdc' }}
            />
          </div>
        </div>

        {/* Financial Summary KPIs */}
        <div className="financial-report-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 0', borderBottom: '1px solid #e7ebe7' }}>
          <div style={{ background: '#f5faf5', padding: '12px 14px', borderRadius: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#2e7d32' }}>
              Cash Inflow (Settled)
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20', marginTop: 4 }}>
              ${totalInflow.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <small style={{ color: '#556663', fontSize: 11 }}>{report?.inflowsCount || 0} completed jobs</small>
          </div>

          <div style={{ background: '#fff7f5', padding: '12px 14px', borderRadius: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#c62828' }}>
              Total Expenses
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#b71c1c', marginTop: 4 }}>
              ${totalExpense.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <small style={{ color: '#556663', fontSize: 11 }}>{report?.expensesCount || 0} expenses recorded</small>
          </div>

          <div style={{ background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2', padding: '12px 14px', borderRadius: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: netProfit >= 0 ? '#15803d' : '#b91c1c' }}>
              Net Cashflow
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: netProfit >= 0 ? '#15803d' : '#b91c1c', marginTop: 4 }}>
              ${netProfit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <small style={{ color: '#556663', fontSize: 11 }}>Margin: {marginPct}%</small>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#475569' }}>
              Average Ticket
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              ${report && report.inflowsCount > 0 ? (totalInflow / report.inflowsCount).toFixed(2) : '0.00'}
            </div>
            <small style={{ color: '#556663', fontSize: 11 }}>AUD per completed booking</small>
          </div>
        </div>

        {/* Breakdown Tables */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#667376' }}>Calculating financial telemetry…</div>
        ) : (
          <div style={{ padding: '16px 0' }}>
            {/* Cash Inflows List */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: '#556663', marginBottom: 8 }}>
                Settled Cash Inflows ({report?.inflows.length || 0})
              </h3>
              {(!report?.inflows || report.inflows.length === 0) ? (
                <div style={{ fontSize: 12, color: '#889895', fontStyle: 'italic' }}>No completed jobs recorded in this period.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e7ebe7', color: '#7a8582', textAlign: 'left' }}>
                      <th style={{ padding: '6px 0' }}>Date</th>
                      <th style={{ padding: '6px 0' }}>Ref</th>
                      <th style={{ padding: '6px 0' }}>Customer</th>
                      <th style={{ padding: '6px 0' }}>Service</th>
                      <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount (AUD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.inflows.map((inf) => (
                      <tr key={inf.id} style={{ borderBottom: '1px solid #f2f5f2' }}>
                        <td style={{ padding: '6px 0', color: '#667376' }}>
                          {inf.completed_at ? new Date(inf.completed_at).toLocaleDateString('en-AU') : '-'}
                        </td>
                        <td style={{ padding: '6px 0', fontFamily: 'monospace', fontWeight: 700 }}>{inf.reference_code}</td>
                        <td style={{ padding: '6px 0' }}>{inf.customer_name}</td>
                        <td style={{ padding: '6px 0', color: '#556663' }}>{inf.service_name}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#2e7d32' }}>
                          +${Number(inf.bill_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Expenses List */}
            <div>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, color: '#556663', marginBottom: 8 }}>
                Operating Expenses ({report?.expenses.length || 0})
              </h3>
              {(!report?.expenses || report.expenses.length === 0) ? (
                <div style={{ fontSize: 12, color: '#889895', fontStyle: 'italic' }}>No expenses recorded in this period.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e7ebe7', color: '#7a8582', textAlign: 'left' }}>
                      <th style={{ padding: '6px 0' }}>Date</th>
                      <th style={{ padding: '6px 0' }}>Expense Item</th>
                      <th style={{ padding: '6px 0' }}>Category</th>
                      <th style={{ padding: '6px 0' }}>Vendor</th>
                      <th style={{ padding: '6px 0', textAlign: 'right' }}>Amount (AUD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.expenses.map((exp) => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid #f2f5f2' }}>
                        <td style={{ padding: '6px 0', color: '#667376' }}>
                          {new Date(exp.expense_date).toLocaleDateString('en-AU')}
                        </td>
                        <td style={{ padding: '6px 0', fontWeight: 600 }}>{exp.title}</td>
                        <td style={{ padding: '6px 0', color: '#556663' }}>{exp.category}</td>
                        <td style={{ padding: '6px 0', color: '#778481' }}>{exp.vendor || '-'}</td>
                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700, color: '#c62828' }}>
                          -${Number(exp.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="financial-report-actions no-print" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e7ebe7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="button"
            onClick={handleDownloadCsv}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 14px' }}
          >
            <span>↓</span> Export Range Ledger (CSV)
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="button dark"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '8px 16px' }}
            >
              <span>🖨</span> Print / PDF Report
            </button>
            <button
              type="button"
              className="button"
              onClick={onClose}
              style={{ fontSize: 12, padding: '8px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
