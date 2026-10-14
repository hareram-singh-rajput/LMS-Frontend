import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  GitMerge,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  RefreshCw,
  Plus,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export default function Workflows() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [tasks, setTasks] = useState([]);
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Decision Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [decision, setDecision] = useState({
    action: 'approved',
    decision_reason: ''
  });

  // Definition Modal
  const [showDefModal, setShowDefModal] = useState(false);
  const [newDef, setNewDef] = useState({
    code: 'ORG_APPROVAL_WF',
    name: 'Training Partner Onboarding Workflow',
    entity_type: 'org_approval'
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
      if (activeTab === 'inbox') {
        const res = await axios.get(`${API_BASE}/workflows/tasks`, { headers: getHeaders() });
        setTasks(res.data.data || []);
      } else if (activeTab === 'definitions') {
        const res = await axios.get(`${API_BASE}/workflows/definitions`, { headers: getHeaders() });
        setDefinitions(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load workflow data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefinition = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/workflows/definitions`, newDef, { headers: getHeaders() });
      setMessage({ type: 'success', text: 'Workflow state machine definition created successfully!' });
      setShowDefModal(false);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create definition' });
    }
  };

  const handleProcessTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await axios.put(`${API_BASE}/workflows/tasks/${selectedTask.id}`, decision, { headers: getHeaders() });
      setMessage({ type: 'success', text: `Workflow task successfully ${decision.action}!` });
      setSelectedTask(null);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process task decision' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 shadow-inner">
            <GitMerge className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Generic Workflow & Approval State Engine</h1>
            <p className="text-slate-400 text-sm">Unified State Machine, Task Approval Inbox, SLA Tracking & Decision Audit</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowDefModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/20 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Define State Machine</span>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === 'inbox'
              ? 'border-purple-500 text-purple-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Approval Task Inbox ({tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('definitions')}
          className={`flex items-center space-x-2 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
            activeTab === 'definitions'
              ? 'border-purple-500 text-purple-400 bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Configured State Machines</span>
        </button>
      </div>

      {/* Tab 1: Approval Task Inbox */}
      {activeTab === 'inbox' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Task ID & Action</th>
                  <th className="p-4">Entity Type</th>
                  <th className="p-4">Current State</th>
                  <th className="p-4">Task Status</th>
                  <th className="p-4">Decision Reason</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-medium text-white">
                      <div>{task.action_code || 'REVIEW_APPROVAL'}</div>
                      <span className="text-xs font-mono text-purple-400">{task.id.slice(0, 8)}...</span>
                    </td>
                    <td className="p-4 font-mono text-xs uppercase text-cyan-400">
                      {task.instance ? task.instance.entity_type : 'GENERAL'}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md text-xs font-semibold uppercase">
                        {task.instance ? task.instance.current_state : 'SUBMITTED'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          task.state === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : task.state === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {task.state === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {task.state === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        {task.state === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        <span>{task.state}</span>
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 max-w-xs truncate">
                      {task.decision_reason || 'Pending reviewer decision'}
                    </td>
                    <td className="p-4 text-right">
                      {task.state === 'pending' ? (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setDecision({ action: 'approved', decision_reason: '' });
                          }}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium shadow-md transition-all"
                        >
                          Review & Decide
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {tasks.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-400">No pending workflow approval tasks in inbox.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Workflow Definitions */}
      {activeTab === 'definitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {definitions.map((def) => (
            <div key={def.id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-400 uppercase tracking-wide border border-purple-500/20">
                {def.entity_type}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">{def.name}</h3>
              <p className="text-xs font-mono text-slate-400">{def.code} (v{def.version_no})</p>

              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                <span>Active Instances:</span>
                <span className="text-purple-400 font-bold">{def.instances_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Process Decision Task */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Workflow Approval Decision</h3>
            <form onSubmit={handleProcessTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Action</label>
                <select
                  value={decision.action}
                  onChange={(e) => setDecision({ ...decision, action: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="approved">Approve & Advance Workflow</option>
                  <option value="rejected">Reject Entity Application</option>
                  <option value="returned">Return for Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Decision Justification / Reason</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Provide explicit compliance rationale for audit logging..."
                  value={decision.decision_reason}
                  onChange={(e) => setDecision({ ...decision, decision_reason: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-4 py-2 text-slate-400 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium">
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
