import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Shield, Clock, FileText, User, Activity } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/audit-logs')
      .then((res) => {
        setLogs(res.data.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch audit logs or access denied.');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 700 }}>
            System Audit Trail
          </h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Immutable append-only audit events for authentication, authorization, and administrative actions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e0f2fe', color: '#0369a1', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}>
          <Shield size={18} />
          <span>Security Hardened</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading audit events...</div>
      ) : error ? (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px' }}>{error}</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Event Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Action</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actor</th>
                <th style={{ padding: '0.85rem 1rem' }}>IP Address</th>
                <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.85rem 1rem' }}>Correlation ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                    {log.event_type}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: log.action === 'login' || log.action === 'register' ? '#dcfce7' : log.action === 'denied' ? '#fee2e2' : '#f1f5f9',
                      color: log.action === 'login' || log.action === 'register' ? '#166534' : log.action === 'denied' ? '#991b1b' : '#334155'
                    }}>
                      {log.action.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                    {log.actor ? log.actor.email : 'System / Guest'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {log.ip || '127.0.0.1'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {log.correlation_id ? log.correlation_id.substring(0, 18) + '...' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
