import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Certificates() {
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates' | 'verify_portal'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data states
  const [certificates, setCertificates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [enrolments, setEnrolments] = useState([]);

  // Public Verification Portal State
  const [verifySearchToken, setVerifySearchToken] = useState('VERIFY-NATIONAL-2026-001');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Forms & Selections
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState('');
  const [eligibilityCheck, setEligibilityCheck] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('Document discrepancy identified upon audit.');

  useEffect(() => {
    fetchCertificatesData();
  }, []);

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      const [certsRes, candidatesRes] = await Promise.all([
        api.get('/certificates'),
        api.get('/candidates'),
      ]);

      setCertificates(certsRes.data.data?.data || certsRes.data.data || []);
      const candList = candidatesRes.data.data?.data || candidatesRes.data.data || [];
      setCandidates(candList);

      // Auto verify sample token for portal preview
      handlePublicVerify('VERIFY-NATIONAL-2026-001');
    } catch (err) {
      console.error('Error loading certification data:', err);
      setMessage({ type: 'danger', text: 'Failed to load certificate records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateEligibility = async (enrolmentId) => {
    setSelectedEnrolmentId(enrolmentId);
    if (!enrolmentId) return;

    setEvaluating(true);
    try {
      const res = await api.post('/certificates/evaluate-eligibility', { enrolment_id: enrolmentId });
      setEligibilityCheck(res.data.data);
    } catch (err) {
      console.error('Eligibility check failed:', err);
      setMessage({ type: 'danger', text: 'Eligibility evaluation failed.' });
    } finally {
      setEvaluating(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!selectedEnrolmentId) return;

    try {
      const res = await api.post('/certificates/generate', { enrolment_id: selectedEnrolmentId });
      setMessage({ type: 'success', text: `Certificate '${res.data.data.certificate_no}' issued successfully!` });
      setShowIssueModal(false);
      fetchCertificatesData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Certificate generation failed.' });
    }
  };

  const handleRevokeCertificate = async (e) => {
    e.preventDefault();
    if (!selectedCert) return;

    try {
      await api.post(`/certificates/${selectedCert.id}/revoke`, { reason: revokeReason });
      setMessage({ type: 'info', text: `Certificate ${selectedCert.certificate_no} revoked.` });
      setShowRevokeModal(false);
      fetchCertificatesData();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Revocation failed.' });
    }
  };

  const handleReissueCertificate = async (certId) => {
    if (!window.confirm('Reissuing will supersede the previous certificate. Continue?')) return;

    try {
      const res = await api.post(`/certificates/${certId}/reissue`);
      setMessage({ type: 'success', text: `Certificate reissued successfully as '${res.data.data.certificate_no}'!` });
      fetchCertificatesData();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Reissuance failed.' });
    }
  };

  const handlePublicVerify = async (tokenToVerify) => {
    const query = tokenToVerify || verifySearchToken;
    if (!query) return;

    setVerifying(true);
    try {
      const res = await api.get(`/certificates/verify/${encodeURIComponent(query)}`);
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({
        verified: false,
        message: err.response?.data?.message || 'Invalid certificate verification token or certificate number.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'issued':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'revoked':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'superseded':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              National Credential & Verification Hub
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Certification Engine & Public QR-Code Verification</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Automate multi-criteria eligibility evaluations, issue tamper-evident QR-coded national skill certificates, process revocations, and run public credential verifications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIssueModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
            >
              + Evaluate & Issue Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notifications */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          message.type === 'danger' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-sky-50 text-sky-800 border-sky-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })} className="hover:opacity-75">✕</button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'certificates'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Issued Certificates Registry ({certificates.length})
        </button>
        <button
          onClick={() => setActiveTab('verify_portal')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'verify_portal'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Public Verification Portal
        </button>
      </div>

      {/* TAB 1: ISSUED CERTIFICATES REGISTRY */}
      {activeTab === 'certificates' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">National Skill Certificates Directory</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {certificates.length} Total Certificates
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                  <th className="p-3">Certificate No</th>
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Qualification</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No certificates issued yet. Click "+ Evaluate & Issue Certificate" to start.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-indigo-700">
                        {cert.certificate_no}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{cert.candidate?.first_name} {cert.candidate?.last_name}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{cert.candidate?.candidate_no}</span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {cert.enrolment?.offering?.course?.name || cert.enrolment?.offering?.programme?.name || 'National Skill Certification'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(cert.issued_at).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] ${getStatusBadgeClass(cert.status)}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCert(cert);
                            setShowPreviewModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md border border-slate-200"
                        >
                          View Certificate
                        </button>
                        {cert.status === 'issued' && (
                          <>
                            <button
                              onClick={() => handleReissueCertificate(cert.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-md border border-amber-200"
                            >
                              Reissue
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCert(cert);
                                setShowRevokeModal(true);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-md border border-rose-200"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PUBLIC VERIFICATION PORTAL */}
      {activeTab === 'verify_portal' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xl space-y-6 text-center">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">National Credential Verification Portal</h2>
              <p className="text-xs text-slate-500 mt-1">Enter a Certificate Number or Verification Token to verify authentic Skill Council credentials.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handlePublicVerify(); }} className="flex gap-2 max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Enter Certificate No or Token e.g. VERIFY-NATIONAL-2026-001"
                value={verifySearchToken}
                onChange={(e) => setVerifySearchToken(e.target.value)}
                className="flex-1 rounded-xl border-slate-200 text-xs p-3 border focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner"
              />
              <button
                type="submit"
                disabled={verifying}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
              >
                {verifying ? 'Verifying...' : 'Verify Credential'}
              </button>
            </form>
          </div>

          {/* Verification Seal Preview Result */}
          {verificationResult && (
            <div className={`rounded-2xl border p-6 shadow-xl space-y-5 transition ${
              verificationResult.verified
                ? 'bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-emerald-500/40'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    verificationResult.verified ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {verificationResult.verified ? '✓' : '✕'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">
                      {verificationResult.verified ? 'AUTHENTIC NATIONAL CREDENTIAL' : 'INVALID / REVOKED CREDENTIAL'}
                    </h3>
                    <p className="text-xs opacity-75">Verification Hash & Digital Signature Checked</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  verificationResult.verified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {verificationResult.data?.status || 'INVALID'}
                </span>
              </div>

              {verificationResult.verified && verificationResult.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Candidate Details</span>
                    <p className="text-sm font-bold text-white">{verificationResult.data.candidate?.full_name}</p>
                    <p className="text-slate-300 font-mono">Candidate ID: {verificationResult.data.candidate?.candidate_no}</p>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Qualification Title</span>
                    <p className="text-sm font-bold text-emerald-300">{verificationResult.data.qualification?.title}</p>
                    <p className="text-slate-300 font-mono">Cert No: {verificationResult.data.certificate_no}</p>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5 md:col-span-2 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Issuing Authority</span>
                      <p className="text-xs font-bold text-white">{verificationResult.data.issuing_authority?.council_name}</p>
                      <p className="text-[11px] text-slate-400">Issued On: {new Date(verificationResult.data.issued_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-slate-400 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700">
                      Token: {verificationResult.data.verification_token}
                    </div>
                  </div>
                </div>
              )}

              {!verificationResult.verified && (
                <p className="text-xs">{verificationResult.message}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: EVALUATE & ISSUE CERTIFICATE */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Certificate Eligibility Evaluator</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Candidate Enrolment *</label>
                <select
                  value={selectedEnrolmentId}
                  onChange={(e) => handleEvaluateEligibility(e.target.value)}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Candidate Enrolment --</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.candidate_no})
                    </option>
                  ))}
                </select>
              </div>

              {evaluating && <p className="text-xs text-indigo-600 font-semibold animate-pulse">Running eligibility evaluation checklist...</p>}

              {eligibilityCheck && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Eligibility Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      eligibilityCheck.is_eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {eligibilityCheck.is_eligible ? 'ELIGIBLE TO ISSUE' : 'INELIGIBLE'}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span>Identity Verification:</span>
                      <span className="font-bold text-emerald-600">✓ {eligibilityCheck.checklist?.document_verification?.details}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Curriculum Progress:</span>
                      <span className="font-bold text-emerald-600">✓ {eligibilityCheck.checklist?.training_completion?.details}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Exam Pass Cutoff:</span>
                      <span className="font-bold text-emerald-600">✓ {eligibilityCheck.checklist?.assessment_result?.details}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button onClick={() => setShowIssueModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button
                  disabled={!eligibilityCheck || !eligibilityCheck.is_eligible}
                  onClick={handleGenerateCertificate}
                  className="px-4 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-semibold hover:bg-emerald-500 shadow-sm"
                >
                  Generate QR Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CERTIFICATE PREVIEW & QR CODE */}
      {showPreviewModal && selectedCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 border-4 border-amber-600/30">
            <div className="text-center space-y-2 pb-4 border-b border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                National Sector Skill Council Certification
              </span>
              <h2 className="text-2xl font-serif font-bold text-slate-900">Certificate of Qualification Competency</h2>
              <p className="text-xs text-slate-500">Certificate No: <span className="font-mono font-bold text-indigo-700">{selectedCert.certificate_no}</span></p>
            </div>

            <div className="text-center space-y-4 py-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">This is to certify that</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedCert.candidate?.first_name} {selectedCert.candidate?.last_name}</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                has successfully completed all prescribed training modules, practical evaluations, and national assessment cutoffs for
              </p>
              <h4 className="text-lg font-bold text-emerald-700">
                {selectedCert.enrolment?.offering?.course?.name || selectedCert.enrolment?.offering?.programme?.name || 'Full-Stack Web & Cloud Engineering'}
              </h4>
            </div>

            {/* QR Verification Seal Code Simulation */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Verification Hash Token</span>
                <p className="text-xs font-mono font-bold text-slate-800">{selectedCert.verification_token}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Valid From: {selectedCert.valid_from}</p>
              </div>

              <div className="w-20 h-20 bg-slate-900 text-white p-2 rounded-xl flex flex-col items-center justify-center font-mono text-[9px] text-center border border-slate-700 shadow">
                <span className="text-[14px]">📱</span>
                <span className="mt-1 font-bold text-emerald-400">SCAN QR</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVOKE CERTIFICATE */}
      {showRevokeModal && selectedCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-rose-700">Revoke Certificate</h3>
              <button onClick={() => setShowRevokeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRevokeCertificate} className="space-y-4 text-xs">
              <p className="text-slate-600">
                You are revoking certificate <span className="font-mono font-bold text-rose-700">{selectedCert.certificate_no}</span>. This action is permanently audited.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Revocation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRevokeModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-500 shadow-sm">
                  Confirm Revocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
