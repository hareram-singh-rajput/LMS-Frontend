import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  Plus,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  FileSpreadsheet,
  MapPin,
  Phone,
  Mail,
  Building
} from 'lucide-react';

export default function Organisations() {
  const { user } = useAuthStore();
  const isSuperOrOfficer = user?.roles?.some(r => ['super_admin', 'council_officer'].includes(r));
  const isTpAdmin = user?.roles?.includes('tp_admin');

  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Org for inspection & TC mapping
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [centres, setCentres] = useState([]);

  // Modals & Notifications
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showAddCentreModal, setShowAddCentreModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [orgForm, setOrgForm] = useState({
    type: 'training_partner',
    code: '',
    name: '',
    registration_no: '',
    email: '',
    phone: '',
    parent_id: '',
    address_json: { street: '', city: '', state: '', pincode: '' }
  });

  const [centreForm, setCentreForm] = useState({
    code: '',
    name: '',
    capacity: 30
  });

  // Bulk import JSON state
  const [bulkImportJson, setBulkImportJson] = useState(JSON.stringify([
    {
      "type": "training_partner",
      "code": "TP-SKILL-101",
      "name": "Apex Skill Development Partner",
      "registration_no": "REG-2026-991",
      "email": "contact@apexskills.org",
      "phone": "+91 9876543210"
    },
    {
      "type": "training_partner",
      "code": "TP-SKILL-102",
      "name": "National Tech Training Academy",
      "registration_no": "REG-2026-992",
      "email": "info@techacademy.edu",
      "phone": "+91 9876543211"
    }
  ], null, 2));

  const [bulkReport, setBulkReport] = useState(null);

  useEffect(() => {
    fetchOrganisations();
  }, [typeFilter, statusFilter]);

  const fetchOrganisations = () => {
    setLoading(true);
    let url = '/organisations?per_page=50';
    if (typeFilter) url += `&type=${typeFilter}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

    apiClient.get(url)
      .then(res => {
        setOrganisations(res.data.data.data || res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg('Failed to fetch organisations directory');
        setLoading(false);
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrganisations();
  };

  const inspectOrg = (org) => {
    setSelectedOrg(org);
    apiClient.get(`/organisations/${org.id}/centres`)
      .then(res => setCentres(res.data.data))
      .catch(err => console.error('Failed to fetch centres', err));
  };

  const handleCreateOrg = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.post('/organisations', orgForm)
      .then(res => {
        setSuccessMsg(`Organisation [${res.data.data.name}] onboarded successfully.`);
        setShowAddOrgModal(false);
        setOrgForm({ type: 'training_partner', code: '', name: '', registration_no: '', email: '', phone: '', parent_id: '', address_json: { street: '', city: '', state: '', pincode: '' } });
        fetchOrganisations();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to onboard organisation'));
  };

  const handleTransitionStatus = (orgId, newStatus) => {
    setErrorMsg('');
    setSuccessMsg('');
    apiClient.put(`/organisations/${orgId}/status`, { status: newStatus })
      .then(res => {
        setSuccessMsg(`Organisation status updated to [${newStatus}].`);
        fetchOrganisations();
        if (selectedOrg && selectedOrg.id === orgId) {
          setSelectedOrg(res.data.data);
        }
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to update status'));
  };

  const handleCreateCentre = (e) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.post(`/organisations/${selectedOrg.id}/centres`, centreForm)
      .then(res => {
        setSuccessMsg(`Training Centre [${res.data.data.name}] added successfully.`);
        setShowAddCentreModal(false);
        setCentreForm({ code: '', name: '', capacity: 30 });
        inspectOrg(selectedOrg);
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to add Training Centre'));
  };

  const handleBulkImportSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setBulkReport(null);

    try {
      const parsedRows = JSON.parse(bulkImportJson);
      apiClient.post('/organisations/bulk-import', { rows: parsedRows })
        .then(res => {
          setSuccessMsg(res.data.message);
          setBulkReport(res.data);
          fetchOrganisations();
        })
        .catch(err => setErrorMsg(err.response?.data?.message || 'Bulk import failed'));
    } catch (err) {
      setErrorMsg('Invalid JSON format. Please format as a JSON array of objects.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
      case 'approved':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Active</span>;
      case 'under_review':
      case 'submitted':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Under Review</span>;
      case 'draft':
        return <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>Draft</span>;
      case 'rejected':
      case 'suspended':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={12} /> {status.toUpperCase()}</span>;
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
              <Building2 style={{ color: '#38bdf8', width: '28px', height: '28px' }} />
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
                {isTpAdmin ? 'My Organisation & Training Centres' : 'Organisation & Partner Management Portal'}
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.6 }}>
              {isTpAdmin
                ? 'View your registered Training Partner organisation profile and manage accredited Training Centres affiliated with your partner.'
                : 'Onboard and govern Training Partners (TP), Training Centers (TC), Employers, and Government entities. Supports approval state machine workflows, training centre mapping, and controlled bulk import.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {isSuperOrOfficer && (
              <>
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '0.65rem 1.1rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Controlled Bulk Import
                </button>

                <button
                  onClick={() => setShowAddOrgModal(true)}
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
                  Onboard Organisation
                </button>
              </>
            )}

            {isTpAdmin && (
              <button
                onClick={() => {
                  const tp = organisations.find(o => o.type === 'training_partner') || organisations[0];
                  if (tp) {
                    setSelectedOrg(tp);
                    setShowAddCentreModal(true);
                  }
                }}
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
                Add Training Centre
              </button>
            )}
          </div>
        </div>

        {/* Filters Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0 0.75rem' }}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by organisation name, code, or registration no..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.6rem', width: '100%', outline: 'none', fontSize: '0.85rem' }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '0 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">All Types</option>
            <option value="training_partner">Training Partner (TP)</option>
            <option value="training_centre">Training Centre (TC)</option>
            {isSuperOrOfficer && (
              <>
                <option value="employer">Employer</option>
                <option value="institution">Institution</option>
                <option value="government">Government</option>
                <option value="council">Council</option>
              </>
            )}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '0 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
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

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedOrg ? '1fr 1.1fr' : '1fr', gap: '2rem' }}>
        
        {/* Left Column: Organisation Directory List */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: '#1e293b' }}>
            Registered Organisations Directory
          </h3>

          {loading ? (
            <p style={{ color: '#64748b' }}>Loading directory...</p>
          ) : organisations.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No organisations found matching filter criteria.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {organisations.map(org => {
                const isSelected = selectedOrg?.id === org.id;
                return (
                  <div
                    key={org.id}
                    onClick={() => inspectOrg(org)}
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
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                          {org.type.replace('_', ' ')}
                        </span>
                        <h4 style={{ margin: '0.35rem 0 0 0', fontSize: '1.05rem', color: '#0f172a' }}>{org.name}</h4>
                      </div>
                      {getStatusBadge(org.status)}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                      <span>Code: <strong>{org.code}</strong></span>
                      {org.registration_no && <span>Reg: <strong>{org.registration_no}</strong></span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                      <span>Training Centres: {org.training_centres_count ?? 0}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Inspect Profile <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Profile Detail & Training Centres Mapping */}
        {selectedOrg && (
          <div style={{ background: '#fff', borderRadius: '10px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  {selectedOrg.type.replace('_', ' ')} PROFILE
                </span>
                <h3 style={{ margin: '0.2rem 0', fontSize: '1.25rem', color: '#0f172a' }}>{selectedOrg.name}</h3>
                <code style={{ fontSize: '0.85rem', color: '#64748b' }}>Code: {selectedOrg.code}</code>
              </div>
              {getStatusBadge(selectedOrg.status)}
            </div>

            {/* Approval Workflow State Transition Bar */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                Governance Approval Workflow State Machine
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleTransitionStatus(selectedOrg.id, 'active')}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Approve & Activate
                </button>
                <button
                  onClick={() => handleTransitionStatus(selectedOrg.id, 'under_review')}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Move to Review
                </button>
                <button
                  onClick={() => handleTransitionStatus(selectedOrg.id, 'suspended')}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Suspend
                </button>
              </div>
            </div>

            {/* Profile Contact Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Email Address</span>
                <strong style={{ color: '#0f172a' }}>{selectedOrg.email || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Phone Number</span>
                <strong style={{ color: '#0f172a' }}>{selectedOrg.phone || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Registration No.</span>
                <strong style={{ color: '#0f172a' }}>{selectedOrg.registration_no || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Parent Entity</span>
                <strong style={{ color: '#0f172a' }}>{selectedOrg.parent ? selectedOrg.parent.name : 'Independent'}</strong>
              </div>
            </div>

            {/* Attached Training Centres Panel */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>
                  Attached Training Centres ({centres.length})
                </h4>
                <button
                  onClick={() => setShowAddCentreModal(true)}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Training Centre
                </button>
              </div>

              {centres.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No training centres mapped to this partner organisation yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {centres.map(tc => (
                    <div key={tc.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a' }}>{tc.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Code: {tc.code} • Capacity: {tc.capacity} trainees</span>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                        {tc.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: ONBOARD ORGANISATION */}
      {/* ========================================== */}
      {showAddOrgModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Onboard New Organisation</h3>

            <form onSubmit={handleCreateOrg}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Organisation Type</label>
                <select
                  value={orgForm.type}
                  onChange={e => setOrgForm({ ...orgForm, type: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="training_partner">Training Partner (TP)</option>
                  <option value="training_centre">Training Centre (TC)</option>
                  <option value="employer">Employer</option>
                  <option value="institution">Institution</option>
                  <option value="government">Government</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TP-SKILL-01"
                    value={orgForm.code}
                    onChange={e => setOrgForm({ ...orgForm, code: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Registration No</label>
                  <input
                    type="text"
                    placeholder="e.g. REG-2026-001"
                    value={orgForm.registration_no}
                    onChange={e => setOrgForm({ ...orgForm, registration_no: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Organisation Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Skill Academy Ltd."
                  value={orgForm.name}
                  onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Email</label>
                  <input
                    type="email"
                    value={orgForm.email}
                    onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Phone</label>
                  <input
                    type="text"
                    value={orgForm.phone}
                    onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddOrgModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save & Submit Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ADD TRAINING CENTRE */}
      {/* ========================================== */}
      {showAddCentreModal && selectedOrg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Add Training Centre under [{selectedOrg.code}]</h3>

            <form onSubmit={handleCreateCentre}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>TC Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TC-DELHI-01"
                  value={centreForm.code}
                  onChange={e => setCentreForm({ ...centreForm, code: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Training Centre Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Okhla Tech Skill Center"
                  value={centreForm.name}
                  onChange={e => setCentreForm({ ...centreForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Capacity (Trainees)</label>
                <input
                  type="number"
                  required
                  value={centreForm.capacity}
                  onChange={e => setCentreForm({ ...centreForm, capacity: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddCentreModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Training Centre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: CONTROLLED BULK IMPORT */}
      {/* ========================================== */}
      {showBulkImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '650px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Controlled Bulk Import Tool</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Import batch Training Partners and Training Centres with row-level validation and duplicate code detection.
            </p>

            <form onSubmit={handleBulkImportSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Import Payload (JSON Format)</label>
                <textarea
                  rows="8"
                  value={bulkImportJson}
                  onChange={e => setBulkImportJson(e.target.value)}
                  style={{ width: '100%', fontFamily: 'monospace', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                />
              </div>

              {bulkReport && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1rem', fontSize: '0.8rem' }}>
                  <strong>Import Summary:</strong> Total: {bulkReport.summary.total_processed} | Successful: <span style={{ color: '#16a34a', fontWeight: 700 }}>{bulkReport.summary.successful_count}</span> | Failed: <span style={{ color: '#dc2626', fontWeight: 700 }}>{bulkReport.summary.failed_count}</span>
                  {bulkReport.errors.length > 0 && (
                    <div style={{ marginTop: '0.5rem', color: '#dc2626' }}>
                      <strong>Row Errors:</strong>
                      <ul style={{ margin: '0.35rem 0 0 0', paddingLeft: '1.25rem' }}>
                        {bulkReport.errors.map((err, idx) => (
                          <li key={idx}>Line {err.line} [{err.code}]: {err.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Execute Bulk Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
