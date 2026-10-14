import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function TrainingOperations() {
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'trainers'
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Selected batch for detailed view/roster/sessions
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchSessions, setBatchSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceRoster, setAttendanceRoster] = useState([]);

  // Available options for modals
  const [offerings, setOfferings] = useState([]);
  const [centres, setCentres] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);

  // Modals state
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showScheduleSessionModal, setShowScheduleSessionModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showRegisterTrainerModal, setShowRegisterTrainerModal] = useState(false);

  // Form States
  const [batchForm, setBatchForm] = useState({
    programme_course_id: '',
    training_centre_id: '',
    trainer_id: '',
    code: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    capacity: 30,
  });

  const [sessionForm, setSessionForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '13:00',
    topic: '',
    trainer_id: '',
  });

  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [trainerForm, setTrainerForm] = useState({
    user_id: '',
    trainer_no: `TRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    specialisations: 'Full-Stack, React, Cloud Architecture',
    qualifications: 'B.Tech, TOT Certified',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, batchesRes, trainersRes, offeringsRes, candidatesRes] = await Promise.all([
        api.get('/training-operations/dashboard-stats'),
        api.get('/batches'),
        api.get('/trainers'),
        api.get('/offerings'),
        api.get('/candidates'),
      ]);

      setStats(statsRes.data.data);
      setBatches(batchesRes.data.data.data || batchesRes.data.data || []);
      setTrainers(trainersRes.data.data || []);
      setOfferings(offeringsRes.data.data?.data || offeringsRes.data.data || []);
      setAllCandidates(candidatesRes.data.data?.data || candidatesRes.data.data || []);
    } catch (err) {
      console.error('Failed to load training operations data:', err);
      setMessage({ type: 'danger', text: 'Error loading operational data from server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBatch = async (batch) => {
    setSelectedBatch(batch);
    try {
      const [batchDetailRes, sessionsRes] = await Promise.all([
        api.get(`/batches/${batch.id}`),
        api.get(`/batches/${batch.id}/sessions`)
      ]);
      setSelectedBatch(batchDetailRes.data.data);
      setBatchSessions(sessionsRes.data.data || []);
    } catch (err) {
      console.error('Error loading batch details:', err);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/batches', batchForm);
      setMessage({ type: 'success', text: `Batch '${batchForm.code}' created successfully!` });
      setShowCreateBatchModal(false);
      fetchDashboardData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to create batch.' });
    }
  };

  const handleEnrollCandidates = async (e) => {
    e.preventDefault();
    if (!selectedBatch || selectedCandidateIds.length === 0) return;

    try {
      await api.post(`/batches/${selectedBatch.id}/roster`, {
        candidate_ids: selectedCandidateIds
      });
      setMessage({ type: 'success', text: `Enrolled ${selectedCandidateIds.length} candidate(s) successfully!` });
      setSelectedCandidateIds([]);
      setShowRosterModal(false);
      handleSelectBatch(selectedBatch);
      fetchDashboardData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to enroll candidates.' });
    }
  };

  const handleWithdrawCandidate = async (candidateId) => {
    if (!selectedBatch) return;
    if (!window.confirm('Are you sure you want to withdraw this candidate from the batch roster?')) return;

    try {
      await api.delete(`/batches/${selectedBatch.id}/roster/${candidateId}`);
      setMessage({ type: 'info', text: 'Candidate withdrawn from roster.' });
      handleSelectBatch(selectedBatch);
      fetchDashboardData();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to withdraw candidate.' });
    }
  };

  const handleScheduleSession = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    try {
      await api.post(`/batches/${selectedBatch.id}/sessions`, sessionForm);
      setMessage({ type: 'success', text: 'Training session scheduled successfully!' });
      setShowScheduleSessionModal(false);
      handleSelectBatch(selectedBatch);
      fetchDashboardData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to schedule session.' });
    }
  };

  const handleOpenAttendanceModal = async (session) => {
    setSelectedSession(session);
    try {
      const res = await api.get(`/sessions/${session.id}/attendance`);
      setAttendanceRoster(res.data.data?.roster || []);
      setShowAttendanceModal(true);
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to fetch session attendance roster.' });
    }
  };

  const handleAttendanceChange = (candidateId, field, value) => {
    setAttendanceRoster(prev => prev.map(item => {
      if (item.candidate_id === candidateId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    try {
      const records = attendanceRoster.map(item => ({
        candidate_id: item.candidate_id,
        status: item.status,
        check_in_at: item.check_in_at || new Date().toISOString(),
        remarks: item.remarks,
        geo_lat: item.geo_lat || 28.6280,
        geo_long: item.geo_long || 77.2189,
        verification_method: item.verification_method || 'manual',
      }));

      await api.post(`/sessions/${selectedSession.id}/attendance`, { records });
      setMessage({ type: 'success', text: 'Attendance recorded successfully with audit trace!' });
      setShowAttendanceModal(false);
      handleSelectBatch(selectedBatch);
      fetchDashboardData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to record attendance.' });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in_training':
      case 'active':
      case 'present':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'planned':
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'late':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'absent':
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
      {/* Header & KPI Summary */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Training Operations & Attendance Hub
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Batch Scheduling & Session Attendance</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Manage operational training centers, assign master trainers, schedule batch timetables, enforce candidate roster validation, and log verified attendance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateBatchModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Schedule New Batch
            </button>
          </div>
        </div>

        {/* Operational KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Batches</span>
            <div className="text-2xl font-bold text-white mt-1">{stats?.total_batches || 0}</div>
            <span className="text-xs text-indigo-400 font-medium">{stats?.active_batches || 0} currently in training</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Qualified Trainers</span>
            <div className="text-2xl font-bold text-white mt-1">{stats?.total_trainers || 0}</div>
            <span className="text-xs text-emerald-400 font-medium">Domain & TOT Certified</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Sessions</span>
            <div className="text-2xl font-bold text-white mt-1">{stats?.total_sessions || 0}</div>
            <span className="text-xs text-sky-400 font-medium">Scheduled & Completed</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Attendance Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats?.attendance_rate_percent || 0}%</div>
            <span className="text-xs text-slate-400 font-medium">{stats?.total_attendance_records || 0} verified check-ins</span>
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
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="hover:opacity-75">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'batches'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Training Batches & Timetables ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('trainers')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'trainers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Trainers Directory ({trainers.length})
        </button>
      </div>

      {/* TAB 1: BATCHES & TIMETABLE OPERATIONS */}
      {activeTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Batches List Sidebar */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center justify-between">
              <span>Operational Batches</span>
              <span className="text-xs font-normal text-slate-500">Select batch to inspect</span>
            </h2>

            {batches.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500">
                No batches found. Click "Schedule New Batch" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {batches.map((b) => {
                  const isSelected = selectedBatch?.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => handleSelectBatch(b)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-md ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{b.code}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(b.status)}`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-medium">
                            {b.offering?.course?.name || b.offering?.programme?.name || 'Standard Offering'}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {b.enrolments_count || 0} / {b.capacity} enrolled
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {b.training_centre?.name || 'Online Center'}
                        </span>
                        <span className="font-medium text-slate-600">
                          {b.start_date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Batch Workspace & Roster / Sessions */}
          <div className="lg:col-span-7">
            {selectedBatch ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Batch Header & Quick Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{selectedBatch.code}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(selectedBatch.status)}`}>
                        {selectedBatch.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Start Date: <span className="font-semibold text-slate-700">{selectedBatch.start_date}</span> |
                      Capacity: <span className="font-semibold text-slate-700">{selectedBatch.capacity} Candidates</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRosterModal(true)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
                    >
                      Manage Roster ({selectedBatch.enrolments?.length || 0})
                    </button>
                    <button
                      onClick={() => setShowScheduleSessionModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      + Schedule Session
                    </button>
                  </div>
                </div>

                {/* Batch Timetable & Scheduled Sessions */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Batch Timetable & Scheduled Sessions ({batchSessions.length})</span>
                  </h4>

                  {batchSessions.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-6 text-center text-xs text-slate-500 border border-slate-200">
                      No sessions scheduled for this batch yet. Click "+ Schedule Session" above to create classroom timetables.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {batchSessions.map((session) => (
                        <div key={session.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                {session.session_date}
                              </span>
                              <span className="text-xs font-semibold text-slate-600">
                                {session.start_time} - {session.end_time}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadgeClass(session.status)}`}>
                                {session.status}
                              </span>
                            </div>
                            <h5 className="text-sm font-semibold text-slate-900 mt-1.5">{session.topic || 'General Training Session'}</h5>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Trainer: {session.trainer?.user?.name || selectedBatch.trainer?.user?.name || 'Assigned Instructor'}
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenAttendanceModal(session)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 self-start sm:self-center"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Log / Audit Attendance
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enrolled Candidate Roster Snapshot */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                    Enrolled Roster Snapshot ({selectedBatch.enrolments?.length || 0})
                  </h4>
                  {(!selectedBatch.enrolments || selectedBatch.enrolments.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">No candidates enrolled in batch roster.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {selectedBatch.enrolments.map((enr) => (
                        <div key={enr.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">
                              {enr.candidate?.first_name} {enr.candidate?.last_name}
                            </span>
                            <span className="text-slate-400 ml-2 font-mono">{enr.candidate?.candidate_no}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{enr.candidate?.email}</span>
                            <button
                              onClick={() => handleWithdrawCandidate(enr.candidate_id)}
                              className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                            >
                              Withdraw
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="font-semibold text-slate-600">No Batch Selected</p>
                <p className="text-xs mt-1">Select a batch from the sidebar to inspect timetables, manage rosters, or verify session attendance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRAINERS DIRECTORY */}
      {activeTab === 'trainers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Registered Master Trainers & Assessors</h2>
            <button
              onClick={() => setShowRegisterTrainerModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
            >
              + Register New Trainer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainers.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{t.user?.name || 'Registered Trainer'}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{t.trainer_no}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-700">Specialisations: </span>
                    {Array.isArray(t.specialisations_json) ? t.specialisations_json.join(', ') : 'Domain Expert'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Qualifications: </span>
                    {Array.isArray(t.qualifications_json) ? t.qualifications_json.join(', ') : 'TOT Certified'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Contact: {t.user?.email || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE BATCH */}
      {showCreateBatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Schedule New Training Batch</h3>
              <button onClick={() => setShowCreateBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Course Offering *</label>
                <select
                  required
                  value={batchForm.programme_course_id}
                  onChange={(e) => setBatchForm({ ...batchForm, programme_course_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Commercial Offering --</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.offering_code || o.id} — {o.programme?.name || 'Programme'} ({o.course?.name || 'Course'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026-WEB-02"
                    value={batchForm.code}
                    onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="500"
                    value={batchForm.capacity}
                    onChange={(e) => setBatchForm({ ...batchForm, capacity: parseInt(e.target.value) })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Trainer</label>
                <select
                  value={batchForm.trainer_id}
                  onChange={(e) => setBatchForm({ ...batchForm, trainer_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Unassigned --</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.name || t.trainer_no} ({t.trainer_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBatchModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 shadow-sm"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE ROSTER */}
      {showRosterModal && selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Batch Roster Management</h3>
                <p className="text-xs text-slate-500">Batch: {selectedBatch.code} (Capacity: {selectedBatch.capacity})</p>
              </div>
              <button onClick={() => setShowRosterModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollCandidates} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Select Candidates to Enroll into Roster</label>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2">
                  {allCandidates.map((c) => {
                    const isAlreadyEnrolled = selectedBatch.enrolments?.some(e => e.candidate_id === c.id && e.status === 'enrolled');
                    const isSelected = selectedCandidateIds.includes(c.id);

                    return (
                      <label key={c.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${isAlreadyEnrolled ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled={isAlreadyEnrolled}
                            checked={isSelected || isAlreadyEnrolled}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCandidateIds([...selectedCandidateIds, c.id]);
                              } else {
                                setSelectedCandidateIds(selectedCandidateIds.filter(id => id !== c.id));
                              }
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-800">{c.first_name} {c.last_name}</span>
                            <span className="text-slate-400 font-mono text-[11px] ml-2">{c.candidate_no}</span>
                          </div>
                        </div>
                        {isAlreadyEnrolled && <span className="text-[10px] font-bold text-emerald-600 uppercase">Enrolled</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRosterModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedCandidateIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 shadow-sm"
                >
                  Enroll Candidates ({selectedCandidateIds.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCHEDULE SESSION */}
      {showScheduleSessionModal && selectedBatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Schedule Session for {selectedBatch.code}</h3>
              <button onClick={() => setShowScheduleSessionModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSession} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Topic / Curriculum Unit *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3: Building RESTful APIs with Laravel 12"
                  value={sessionForm.topic}
                  onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Session Date *</label>
                  <input
                    type="date"
                    required
                    value={sessionForm.session_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.start_time}
                    onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={sessionForm.end_time}
                    onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Trainer</label>
                  <select
                    value={sessionForm.trainer_id}
                    onChange={(e) => setSessionForm({ ...sessionForm, trainer_id: e.target.value })}
                    className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Default Batch Trainer</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>{t.user?.name || t.trainer_no}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleSessionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 shadow-sm"
                >
                  Save Timetable Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SESSION ATTENDANCE VERIFICATION ENGINE */}
      {showAttendanceModal && selectedSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Session Attendance Engine & Audit Log</h3>
                <p className="text-xs text-slate-500">
                  Topic: <span className="font-semibold text-slate-700">{selectedSession.topic}</span> ({selectedSession.session_date})
                </p>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {attendanceRoster.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No candidates enrolled in batch roster for attendance logging.</p>
              ) : (
                attendanceRoster.map((item) => (
                  <div key={item.candidate_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{item.full_name}</span>
                        <span className="text-[11px] font-mono text-slate-400 ml-2">{item.candidate_no}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) => handleAttendanceChange(item.candidate_id, 'status', e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-indigo-500 ${
                            item.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            item.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                            item.status === 'absent' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="present">Present</option>
                          <option value="late">Late</option>
                          <option value="absent">Absent</option>
                          <option value="excused">Excused</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 font-medium">Verification Method:</span>
                        <select
                          value={item.verification_method || 'manual'}
                          onChange={(e) => handleAttendanceChange(item.candidate_id, 'verification_method', e.target.value)}
                          className="w-full mt-0.5 rounded-md border-slate-200 text-[11px] p-1 border"
                        >
                          <option value="manual">Manual Trainer Check</option>
                          <option value="geo_fenced font-mono">Geo-Fenced Mobile App</option>
                          <option value="biometric">Biometric Scanner</option>
                          <option value="qr_code">Dynamic QR Code</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-slate-500 font-medium">Geo Coordinates:</span>
                        <input
                          type="text"
                          readOnly
                          value={item.geo_lat ? `${item.geo_lat}, ${item.geo_long}` : '28.6280, 77.2189 (Center)'}
                          className="w-full mt-0.5 bg-slate-100 rounded-md border-slate-200 text-[11px] p-1 border font-mono text-slate-600"
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 font-medium">Remarks / Audit Note:</span>
                        <input
                          type="text"
                          placeholder="e.g. Verified via Geo-fence"
                          value={item.remarks || ''}
                          onChange={(e) => handleAttendanceChange(item.candidate_id, 'remarks', e.target.value)}
                          className="w-full mt-0.5 rounded-md border-slate-200 text-[11px] p-1 border"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowAttendanceModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save & Audit Attendance Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
