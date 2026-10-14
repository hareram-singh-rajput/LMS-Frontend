import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import {
  UserCheck,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  GraduationCap,
  FileText,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function Candidates() {
  const { user } = useAuthStore();
  const isTpAdmin = user?.roles?.includes('tp_admin');

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tpCentres, setTpCentres] = useState([]);

  // Selected Candidate
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);

  // Modals & Notifications
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Candidate Registration Form
  const [candidateForm, setCandidateForm] = useState({
    first_name: '',
    last_name: '',
    dob: '2004-05-15',
    gender: 'male',
    email: '',
    mobile: '',
    training_centre_id: '',
    highest_qualification: '12th Pass',
    specialisation: 'Science & Computing'
  });

  // Document Upload Form
  const [docForm, setDocForm] = useState({
    document_type: 'aadhaar',
    document_no: ''
  });

  // Eligibility Evaluation Result State
  const [evalResult, setEvalResult] = useState(null);

  useEffect(() => {
    fetchCandidates();
    if (isTpAdmin) {
      apiClient.get('/organisations?per_page=50')
        .then(res => {
          const list = res.data.data.data || res.data.data || [];
          const centresList = list.filter(o => o.type === 'training_centre');
          setTpCentres(centresList);
        })
        .catch(err => console.error('Failed to load TP training centres', err));
    }
  }, [statusFilter]);

  const fetchCandidates = () => {
    setLoading(true);
    let url = '/candidates?per_page=50';
    if (statusFilter) url += `&status=${statusFilter}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    apiClient.get(url)
      .then(res => {
        setCandidates(res.data.data.data || res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg('Failed to fetch candidates directory');
        setLoading(false);
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCandidates();
  };

  const inspectCandidate = (cand) => {
    setSelectedCandidate(cand);
    setEvalResult(null);
    apiClient.get(`/candidates/${cand.id}`)
      .then(res => setCandidateDetails(res.data.data))
      .catch(err => console.error('Failed to fetch candidate details', err));
  };

  const handleRegisterCandidate = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      first_name: candidateForm.first_name,
      last_name: candidateForm.last_name,
      dob: candidateForm.dob,
      gender: candidateForm.gender,
      email: candidateForm.email,
      mobile: candidateForm.mobile,
      training_centre_id: candidateForm.training_centre_id || undefined,
      education_json: {
        highest_qualification: candidateForm.highest_qualification,
        specialisation: candidateForm.specialisation,
        year_completed: 2024
      }
    };

    apiClient.post('/candidates', payload)
      .then(res => {
        setSuccessMsg(`Candidate registered with ID: [${res.data.data.candidate_no}].`);
        setShowAddCandidateModal(false);
        setCandidateForm({ first_name: '', last_name: '', dob: '2004-05-15', gender: 'male', email: '', mobile: '', training_centre_id: '', highest_qualification: '12th Pass', specialisation: 'Science & Computing' });
        fetchCandidates();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to register candidate'));
  };

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.post(`/candidates/${selectedCandidate.id}/documents`, docForm)
      .then(res => {
        setSuccessMsg(`Document [${docForm.document_type.toUpperCase()}] uploaded.`);
        setShowUploadDocModal(false);
        setDocForm({ document_type: 'aadhaar', document_no: '' });
        inspectCandidate(selectedCandidate);
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to upload document'));
  };

  const handleVerifyDoc = (docId, verified) => {
    if (!selectedCandidate) return;
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.put(`/candidates/${selectedCandidate.id}/documents/${docId}/verify`, { verified: verified, remarks: 'Verified by council officer' })
      .then(res => {
        setSuccessMsg(`Document verification status updated.`);
        inspectCandidate(selectedCandidate);
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Verification update failed'));
  };

  const handleRunEligibilityEngine = () => {
    if (!selectedCandidate) return;
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.post(`/candidates/${selectedCandidate.id}/evaluate-eligibility`, {
      min_age: 18,
      require_verified_id: true
    })
      .then(res => {
        setEvalResult(res.data.eligibility);
        setSuccessMsg(`Eligibility evaluation completed: Candidate is [${res.data.eligibility.status.toUpperCase()}].`);
        inspectCandidate(selectedCandidate);
        fetchCandidates();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Eligibility evaluation failed'));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'eligible':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Eligible</span>;
      case 'ineligible':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> Ineligible</span>;
      case 'registered':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Registered</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>{status}</span>;
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
              <UserCheck style={{ color: '#38bdf8', width: '28px', height: '28px' }} />
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
                {isTpAdmin ? 'Candidates & Learners' : 'Candidate Profile & Eligibility Engine Portal'}
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.6 }}>
              {isTpAdmin
                ? 'View and manage candidate records associated with your Training Partner organisation and accredited Training Centres.'
                : 'Tenant-safe auto-generated candidate numbers (`CND-2026-XXXXX`), document verification engine (Aadhaar / Govt ID), and configurable eligibility evaluation rule engine.'}
            </p>
          </div>

          <button
            onClick={() => setShowAddCandidateModal(true)}
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
            Register Candidate
          </button>
        </div>

        {/* Filters Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0 0.75rem' }}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by candidate number, name, email, or mobile..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.6rem', width: '100%', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '0 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">All Eligibility Statuses</option>
            <option value="registered">Registered</option>
            <option value="eligible">Eligible</option>
            <option value="ineligible">Ineligible</option>
          </select>

          <button
            type="submit"
            style={{ background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', padding: '0 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            Filter
          </button>
        </form>
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

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCandidate ? '1fr 1.1fr' : '1fr', gap: '2rem' }}>
        
        {/* Left Column: Candidates Directory List */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>
            Registered Candidates Directory
          </h3>

          {loading ? (
            <p style={{ color: '#64748b' }}>Loading candidate profiles...</p>
          ) : candidates.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No candidate profiles found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {candidates.map(cand => {
                const isSelected = selectedCandidate?.id === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => inspectCandidate(cand)}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                          {cand.candidate_no}
                        </span>
                        <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1.05rem', color: '#0f172a' }}>
                          {cand.first_name} {cand.last_name}
                        </h4>
                      </div>
                      {getStatusBadge(cand.status)}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                      <span>Email: <strong>{cand.email || 'N/A'}</strong></span>
                      <span>Mobile: <strong>{cand.mobile || 'N/A'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                      <span>Documents: {cand.documents_count ?? 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Evaluate & Verify <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Profile Detail, Documents, & Eligibility Engine */}
        {selectedCandidate && candidateDetails && (
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>TENANT-SAFE CANDIDATE PROFILE</span>
                <h3 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: '#0f172a' }}>
                  {candidateDetails.first_name} {candidateDetails.last_name}
                </h3>
                <code style={{ fontSize: '0.85rem', color: '#64748b' }}>{candidateDetails.candidate_no}</code>
              </div>
              {getStatusBadge(candidateDetails.status)}
            </div>

            {/* Configurable Eligibility Engine Action Card */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} style={{ color: '#38bdf8' }} /> Configurable Eligibility Engine
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Runs automated rules: Minimum age check (18+), Govt ID verification, and education requirement validation.
                  </p>
                </div>
                <button
                  onClick={handleRunEligibilityEngine}
                  style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Evaluate Eligibility
                </button>
              </div>

              {/* Evaluation Engine Result Output */}
              {evalResult && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>Evaluation Decision:</strong>
                    <span style={{ color: evalResult.status === 'eligible' ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      {evalResult.status.toUpperCase()}
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#cbd5e1' }}>
                    {evalResult.reasons_json?.evaluated_rules?.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Profile Info Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Date of Birth</span>
                <strong style={{ color: '#0f172a' }}>{candidateDetails.dob || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Gender</span>
                <strong style={{ color: '#0f172a' }}>{candidateDetails.gender}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Highest Qualification</span>
                <strong style={{ color: '#0f172a' }}>{candidateDetails.education_json?.highest_qualification || '12th Pass'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Specialisation</span>
                <strong style={{ color: '#0f172a' }}>{candidateDetails.education_json?.specialisation || 'General'}</strong>
              </div>
            </div>

            {/* Candidate Documents Verification Table */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
                  Candidate Identity & Verification Documents
                </h4>
                <button
                  onClick={() => setShowUploadDocModal(true)}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Upload Document
                </button>
              </div>

              {candidateDetails.documents.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No verification documents uploaded for this candidate yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {candidateDetails.documents.map(doc => (
                    <div key={doc.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#0f172a', textTransform: 'uppercase' }}>{doc.document_type}</strong>
                          {doc.document_no && <code style={{ fontSize: '0.75rem', color: '#64748b' }}>No: {doc.document_no}</code>}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Key: {doc.storage_key} {doc.verifier ? `• Verified by ${doc.verifier.name}` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {doc.verified ? (
                          <button
                            onClick={() => handleVerifyDoc(doc.id, false)}
                            style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            ✓ Verified (Click to Unverify)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyDoc(doc.id, true)}
                            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Verify Document
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: REGISTER CANDIDATE */}
      {/* ========================================== */}
      {showAddCandidateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Register Candidate Profile</h3>

            <form onSubmit={handleRegisterCandidate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh"
                    value={candidateForm.first_name}
                    onChange={e => setCandidateForm({ ...candidateForm, first_name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kumar"
                    value={candidateForm.last_name}
                    onChange={e => setCandidateForm({ ...candidateForm, last_name: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={candidateForm.dob}
                    onChange={e => setCandidateForm({ ...candidateForm, dob: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Gender</label>
                  <select
                    value={candidateForm.gender}
                    onChange={e => setCandidateForm({ ...candidateForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Email</label>
                  <input
                    type="email"
                    placeholder="e.g. rajesh@example.com"
                    value={candidateForm.email}
                    onChange={e => setCandidateForm({ ...candidateForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Mobile</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={candidateForm.mobile}
                    onChange={e => setCandidateForm({ ...candidateForm, mobile: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              {tpCentres.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Assigned Training Centre (Optional)</label>
                  <select
                    value={candidateForm.training_centre_id}
                    onChange={e => setCandidateForm({ ...candidateForm, training_centre_id: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="">Default (Direct Partner Affiliation)</option>
                    {tpCentres.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Highest Qualification</label>
                <input
                  type="text"
                  value={candidateForm.highest_qualification}
                  onChange={e => setCandidateForm({ ...candidateForm, highest_qualification: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Register & Assign ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: UPLOAD DOCUMENT */}
      {/* ========================================== */}
      {showUploadDocModal && selectedCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Upload Verification Document</h3>

            <form onSubmit={handleUploadDoc}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Document Type</label>
                <select
                  value={docForm.document_type}
                  onChange={e => setDocForm({ ...docForm, document_type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="education_cert">Education Marksheet / Certificate</option>
                  <option value="photo">Passport Photo</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Document ID / Aadhaar No.</label>
                <input
                  type="text"
                  placeholder="e.g. 5432-8765-1092"
                  value={docForm.document_no}
                  onChange={e => setDocForm({ ...docForm, document_no: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadDocModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Upload & Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
