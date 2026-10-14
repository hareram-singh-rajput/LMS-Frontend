import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import {
  Layers,
  BookOpen,
  Globe,
  Plus,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Eye,
  Edit3,
  FileCheck
} from 'lucide-react';

export default function MasterData() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('qualifications'); // qualifications, sectors, geographies

  // Master Data States
  const [sectors, setSectors] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [geographies, setGeographies] = useState([]);

  // Selected Item / Modals
  const [selectedQP, setSelectedQP] = useState(null);
  const [qpVersions, setQpVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Loading & Action state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [showAddSectorModal, setShowAddSectorModal] = useState(false);
  const [sectorForm, setSectorForm] = useState({ code: '', name: '', description: '' });

  const [showAddJobRoleModal, setShowAddJobRoleModal] = useState(false);
  const [jobRoleForm, setJobRoleForm] = useState({ sector_id: '', code: '', title: '', level: 'NSQF Level 4', description: '' });

  const [showAddQPModal, setShowAddQPModal] = useState(false);
  const [qpForm, setQpForm] = useState({ job_role_id: '', code: '', title: '', framework: 'NSQF', level: 'NSQF Level 4', credits: 12 });

  const [showAddVersionModal, setShowAddVersionModal] = useState(false);
  const [versionForm, setVersionForm] = useState({ version_no: '', effective_from: new Date().toISOString().split('T')[0] });

  // Fetch initial data
  useEffect(() => {
    fetchSectors();
    fetchJobRoles();
    fetchQualifications();
    fetchGeographies();
  }, []);

  const fetchSectors = () => {
    apiClient.get('/sectors')
      .then(res => setSectors(res.data.data))
      .catch(err => console.error('Failed to load sectors', err));
  };

  const fetchJobRoles = () => {
    apiClient.get('/job-roles')
      .then(res => setJobRoles(res.data.data))
      .catch(err => console.error('Failed to load job roles', err));
  };

  const fetchQualifications = () => {
    setLoading(true);
    apiClient.get('/qualifications')
      .then(res => {
        setQualifications(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg('Failed to fetch qualification packs');
        setLoading(false);
      });
  };

  const fetchGeographies = () => {
    apiClient.get('/master-data/geographies')
      .then(res => setGeographies(res.data.data))
      .catch(err => console.error('Failed to load geographies', err));
  };

  const inspectQP = (qp) => {
    setSelectedQP(qp);
    apiClient.get(`/qualifications/${qp.id}/versions`)
      .then(res => {
        setQpVersions(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedVersion(res.data.data[0]);
        }
      })
      .catch(err => console.error('Failed to fetch QP versions', err));
  };

  // Handlers for Sector creation
  const handleCreateSector = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.post('/sectors', sectorForm)
      .then(res => {
        setSuccessMsg('Sector created successfully.');
        setShowAddSectorModal(false);
        setSectorForm({ code: '', name: '', description: '' });
        fetchSectors();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to create sector'));
  };

  // Handlers for Job Role creation
  const handleCreateJobRole = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.post('/job-roles', jobRoleForm)
      .then(res => {
        setSuccessMsg('Job Role created successfully.');
        setShowAddJobRoleModal(false);
        setJobRoleForm({ sector_id: '', code: '', title: '', level: 'NSQF Level 4', description: '' });
        fetchJobRoles();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to create job role'));
  };

  // Handlers for QP creation
  const handleCreateQP = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.post('/qualifications', qpForm)
      .then(res => {
        setSuccessMsg('Qualification Pack created with draft v1.0 successfully.');
        setShowAddQPModal(false);
        setQpForm({ job_role_id: '', code: '', title: '', framework: 'NSQF', level: 'NSQF Level 4', credits: 12 });
        fetchQualifications();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to create Qualification Pack'));
  };

  // Handlers for Version creation
  const handleCreateVersion = (e) => {
    e.preventDefault();
    if (!selectedQP) return;
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.post(`/qualifications/${selectedQP.id}/versions`, versionForm)
      .then(res => {
        setSuccessMsg(`New version [${res.data.data.version_no}] created as draft.`);
        setShowAddVersionModal(false);
        setVersionForm({ version_no: '', effective_from: new Date().toISOString().split('T')[0] });
        inspectQP(selectedQP);
        fetchQualifications();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to create new version'));
  };

  // Transition Version Status
  const handleTransitionStatus = (versionId, newStatus) => {
    if (!selectedQP) return;
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.put(`/qualifications/${selectedQP.id}/versions/${versionId}/status`, { status: newStatus })
      .then(res => {
        setSuccessMsg(`Version status updated to [${newStatus}].`);
        inspectQP(selectedQP);
        fetchQualifications();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to transition status'));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Published</span>;
      case 'approved':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FileCheck size={12} /> Approved</span>;
      case 'review':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Under Review</span>;
      case 'draft':
        return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Edit3 size={12} /> Draft</span>;
      case 'retired':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Retired (Locked)</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>{status}</span>;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '12px',
        padding: '2rem',
        color: '#fff',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <GitBranch style={{ color: '#38bdf8', width: '28px', height: '28px' }} />
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
                Master Data & Qualification Pack Versioning Engine
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.6 }}>
              Configure Sectors, Job Roles, Geographies, and Qualification Packs. Enforces version lifecycle state transitions (Draft → Review → Approved → Published → Retired) with immutable historical enrolment protection.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowAddQPModal(true)}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.2rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Plus size={16} />
              New Qualification Pack
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => setActiveTab('qualifications')}
            style={{
              background: activeTab === 'qualifications' ? '#38bdf8' : 'transparent',
              color: activeTab === 'qualifications' ? '#0f172a' : '#cbd5e1',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BookOpen size={16} />
            Qualification Packs & Versions
          </button>

          <button
            onClick={() => setActiveTab('sectors')}
            style={{
              background: activeTab === 'sectors' ? '#38bdf8' : 'transparent',
              color: activeTab === 'sectors' ? '#0f172a' : '#cbd5e1',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Layers size={16} />
            Sectors & Job Roles ({sectors.length} Sectors / {jobRoles.length} Roles)
          </button>

          <button
            onClick={() => setActiveTab('geographies')}
            style={{
              background: activeTab === 'geographies' ? '#38bdf8' : 'transparent',
              color: activeTab === 'geographies' ? '#0f172a' : '#cbd5e1',
              border: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Globe size={16} />
            Master Geographies
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 1: QUALIFICATION PACKS & VERSIONING ENGINE */}
      {/* ========================================== */}
      {activeTab === 'qualifications' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedQP ? '1fr 1.2fr' : '1fr', gap: '2rem' }}>
          
          {/* Left Column: Qualification List */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>
              Qualification Packs Catalogue
            </h3>

            {loading ? (
              <p style={{ color: '#64748b' }}>Loading Qualification Packs...</p>
            ) : qualifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                <p>No Qualification Packs created yet.</p>
                <button
                  onClick={() => setShowAddQPModal(true)}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create First Qualification Pack
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {qualifications.map(qp => {
                  const isSelected = selectedQP?.id === qp.id;
                  const activeVersion = qp.current_version || (qp.versions && qp.versions[0]);
                  return (
                    <div
                      key={qp.id}
                      onClick={() => inspectQP(qp)}
                      style={{
                        padding: '1.25rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                            {qp.code}
                          </span>
                          <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{qp.title}</h4>
                        </div>
                        {activeVersion && getStatusBadge(activeVersion.approval_status)}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                        <span>Framework: <strong>{qp.framework}</strong></span>
                        <span>Level: <strong>{qp.level}</strong></span>
                        <span>Credits: <strong>{qp.credits}</strong></span>
                      </div>

                      {qp.job_role && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#475569', background: 'rgba(0,0,0,0.03)', padding: '0.35rem 0.6rem', borderRadius: '4px' }}>
                          Job Role: <strong>{qp.job_role.title}</strong> ({qp.job_role.sector?.name || 'Sector'})
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                        <span>Versions: {qp.versions ? qp.versions.length : 1}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          Inspect Version Lifecycle <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Version Lifecycle & Locking Panel */}
          {selectedQP && (
            <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>SELECTED QUALIFICATION PACK</span>
                  <h3 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: '#0f172a' }}>{selectedQP.title}</h3>
                  <code style={{ fontSize: '0.85rem', color: '#64748b' }}>QP Code: {selectedQP.code}</code>
                </div>

                <button
                  onClick={() => setShowAddVersionModal(true)}
                  style={{
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Plus size={14} />
                  New Draft Version
                </button>
              </div>

              {/* Version History Table */}
              <h4 style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.75rem' }}>
                Version History & Lifecycle State Transitions
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {qpVersions.map(ver => {
                  const isSelVer = selectedVersion?.id === ver.id;
                  const isLocked = in_array_js(ver.approval_status, ['published', 'retired']);

                  return (
                    <div
                      key={ver.id}
                      onClick={() => setSelectedVersion(ver)}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: isSelVer ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: isSelVer ? '#f0f9ff' : '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{ver.version_no}</strong>
                          {getStatusBadge(ver.approval_status)}
                          {isLocked && (
                            <span style={{ fontSize: '0.7rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '2px', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                              <Lock size={10} /> Enrolment Lock Active
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Effective: {ver.effective_from} {ver.effective_to ? `to ${ver.effective_to}` : '(Ongoing)'}
                        </span>
                      </div>

                      {/* State Machine Transition Actions */}
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {ver.approver && <span>Approved by: <strong>{ver.approver.name}</strong></span>}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {ver.approval_status === 'draft' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTransitionStatus(ver.id, 'review'); }}
                              style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Submit to Review
                            </button>
                          )}
                          {ver.approval_status === 'review' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTransitionStatus(ver.id, 'approved'); }}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleTransitionStatus(ver.id, 'draft'); }}
                                style={{ background: '#64748b', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Reject to Draft
                              </button>
                            </>
                          )}
                          {ver.approval_status === 'approved' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTransitionStatus(ver.id, 'published'); }}
                              style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Publish Version
                            </button>
                          )}
                          {ver.approval_status === 'published' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTransitionStatus(ver.id, 'retired'); }}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Retire Version
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Version Requirements & NOS Details */}
              {selectedVersion && (
                <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '0.9rem' }}>
                    Version [{selectedVersion.version_no}] Requirements & NOS Competencies
                  </h5>

                  <div style={{ fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.25rem' }}>Eligibility & Prerequisites:</strong>
                      <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', margin: 0, overflowX: 'auto' }}>
                        {JSON.stringify(selectedVersion.requirements_json, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <strong style={{ display: 'block', color: '#0f172a', marginBottom: '0.25rem' }}>NOS Competency Structure:</strong>
                      <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.75rem', margin: 0, overflowX: 'auto' }}>
                        {JSON.stringify(selectedVersion.competency_json, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: SECTORS & JOB ROLES */}
      {/* ========================================== */}
      {activeTab === 'sectors' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Sectors Card */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Sectors Catalogue</h3>
              <button
                onClick={() => setShowAddSectorModal(true)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Sector
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sectors.map(sec => (
                <div key={sec.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#0f172a' }}>{sec.name}</strong>
                    <code style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{sec.code}</code>
                  </div>
                  <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#64748b' }}>{sec.description || 'No description provided.'}</p>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
                    {sec.job_roles_count ?? 0} Job Roles linked
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Job Roles Card */}
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Job Roles & NSQF Levels</h3>
              <button
                onClick={() => setShowAddJobRoleModal(true)}
                style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Job Role
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {jobRoles.map(jr => (
                <div key={jr.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#0f172a' }}>{jr.title}</strong>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{jr.level}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Code: <code>{jr.code}</code> | Sector: <strong>{jr.sector?.name}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: MASTER GEOGRAPHIES */}
      {/* ========================================== */}
      {activeTab === 'geographies' && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>
            National & Regional Geographies Hierarchy
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {geographies.map(geo => (
              <div key={geo.id} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#0284c7', fontWeight: 700 }}>{geo.level}</span>
                <h4 style={{ margin: '0.2rem 0', fontSize: '1rem', color: '#0f172a' }}>{geo.name}</h4>
                <code style={{ fontSize: '0.8rem', color: '#64748b' }}>Code: {geo.code}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD QUALIFICATION PACK */}
      {/* ========================================== */}
      {showAddQPModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Create Qualification Pack</h3>

            <form onSubmit={handleCreateQP}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Job Role</label>
                <select
                  required
                  value={qpForm.job_role_id}
                  onChange={e => setQpForm({ ...qpForm, job_role_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Select Job Role --</option>
                  {jobRoles.map(jr => (
                    <option key={jr.id} value={jr.id}>{jr.title} ({jr.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>QP Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QP-IT-002"
                    value={qpForm.code}
                    onChange={e => setQpForm({ ...qpForm, code: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Framework</label>
                  <input
                    type="text"
                    required
                    value={qpForm.framework}
                    onChange={e => setQpForm({ ...qpForm, framework: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Qualification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Developer Qualification"
                  value={qpForm.title}
                  onChange={e => setQpForm({ ...qpForm, title: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>NSQF Level</label>
                  <input
                    type="text"
                    required
                    value={qpForm.level}
                    onChange={e => setQpForm({ ...qpForm, level: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Credits</label>
                  <input
                    type="number"
                    required
                    value={qpForm.credits}
                    onChange={e => setQpForm({ ...qpForm, credits: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddQPModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save & Create v1.0 Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD NEW DRAFT VERSION */}
      {/* ========================================== */}
      {showAddVersionModal && selectedQP && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Create New Draft Version for [{selectedQP.code}]</h3>

            <form onSubmit={handleCreateVersion}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Version Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. v1.1 or v2.0"
                  value={versionForm.version_no}
                  onChange={e => setVersionForm({ ...versionForm, version_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Effective From Date</label>
                <input
                  type="date"
                  required
                  value={versionForm.effective_from}
                  onChange={e => setVersionForm({ ...versionForm, effective_from: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddVersionModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Draft Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SECTOR */}
      {showAddSectorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Add New Sector</h3>
            <form onSubmit={handleCreateSector}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Sector Code</label>
                <input type="text" required placeholder="e.g. HEALTHCARE" value={sectorForm.code} onChange={e => setSectorForm({ ...sectorForm, code: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Sector Name</label>
                <input type="text" required placeholder="e.g. Healthcare & Medical Services" value={sectorForm.name} onChange={e => setSectorForm({ ...sectorForm, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Description</label>
                <textarea rows="3" placeholder="Sector description..." value={sectorForm.description} onChange={e => setSectorForm({ ...sectorForm, description: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddSectorModal(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Sector</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD JOB ROLE */}
      {showAddJobRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Add New Job Role</h3>
            <form onSubmit={handleCreateJobRole}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Sector</label>
                <select required value={jobRoleForm.sector_id} onChange={e => setJobRoleForm({ ...jobRoleForm, sector_id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- Select Sector --</option>
                  {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Job Role Code</label>
                <input type="text" required placeholder="e.g. JR-HC-001" value={jobRoleForm.code} onChange={e => setJobRoleForm({ ...jobRoleForm, code: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Title</label>
                <input type="text" required placeholder="e.g. General Duty Assistant" value={jobRoleForm.title} onChange={e => setJobRoleForm({ ...jobRoleForm, title: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Level</label>
                <input type="text" required value={jobRoleForm.level} onChange={e => setJobRoleForm({ ...jobRoleForm, level: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddJobRoleModal(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Job Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function in_array_js(val, arr) {
  return arr.includes(val);
}
