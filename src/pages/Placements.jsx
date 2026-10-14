import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Briefcase,
  Users,
  Building,
  CheckCircle2,
  Clock,
  Award,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Building2,
  DollarSign
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export default function Placements() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [placements, setPlacements] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Candidate Match Engine State
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Modals
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  // Forms
  const [newEmployer, setNewEmployer] = useState({
    name: '',
    industry: 'Information Technology',
    contact_person: '',
    email: '',
    phone: '',
    city: 'Bengaluru'
  });

  const [newVacancy, setNewVacancy] = useState({
    employer_id: '',
    title: '',
    openings: 5,
    city: 'Bengaluru',
    min_salary: 300000,
    max_salary: 500000
  });

  const [stageUpdate, setStageUpdate] = useState({
    status: 'offered',
    joining_date: new Date().toISOString().split('T')[0],
    salary: 350000,
    post_placement_3m_verified: false
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pipeline') {
        const res = await axios.get(`${API_BASE}/placements`, { headers: getHeaders() });
        setPlacements(res.data.data || []);
      } else if (activeTab === 'vacancies') {
        const res = await axios.get(`${API_BASE}/vacancies`, { headers: getHeaders() });
        setVacancies(res.data.data || []);
      } else if (activeTab === 'employers') {
        const res = await axios.get(`${API_BASE}/employers`, { headers: getHeaders() });
        setEmployers(res.data.data || []);
      } else if (activeTab === 'matching') {
        const vacRes = await axios.get(`${API_BASE}/vacancies`, { headers: getHeaders() });
        setVacancies(vacRes.data.data || []);
        if (vacRes.data.data?.length > 0 && !selectedVacancyId) {
          setSelectedVacancyId(vacRes.data.data[0].id);
          fetchRecommendations(vacRes.data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load placement data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (vacId) => {
    if (!vacId) return;
    setMatchingLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/vacancies/${vacId}/recommendations`, { headers: getHeaders() });
      setRecommendations(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to fetch candidate recommendations' });
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleCreateEmployer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/employers`, newEmployer, { headers: getHeaders() });
      setMessage({ type: 'success', text: 'Placement employer registered successfully!' });
      setShowEmployerModal(false);
      setNewEmployer({ name: '', industry: 'Information Technology', contact_person: '', email: '', phone: '', city: 'Bengaluru' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create employer' });
    }
  };

  const handleCreateVacancy = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/vacancies`, newVacancy, { headers: getHeaders() });
      setMessage({ type: 'success', text: 'Job vacancy published successfully!' });
      setShowVacancyModal(false);
      setNewVacancy({ employer_id: '', title: '', openings: 5, city: 'Bengaluru', min_salary: 300000, max_salary: 500000 });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to publish vacancy' });
    }
  };

  const handleUpdateStage = async (e) => {
    e.preventDefault();
    if (!selectedPlacement) return;
    try {
      await axios.put(`${API_BASE}/placements/${selectedPlacement.id}/stage`, stageUpdate, { headers: getHeaders() });
      setMessage({ type: 'success', text: 'Placement stage & retention status updated successfully!' });
      setShowStageModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update placement stage' });
    }
  };

  const handleReferCandidate = async (candidateId, vacancyId, employerId) => {
    try {
      await axios.post(`${API_BASE}/placements`, {
        candidate_id: candidateId,
        vacancy_id: vacancyId,
        employer_id: employerId
      }, { headers: getHeaders() });
      setMessage({ type: 'success', text: 'Candidate successfully referred for vacancy!' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to refer candidate' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Post-Training Governance</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Placement & Career Tracking Engine</h1>
            <p className="text-slate-400 text-sm">Employer Vacancy Matching, Pipeline Transition & 3-Month Retention Audit</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              axios.get(`${API_BASE}/employers`, { headers: getHeaders() }).then(res => setEmployers(res.data.data || []));
              setShowVacancyModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium shadow-lg hover:shadow-emerald-500/20 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Vacancy</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'pipeline'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Placement Pipeline & Retention</span>
        </button>
        <button
          onClick={() => setActiveTab('vacancies')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'vacancies'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Corporate Vacancies</span>
        </button>
        <button
          onClick={() => setActiveTab('matching')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'matching'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Candidate Match Engine</span>
        </button>
        <button
          onClick={() => setActiveTab('employers')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'employers'
              ? 'border-emerald-500 text-emerald-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Employer Directory</span>
        </button>
      </div>

      {/* Tab 1: Placement Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Employer & Vacancy</th>
                  <th className="p-4">Placement Stage</th>
                  <th className="p-4">Offered CTC</th>
                  <th className="p-4">3-Month Retention</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {placements.map((plc) => (
                  <tr key={plc.id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="font-bold text-white">
                        {plc.candidate ? `${plc.candidate.first_name} ${plc.candidate.last_name}` : 'N/A'}
                      </div>
                      <span className="text-xs font-mono text-cyan-400">
                        {plc.candidate ? plc.candidate.candidate_number : ''}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{plc.employer ? plc.employer.name : 'N/A'}</div>
                      <div className="text-xs text-slate-400">{plc.vacancy ? plc.vacancy.title : 'Direct Placement'}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          plc.status === 'retained'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : plc.status === 'joined'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : plc.status === 'offered'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {plc.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {plc.salary ? `₹${Number(plc.salary).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="p-4">
                      {plc.outcome_json?.post_placement_3m_verified ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Retained</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">Pending 90-Day Audit</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPlacement(plc);
                          setStageUpdate({
                            status: plc.status,
                            joining_date: plc.joining_date || new Date().toISOString().split('T')[0],
                            salary: plc.salary || 350000,
                            post_placement_3m_verified: plc.outcome_json?.post_placement_3m_verified || false
                          });
                          setShowStageModal(true);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium border border-slate-700"
                      >
                        Update Stage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {placements.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400">No candidate placement pipeline records found.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Vacancies */}
      {activeTab === 'vacancies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map((vac) => (
            <div
              key={vac.id}
              className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 uppercase tracking-wide border border-emerald-500/20">
                    {vac.openings} Openings
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">{vac.status}</span>
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{vac.title}</h3>
                <p className="text-xs font-semibold text-slate-300 mt-0.5">{vac.employer ? vac.employer.name : 'Corporate Partner'}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="text-slate-200 font-medium">{vac.location_json?.city || 'Bengaluru'} ({vac.location_json?.work_mode || 'Onsite'})</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary Range:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    ₹{(vac.salary_json?.min / 100000).toFixed(1)}L - ₹{(vac.salary_json?.max / 100000).toFixed(1)}L PA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Placements:</span>
                  <span className="text-cyan-400 font-bold">{vac.placements_count || 0} Referred</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedVacancyId(vac.id);
                  setActiveTab('matching');
                  fetchRecommendations(vac.id);
                }}
                className="w-full mt-2 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md"
              >
                <span>Find Matched Candidates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {vacancies.length === 0 && !loading && (
            <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No active vacancies published yet. Click "Publish Vacancy" to add one.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Candidate Match Engine */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">AI Candidate Recommendation Engine</h3>
              <p className="text-xs text-slate-400">Match verified NSQF candidates with active vacancies based on QP completion & assessment scores</p>
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedVacancyId}
                onChange={(e) => {
                  setSelectedVacancyId(e.target.value);
                  fetchRecommendations(e.target.value);
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {vacancies.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.employer?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.recommended_candidates?.map((cand) => (
                <div
                  key={cand.candidate_id}
                  className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {cand.match_score_pct}% Match Score
                      </span>
                      {cand.is_certified && (
                        <span className="inline-flex items-center space-x-1 text-amber-400 text-xs font-bold">
                          <Award className="w-3.5 h-3.5" />
                          <span>NSQF Certified</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-white mt-2">{cand.full_name}</h4>
                    <p className="text-xs font-mono text-cyan-400">{cand.candidate_number}</p>
                    <p className="text-xs text-slate-400 mt-2">{cand.recommendation_reason}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">{cand.mobile}</span>
                    <button
                      onClick={() => handleReferCandidate(cand.candidate_id, recommendations.vacancy.id, recommendations.vacancy.employer_id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium shadow-md transition-all"
                    >
                      Refer Candidate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Employers */}
      {activeTab === 'employers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowEmployerModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Register Employer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employers.map((emp) => (
              <div key={emp.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/10 text-indigo-400 uppercase tracking-wide border border-indigo-500/20">
                  {emp.industry}
                </span>
                <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>Contact: <span className="text-slate-200 font-medium">{emp.contact_json?.person}</span></p>
                  <p>Email: <span className="text-slate-200 font-mono">{emp.contact_json?.email}</span></p>
                  <p>Vacancies: <span className="text-cyan-400 font-bold">{emp.vacancies_count || 0}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Employer */}
      {showEmployerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Register Placement Employer</h3>
            <form onSubmit={handleCreateEmployer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Company / Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Consultancy Services"
                  value={newEmployer.name}
                  onChange={(e) => setNewEmployer({ ...newEmployer, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Industry Sector</label>
                <input
                  type="text"
                  required
                  value={newEmployer.industry}
                  onChange={(e) => setNewEmployer({ ...newEmployer, industry: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Person & Email</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Person"
                    value={newEmployer.contact_person}
                    onChange={(e) => setNewEmployer({ ...newEmployer, contact_person: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="HR Email"
                    value={newEmployer.email}
                    onChange={(e) => setNewEmployer({ ...newEmployer, email: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowEmployerModal(false)} className="px-4 py-2 text-slate-400 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">
                  Register Employer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Publish Vacancy */}
      {showVacancyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Publish Corporate Vacancy</h3>
            <form onSubmit={handleCreateVacancy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hiring Employer</label>
                <select
                  required
                  value={newVacancy.employer_id}
                  onChange={(e) => setNewVacancy({ ...newVacancy, employer_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Corporate Employer --</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Cloud Associate"
                  value={newVacancy.title}
                  onChange={(e) => setNewVacancy({ ...newVacancy, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={newVacancy.openings}
                    onChange={(e) => setNewVacancy({ ...newVacancy, openings: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Location City</label>
                  <input
                    type="text"
                    value={newVacancy.city}
                    onChange={(e) => setNewVacancy({ ...newVacancy, city: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowVacancyModal(false)} className="px-4 py-2 text-slate-400 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">
                  Publish Vacancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Stage & Retention */}
      {showStageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Update Placement & Retention Stage</h3>
            <form onSubmit={handleUpdateStage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Placement Stage</label>
                <select
                  value={stageUpdate.status}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, status: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="referred">Referred</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offered">Offered</option>
                  <option value="joined">Joined</option>
                  <option value="retained">Retained (Post 90 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={stageUpdate.joining_date}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, joining_date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Offered Salary (Annual CTC in INR)</label>
                <input
                  type="number"
                  value={stageUpdate.salary}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, salary: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="3m_verify"
                  checked={stageUpdate.post_placement_3m_verified}
                  onChange={(e) => setStageUpdate({ ...stageUpdate, post_placement_3m_verified: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <label htmlFor="3m_verify" className="text-xs text-slate-300 font-semibold">
                  Verify 90-Day Post-Placement Retention (Salary Slip / EPF Audit Verified)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowStageModal(false)} className="px-4 py-2 text-slate-400 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">
                  Update Placement Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
