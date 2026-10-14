import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Cpu,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Integrations() {
  const [activeTab, setActiveTab] = useState('configs');
  const [configs, setConfigs] = useState([]);
  const [events, setEvents] = useState([]);
  const [dlqEvents, setDlqEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [newConfig, setNewConfig] = useState({
    code: '',
    provider_type: 'digilocker',
    base_url: 'https://api.digilocker.gov.in/v1',
    auth_type: 'oauth2'
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'configs') {
        const res = await axios.get(`${API_BASE}/integrations/configs`, { headers: getHeaders() });
        setConfigs(res.data.data || []);
      } else if (activeTab === 'events') {
        const res = await axios.get(`${API_BASE}/integrations/events`, { headers: getHeaders() });
        setEvents(res.data.data?.data || res.data.data || []);
      } else if (activeTab === 'dlq') {
        const res = await axios.get(`${API_BASE}/integrations/dlq`, { headers: getHeaders() });
        setDlqEvents(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load integration data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/integrations/configs`, newConfig, { headers: getHeaders() });
      setMessage({ type: 'success', text: 'Integration config registered successfully!' });
      setShowConfigModal(false);
      setNewConfig({ code: '', provider_type: 'digilocker', base_url: 'https://api.digilocker.gov.in/v1', auth_type: 'oauth2' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create config' });
    }
  };

  const handleRetryDlq = async (eventId) => {
    try {
      const res = await axios.post(`${API_BASE}/integrations/dlq/${eventId}/retry`, {}, { headers: getHeaders() });
      setMessage({ type: 'success', text: res.data.message || 'Event re-processed successfully!' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to retry event' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">External Integration Mesh</h1>
            <p className="text-slate-400 text-sm">DigiLocker, Aadhaar KYC, Payment Gateways & Dead-Letter Queue Monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-cyan-500/25 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Integration Adapter</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            title="Refresh"
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

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Active Adapters</p>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1">{configs.length}</p>
          </div>
          <Server className="w-8 h-8 text-cyan-500/30" />
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Total Integration Events</p>
            <p className="text-2xl font-extrabold text-blue-400 mt-1">{events.length}</p>
          </div>
          <Activity className="w-8 h-8 text-blue-500/30" />
        </div>
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Dead-Letter Queue (DLQ)</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{dlqEvents.length}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-500/30" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('configs')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === 'configs'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Configured Adapters</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === 'events'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log Events</span>
        </button>
        <button
          onClick={() => setActiveTab('dlq')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === 'dlq'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Dead-Letter Queue ({dlqEvents.length})</span>
        </button>
      </div>

      {/* Tab 1: Configs */}
      {activeTab === 'configs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((cfg) => (
            <div
              key={cfg.id}
              className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500/10 text-cyan-400 uppercase tracking-wide border border-cyan-500/20">
                    {cfg.provider_type}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-semibold rounded-md ${
                      cfg.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{cfg.status}</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{cfg.code}</h3>
                <p className="text-xs text-slate-400 font-mono mt-1 truncate" title={cfg.base_url}>
                  {cfg.base_url}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Auth Mechanism</span>
                  <span className="text-slate-300 font-medium uppercase">{cfg.auth_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Secret Reference</span>
                  <span className="text-slate-300 font-mono truncate block" title={cfg.secret_ref}>
                    {cfg.secret_ref}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {configs.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No integration adapters configured yet. Click "Add Integration Adapter" to configure one.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Integration Events */}
      {activeTab === 'events' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Correlation ID</th>
                  <th className="p-4">Adapter / Action</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Attempts</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-mono text-xs text-cyan-400 font-semibold">{evt.correlation_id}</td>
                    <td className="p-4 font-medium text-white">{evt.action_name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          evt.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : evt.status === 'dead_letter' || evt.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {evt.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {evt.status !== 'success' && <XCircle className="w-3.5 h-3.5" />}
                        <span>{evt.status}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-300">{evt.attempt_count}</td>
                    <td className="p-4 text-xs text-slate-400">{evt.duration_ms ? `${evt.duration_ms} ms` : 'N/A'}</td>
                    <td className="p-4 text-xs text-slate-400">{new Date(evt.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Dead Letter Queue */}
      {activeTab === 'dlq' && (
        <div className="space-y-4">
          {dlqEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-slate-900/60 p-5 rounded-2xl border border-rose-900/30 shadow-xl space-y-4 hover:border-rose-700/50 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{evt.action_name}</h4>
                    <p className="text-xs text-slate-400 font-mono">Correlation: {evt.correlation_id}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-mono">
                    Attempts: {evt.attempt_count}
                  </span>
                  <button
                    onClick={() => handleRetryDlq(evt.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-medium shadow-md text-xs transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-process & Retry</span>
                  </button>
                </div>
              </div>

              {evt.error_message && (
                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/40 text-xs text-rose-300 font-mono">
                  <span className="font-bold uppercase text-rose-400 block mb-1">Error [{evt.error_code || 'UNKNOWN'}]:</span>
                  {evt.error_message}
                </div>
              )}
            </div>
          ))}

          {dlqEvents.length === 0 && !loading && (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
              <p className="font-semibold text-white">Dead-Letter Queue is empty</p>
              <p className="text-xs text-slate-500 mt-1">All integration events processed successfully or retried.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: New Config */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Register Integration Adapter</h3>
            <form onSubmit={handleCreateConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Adapter Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIGILOCKER_SANDBOX"
                  value={newConfig.code}
                  onChange={(e) => setNewConfig({ ...newConfig, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Provider Type</label>
                <select
                  value={newConfig.provider_type}
                  onChange={(e) => setNewConfig({ ...newConfig, provider_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="digilocker">DigiLocker</option>
                  <option value="aadhaar_kyc">Aadhaar KYC</option>
                  <option value="sms_gateway">SMS Gateway</option>
                  <option value="payment_gateway">Payment Gateway</option>
                  <option value="government_portal">Government Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Base Endpoint URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://api.gateway.org/v1"
                  value={newConfig.base_url}
                  onChange={(e) => setNewConfig({ ...newConfig, base_url: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Authentication Type</label>
                <select
                  value={newConfig.auth_type}
                  onChange={(e) => setNewConfig({ ...newConfig, auth_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="api_key">API Key</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-cyan-600/20"
                >
                  Register Adapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
