import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  Download,
  Filter,
  Users,
  Award,
  BookOpen,
  DollarSign,
  Building2,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

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
    format: 'csv'
  });
  const [exporting, setExporting] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [kpiRes, sectorRes, partnerRes, finRes] = await Promise.all([
        axios.get(`${API_BASE}/reports/executive-kpis`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/reports/sector-performance`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/reports/partner-analytics`, { headers: getHeaders() }),
        axios.get(`${API_BASE}/reports/financial-trends`, { headers: getHeaders() })
      ]);

      setKpis(kpiRes.data.data);
      setSectorData(sectorRes.data.data || []);
      setPartnerData(partnerRes.data.data || []);
      setFinancialData(finRes.data.data);
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
      const res = await axios.post(`${API_BASE}/reports/export`, exportConfig, { headers: getHeaders() });
      const exportData = res.data.data;
      
      // Auto download link
      const link = document.createElement('a');
      link.href = exportData.download_url;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ type: 'success', text: `Report '${exportData.filename}' generated & downloaded successfully!` });
      setExportModal(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to trigger report export' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Executive Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-900/40 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">Governance & Intelligence</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Executive MIS & Reporting Analytics</h1>
            <p className="text-slate-400 text-sm mt-0.5">Real-time Sector Skill Council Key Metrics, Partner Audits & Export Engine</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setExportModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium shadow-lg hover:shadow-emerald-500/20 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Async Export Report</span>
          </button>
          <button
            onClick={fetchReportData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            title="Refresh MIS Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Overview Grid */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Candidate Registry</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-white">{kpis.total_candidates}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{kpis.active_enrolments} Active</span> Enrolments
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Completion Rate</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400">{kpis.completion_rate_pct}%</p>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="text-white font-semibold">{kpis.completed_enrolments}</span> / {kpis.total_enrolments} Enrolments
            </p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Certified Credentials</span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-400">{kpis.total_certificates_issued}</p>
            <p className="text-xs text-slate-400">QR-Verified National Credentials</p>
          </div>

          <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-blue-400">₹{kpis.total_revenue_inr.toLocaleString()}</p>
            <p className="text-xs text-slate-400">
              <span className="text-emerald-400 font-semibold">{kpis.successful_transactions} Paid</span> Transactions
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Sector & Partner Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Performance */}
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Sector & QP Performance</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{sectorData.length} Sectors Active</span>
          </div>

          <div className="space-y-4 pt-2">
            {sectorData.map((sec) => (
              <div key={sec.sector_id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-xs font-bold bg-cyan-500/10 text-cyan-400 rounded-md uppercase">
                      {sec.code}
                    </span>
                    <span className="font-bold text-white text-sm">{sec.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{sec.completion_rate_pct}% Pass Rate</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(sec.completion_rate_pct || 0, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 pt-1">
                  <span>QPs: {sec.total_qps}</span>
                  <span>Enrolments: {sec.total_enrolments}</span>
                  <span>Certificates: {sec.total_certificates}</span>
                </div>
              </div>
            ))}

            {sectorData.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-sm">No sector performance data available.</div>
            )}
          </div>
        </div>

        {/* Partner & Training Center Network */}
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">Partner Network & Capacity</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{partnerData.length} Partners</span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Partner Entity</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Centres</th>
                  <th className="p-3">Candidates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {partnerData.map((pt) => (
                  <tr key={pt.organisation_id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-white">
                      <div>{pt.name}</div>
                      <span className="text-xs text-slate-400 font-mono">{pt.code}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs uppercase font-semibold">
                        {pt.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-cyan-400 font-semibold">{pt.training_centres_count}</td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{pt.candidates_enrolled}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {partnerData.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-sm">No partner analytics data recorded.</div>
            )}
          </div>
        </div>
      </div>

      {/* Financial & Revenue Breakdown */}
      {financialData && (
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Financial & GST Tax Invoicing Breakdown</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Invoices Issued</span>
              <p className="text-2xl font-extrabold text-white">{financialData.invoice_summary.total_invoices}</p>
              <p className="text-xs text-slate-400">Total B2C / B2B billing records</p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Total Tax (GST Collected)</span>
              <p className="text-2xl font-extrabold text-amber-400">₹{financialData.invoice_summary.total_tax_gst.toLocaleString()}</p>
              <p className="text-xs text-slate-400">18% GST Compliance ledger</p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 uppercase font-semibold">Settled Paid Value</span>
              <p className="text-2xl font-extrabold text-emerald-400">₹{financialData.invoice_summary.paid_invoices_value.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Reconciled bank settlement total</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Async Export Engine */}
      {exportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Asynchronous Report Export Engine</h3>
                <p className="text-xs text-slate-400">Generate governed CSV/XLSX downloads with audit log tracing</p>
              </div>
            </div>

            <form onSubmit={handleTriggerExport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Report Type</label>
                <select
                  value={exportConfig.report_type}
                  onChange={(e) => setExportConfig({ ...exportConfig, report_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="executive_kpis">Executive KPI Summary</option>
                  <option value="candidates_roster">Candidates Roster & Status</option>
                  <option value="partner_analytics">Partner Network & Centres</option>
                  <option value="sector_performance">Sector & QP Performance</option>
                  <option value="financial_trends">Financial Trends & Invoices</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Export File Format</label>
                <select
                  value={exportConfig.format}
                  onChange={(e) => setExportConfig({ ...exportConfig, format: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="csv">CSV (Comma-Separated Values)</option>
                  <option value="xlsx">XLSX (Microsoft Excel)</option>
                  <option value="pdf">PDF Report Summary Document</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExportModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={exporting}
                  className="flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  <span>{exporting ? 'Generating Report...' : 'Generate & Download'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
