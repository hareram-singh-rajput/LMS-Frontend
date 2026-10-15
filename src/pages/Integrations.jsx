import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Server,
  Activity,
  Layers,
  RotateCcw
} from 'lucide-react';
import apiClient from '../api/client';

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
    auth_type: 'oauth2',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'configs') {
        const res = await apiClient.get('/integrations/configs');
        setConfigs(res.data?.data || []);
      } else if (activeTab === 'events') {
        const res = await apiClient.get('/integrations/events');
        setEvents(res.data?.data?.data || res.data?.data || []);
      } else if (activeTab === 'dlq') {
        // Backend endpoint is /integrations/dead-letter
        const res = await apiClient.get('/integrations/dead-letter');
        setDlqEvents(res.data?.data || []);
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
      await apiClient.post('/integrations/configs', newConfig);
      setMessage({ type: 'success', text: 'Integration adapter registered successfully!' });
      setShowConfigModal(false);
      setNewConfig({
        code: '',
        provider_type: 'digilocker',
        base_url: 'https://api.digilocker.gov.in/v1',
        auth_type: 'oauth2',
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create adapter config' });
    }
  };

  const handleRetryDlq = async (eventId) => {
    try {
      // Backend endpoint is /integrations/events/{id}/retry
      const res = await apiClient.post(`/integrations/events/${eventId}/retry`);
      setMessage({ type: 'success', text: res.data?.message || 'Event re-processed successfully!' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to retry event' });
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
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
            <Cpu size={16} />
            External Integration Mesh & Gateways
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: '#ffffff',
            }}
          >
            External Integrations & Dead-Letter Queue
          </h1>

          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem', lineHeight: 1.6 }}>
            DigiLocker credential issuers, Aadhaar identity verification, payment gateways, and resilient dead-letter event monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowConfigModal(true)}
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
            <Plus size={16} />
            Add Integration Adapter
          </button>

          <button
            onClick={fetchData}
            title="Refresh"
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
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
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

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Active Adapters</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>{configs.length}</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>External Connectors</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e0f2fe', display: 'grid', placeItems: 'center', color: '#0284c7' }}>
            <Server size={22} />
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Integration Events</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2563eb', margin: '0.25rem 0' }}>{events.length}</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Outbound / Inbound Logs</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', display: 'grid', placeItems: 'center', color: '#2563eb' }}>
            <Activity size={22} />
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Dead-Letter Queue (DLQ)</span>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: dlqEvents.length > 0 ? '#b91c1c' : '#16a34a', margin: '0.25rem 0' }}>
              {dlqEvents.length}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Failed Exhausted Events</span>
          </div>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: dlqEvents.length > 0 ? '#fee2e2' : '#dcfce7', display: 'grid', placeItems: 'center', color: dlqEvents.length > 0 ? '#b91c1c' : '#16a34a' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('configs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'configs' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'configs' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          <Layers size={18} />
          Configured Adapters ({configs.length})
        </button>

        <button
          onClick={() => setActiveTab('events')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'events' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'events' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          <Activity size={18} />
          Event Stream ({events.length})
        </button>

        <button
          onClick={() => setActiveTab('dlq')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dlq' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'dlq' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          <AlertTriangle size={18} />
          Dead-Letter Queue ({dlqEvents.length})
        </button>
      </div>

      {/* TAB 1: Configured Adapters */}
      {activeTab === 'configs' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Adapter Code</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Provider Type</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Base Endpoint URL</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Auth Protocol</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No integration adapters configured. Click &quot;Add Integration Adapter&quot; to register one.
                    </td>
                  </tr>
                ) : (
                  configs.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {c.code}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {c.provider_type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                        {c.base_url}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#475569', fontWeight: 600 }}>
                        {c.auth_type?.toUpperCase() || 'OAUTH2'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <span style={{ padding: '3px 8px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {c.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Event Stream */}
      {activeTab === 'events' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Event ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Adapter</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Direction</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Endpoint / Status Code</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No integration event records captured yet.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {ev.id ? `${ev.id.slice(0, 8)}...` : 'EVENT'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>
                        {ev.config?.code || 'ADAPTER'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ padding: '3px 8px', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          {ev.direction || 'OUTBOUND'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                        {ev.endpoint || '/v1/event'} ({ev.response_status_code || 200})
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                        {new Date(ev.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: ev.status === 'success' ? '#dcfce7' : '#fee2e2',
                            color: ev.status === 'success' ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {ev.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Dead-Letter Queue */}
      {activeTab === 'dlq' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>DLQ Event ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Adapter</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Retry Count</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Error Reason</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Exhausted At</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {dlqEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#16a34a' }}>
                      ✓ Dead-Letter Queue is empty. No failed integration deliveries!
                    </td>
                  </tr>
                ) : (
                  dlqEvents.map((dlq) => (
                    <tr key={dlq.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#b91c1c' }}>
                        {dlq.id ? `${dlq.id.slice(0, 8)}...` : 'DLQ'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>
                        {dlq.config?.code || 'ADAPTER'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#b45309' }}>
                        {dlq.retry_count || 3} attempts
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#b91c1c', maxWidth: '300px' }}>
                        {dlq.error_message || 'HTTP timeout / external gateway 503'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                        {new Date(dlq.updated_at || dlq.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRetryDlq(dlq.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.45rem 0.85rem',
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>Retry Event</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIG MODAL */}
      {showConfigModal && (
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
              maxWidth: '520px',
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
                Register Integration Adapter
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Adapter Unique Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIGILOCKER_NATIONAL"
                  value={newConfig.code}
                  onChange={(e) => setNewConfig({ ...newConfig, code: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Provider Type *
                </label>
                <select
                  value={newConfig.provider_type}
                  onChange={(e) => setNewConfig({ ...newConfig, provider_type: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="digilocker">DigiLocker Credential Gateway</option>
                  <option value="aadhaar_kyc">UIDAI Aadhaar KYC Gateway</option>
                  <option value="payment_gateway">Razorpay / Cashfree Merchant</option>
                  <option value="sms_gateway">Twilio SMS Adapter</option>
                  <option value="webhook_outbound">Generic Enterprise Webhook</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Base Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  value={newConfig.base_url}
                  onChange={(e) => setNewConfig({ ...newConfig, base_url: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Authentication Protocol *
                </label>
                <select
                  value={newConfig.auth_type}
                  onChange={(e) => setNewConfig({ ...newConfig, auth_type: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="oauth2">OAuth 2.0 (Bearer Token)</option>
                  <option value="api_key">API Key (X-Api-Key Header)</option>
                  <option value="basic">HTTP Basic Authentication</option>
                  <option value="hmac">HMAC SHA-256 Signature</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
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
