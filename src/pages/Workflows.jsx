import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  RefreshCw,
  Plus,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import apiClient from '../api/client';

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

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'inbox') {
        const res = await apiClient.get('/workflows/tasks');
        setTasks(res.data?.data || []);
      } else if (activeTab === 'definitions') {
        const res = await apiClient.get('/workflows/definitions');
        setDefinitions(res.data?.data || []);
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
      await apiClient.post('/workflows/definitions', newDef);
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
      await apiClient.put(`/workflows/tasks/${selectedTask.id}`, decision);
      setMessage({ type: 'success', text: `Workflow task successfully ${decision.action}!` });
      setSelectedTask(null);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to process task decision' });
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #102a35, #193b46)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ maxWidth: '800px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            <GitMerge size={16} />
            Unified State Machine Engine
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: '#ffffff',
            }}
          >
            Workflow Inbox & Approvals
          </h1>

          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Oversee multi-stage approval lifecycles, action pending task assignments, and review governance transition trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowDefModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 0,
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
            }}
          >
            <Plus size={16} />
            Define State Machine
          </button>

          <button
            onClick={fetchData}
            title="Refresh Data"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              background: '#ffffff15',
              color: '#ffffff',
              border: '1px solid #ffffff25',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* Message Banner */}
      {message && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.9rem',
          }}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('inbox')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'inbox' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'inbox' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          <FileCheck size={18} />
          Approval Task Inbox ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('definitions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'definitions' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'definitions' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          <Layers size={18} />
          Configured State Machines ({definitions.length})
        </button>
      </div>

      {/* TAB 1: Task Inbox */}
      {activeTab === 'inbox' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Action Code / Task ID</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Entity Type</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Current State</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Task Status</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Decision Reason</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No pending workflow tasks found in your approval queue.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{task.action_code || 'REVIEW_APPROVAL'}</strong>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#2563eb' }}>
                          {task.id ? `${task.id.slice(0, 8)}...` : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#0284c7' }}>
                        {task.instance?.entity_type || 'GENERAL'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {task.instance?.current_state || 'SUBMITTED'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background:
                              task.state === 'approved'
                                ? '#dcfce7'
                                : task.state === 'rejected'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              task.state === 'approved'
                                ? '#15803d'
                                : task.state === 'rejected'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {task.state === 'approved' && <CheckCircle2 size={12} />}
                          {task.state === 'rejected' && <XCircle size={12} />}
                          {task.state === 'pending' && <Clock size={12} />}
                          <span>{task.state}</span>
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748b', maxWidth: '280px' }}>
                        {task.decision_reason || 'Pending reviewer decision'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {task.state === 'pending' ? (
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setDecision({ action: 'approved', decision_reason: '' });
                            }}
                            style={{
                              padding: '0.5rem 0.85rem',
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Processed</span>
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

      {/* TAB 2: Definitions */}
      {activeTab === 'definitions' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Workflow Code</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Workflow Title</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Target Entity</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Version</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {definitions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                      No custom state machines registered. Click &quot;Define State Machine&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  definitions.map((def) => (
                    <tr key={def.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {def.code}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#0f172a', fontWeight: 600 }}>
                        {def.name}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#0284c7', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {def.entity_type}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                        v{def.version || '1.0'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: '#dcfce7',
                            color: '#15803d',
                          }}
                        >
                          {def.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DECISION MODAL */}
      {selectedTask && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                Process Workflow Decision
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Decision Outcome *
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setDecision({ ...decision, action: 'approved' })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: decision.action === 'approved' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: decision.action === 'approved' ? '#f0fdf4' : '#ffffff',
                      color: decision.action === 'approved' ? '#166534' : '#475569',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Approve Task
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecision({ ...decision, action: 'rejected' })}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: decision.action === 'rejected' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: decision.action === 'rejected' ? '#fef2f2' : '#ffffff',
                      color: decision.action === 'rejected' ? '#991b1b' : '#475569',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Reject Task
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Reason / Governance Notes *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter audit rationale for this decision..."
                  value={decision.decision_reason}
                  onChange={(e) => setDecision({ ...decision, decision_reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.25rem',
                    background: decision.action === 'approved' ? '#16a34a' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEFINITION MODAL */}
      {showDefModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                Define State Machine Workflow
              </h3>
              <button
                onClick={() => setShowDefModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDefinition} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Workflow Code *
                </label>
                <input
                  type="text"
                  required
                  value={newDef.code}
                  onChange={(e) => setNewDef({ ...newDef, code: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Workflow Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDef.name}
                  onChange={(e) => setNewDef({ ...newDef, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Entity Type *
                </label>
                <select
                  value={newDef.entity_type}
                  onChange={(e) => setNewDef({ ...newDef, entity_type: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="org_approval">Organisation Accreditation</option>
                  <option value="assessment_certification">Assessment Certification</option>
                  <option value="candidate_enrolment">Candidate Enrolment Exception</option>
                  <option value="general_approval">General Administrative Approval</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowDefModal(false)}
                  style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
