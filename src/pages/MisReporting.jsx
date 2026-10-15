import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  Award,
  BookOpen,
  DollarSign,
  Building2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiClient from '../api/client';

export default function MisReporting() {
  const [kpis, setKpis] = useState(null);
  const [sectorData, setSectorData] = useState([]);
  const [partnerData, setPartnerData] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Export State
  const [exportModal, setExportModal] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    report_type: 'executive_kpis',
    format: 'csv',
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [kpiRes, sectorRes, partnerRes, finRes] = await Promise.allSettled([
        apiClient.get('/reports/executive-kpis'),
        apiClient.get('/reports/sector-performance'),
        apiClient.get('/reports/partner-analytics'),
        apiClient.get('/reports/financial-trends'),
      ]);

      if (kpiRes.status === 'fulfilled') setKpis(kpiRes.value.data?.data || null);
      if (sectorRes.status === 'fulfilled') setSectorData(sectorRes.value.data?.data || []);
      if (partnerRes.status === 'fulfilled') setPartnerData(partnerRes.value.data?.data || []);
      if (finRes.status === 'fulfilled') setFinancialData(finRes.value.data?.data || null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch MIS report analytics' });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerExport = async (e) => {
    e.preventDefault();
    setExporting(true);
    try {
      const res = await apiClient.post('/reports/export', exportConfig);
      const exportData = res.data?.data;

      if (exportData?.download_url) {
        const link = document.createElement('a');
        link.href = exportData.download_url;
        link.download = exportData.filename || 'report.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setMessage({
        type: 'success',
        text: `Report '${exportData?.filename || 'report'}' generated and downloaded successfully!`,
      });
      setExportModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to trigger report export' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Executive Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #102a35, #193b46)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            <Sparkles size={16} />
            Governance Intelligence & Audits
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: '#ffffff',
            }}
          >
            Executive MIS & Reporting Analytics
          </h1>

          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Real-time Sector Skill Council metrics, partner accreditation analytics, financial trends, and asynchronous export engine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setExportModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 0,
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            <Download size={16} />
            Export Report
          </button>

          <button
            onClick={fetchReportData}
            title="Refresh Data"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              background: '#ffffff15',
              color: '#ffffff',
              border: '1px solid #ffffff25',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* Message Banner */}
      {message && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      {kpis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Candidate Registry</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#e0f2fe', display: 'grid', placeItems: 'center', color: '#0284c7' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>
              {kpis.total_candidates || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <strong style={{ color: '#16a34a' }}>{kpis.active_enrolments || 0}</strong> Active Enrolments
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Completion Rate</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#dcfce7', display: 'grid', placeItems: 'center', color: '#16a34a' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginBottom: '0.25rem' }}>
              {kpis.completion_rate_pct || 0}%
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <strong>{kpis.completed_enrolments || 0}</strong> of {kpis.total_enrolments || 0} Enrolments
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Certified Credentials</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#b45309' }}>
                <Award size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309', marginBottom: '0.25rem' }}>
              {kpis.total_certificates_issued || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              QR-Verified National Credentials
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Commercial Revenue</span>
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f3e8ff', display: 'grid', placeItems: 'center', color: '#7e22ce' }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.25rem' }}>
              ₹{(kpis.total_revenue_inr || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <strong style={{ color: '#16a34a' }}>{kpis.successful_transactions || 0}</strong> Settled Transactions
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sector & Partner Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Sector Performance Card */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="#0284c7" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                Sector & Qualification Packs
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
              {sectorData.length} Active Sectors
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sectorData.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                No sector performance records available.
              </div>
            ) : (
              sectorData.map((sec) => (
                <div key={sec.sector_id || sec.code} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {sec.code}
                      </span>
                      <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{sec.name}</strong>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>
                      {sec.completion_rate_pct || 0}% Completion
                    </span>
                  </div>

                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '999px',
                        background: 'linear-gradient(90deg, #0284c7, #16a34a)',
                        width: `${Math.min(sec.completion_rate_pct || 0, 100)}%`,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                    <span>QPs: {sec.total_qps || 0}</span>
                    <span>Enrolments: {sec.total_enrolments || 0}</span>
                    <span>Certificates: {sec.total_certificates || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Partner Network Card */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={20} color="#2563eb" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                Partner Network & Centres
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
              {partnerData.length} Organisations
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Partner Entity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Centres</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Candidates</th>
                </tr>
              </thead>
              <tbody>
                {partnerData.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                      No partner analytics available yet.
                    </td>
                  </tr>
                ) : (
                  partnerData.map((p) => (
                    <tr key={p.organisation_id || p.legal_name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        {p.legal_name || p.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {p.type || 'TP'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                        {p.training_centres_count || 0}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#2563eb' }}>
                        {p.total_candidates_enrolled ?? p.candidates_enrolled ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {exportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                Export MIS Report
              </h3>
              <button
                onClick={() => setExportModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTriggerExport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Report Target *
                </label>
                <select
                  value={exportConfig.report_type}
                  onChange={(e) => setExportConfig({ ...exportConfig, report_type: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="executive_kpis">Executive Key Performance Indicators</option>
                  <option value="sector_performance">Sector & QP Performance Metrics</option>
                  <option value="partner_analytics">Partner Accreditation & Delivery Capacity</option>
                  <option value="financial_trends">Commercial Transactions & Billing Ledger</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Output Format *
                </label>
                <select
                  value={exportConfig.format}
                  onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="csv">Standard CSV Document</option>
                  <option value="json">Machine-Readable JSON</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setExportModal(false)}
                  style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exporting}
                  style={{ padding: '0.65rem 1.25rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: exporting ? 'not-allowed' : 'pointer', opacity: exporting ? 0.7 : 1 }}
                >
                  {exporting ? 'Generating...' : 'Download Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
