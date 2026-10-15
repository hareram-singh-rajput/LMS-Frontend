import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../api/client';
import CredentialSuccessModal from '../components/CredentialSuccessModal';

export default function CouncilOfficers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [credentialsResult, setCredentialsResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // New Officer Form
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    user_identifier: '',
    mobile: '',
  });

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get('/admin/council-officers', { params });
      setOfficers(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch council officers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [search, statusFilter]);

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/admin/council-officers', {
        name: newOfficer.name.trim(),
        email: newOfficer.email.trim(),
        user_identifier: newOfficer.user_identifier?.trim() || null,
        mobile: newOfficer.mobile?.trim() || null,
      });

      setShowAddModal(false);
      setNewOfficer({ name: '', email: '', user_identifier: '', mobile: '' });
      setCredentialsResult(res.data?.credentials);
      fetchOfficers();
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMsg('Session expired or unauthenticated for this backend server. Please log out and log back in.');
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to create Council Officer.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetCredentials = async (officer) => {
    if (!window.confirm(`Are you sure you want to reset credentials for ${officer.name} (${officer.user_identifier || officer.email})? Previous sessions will be terminated.`)) {
      return;
    }

    try {
      const res = await apiClient.post(`/admin/council-officers/${officer.id}/reset-credentials`);
      setCredentialsResult(res.data?.credentials);
      fetchOfficers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset credentials.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #102a35, #193b46)',
          borderRadius: '16px',
          padding: '2rem 2.5rem',
          color: '#fff',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ color: '#c5f36a', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            SUPER ADMIN GOVERNANCE
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>
            Council Officer Management
          </h1>
          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem' }}>
            Create council officers, monitor credential states, and execute secure credential resets.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: '#c5f36a',
            color: '#102a35',
            border: 0,
            borderRadius: '10px',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          <UserPlus size={18} />
          Add Council Officer
        </button>
      </section>

      {/* Controls & Filters */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name, email, or User ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: '#fff',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <button
          onClick={fetchOfficers}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.65rem 1rem',
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#334155',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Officers Table */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
              <th style={{ padding: '1rem 1.25rem' }}>User ID / Code</th>
              <th style={{ padding: '1rem 1.25rem' }}>Officer Name</th>
              <th style={{ padding: '1rem 1.25rem' }}>Contact Info</th>
              <th style={{ padding: '1rem 1.25rem' }}>Credential Status</th>
              <th style={{ padding: '1rem 1.25rem' }}>Account Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading Council Officers...
                </td>
              </tr>
            ) : officers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No Council Officers found matching the search criteria.
                </td>
              </tr>
            ) : (
              officers.map((officer) => (
                <tr key={officer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <code style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      {officer.user_identifier || 'CO-' + officer.id.toString().padStart(4, '0')}
                    </code>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block' }}>{officer.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>National Skill Council</span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#0f172a' }}>{officer.email}</div>
                    {officer.mobile && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{officer.mobile}</div>}
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    {officer.must_change_password ? (
                      <span
                        style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertCircle size={13} /> Temporary Credential Issued
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle size={13} /> Active Credentials
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span
                      style={{
                        background: officer.status === 'active' ? '#e0f2fe' : '#fee2e2',
                        color: officer.status === 'active' ? '#0369a1' : '#b91c1c',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                      }}
                    >
                      {officer.status}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleResetCredentials(officer)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        color: '#0f172a',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <RotateCcw size={14} /> Reset Credentials
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Council Officer Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ background: '#102a35', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Create Council Officer</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 0, color: '#cbd5e1', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} style={{ padding: '1.5rem' }}>
              {errorMsg && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="rajesh.officer@sectorcouncil.org"
                  value={newOfficer.email}
                  onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Unique User ID (Optional - Auto-generated if left blank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CO-1002"
                  value={newOfficer.user_identifier}
                  onChange={(e) => setNewOfficer({ ...newOfficer, user_identifier: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newOfficer.mobile}
                  onChange={(e) => setNewOfficer({ ...newOfficer, mobile: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.65rem 1.25rem', background: '#f1f5f9', border: 0, borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.65rem 1.5rem', background: '#102a35', border: 0, borderRadius: '8px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  {actionLoading ? 'Generating Credentials...' : 'Create & Issue Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Success Modal */}
      {credentialsResult && (
        <CredentialSuccessModal
          credentials={credentialsResult}
          title="Council Officer Credentials Generated"
          onClose={() => setCredentialsResult(null)}
        />
      )}
    </div>
  );
}
