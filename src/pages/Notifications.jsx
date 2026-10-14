import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [templates, setTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    channel: 'email',
    template_code: 'CERTIFICATE_ISSUED',
    variables: JSON.stringify({ candidate_name: 'Aarav Sharma', course_title: 'Full-Stack Web Engineering', verification_token: 'VERIFY-NATIONAL-2026-001' }, null, 2),
  });

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const fetchNotificationsData = async () => {
    setLoading(true);
    try {
      const [tplRes, notifRes] = await Promise.all([
        api.get('/notifications/templates'),
        api.get('/notifications'),
      ]);

      setTemplates(tplRes.data.data || []);
      setNotifications(notifRes.data.data?.data || notifRes.data.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setMessage({ type: 'danger', text: 'Failed to load notifications data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchNotification = async (e) => {
    e.preventDefault();
    try {
      const parsedVars = JSON.parse(dispatchForm.variables);

      await api.post('/notifications/dispatch', {
        channel: dispatchForm.channel,
        template_code: dispatchForm.template_code,
        variables: parsedVars,
      });

      setMessage({ type: 'success', text: `Asynchronous notification dispatched via ${dispatchForm.channel} channel!` });
      setShowDispatchModal(false);
      fetchNotificationsData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Dispatch failed.' });
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
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Multi-Channel Asynchronous Notification Engine
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Email, SMS & In-App Event Notifications</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Manage dynamic templates with variable interpolation (`{{candidate_name}}`), trigger event bindings, and track delivery status (`queued`, `sent`, `failed`).
            </p>
          </div>
          <button
            onClick={() => setShowDispatchModal(false) || setShowDispatchModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shrink-0"
          >
            + Dispatch Notification
          </button>
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

      {/* Notification Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Dispatched Notification Log History</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <th className="p-3">Provider Ref</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Template Code</th>
                <th className="p-3">Subject / Body</th>
                <th className="p-3">Dispatched At</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No notification logs found. Click "+ Dispatch Notification" to test multi-channel events.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-indigo-700">{n.provider_ref}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                        {n.channel}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{n.template_code}</td>
                    <td className="p-3 max-w-xs truncate">
                      <span className="font-semibold text-slate-900 block">{n.subject}</span>
                      <span className="text-slate-400 text-[11px] font-mono">{JSON.stringify(n.payload_json?.variables || {})}</span>
                    </td>
                    <td className="p-3 text-slate-600">{new Date(n.sent_at || n.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {n.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH MODAL */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Async Multi-Channel Dispatch</h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleDispatchNotification} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Channel *</label>
                <select
                  value={dispatchForm.channel}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, channel: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email (SMTP / SES)</option>
                  <option value="sms">SMS Gateway (Twilio Adapter)</option>
                  <option value="in_app">In-App Notification Bell</option>
                  <option value="push">Push Notification</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Event Code *</label>
                <input
                  type="text"
                  required
                  value={dispatchForm.template_code}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, template_code: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interpolation Variables (JSON)</label>
                <textarea
                  rows={4}
                  value={dispatchForm.variables}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, variables: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border font-mono focus:ring-2 focus:ring-blue-500 bg-slate-900 text-slate-100"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowDispatchModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 shadow-sm">
                  Dispatch Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
