import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import api from '../api/client';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [templates, setTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    channel: 'email',
    template_code: 'CERTIFICATE_ISSUED',
    variables: JSON.stringify(
      {
        candidate_name: 'Aarav Sharma',
        course_title: 'Full-Stack Web Engineering',
        verification_token: 'VERIFY-NATIONAL-2026-001',
      },
      null,
      2
    ),
  });

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const [tplRes, notifRes] = await Promise.all([
        api.get('/notifications/templates'),
        api.get('/notifications'),
      ]);

      setTemplates(tplRes.data?.data || []);
      setNotifications(notifRes.data?.data?.data || notifRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setMessage({ type: 'danger', text: 'Failed to load notifications data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchNotification = async (e) => {
    e.preventDefault();
    try {
      const parsedVars = JSON.parse(dispatchForm.variables);

      await api.post('/notifications/dispatch', {
        channel: dispatchForm.channel,
        template_code: dispatchForm.template_code,
        variables: parsedVars,
      });

      setMessage({
        type: 'success',
        text: `Asynchronous notification dispatched via ${dispatchForm.channel} channel!`,
      });
      setShowDispatchModal(false);
      fetchNotificationsData();
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Dispatch failed.',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        Loading notification engine...
      </div>
    );
  }

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
            <Bell size={16} />
            Multi-Channel Asynchronous Notification Engine
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: '#ffffff',
            }}
          >
            Email, SMS & In-App Event Notifications
          </h1>

          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Manage dynamic templates with variable interpolation (&apos;&#123;&#123;candidate_name&#125;&#125;&apos;),
            trigger event bindings, and track delivery status across queued, sent, and failed states.
          </p>
        </div>

        <button
          onClick={() => setShowDispatchModal(true)}
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
          <Send size={16} />
          Dispatch Notification
        </button>
      </section>

      {/* Alert Banner */}
      {message.text && (
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
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Notification Logs Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
            Dispatched Notification Log History
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing {notifications.length} events
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Provider Ref</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Channel</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Template Code</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Subject / Payload</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Dispatched At</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No notification logs found. Click &quot;Dispatch Notification&quot; to test multi-channel events.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                      {n.provider_ref}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: '#e0f2fe',
                          color: '#0369a1',
                        }}
                      >
                        {n.channel}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#334155' }}>
                      {n.template_code}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', maxWidth: '320px' }}>
                      <strong style={{ color: '#0f172a', display: 'block' }}>{n.subject}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {JSON.stringify(n.payload_json?.variables || {})}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                      {new Date(n.sent_at || n.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: n.status === 'sent' ? '#dcfce7' : '#fef3c7',
                          color: n.status === 'sent' ? '#15803d' : '#92400e',
                        }}
                      >
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH MODAL */}
      {showDispatchModal && (
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
                Async Multi-Channel Dispatch
              </h3>
              <button
                onClick={() => setShowDispatchModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDispatchNotification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Channel *
                </label>
                <select
                  value={dispatchForm.channel}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, channel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="email">Email (SMTP / SES)</option>
                  <option value="sms">SMS Gateway (Twilio Adapter)</option>
                  <option value="in_app">In-App Notification Bell</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Template Event Code *
                </label>
                <input
                  type="text"
                  required
                  value={dispatchForm.template_code}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, template_code: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Interpolation Variables (JSON)
                </label>
                <textarea
                  rows={4}
                  value={dispatchForm.variables}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, variables: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    background: '#0f172a',
                    color: '#f8fafc',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  style={{
                    padding: '0.65rem 1rem',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Dispatch Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
