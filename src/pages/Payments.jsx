import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [candidates, setCandidates] = useState([]);

  // Form State for Order Creation
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    candidate_id: '',
    programme_course_id: '',
    quantity: 1,
  });

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Duplicate payment processing adjustment.');

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  const fetchPaymentsData = async () => {
    setLoading(true);
    try {
      const [reconRes, ordersRes, offeringsRes, candidatesRes] = await Promise.all([
        api.get('/payments/reconciliation'),
        api.get('/payments/orders'),
        api.get('/offerings'),
        api.get('/candidates'),
      ]);

      setStats(reconRes.data.data);
      setOrders(ordersRes.data.data?.data || ordersRes.data.data || []);
      setOfferings(offeringsRes.data.data?.data || offeringsRes.data.data || []);
      setCandidates(candidatesRes.data.data?.data || candidatesRes.data.data || []);
    } catch (err) {
      console.error('Error loading payment data:', err);
      setMessage({ type: 'danger', text: 'Failed to load financial reconciliation data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments/orders', orderForm);
      const newOrder = res.data.data;
      setMessage({ type: 'success', text: `Commercial order '${newOrder.order_no}' created for ₹${newOrder.total}!` });
      setShowOrderModal(false);

      // Auto initiate payment simulation with Idempotency Key
      handleInitiatePayment(newOrder.id);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to create commercial order.' });
    }
  };

  const handleInitiatePayment = async (orderId) => {
    try {
      const idempotencyKey = `IDEM-PAY-${Date.now()}`;
      const initRes = await api.post('/payments/initiate', {
        order_id: orderId,
        provider: 'razorpay'
      }, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });

      const payment = initRes.data.data;

      // Simulate Gateway Webhook Success Callback
      await api.post('/webhooks/payment', {
        payment_id: payment.id,
        status: 'success',
        provider_transaction_id: `pay_${Math.random().toString(36).substring(7)}`
      });

      setMessage({ type: 'success', text: 'Payment captured and GST invoice auto-generated!' });
      fetchPaymentsData();
    } catch (err) {
      console.error('Payment initiation error:', err);
    }
  };

  const handleIssueRefund = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    try {
      await api.post(`/payments/${selectedPayment.id}/refund`, {
        amount: parseFloat(refundAmount),
        reason: refundReason
      });

      setMessage({ type: 'info', text: `Refund of ₹${refundAmount} issued successfully!` });
      setShowRefundModal(false);
      fetchPaymentsData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Refund failed.' });
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
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Payments, Commercials & Financial Reconciliation
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Order Billing, Idempotency & Gateway Webhooks</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Process commercial course orders, enforce Idempotency-Key headers, verify server-to-server gateway callbacks, issue full/partial refunds, and generate GST invoices.
            </p>
          </div>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shrink-0"
          >
            + Create Commercial Order
          </button>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Captured Revenue</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">₹{stats?.total_revenue?.toLocaleString() || '0'}</div>
            <span className="text-xs text-slate-400 font-medium">{stats?.paid_orders || 0} paid transactions</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">GST Tax Collected</span>
            <div className="text-2xl font-bold text-sky-400 mt-1">₹{stats?.total_tax_collected?.toLocaleString() || '0'}</div>
            <span className="text-xs text-slate-400 font-medium">18% Standard GST</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Commercial Orders</span>
            <div className="text-2xl font-bold text-white mt-1">{stats?.total_orders || 0}</div>
            <span className="text-xs text-amber-400 font-medium">Orders Issued</span>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-3.5 border border-slate-700/50">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Refunds Issued</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">₹{stats?.total_refunds?.toLocaleString() || '0'}</div>
            <span className="text-xs text-slate-400 font-medium">Reconciled Refunds</span>
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

      {/* Orders & Financial Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Commercial Orders & Payment Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <th className="p-3">Order No</th>
                <th className="p-3">Candidate / Customer</th>
                <th className="p-3">Line Description</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3">GST Tax</th>
                <th className="p-3">Total (INR)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No commercial orders found. Click "+ Create Commercial Order" to initiate payments.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const payment = ord.payments?.[0];
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-indigo-700">{ord.order_no}</td>
                      <td className="p-3 font-bold text-slate-900">{ord.candidate?.first_name ? `${ord.candidate.first_name} ${ord.candidate.last_name}` : 'Corporate Client'}</td>
                      <td className="p-3 text-slate-600 font-medium">{ord.items?.[0]?.description || 'Course Offering Fee'}</td>
                      <td className="p-3 font-mono">₹{ord.subtotal}</td>
                      <td className="p-3 font-mono text-sky-700">₹{ord.tax}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">₹{ord.total}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border uppercase text-[10px] ${
                          ord.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          ord.status === 'refunded' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        {ord.status === 'created' && (
                          <button
                            onClick={() => handleInitiatePayment(ord.id)}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-semibold rounded"
                          >
                            Pay & Capture
                          </button>
                        )}
                        {ord.status === 'paid' && payment && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setRefundAmount(payment.amount);
                              setShowRefundModal(true);
                            }}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold rounded border border-rose-200"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CREATE ORDER */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Create Commercial Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Candidate Profile</label>
                <select
                  value={orderForm.candidate_id}
                  onChange={(e) => setOrderForm({ ...orderForm, candidate_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Candidate --</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.candidate_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Course Offering *</label>
                <select
                  required
                  value={orderForm.programme_course_id}
                  onChange={(e) => setOrderForm({ ...orderForm, programme_course_id: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Offering --</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.course?.name || o.programme?.name} (Tuition: ₹{o.fee_config_json?.tuition_fee || 15000})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowOrderModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-500 shadow-sm">
                  Issue Order & Initiate Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE REFUND */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-rose-700">Issue Payment Refund</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleIssueRefund} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Refunding payment transaction <span className="font-mono font-bold">{selectedPayment.provider_transaction_id}</span> (Captured: ₹{selectedPayment.amount}).
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Refund Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedPayment.amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl border-slate-200 text-xs p-2.5 border focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRefundModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-500 shadow-sm">
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
