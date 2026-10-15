import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw
} from 'lucide-react';
import apiClient from '../api/client';

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
        apiClient.get('/payments/reconciliation'),
        apiClient.get('/payments/orders'),
        apiClient.get('/offerings'),
        apiClient.get('/candidates'),
      ]);

      setStats(reconRes.data?.data || null);
      setOrders(ordersRes.data?.data?.data || ordersRes.data?.data || []);
      setOfferings(offeringsRes.data?.data?.data || offeringsRes.data?.data || []);
      setCandidates(candidatesRes.data?.data?.data || candidatesRes.data?.data || []);
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
      const res = await apiClient.post('/payments/orders', orderForm);
      const newOrder = res.data?.data;
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
      const initRes = await apiClient.post(
        '/payments/initiate',
        {
          order_id: orderId,
          provider: 'razorpay',
        },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        }
      );

      const payment = initRes.data?.data;

      // Simulate Gateway Webhook Success Callback
      await apiClient.post('/webhooks/payment', {
        payment_id: payment.id,
        status: 'success',
        provider_transaction_id: `pay_${Math.random().toString(36).substring(7)}`,
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
      await apiClient.post(`/payments/${selectedPayment.id}/refund`, {
        amount: parseFloat(refundAmount),
        reason: refundReason,
      });

      setMessage({ type: 'success', text: `Refund of ₹${refundAmount} issued successfully!` });
      setShowRefundModal(false);
      fetchPaymentsData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Refund failed.' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        Loading payment & billing ledger...
      </div>
    );
  }

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
            <CreditCard size={16} />
            Commercial Orders & Financial Reconciliation
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: '#ffffff',
            }}
          >
            Payments & Commercial Billing
          </h1>

          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Enforce Idempotency-Key headers, verify server-to-server gateway callbacks, process refunds, and maintain GST tax compliance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowOrderModal(true)}
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
            Create Commercial Order
          </button>

          <button
            onClick={fetchPaymentsData}
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

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Total Captured Revenue</span>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', margin: '0.25rem 0' }}>
            ₹{(stats?.total_revenue || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {stats?.paid_orders || 0} paid transactions
          </span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>GST Tax Collected</span>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', margin: '0.25rem 0' }}>
            ₹{(stats?.total_tax_collected || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            18% Standard GST
          </span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Total Orders Issued</span>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0.25rem 0' }}>
            {stats?.total_orders || orders.length || 0}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Commercial Orders
          </span>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Refunds Issued</span>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b91c1c', margin: '0.25rem 0' }}>
            ₹{(stats?.total_refunds || 0).toLocaleString()}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Reconciled Claims
          </span>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Orders Table Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
            Commercial Orders & Invoices
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {orders.length} orders recorded
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>Order No</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Customer / Candidate</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Line Description</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Subtotal</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Tax</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Total (INR)</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No commercial orders found. Click &quot;Create Commercial Order&quot; to initiate a transaction.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const payment = ord.payments?.[0];
                  return (
                    <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                        {ord.order_no}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0f172a' }}>
                        {ord.candidate?.name || ord.candidate?.first_name ? `${ord.candidate.first_name || ord.candidate.name} ${ord.candidate.last_name || ''}` : 'Corporate Client'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748b', maxWidth: '240px' }}>
                        {ord.items?.[0]?.description || 'Course Offering Fee'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace' }}>
                        ₹{ord.subtotal}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', color: '#0284c7' }}>
                        ₹{ord.tax}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                        ₹{ord.total}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background:
                              ord.status === 'paid'
                                ? '#dcfce7'
                                : ord.status === 'refunded'
                                ? '#fee2e2'
                                : '#fef3c7',
                            color:
                              ord.status === 'paid'
                                ? '#15803d'
                                : ord.status === 'refunded'
                                ? '#b91c1c'
                                : '#b45309',
                          }}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {ord.status === 'created' && (
                            <button
                              onClick={() => handleInitiatePayment(ord.id)}
                              style={{
                                padding: '0.45rem 0.85rem',
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
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
                              style={{
                                padding: '0.45rem 0.85rem',
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {showOrderModal && (
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
                Create Commercial Order
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Target Candidate *
                </label>
                <select
                  required
                  value={orderForm.candidate_id}
                  onChange={(e) => setOrderForm({ ...orderForm, candidate_id: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Candidate...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.name || c.id} ({c.email || c.user_identifier || 'ID'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Course Offering *
                </label>
                <select
                  required
                  value={orderForm.programme_course_id}
                  onChange={(e) => setOrderForm({ ...orderForm, programme_course_id: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Course Offering...</option>
                  {offerings.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title || o.name || 'Course Offering'} - ₹{o.fee_inr || o.price || 4999}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create & Initiate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {showRefundModal && (
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
              maxWidth: '480px',
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
                Issue Commercial Refund
              </h3>
              <button
                onClick={() => setShowRefundModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueRefund} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Refund Amount (INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Refund Reason / Audit Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  style={{ padding: '0.65rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.25rem', background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
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
