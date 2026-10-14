import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  UserPlus,
  KeyRound,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Building,
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import CredentialSuccessModal from '../components/CredentialSuccessModal';

export default function TrainerAssessorManagement() {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.roles?.[0] || '';

  const canManageAssessors = ['super_admin', 'council_officer'].includes(userRole);
  const [activeTab, setActiveTab] = useState(canManageAssessors ? 'assessors' : 'trainers');

  const [trainers, setTrainers] = useState([]);
  const [assessors, setAssessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals & Action States
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  const [showAddAssessorModal, setShowAddAssessorModal] = useState(false);
  const [credentialsResult, setCredentialsResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forms
  const [trainerForm, setTrainerForm] = useState({
    name: '',
    email: '',
    mobile: '',
    user_identifier: '',
    qualifications: 'B.Tech, TOT Certified',
    specialisations: 'Domain Specialist',
  });

  const [assessorForm, setAssessorForm] = useState({
    name: '',
    email: '',
    mobile: '',
    user_identifier: '',
    qualifications: 'Certified Lead Assessor',
  });

  const primaryOrgId = user?.organisations?.[0]?.id || null;

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trainers') {
        const res = await apiClient.get('/trainers');
        setTrainers(res.data?.data || []);
      } else if (activeTab === 'assessors') {
        const res = await apiClient.get('/council/assessors');
        setAssessors(res.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load personnel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    if (!primaryOrgId) {
      alert('Your user account is not associated with an accredited organisation.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post(`/organisations/${primaryOrgId}/trainers/onboard`, {
        name: trainerForm.name.trim(),
        email: trainerForm.email.trim(),
        mobile: trainerForm.mobile?.trim() || null,
        user_identifier: trainerForm.user_identifier?.trim() || null,
        qualifications: trainerForm.qualifications.split(',').map((q) => q.trim()),
        specialisations: trainerForm.specialisations.split(',').map((s) => s.trim()),
      });

      setShowAddTrainerModal(false);
      setTrainerForm({ name: '', email: '', mobile: '', user_identifier: '', qualifications: '', specialisations: '' });
      setCredentialsResult(res.data?.credentials);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to onboard trainer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAssessor = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/council/assessors', {
        name: assessorForm.name.trim(),
        email: assessorForm.email.trim(),
        mobile: assessorForm.mobile?.trim() || null,
        user_identifier: assessorForm.user_identifier?.trim() || null,
        qualifications: assessorForm.qualifications.split(',').map((q) => q.trim()),
      });

      setShowAddAssessorModal(false);
      setAssessorForm({ name: '', email: '', mobile: '', user_identifier: '', qualifications: '' });
      setCredentialsResult(res.data?.credentials);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to onboard assessor.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTrainer = async (trainer) => {
    if (!window.confirm(`Reset credentials for Trainer ${trainer.user?.name || trainer.trainer_no}? Old tokens will be invalidated.`)) return;

    try {
      const res = await apiClient.post(`/trainers/${trainer.id}/reset-credentials`);
      setCredentialsResult(res.data?.credentials);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset trainer credentials.');
    }
  };

  const handleResetAssessor = async (assessor) => {
    if (!window.confirm(`Reset credentials for Assessor ${assessor.user?.name || assessor.assessor_no}? Old tokens will be invalidated.`)) return;

    try {
      const res = await apiClient.post(`/assessors/${assessor.id}/reset-credentials`);
      setCredentialsResult(res.data?.credentials);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset assessor credentials.');
    }
  };

  const filteredTrainers = trainers.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.trainer_no?.toLowerCase().includes(term) ||
      t.user?.name?.toLowerCase().includes(term) ||
      t.user?.email?.toLowerCase().includes(term)
    );
  });

  const filteredAssessors = assessors.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.assessor_no?.toLowerCase().includes(term) ||
      a.user?.name?.toLowerCase().includes(term) ||
      a.user?.email?.toLowerCase().includes(term)
    );
  });

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
            ONBOARDING & CREDENTIAL GOVERNANCE
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#fff' }}>
            {canManageAssessors ? 'Trainer & Assessor Management' : 'Organisation Trainer Management'}
          </h1>
          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem' }}>
            Controlled onboarding with unique User IDs, secure credential issuance, and forced first-login password changes.
          </p>
        </div>

        <div>
          {activeTab === 'trainers' && (
            <button
              onClick={() => setShowAddTrainerModal(true)}
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
              Onboard Trainer
            </button>
          )}

          {activeTab === 'assessors' && canManageAssessors && (
            <button
              onClick={() => setShowAddAssessorModal(true)}
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
              Onboard Assessor
            </button>
          )}
        </div>
      </section>

      {/* Tabs */}
      {canManageAssessors && (
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('assessors')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              border: 0,
              borderBottom: activeTab === 'assessors' ? '3px solid #102a35' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'assessors' ? '#102a35' : '#64748b',
              fontWeight: activeTab === 'assessors' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <ClipboardCheck size={18} />
            Assessors Directory
          </button>

          <button
            onClick={() => setActiveTab('trainers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              border: 0,
              borderBottom: activeTab === 'trainers' ? '3px solid #102a35' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'trainers' ? '#102a35' : '#64748b',
              fontWeight: activeTab === 'trainers' ? 800 : 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <GraduationCap size={18} />
            Trainers Directory
          </button>
        </div>
      )}

      {/* Search & Refresh */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder={`Search ${activeTab} by name, code or email...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <button
          onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Table: Trainers */}
      {activeTab === 'trainers' && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                <th style={{ padding: '1rem 1.25rem' }}>Trainer ID</th>
                <th style={{ padding: '1rem 1.25rem' }}>Trainer Name</th>
                <th style={{ padding: '1rem 1.25rem' }}>Contact</th>
                <th style={{ padding: '1rem 1.25rem' }}>Qualifications</th>
                <th style={{ padding: '1rem 1.25rem' }}>Credential Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Loading trainers...
                  </td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No trainers onboarded yet.
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <code style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {t.trainer_no || t.user?.user_identifier || 'TR-' + t.id.slice(0, 8)}
                      </code>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#0f172a' }}>{t.user?.name || 'N/A'}</strong>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div>{t.user?.email}</div>
                      {t.user?.mobile && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t.user?.mobile}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {Array.isArray(t.qualifications_json) ? t.qualifications_json.join(', ') : 'Domain Expert'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {t.user?.must_change_password ? (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Temporary Credential
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Active Credentials
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleResetTrainer(t)}
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
                          gap: '0.35rem',
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
      )}

      {/* Table: Assessors */}
      {activeTab === 'assessors' && canManageAssessors && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                <th style={{ padding: '1rem 1.25rem' }}>Assessor ID</th>
                <th style={{ padding: '1rem 1.25rem' }}>Assessor Name</th>
                <th style={{ padding: '1rem 1.25rem' }}>Contact</th>
                <th style={{ padding: '1rem 1.25rem' }}>Accreditation</th>
                <th style={{ padding: '1rem 1.25rem' }}>Credential Status</th>
                <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    Loading assessors...
                  </td>
                </tr>
              ) : filteredAssessors.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No assessors onboarded yet.
                  </td>
                </tr>
              ) : (
                filteredAssessors.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <code style={{ background: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        {a.assessor_no || a.user?.user_identifier || 'AS-' + a.id.slice(0, 8)}
                      </code>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <strong style={{ color: '#0f172a' }}>{a.user?.name || 'N/A'}</strong>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div>{a.user?.email}</div>
                      {a.user?.mobile && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.user?.mobile}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                        {Array.isArray(a.qualifications_json) ? a.qualifications_json.join(', ') : 'Certified Assessor'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {a.user?.must_change_password ? (
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Temporary Credential
                        </span>
                      ) : (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Active Credentials
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleResetAssessor(a)}
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
                          gap: '0.35rem',
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
      )}

      {/* Onboard Trainer Modal */}
      {showAddTrainerModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', overflow: 'hidden' }}>
            <div style={{ background: '#102a35', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Onboard New Trainer</h3>
              <button onClick={() => setShowAddTrainerModal(false)} style={{ background: 'transparent', border: 0, color: '#cbd5e1', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTrainer} style={{ padding: '1.5rem' }}>
              {errorMsg && <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem' }}>{errorMsg}</div>}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Trainer Full Name *</label>
                <input required type="text" placeholder="e.g. Anand Verma" value={trainerForm.name} onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Email Address *</label>
                <input required type="email" placeholder="anand.trainer@skills.org" value={trainerForm.email} onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Mobile Number</label>
                <input type="text" placeholder="+91 98765 11111" value={trainerForm.mobile} onChange={(e) => setTrainerForm({ ...trainerForm, mobile: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Qualifications (Comma separated)</label>
                <input type="text" placeholder="B.Tech, TOT Certified" value={trainerForm.qualifications} onChange={(e) => setTrainerForm({ ...trainerForm, qualifications: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Specialisations (Comma separated)</label>
                <input type="text" placeholder="Full Stack, Cloud Computing" value={trainerForm.specialisations} onChange={(e) => setTrainerForm({ ...trainerForm, specialisations: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddTrainerModal(false)} style={{ padding: '0.65rem 1rem', background: '#f1f5f9', border: 0, borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ padding: '0.65rem 1.25rem', background: '#102a35', border: 0, borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {actionLoading ? 'Creating...' : 'Onboard & Generate Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboard Assessor Modal */}
      {showAddAssessorModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '500px', width: '100%', overflow: 'hidden' }}>
            <div style={{ background: '#102a35', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Onboard New Assessor</h3>
              <button onClick={() => setShowAddAssessorModal(false)} style={{ background: 'transparent', border: 0, color: '#cbd5e1', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleCreateAssessor} style={{ padding: '1.5rem' }}>
              {errorMsg && <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: '6px', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.85rem' }}>{errorMsg}</div>}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Assessor Full Name *</label>
                <input required type="text" placeholder="e.g. Meera Nair" value={assessorForm.name} onChange={(e) => setAssessorForm({ ...assessorForm, name: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Email Address *</label>
                <input required type="email" placeholder="meera.assessor@council.org" value={assessorForm.email} onChange={(e) => setAssessorForm({ ...assessorForm, email: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Mobile Number</label>
                <input type="text" placeholder="+91 98765 22222" value={assessorForm.mobile} onChange={(e) => setAssessorForm({ ...assessorForm, mobile: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>Accreditation / Qualifications</label>
                <input type="text" placeholder="Certified Master Assessor Level 4" value={assessorForm.qualifications} onChange={(e) => setAssessorForm({ ...assessorForm, qualifications: e.target.value })} style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddAssessorModal(false)} style={{ padding: '0.65rem 1rem', background: '#f1f5f9', border: 0, borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ padding: '0.65rem 1.25rem', background: '#102a35', border: 0, borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {actionLoading ? 'Creating...' : 'Onboard & Generate Credentials'}
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
          title={`${activeTab === 'assessors' ? 'Assessor' : 'Trainer'} Credentials Generated`}
          onClose={() => setCredentialsResult(null)}
        />
      )}
    </div>
  );
}
