import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Assessments() {
  const [activeTab, setActiveTab] = useState('blueprints'); // 'blueprints' | 'banks' | 'player' | 'moderation'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Data states
  const [blueprints, setBlueprints] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [pendingEvaluations, setPendingEvaluations] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [enrolments, setEnrolments] = useState([]);

  // Candidate Exam Player State
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [remainingTimer, setRemainingTimer] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResultData, setExamResultData] = useState(null);

  // Modals state
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showCreateBlueprintModal, setShowCreateBlueprintModal] = useState(false);
  const [showAssignAssessmentModal, setShowAssignAssessmentModal] = useState(false);
  const [showAssessorModal, setShowAssessorModal] = useState(false);

  // Forms
  const [bankForm, setBankForm] = useState({ name: '', subject: 'Web Development & REST APIs' });
  const [questionForm, setQuestionForm] = useState({
    type: 'single_choice',
    text: '',
    difficulty: 'medium',
    marks: 2.0,
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
    ],
    numeric_correct_value: 201,
  });

  const [blueprintForm, setBlueprintForm] = useState({
    programme_course_id: '',
    code: `BP-WEB-${new Date().getFullYear()}-0${Math.floor(Math.random() * 9 + 1)}`,
    name: 'National Skill Certification Examination',
    duration_minutes: 60,
    max_attempts: 3,
    pass_score: 50.0,
    mode: 'online',
    selected_question_ids: [],
  });

  const [assignForm, setAssignForm] = useState({
    assessment_blueprint_id: '',
    candidate_id: '',
    enrolment_id: '',
  });

  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [evalScores, setEvalScores] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Timer Countdown Effect for Candidate Exam Player
  useEffect(() => {
    if (!activeAttemptId || examSubmitted || remainingTimer <= 0) return;

    const timerInterval = setInterval(() => {
      setRemainingTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleAutoSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [activeAttemptId, examSubmitted, remainingTimer]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [blueprintsRes, banksRes, pendingRes, offeringsRes, candidatesRes] = await Promise.all([
        api.get('/assessments/blueprints'),
        api.get('/assessments/question-banks'),
        api.get('/assessments/evaluations/pending'),
        api.get('/offerings'),
        api.get('/candidates'),
      ]);

      setBlueprints(blueprintsRes.data.data || []);
      setQuestionBanks(banksRes.data.data || []);
      setPendingEvaluations(pendingRes.data.data || []);
      setOfferings(offeringsRes.data.data?.data || offeringsRes.data.data || []);
      setCandidates(candidatesRes.data.data?.data || candidatesRes.data.data || []);

      if (banksRes.data.data && banksRes.data.data.length > 0) {
        handleSelectQuestionBank(banksRes.data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      setMessage({ type: 'danger', text: 'Failed to load assessment engine data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestionBank = async (bank) => {
    setSelectedBank(bank);
    try {
      const res = await api.get(`/assessments/question-banks/${bank.id}/questions`);
      setBankQuestions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load bank questions:', err);
    }
  };

  const handleCreateBank = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assessments/question-banks', bankForm);
      setMessage({ type: 'success', text: `Question bank '${bankForm.name}' created successfully!` });
      setShowCreateBankModal(false);
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to create question bank.' });
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedBank) return;

    try {
      let payload = {
        type: questionForm.type,
        text: questionForm.text,
        difficulty: questionForm.difficulty,
        marks: questionForm.marks,
      };

      if (['single_choice', 'multiple_choice', 'true_false'].includes(questionForm.type)) {
        payload.options = questionForm.options;
      } else if (questionForm.type === 'numeric') {
        payload.metadata_json = { correct_value: questionForm.numeric_correct_value };
      }

      await api.post(`/assessments/question-banks/${selectedBank.id}/questions`, payload);
      setMessage({ type: 'success', text: 'Question added to bank successfully!' });
      setShowAddQuestionModal(false);
      handleSelectQuestionBank(selectedBank);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to add question.' });
    }
  };

  const handleCreateBlueprint = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assessments/blueprints', {
        ...blueprintForm,
        question_ids: blueprintForm.selected_question_ids,
      });
      setMessage({ type: 'success', text: `Assessment Blueprint '${blueprintForm.code}' created successfully!` });
      setShowCreateBlueprintModal(false);
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to create blueprint.' });
    }
  };

  const handleAssignAssessment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/assessments/assignments', assignForm);
      const assignment = res.data.data;
      setMessage({ type: 'success', text: 'Assessment assigned to candidate! Launching Exam Player...' });
      setShowAssignAssessmentModal(false);

      // Immediately launch exam player attempt
      handleStartExamAttempt(assignment.id);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to assign assessment.' });
    }
  };

  const handleStartExamAttempt = async (assignmentId) => {
    try {
      const startRes = await api.post(`/assessments/assignments/${assignmentId}/start`);
      const attempt = startRes.data.data.attempt;

      const detailsRes = await api.get(`/assessments/attempts/${attempt.id}`);
      setExamData(detailsRes.data.data);
      setActiveAttemptId(attempt.id);
      setRemainingTimer(detailsRes.data.data.remaining_seconds);
      setExamSubmitted(false);
      setExamResultData(null);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setActiveTab('player');
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Unable to start exam attempt.' });
    }
  };

  const handleAnswerSelect = (attemptQuestionId, answerValue) => {
    setUserAnswers((prev) => ({ ...prev, [attemptQuestionId]: answerValue }));

    // Silently persist answer to backend API
    api.post(`/assessments/attempts/${activeAttemptId}/save-response`, {
      attempt_question_id: attemptQuestionId,
      response: answerValue,
    }).catch(err => console.error('Save response error:', err));
  };

  const handleAutoSubmitExam = async () => {
    if (examSubmitted || !activeAttemptId) return;
    try {
      const submitRes = await api.post(`/assessments/attempts/${activeAttemptId}/submit`);
      setExamSubmitted(true);
      setExamResultData(submitRes.data.data);
      setMessage({ type: 'info', text: 'Timer expired! Assessment automatically submitted and graded.' });
      fetchInitialData();
    } catch (err) {
      console.error('Auto submit error:', err);
    }
  };

  const handleSubmitExamManually = async () => {
    if (!activeAttemptId) return;
    if (!window.confirm('Are you sure you want to submit your assessment attempt?')) return;

    try {
      const submitRes = await api.post(`/assessments/attempts/${activeAttemptId}/submit`);
      setExamSubmitted(true);
      setExamResultData(submitRes.data.data);
      setMessage({ type: 'success', text: 'Assessment submitted successfully!' });
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Submission failed.' });
    }
  };

  const handleOpenAssessorModal = (evaluation) => {
    setSelectedEvaluation(evaluation);
    const initialScores = {};
    const attempt = evaluation.attempts?.[0];

    attempt?.attempt_questions?.forEach((aq) => {
      initialScores[aq.id] = aq.marks_awarded || 0;
    });

    setEvalScores(initialScores);
    setShowAssessorModal(true);
  };

  const handleSaveAssessorScores = async () => {
    if (!selectedEvaluation) return;
    const attempt = selectedEvaluation.attempts?.[0];
    if (!attempt) return;

    try {
      const scoresPayload = Object.entries(evalScores).map(([aqId, marks]) => ({
        attempt_question_id: aqId,
        marks_awarded: parseFloat(marks),
      }));

      await api.post(`/assessments/evaluations/${attempt.id}/score`, { scores: scoresPayload });
      setMessage({ type: 'success', text: 'Assessor scores saved and attempt status updated to Evaluated!' });
      setShowAssessorModal(false);
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to record assessor scores.' });
    }
  };

  const handleModerateResult = async (resultId, targetStatus) => {
    try {
      await api.put(`/results/${resultId}/moderate`, { status: targetStatus, reason: `Moderation ${targetStatus}` });
      setMessage({ type: 'success', text: `Result status updated to '${targetStatus}'!` });
      fetchInitialData();
    } catch (err) {
      setMessage({ type: 'danger', text: 'Moderation action failed.' });
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Assessment & Examination Engine
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Question Bank, Exam Player & Assessor Moderation</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Author question banks across 9 item types, define blueprints with randomization rules, execute timed candidate exam sessions, and moderate assessor evaluation workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateBlueprintModal(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
            >
              + Create Assessment Blueprint
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
          onClick={() => setActiveTab('blueprints')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'blueprints'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Blueprints & Exams ({blueprints.length})
        </button>
        <button
          onClick={() => setActiveTab('banks')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'banks'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Question Banks ({questionBanks.length})
        </button>
        <button
          onClick={() => setActiveTab('player')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'player'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Candidate Exam Player {activeAttemptId ? '(Live Exam Active)' : ''}
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'moderation'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Assessor Moderation & Results ({pendingEvaluations.length})
        </button>
      </div>

      {/* TAB 1: BLUEPRINTS */}
      {activeTab === 'blueprints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Configured Assessment Blueprints</h2>
            <button
              onClick={() => setShowAssignAssessmentModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              Assign Blueprint to Candidate
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blueprints.map((bp) => (
              <div key={bp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                      {bp.code} v{bp.version_no}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-2">{bp.name}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {bp.mode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 font-medium">Timer Duration:</span>
                    <p className="font-semibold text-slate-800">{bp.duration_minutes} Mins</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Pass Cutoff:</span>
                    <p className="font-semibold text-slate-800">{bp.pass_score}%</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Max Attempts:</span>
                    <p className="font-semibold text-slate-800">{bp.max_attempts} Allowed</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Questions Attached:</span>
                    <p className="font-semibold text-purple-700">{bp.questions_count || bp.questions?.length || 0} Questions</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Course: {bp.offering?.programme?.name || 'Full-Stack Eng'}</span>
                  <button
                    onClick={() => {
                      setAssignForm({ ...assignForm, assessment_blueprint_id: bp.id });
                      setShowAssignAssessmentModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Assign Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANKS */}
      {activeTab === 'banks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">Question Banks</h2>
              <button
                onClick={() => setShowCreateBankModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
              >
                + Create Bank
              </button>
            </div>

            <div className="space-y-3">
              {questionBanks.map((bank) => {
                const isSelected = selectedBank?.id === bank.id;
                return (
                  <div
                    key={bank.id}
                    onClick={() => handleSelectQuestionBank(bank)}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <h3 className="font-bold text-slate-900 text-sm">{bank.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{bank.subject}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-purple-700">{bank.questions_count || 0} Questions</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{bank.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {selectedBank ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedBank.name}</h3>
                    <p className="text-xs text-slate-500">Subject: {selectedBank.subject}</p>
                  </div>
                  <button
                    onClick={() => setShowAddQuestionModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-3">
                  {bankQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">Q{idx + 1}.</span>
                          <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                            {q.type}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">Marks: {q.marks}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded border border-slate-200">
                          {q.difficulty}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900">{q.text}</h4>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-xs">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border font-medium ${
                                opt.is_correct ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              {opt.option_text} {opt.is_correct && '✓ (Correct)'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
                Select a Question Bank to inspect item sets.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE EXAM PLAYER SIMULATOR */}
      {activeTab === 'player' && (
        <div>
          {examData && !examSubmitted ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden space-y-6">
              {/* Exam Timer & Status Header */}
              <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-100">{examData.blueprint_name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Candidate: {examData.candidate_name} | Attempt #{examData.attempt_no}</p>
                </div>

                {/* Server-Authoritative Countdown Timer */}
                <div className={`px-4 py-2 rounded-xl text-center border font-mono font-bold text-lg shadow-inner ${
                  remainingTimer < 300 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}>
                  <span className="text-xs uppercase block font-sans font-semibold text-slate-400">Time Remaining</span>
                  {formatTimer(remainingTimer)}
                </div>
              </div>

              {/* Question Navigation & Canvas */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Question Selector Palette */}
                <div className="md:col-span-3 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Question Palette</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {examData.questions.map((q, idx) => {
                      const isAnswered = !!userAnswers[q.attempt_question_id];
                      const isCurrent = idx === currentQuestionIndex;

                      return (
                        <button
                          key={q.attempt_question_id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                            isCurrent
                              ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-500/30'
                              : isAnswered
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Canvas */}
                <div className="md:col-span-9 space-y-6">
                  {(() => {
                    const currentQ = examData.questions[currentQuestionIndex];
                    if (!currentQ) return null;

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <span className="text-xs font-bold text-purple-700 uppercase bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                            Question {currentQuestionIndex + 1} of {examData.questions.length} ({currentQ.type})
                          </span>
                          <span className="text-xs font-semibold text-slate-600">Marks: {currentQ.marks}</span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 leading-relaxed">{currentQ.text}</h3>

                        {/* Options Input */}
                        {['single_choice', 'true_false'].includes(currentQ.type) && (
                          <div className="space-y-2.5 pt-2">
                            {currentQ.options.map((opt) => (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                                  userAnswers[currentQ.attempt_question_id]?.selected_option_id === opt.id
                                    ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold shadow-sm'
                                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`q_${currentQ.attempt_question_id}`}
                                  checked={userAnswers[currentQ.attempt_question_id]?.selected_option_id === opt.id}
                                  onChange={() => handleAnswerSelect(currentQ.attempt_question_id, { selected_option_id: opt.id })}
                                  className="text-purple-600 focus:ring-purple-500"
                                />
                                <span className="text-xs">{opt.option_text}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {currentQ.type === 'numeric' && (
                          <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Enter Numeric Value</label>
                            <input
                              type="number"
                              placeholder="e.g. 201"
                              value={userAnswers[currentQ.attempt_question_id]?.answer || ''}
                              onChange={(e) => handleAnswerSelect(currentQ.attempt_question_id, { answer: e.target.value })}
                              className="w-full max-w-xs rounded-xl border-slate-200 p-2.5 text-xs border focus:ring-2 focus:ring-purple-500 font-mono"
                            />
                          </div>
                        )}

                        {currentQ.type === 'practical' && (
                          <div className="pt-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Practical Viva Response Notes</label>
                            <textarea
                              rows={4}
                              placeholder="Enter practical code demonstration notes or answer description..."
                              value={userAnswers[currentQ.attempt_question_id]?.answer || ''}
                              onChange={(e) => handleAnswerSelect(currentQ.attempt_question_id, { answer: e.target.value })}
                              className="w-full rounded-xl border-slate-200 p-2.5 text-xs border focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Navigation & Submit */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                      className="px-4 py-2 bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      ← Previous Question
                    </button>

                    <div className="flex items-center gap-3">
                      {currentQuestionIndex < examData.questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition"
                        >
                          Next Question →
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitExamManually}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                        >
                          Submit Assessment Attempt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : examSubmitted && examResultData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xl text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900">Assessment Submitted Successfully!</h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Objective Score Earned:</span>
                  <span className="font-bold text-slate-900">{examResultData.total_score} / {examResultData.max_score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Percentage Score:</span>
                  <span className="font-bold text-purple-700">{examResultData.percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pass Cutoff Result:</span>
                  <span className={`font-bold ${examResultData.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {examResultData.passed ? 'PASSED' : 'PENDING EVALUATION'}
                  </span>
                </div>
              </div>

              {examResultData.needs_manual_scoring && (
                <p className="text-xs text-slate-500 italic bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">
                  Note: Objective questions auto-graded. Practical/Viva items are queued for assessor evaluation.
                </p>
              )}

              <button
                onClick={() => setActiveTab('moderation')}
                className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl"
              >
                Go to Assessor Moderation & Results
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
              <p className="font-semibold text-slate-600">No Exam Attempt Active</p>
              <p className="text-xs mt-1">Assign an Assessment Blueprint from the Blueprints tab to launch the candidate exam player.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ASSESSOR MODERATION & RESULTS */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Pending Evaluated Attempts & Moderation Workflow</h2>

          <div className="space-y-3">
            {pendingEvaluations.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500">
                No pending evaluations found.
              </div>
            ) : (
              pendingEvaluations.map((ev) => {
                const attempt = ev.attempts?.[0];
                return (
                  <div key={ev.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{ev.blueprint?.name || 'Assessment'}</span>
                        <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {ev.blueprint?.code}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase bg-amber-50 text-amber-700 border-amber-200">
                          {ev.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        Candidate: <span className="font-semibold text-slate-800">{ev.candidate?.first_name} {ev.candidate?.last_name}</span> |
                        Assessor: <span className="font-semibold text-slate-800">{ev.assessor?.user?.name || 'Assigned Assessor'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {attempt && (
                        <button
                          onClick={() => handleOpenAssessorModal(ev)}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                        >
                          Score Practical / Viva
                        </button>
                      )}
                      <button
                        onClick={() => handleModerateResult(ev.id, 'released')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                      >
                        Approve & Release Result
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL: ASSESSOR VIVA SCORING */}
      {showAssessorModal && selectedEvaluation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assessor Practical & Viva Scoring</h3>
                <p className="text-xs text-slate-500">Candidate: {selectedEvaluation.candidate?.first_name} {selectedEvaluation.candidate?.last_name}</p>
              </div>
              <button onClick={() => setShowAssessorModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4 text-xs max-h-60 overflow-y-auto">
              {selectedEvaluation.attempts?.[0]?.attempt_questions?.map((aq) => (
                <div key={aq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>Q{aq.sequence_no}: {aq.question?.text}</span>
                    <span className="text-purple-600">Max Marks: {aq.question?.marks}</span>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Award Marks:</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={aq.question?.marks}
                      value={evalScores[aq.id] || 0}
                      onChange={(e) => setEvalScores({ ...evalScores, [aq.id]: e.target.value })}
                      className="w-full rounded-xl border-slate-200 p-2 text-xs border focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setShowAssessorModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                Cancel
              </button>
              <button onClick={handleSaveAssessorScores} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-500 shadow-sm">
                Save & Update Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
