import React, { useState, useEffect } from 'react';
import {
  Building2,
  Building,
  BriefcaseBusiness,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  RefreshCw,
  Eye,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import apiClient from '../api/client';
import CredentialSuccessModal from '../components/CredentialSuccessModal';

export default function RegistrationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals & Action States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Credentials Dialog
  const [issuedCredentials, setIssuedCredentials] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusTab !== 'all') params.approval_status = statusTab;
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;

      const res = await apiClient.get('/officer/registration-requests', { params });
      setRequests(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error('Failed to load registration requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusTab, typeFilter, search]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this organisation registration?')) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/officer/registration-requests/${id}/approve`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('A rejection reason is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post(`/officer/registration-requests/${selectedRequest.id}/reject`, {
        rejection_reason: rejectionReason.trim(),
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (e) => {
    e.preventDefault();
    if (!suspensionReason.trim()) {
      alert('A suspension reason is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post(`/officer/organisations/${selectedRequest.id}/suspend`, {
        suspension_reason: suspensionReason.trim(),
      });
      setShowSuspendModal(false);
      setSuspensionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend organisation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (id) => {
    if (!window.confirm('Reactivate this organisation account?')) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/officer/organisations/${id}/reactivate`);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate organisation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCredentials = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiClient.post(`/officer/organisations/${id}/issue-credentials`);
      setIssuedCredentials(res.data?.credentials);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'training_partner':
        return <Building2 size={18} color="#b45309" />;
      case 'training_centre':
        return <Building size={18} color="#15803d" />;
      case 'employer':
        return <BriefcaseBusiness size={18} color="#7e22ce" />;
      default:
        return <Building2 size={18} color="#0369a1" />;
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
            COUNCIL OFFICER INBOX
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>
            Registration Approval Queue & Credentials
          </h1>
          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem' }}>
            Review pending applications from Training Partners, Centres, and Employers. Enforce compliance and issue activation credentials.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        {[
          { id: 'pending', label: 'Pending Review', icon: Clock },
          { id: 'approved', label: 'Approved Organisations', icon: CheckCircle },
          { id: 'rejected', label: 'Rejected Applications', icon: XCircle },
          { id: 'suspended', label: 'Suspended Accounts', icon: ShieldAlert },
          { id: 'all', label: 'All Registrations', icon: Building2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = statusTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 0,
                borderBottom: isActive ? '3px solid #102a35' : '3px solid transparent',
                background: 'transparent',
                color: isActive ? '#102a35' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search organisation name, code, email..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.9rem',
              background: '#fff',
            }}
          >
            <option value="">All Types</option>
            <option value="training_partner">Training Partner</option>
            <option value="training_centre">Training Centre</option>
            <option value="employer">Employer</option>
          </select>
        </div>

        <button
          onClick={fetchRequests}
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

      {/* Requests Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
              <th style={{ padding: '1rem 1.25rem' }}>Type</th>
              <th style={{ padding: '1rem 1.25rem' }}>Organisation / Centre</th>
              <th style={{ padding: '1rem 1.25rem' }}>Code</th>
              <th style={{ padding: '1rem 1.25rem' }}>Primary Contact</th>
              <th style={{ padding: '1rem 1.25rem' }}>Approval Status</th>
              <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading registration requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No registration requests in this queue.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getTypeIcon(req.type)}
                      <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#334155' }}>
                        {req.type?.replace('_', ' ')}
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <strong style={{ color: '#0f172a', display: 'block' }}>{req.name}</strong>
                    {req.parent && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Parent TP: {req.parent.name} ({req.parent.code})
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                      {req.code}
                    </code>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ color: '#0f172a' }}>{req.email || req.users?.[0]?.email || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{req.phone || req.users?.[0]?.mobile || ''}</div>
                  </td>

                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          req.approval_status === 'approved'
                            ? '#dcfce7'
                            : req.approval_status === 'rejected'
                            ? '#fee2e2'
                            : req.status === 'suspended'
                            ? '#fef3c7'
                            : '#e0f2fe',
                        color:
                          req.approval_status === 'approved'
                            ? '#15803d'
                            : req.approval_status === 'rejected'
                            ? '#b91c1c'
                            : req.status === 'suspended'
                            ? '#b45309'
                            : '#0369a1',
                      }}
                    >
                      {req.status === 'suspended' ? 'Suspended' : req.approval_status}
                    </span>
                  </td>

                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#102a35',
                        border: 0,
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Eye size={14} /> Review & Action
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.75)',
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
              maxWidth: '650px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ background: '#102a35', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Review Application</h3>
                <span style={{ fontSize: '0.8rem', color: '#c5f36a' }}>{selectedRequest.type?.replace('_', ' ').toUpperCase()}</span>
              </div>
              <button onClick={() => setSelectedRequest(null)} style={{ background: 'transparent', border: 0, color: '#cbd5e1', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Organisation Name:</span>
                  <strong>{selectedRequest.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Code:</span>
                  <code>{selectedRequest.code}</code>
                </div>
                {selectedRequest.registration_no && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Registration / CIN:</span>
                    <span>{selectedRequest.registration_no}</span>
                  </div>
                )}
                {selectedRequest.parent && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Parent Training Partner:</span>
                    <strong>{selectedRequest.parent.name} ({selectedRequest.parent.code})</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Contact Email:</span>
                  <span>{selectedRequest.email || selectedRequest.users?.[0]?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Phone:</span>
                  <span>{selectedRequest.phone || selectedRequest.users?.[0]?.mobile || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Current Status:</span>
                  <span style={{ fontWeight: 700 }}>{selectedRequest.approval_status} ({selectedRequest.status})</span>
                </div>

                {selectedRequest.rejection_reason && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fee2e2', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem' }}>
                    <strong>Rejection Reason:</strong> {selectedRequest.rejection_reason}
                  </div>
                )}

                {selectedRequest.suspension_reason && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', color: '#b45309', fontSize: '0.85rem' }}>
                    <strong>Suspension Reason:</strong> {selectedRequest.suspension_reason}
                  </div>
                )}
              </div>

              {/* Action Buttons based on status */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {selectedRequest.approval_status === 'pending' && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      style={{ padding: '0.65rem 1.25rem', background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Reject with Reason
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={actionLoading}
                      style={{ padding: '0.65rem 1.5rem', background: '#15803d', border: 0, color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Approve Application
                    </button>
                  </>
                )}

                {selectedRequest.approval_status === 'approved' && selectedRequest.status !== 'suspended' && (
                  <>
                    <button
                      onClick={() => handleIssueCredentials(selectedRequest.id)}
                      style={{ padding: '0.65rem 1.25rem', background: '#102a35', border: 0, color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <KeyRound size={16} /> Issue / Reset Credentials
                    </button>
                    <button
                      onClick={() => setShowSuspendModal(true)}
                      style={{ padding: '0.65rem 1.25rem', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Suspend Account
                    </button>
                  </>
                )}

                {selectedRequest.status === 'suspended' && (
                  <button
                    onClick={() => handleReactivate(selectedRequest.id)}
                    style={{ padding: '0.65rem 1.5rem', background: '#15803d', border: 0, color: '#fff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Reactivate Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject with Reason Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#b91c1c' }}>Mandatory Rejection Reason</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>
              Provide the specific compliance or accreditation deficiency reason. This reason will be logged in the immutable audit trail and visible to the applicant.
            </p>
            <form onSubmit={handleReject}>
              <textarea
                required
                rows={4}
                placeholder="e.g. Incomplete accreditation documents or invalid registration certificate."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '1rem', fontSize: '0.9rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  style={{ padding: '0.55rem 1rem', background: '#f1f5f9', border: 0, borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.55rem 1.25rem', background: '#b91c1c', border: 0, borderRadius: '6px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend with Reason Modal */}
      {showSuspendModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.8)',
            display: 'grid',
            placeItems: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '14px', maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#b45309' }}>Mandatory Suspension Reason</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#64748b' }}>
              Suspending an organisation revokes all active session tokens immediately and blocks all subordinate logins until reactivated by Council Officers.
            </p>
            <form onSubmit={handleSuspend}>
              <textarea
                required
                rows={4}
                placeholder="e.g. Compliance audit failure or financial irregularities flagged during periodic review."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '1rem', fontSize: '0.9rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowSuspendModal(false)}
                  style={{ padding: '0.55rem 1rem', background: '#f1f5f9', border: 0, borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '0.55rem 1.25rem', background: '#b45309', border: 0, borderRadius: '6px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Suspension & Revoke Tokens
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credential Issuance Modal */}
      {issuedCredentials && (
        <CredentialSuccessModal
          credentials={issuedCredentials}
          title="Organisation Credentials Issued"
          onClose={() => setIssuedCredentials(null)}
        />
      )}
    </div>
  );
}
