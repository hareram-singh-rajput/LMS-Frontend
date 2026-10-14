import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Enrolments() {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'b2c_catalog' | 'b2b_bulk'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data states
  const [enrolments, setEnrolments] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // B2C Single Enrolment Form State
  const [showB2CModal, setShowB2CModal] = useState(false);
  const [b2cForm, setB2cForm] = useState({
    candidate_id: '',
    programme_course_id: '',
    batch_id: '',
  });

  // B2B Bulk Import State
  const [b2bOfferingId, setB2bOfferingId] = useState('');
  const [b2bBatchId, setB2bBatchId] = useState('');
  const [bulkRawJson, setBulkRawJson] = useState(JSON.stringify([
    { first_name: 'Kabir', last_name: 'Mehta', email: 'kabir.mehta@techcorp.com', mobile: '+919812345678', gender: 'male', dob: '2001-03-12' },
    { first_name: 'Ananya', last_name: 'Roy', email: 'ananya.roy@techcorp.com', mobile: '+919812345679', gender: 'female', dob: '2002-07-25' },
    { first_name: 'Dev', last_name: 'Singh', email: 'dev.singh@techcorp.com', mobile: '+919812345680', gender: 'male', dob: '2000-11-05' }
  ], null, 2));
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchEnrolmentsData();
  }, []);

  const fetchEnrolmentsData = async () => {
    setLoading(true);
    try {
      const [enrolRes, offeringsRes, batchesRes, candidatesRes] = await Promise.all([
        api.get('/enrolments'),
        api.get('/offerings'),
        api.get('/batches'),
        api.get('/candidates'),
      ]);

      setEnrolments(enrolRes.data.data?.data || enrolRes.data.data || []);
      const offList = offeringsRes.data.data?.data || offeringsRes.data.data || [];
      setOfferings(offList);
      if (offList.length > 0) setB2bOfferingId(offList[0].id);

      const batchList = batchesRes.data.data?.data || batchesRes.data.data || [];
      setBatches(batchList);
      if (batchList.length > 0) setB2bBatchId(batchList[0].id);

      setCandidates(candidatesRes.data.data?.data || candidatesRes.data.data || []);
    } catch (err) {
      console.error('Error fetching enrolment data:', err);
      setMessage({ type: 'danger', text: 'Failed to load enrolment records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleB2CSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enrolments/b2c', b2cForm);
      setMessage({ type: 'success', text: 'Candidate successfully enrolled via B2C pipeline!' });
      setShowB2CModal(false);
      fetchEnrolmentsData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'B2C enrolment failed.' });
    }
  };

  const handleScanB2BBulkRoster = async () => {
    if (!b2bOfferingId) {
      setMessage({ type: 'danger', text: 'Please select a Course Offering for B2B bulk import.' });
      return;
    }

    let parsedRows = [];
    try {
      parsedRows = JSON.parse(bulkRawJson);
      if (!Array.isArray(parsedRows) || parsedRows.length === 0) throw new Error();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Invalid JSON upload format. Provide an array of candidate objects.' });
      return;
    }

    setScanning(true);
    setDiagnosticReport(null);
    try {
      const res = await api.post('/enrolments/b2b-bulk', {
        programme_course_id: b2bOfferingId,
        batch_id: b2bBatchId || null,
        rows: parsedRows,
        confirm: false,
      });

      setDiagnosticReport(res.data);
      setMessage({ type: 'info', text: 'Diagnostic scan complete. Inspect row-level summary below.' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Bulk diagnostic scan failed.' });
    } finally {
      setScanning(false);
    }
  };

  const handleCommitB2BBulkImport = async () => {
    if (!diagnosticReport || !diagnosticReport.summary?.can_commit) return;

    setImporting(true);
    try {
      const parsedRows = JSON.parse(bulkRawJson);
      const res = await api.post('/enrolments/b2b-bulk', {
        programme_course_id: b2bOfferingId,
        batch_id: b2bBatchId || null,
        rows: parsedRows,
        confirm: true,
      });

      setMessage({ type: 'success', text: res.data.message });
      setDiagnosticReport(null);
      fetchEnrolmentsData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Atomic bulk commit failed.' });
    } finally {
      setImporting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/enrolments/${id}/status`, { status });
      setMessage({ type: 'success', text: `Enrolment status updated to '${status}'!` });
      fetchEnrolmentsData();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to update enrolment status.' });
    }
  };

  const getSourceBadgeClass = (source) => {
    return source === 'b2c' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-purple-50 text-purple-700 border-purple-200';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'completed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'withdrawn':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
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
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-sky-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Enrolment & Bulk Roster Engine
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Candidate Enrolments & B2B Bulk Roster Pipelines</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Process individual B2C course registrations and execute atomic B2B/B2G bulk roster imports with real-time row diagnostics and capacity validation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowB2CModal(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
            >
              + Single B2C Enrolment
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

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'directory'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Master Enrolment Directory ({enrolments.length})
        </button>
        <button
          onClick={() => setActiveTab('b2c_catalog')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'b2c_catalog'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          B2C Course Catalog ({offerings.length})
        </button>
        <button
          onClick={() => setActiveTab('b2b_bulk')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'b2b_bulk'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          B2B / B2G Bulk Roster Import Engine
        </button>
      </div>

      {/* TAB 1: MASTER ENROLMENT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Enrolled Learner Records</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {enrolments.length} Total Enrolments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                  <th className="p-3">Candidate</th>
                  <th className="p-3">Course / Programme</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No enrolments found. Click "+ Single B2C Enrolment" or navigate to "B2B Bulk Import" tab to enroll candidates.
                    </td>
                  </tr>
                ) : (
                  enrolments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-900">{enr.candidate?.first_name} {enr.candidate?.last_name}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{enr.candidate?.candidate_no}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {enr.offering?.course?.name || enr.offering?.programme?.name || 'Standard Offering'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] ${getSourceBadgeClass(enr.source)}`}>
                          {enr.source}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {enr.batch?.code || 'Unassigned Batch'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] ${getStatusBadgeClass(enr.status)}`}>
                          {enr.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {enr.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(enr.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200"
                          >
                            Complete
                          </button>
                        )}
                        {enr.status === 'active' && (
                          <button
                            onClick={() => handleUpdateStatus(enr.id, 'withdrawn')}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold rounded border border-amber-200"
                          >
                            Withdraw
                          </button>
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

      {/* TAB 2: B2C COURSE CATALOG */}
      {activeTab === 'b2c_catalog' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">B2C Course Offering Catalog</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {offerings.map((off) => {
              const feeConfig = off.fee_config_json || {};
              return (
                <div key={off.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                      {feeConfig.offering_code || off.id.slice(0, 8)}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{off.course?.name || off.programme?.name || 'National Qualification Course'}</h3>
                    <p className="text-xs text-slate-500">{off.programme?.description || 'Hands-on Web Engineering & Cloud API development.'}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Tuition Fee</span>
                      <span className="font-bold text-slate-900 text-sm">₹{feeConfig.tuition_fee || 15000}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">GST Tax</span>
                      <span className="font-bold text-slate-700">{feeConfig.tax_percent || 18}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-medium block">Delivery</span>
                      <span className="font-bold text-sky-700 uppercase text-[10px]">{feeConfig.delivery_mode || 'Blended'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setB2cForm({ ...b2cForm, programme_course_id: off.id });
                      setShowB2CModal(true);
                    }}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    Enroll Candidate (B2C)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: B2B BULK ROSTER IMPORT ENGINE */}
      {activeTab === 'b2b_bulk' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">B2B / B2G Bulk Roster Import Pipeline</h2>
            <p className="text-xs text-slate-500">Upload candidate roster array to run row-level diagnostic validation prior to atomic DB commit.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Target Course Offering *</label>
              <select
                value={b2bOfferingId}
                onChange={(e) => setB2bOfferingId(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-sky-500"
              >
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.course?.name || o.programme?.name} ({o.fee_config_json?.offering_code || o.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assign Batch (Optional)</label>
              <select
                value={b2bBatchId}
                onChange={(e) => setB2bBatchId(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Unassigned Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} (Capacity: {b.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <label className="font-semibold text-slate-700">JSON Payload / Roster Dataset</label>
              <button
                onClick={() => setBulkRawJson(JSON.stringify([
                  { first_name: 'Rahul', last_name: 'Verma', email: `rahul.${Date.now()}@corporate.com`, mobile: '+919800011122' },
                  { first_name: 'Sneha', last_name: 'Gupta', email: `sneha.${Date.now()}@corporate.com`, mobile: '+919800011123' },
                  { first_name: 'Amit', last_name: 'Kumar', email: `rahul.${Date.now()}@corporate.com`, mobile: '+919800011122' } // intentional duplicate check
                ], null, 2))}
                className="text-sky-600 font-semibold hover:underline"
              >
                Load Sample Roster Data
              </button>
            </div>
            <textarea
              rows={8}
              value={bulkRawJson}
              onChange={(e) => setBulkRawJson(e.target.value)}
              className="w-full rounded-xl border-slate-200 text-xs p-3 border font-mono focus:ring-2 focus:ring-sky-500 bg-slate-900 text-slate-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleScanB2BBulkRoster}
              disabled={scanning}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              {scanning ? 'Scanning...' : '1. Run Row Diagnostic Scan'}
            </button>
          </div>

          {/* Row-level Diagnostic Scan Report */}
          {diagnosticReport && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Bulk Roster Diagnostic Scan Results</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                    Valid: {diagnosticReport.summary?.valid_count}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
                    Errors: {diagnosticReport.summary?.error_count}
                  </span>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                {diagnosticReport.diagnostics?.map((diag) => (
                  <div
                    key={diag.row}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                      diag.status === 'valid' ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-slate-500">Row #{diag.row}:</span>
                        <span className="text-slate-900">{diag.name}</span>
                        <span className="text-slate-400 font-mono">({diag.email})</span>
                      </div>
                      {diag.errors?.length > 0 && (
                        <div className="mt-1 text-rose-700 font-semibold space-y-0.5">
                          {diag.errors.map((err, i) => (
                            <p key={i}>• {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      diag.status === 'valid' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                    }`}>
                      {diag.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {diagnosticReport.summary?.can_commit
                    ? 'All rows validated successfully. Ready for atomic DB commit.'
                    : 'Resolve row-level errors above before committing roster upload.'}
                </p>
                <button
                  disabled={!diagnosticReport.summary?.can_commit || importing}
                  onClick={handleCommitB2BBulkImport}
                  className="px-5 py-2.5 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {importing ? 'Importing...' : '2. Commit Atomic Bulk Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: B2C SINGLE ENROLMENT */}
      {showB2CModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">B2C Candidate Enrolment</h3>
              <button onClick={() => setShowB2CModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleB2CSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Candidate Profile *</label>
                <select
                  required
                  value={b2cForm.candidate_id}
                  onChange={(e) => setB2cForm({ ...b2cForm, candidate_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Registered Candidate --</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.candidate_no})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Offering *</label>
                <select
                  required
                  value={b2cForm.programme_course_id}
                  onChange={(e) => setB2cForm({ ...b2cForm, programme_course_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">-- Choose Offering --</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.course?.name || o.programme?.name} ({o.fee_config_json?.offering_code || o.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Batch (Optional)</label>
                <select
                  value={b2cForm.batch_id}
                  onChange={(e) => setB2cForm({ ...b2cForm, batch_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Unassigned Batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} (Capacity: {b.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowB2CModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-500 shadow-sm">
                  Enroll Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
