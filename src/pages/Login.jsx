import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  LockKeyhole,
  Building2,
  Users,
  Building,
  KeyRound,
  CheckCircle,
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

const AUTH_ENDPOINTS = {
  login: '/auth/login',
  registerCandidate: '/auth/register/candidate',
  registerTP: '/auth/register/training-partner',
  registerTC: '/auth/register/training-centre',
  registerEmployer: '/auth/register/employer',
  changePassword: '/auth/password/change',
};

const C = {
  navy: '#102a35',
  navy2: '#193b46',
  green: '#c5f36a',
  text: '#172b36',
  muted: '#71808c',
  border: '#dce4e9',
  bg: '#f7f9fa',
  danger: '#b42318',
  success: '#18794e',
};

const inputStyle = {
  width: '100%',
  height: 48,
  padding: '0 14px',
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  background: '#fff',
  color: C.text,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block',
  marginBottom: 8,
  color: '#263b46',
  fontSize: 12,
  fontWeight: 700,
};

const primaryButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  minHeight: 50,
  padding: '0 18px',
  border: `1px solid ${C.navy}`,
  borderRadius: 9,
  background: C.navy,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const secondaryButtonStyle = {
  border: 0,
  padding: 0,
  background: 'transparent',
  color: '#426b5a',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0];
    if (firstError) return firstError;
  }
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (!error?.response) {
    return 'Unable to connect to the server. Please check that your backend is running.';
  }
  return fallback;
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  required = true,
  disabled = false,
  rightElement,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={name} style={labelStyle}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputStyle,
            paddingRight: rightElement ? 48 : 14,
            borderColor: focused ? '#527e70' : C.border,
            boxShadow: focused ? '0 0 0 3px #527e701a' : 'none',
          }}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const [view, setView] = useState('login');
  // 'login', 'register_select', 'register_candidate', 'register_tp', 'register_tc', 'register_employer', 'force_change'

  const [form, setForm] = useState({
    loginIdentifier: '',
    password: '',
    password_confirmation: '',
    current_password: '',

    // Candidate fields
    candidate_name: '',
    candidate_email: '',
    candidate_mobile: '',

    // Org common fields
    org_name: '',
    org_code: '',
    registration_no: '',
    contact_name: '',
    email: '',
    mobile: '',

    // Training Centre fields
    parent_org_code: '',
    centre_name: '',
    centre_code: '',
    capacity: 30,

    // Employer fields
    industry_sector: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const changeView = (nextView) => {
    setView(nextView);
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowCurrentPassword(false);
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. LOGIN
      if (view === 'login') {
        const response = await apiClient.post(AUTH_ENDPOINTS.login, {
          email: form.loginIdentifier.trim(), // Can be email, mobile, or user_identifier
          password: form.password,
        });

        const { access_token, user } = response.data;
        if (!access_token || !user) {
          throw new Error('Invalid login response received from server.');
        }

        setAuth(user, access_token);

        // Check if mandatory password change is required
        if (user.must_change_password) {
          setView('force_change');
          setForm((f) => ({ ...f, current_password: form.password, password: '', password_confirmation: '' }));
          setError('');
          setSuccess('Initial temporary credentials verified. Please establish a new password to complete your account setup.');
          return;
        }

        navigate('/', { replace: true });
        return;
      }

      // 2. MANDATORY PASSWORD CHANGE
      if (view === 'force_change') {
        if (form.password !== form.password_confirmation) {
          setError('New password and password confirmation do not match.');
          return;
        }

        await apiClient.post(AUTH_ENDPOINTS.changePassword, {
          current_password: form.current_password,
          new_password: form.password,
          new_password_confirmation: form.password_confirmation,
        });

        setSuccess('Password updated successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1200);
        return;
      }

      // 3. CANDIDATE REGISTRATION (Self-Service)
      if (view === 'register_candidate') {
        if (form.password !== form.password_confirmation) {
          setError('Password and confirm password do not match.');
          return;
        }

        const response = await apiClient.post(AUTH_ENDPOINTS.registerCandidate, {
          name: form.candidate_name.trim(),
          email: form.candidate_email.trim(),
          mobile: form.candidate_mobile?.trim() || null,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });

        if (response.data?.access_token && response.data?.user) {
          setAuth(response.data.user, response.data.access_token);
          navigate('/', { replace: true });
          return;
        }

        setSuccess('Candidate registration successful. Please log in with your credentials.');
        changeView('login');
        return;
      }

      // 4. TRAINING PARTNER REGISTRATION (Requires Council Officer Approval)
      if (view === 'register_tp') {
        const response = await apiClient.post(AUTH_ENDPOINTS.registerTP, {
          org_name: form.org_name.trim(),
          org_code: form.org_code.trim(),
          registration_no: form.registration_no?.trim() || null,
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          mobile: form.mobile?.trim() || null,
        });

        setSuccess(response.data?.message || 'Training Partner application submitted successfully. Pending review by Council Officers.');
        setView('registered_pending');
        return;
      }

      // 5. TRAINING CENTRE REGISTRATION (Requires Approved Parent TP)
      if (view === 'register_tc') {
        const response = await apiClient.post(AUTH_ENDPOINTS.registerTC, {
          parent_org_code: form.parent_org_code.trim(),
          centre_name: form.centre_name.trim(),
          centre_code: form.centre_code.trim(),
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          mobile: form.mobile?.trim() || null,
          capacity: parseInt(form.capacity, 10) || 30,
        });

        setSuccess(response.data?.message || 'Training Centre application submitted successfully. Pending review by Council Officers.');
        setView('registered_pending');
        return;
      }

      // 6. EMPLOYER REGISTRATION (Requires Council Officer Approval)
      if (view === 'register_employer') {
        const response = await apiClient.post(AUTH_ENDPOINTS.registerEmployer, {
          org_name: form.org_name.trim(),
          org_code: form.org_code.trim(),
          registration_no: form.registration_no?.trim() || null,
          contact_name: form.contact_name.trim(),
          email: form.email.trim(),
          mobile: form.mobile?.trim() || null,
          industry_sector: form.industry_sector?.trim() || null,
        });

        setSuccess(response.data?.message || 'Employer application submitted successfully. Pending review by Council Officers.');
        setView('registered_pending');
        return;
      }
    } catch (err) {
      setError(getErrorMessage(err, 'The request could not be completed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const passwordToggle = (visible, toggle) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        border: 0,
        background: 'transparent',
        color: '#6e808a',
        cursor: 'pointer',
        padding: '0 8px',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <main
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(420px, 1.15fr)',
        minHeight: '100vh',
        background: '#fff',
        color: C.text,
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Brand panel */}
      <section
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          padding: 'clamp(32px, 5vw, 64px)',
          background: 'radial-gradient(ellipse at 10% 90%, #1b4b4e 0%, transparent 45%), linear-gradient(145deg, #102a35, #0b202a)',
          color: '#fff',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 48,
                height: 48,
                borderRadius: 12,
                background: C.green,
                color: C.navy,
              }}
            >
              <GraduationCap size={28} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.5 }}>SECTOR SKILL COUNCIL</div>
              <div style={{ marginTop: 2, color: '#a9c0c6', fontSize: 10, letterSpacing: 2 }}>GENERIC LMS PLATFORM</div>
            </div>
          </div>

          <div style={{ marginTop: 'clamp(50px, 8vh, 90px)', maxWidth: 520 }}>
            <div style={{ color: C.green, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              Phase 3 Integrated Governance
            </div>
            <h1 style={{ margin: '14px 0', fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.25, color: '#ffffff' }}>
              National Skill Ecosystem Lifecycle & Onboarding
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.8 }}>
              Role-based management, secure approval workflows, and organisation credential management connecting Councils, Training Partners, Training Centres, Assessors, and Employers.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 20, marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 10, background: '#ffffff12', color: C.green }}>
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Organisation Governance</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>Structured approval queue for Partners, Centres, & Employers</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 10, background: '#ffffff12', color: C.green }}>
                <KeyRound size={20} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Credential Management</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>Secure initial credential generation & mandatory first-login reset</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 10, background: '#ffffff12', color: C.green }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Multi-Tenant Isolation</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>Strict server-enforced role and organisation boundary controls</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 30, color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={16} color={C.green} />
          End-to-End Audited Operations · No Plaintext Credential Exposure
        </div>
      </section>

      {/* Main Authentication & Registration Panel */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px clamp(24px, 5vw, 64px)',
          background: '#fff',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: '#4d7c67', fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>
              {view === 'login' && 'SECURE SIGN IN'}
              {view === 'register_select' && 'GET STARTED'}
              {view === 'register_candidate' && 'CANDIDATE ONBOARDING'}
              {view === 'register_tp' && 'TRAINING PARTNER ONBOARDING'}
              {view === 'register_tc' && 'TRAINING CENTRE ONBOARDING'}
              {view === 'register_employer' && 'EMPLOYER ONBOARDING'}
              {view === 'force_change' && 'SECURITY ACTIVATION'}
              {view === 'registered_pending' && 'APPLICATION RECEIVED'}
            </div>

            <h2 style={{ margin: '8px 0', fontSize: '1.75rem', fontWeight: 800, color: C.navy }}>
              {view === 'login' && 'Sign in to workspace'}
              {view === 'register_select' && 'Select Registration Type'}
              {view === 'register_candidate' && 'Register as Candidate'}
              {view === 'register_tp' && 'Apply as Training Partner'}
              {view === 'register_tc' && 'Register Training Centre'}
              {view === 'register_employer' && 'Register as Employer'}
              {view === 'force_change' && 'Mandatory Password Setup'}
              {view === 'registered_pending' && 'Application Submitted'}
            </h2>

            <p style={{ margin: 0, color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
              {view === 'login' && 'Enter your User ID, Email, or Mobile to access your authorized dashboard.'}
              {view === 'register_select' && 'Choose your role within the Skill Council ecosystem.'}
              {view === 'register_candidate' && 'Instant self-service registration for learners.'}
              {view === 'register_tp' && 'Submit institutional details for Council Officer approval.'}
              {view === 'register_tc' && 'Register a training delivery centre under your approved Training Partner.'}
              {view === 'register_employer' && 'Register your company to access certified talent.'}
              {view === 'force_change' && 'A temporary credential was issued. Establish your private password.'}
            </p>
          </div>

          {/* Feedback banners */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 20,
                padding: '12px 14px',
                border: '1px solid #fecaca',
                borderRadius: 9,
                background: '#fef2f2',
                color: C.danger,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 20,
                padding: '12px 14px',
                border: '1px solid #bbf7d0',
                borderRadius: 9,
                background: '#f0fdf4',
                color: C.success,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{success}</span>
            </div>
          )}

          {/* 1. REGISTRATION SELECTOR SCREEN */}
          {view === 'register_select' && (
            <div>
              <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                {/* Option 1: Candidate */}
                <div
                  onClick={() => changeView('register_candidate')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#102a35')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 10, background: '#e0f2fe', color: '#0369a1' }}>
                    <Users size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>1. Candidate / Learner</strong>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Self-register to enrol in courses and access learning</span>
                  </div>
                  <ArrowRight size={16} color="#64748b" />
                </div>

                {/* Option 2: Training Partner */}
                <div
                  onClick={() => changeView('register_tp')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#102a35')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 10, background: '#fef3c7', color: '#b45309' }}>
                    <Building2 size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>2. Training Partner</strong>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Accredited organisation. Requires Council approval.</span>
                  </div>
                  <ArrowRight size={16} color="#64748b" />
                </div>

                {/* Option 3: Training Centre */}
                <div
                  onClick={() => changeView('register_tc')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#102a35')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 10, background: '#dcfce7', color: '#15803d' }}>
                    <Building size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>3. Training Centre</strong>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Affiliated centre under an approved Training Partner</span>
                  </div>
                  <ArrowRight size={16} color="#64748b" />
                </div>

                {/* Option 4: Employer */}
                <div
                  onClick={() => changeView('register_employer')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#102a35')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
                >
                  <div style={{ display: 'grid', placeItems: 'center', width: 44, height: 44, borderRadius: 10, background: '#f3e8ff', color: '#7e22ce' }}>
                    <BriefcaseBusiness size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 14, color: '#0f172a' }}>4. Employer</strong>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Industry partner for recruitment & placement</span>
                  </div>
                  <ArrowRight size={16} color="#64748b" />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => changeView('login')}
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 2. APPLICATION SUBMITTED PENDING BANNER */}
          {view === 'registered_pending' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#b45309',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle size={36} />
              </div>

              <h3 style={{ fontSize: '1.3rem', color: C.navy, margin: '0 0 10px' }}>
                Application Under Review
              </h3>

              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                Your registration application has been submitted to the Sector Skill Council. A Council Officer will review your organisation details and issue your initial login credentials upon approval.
              </p>

              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => changeView('login')}
              >
                <span>Return to Login</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* 3. LOGIN FORM */}
          {view === 'login' && (
            <form onSubmit={submitRequest}>
              <Field
                label="User ID, Email, or Mobile"
                name="loginIdentifier"
                value={form.loginIdentifier}
                onChange={update}
                placeholder="e.g. CO-1001, admin@org.com, or mobile"
                disabled={loading}
              />

              <Field
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update}
                placeholder="Enter password"
                disabled={loading}
                rightElement={passwordToggle(showPassword, () => setShowPassword(!showPassword))}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.75 : 1,
                  marginTop: 8,
                }}
              >
                <span>{loading ? 'Authenticating...' : 'Sign in to workspace'}</span>
                {loading ? <LoaderCircle size={18} className="spin" /> : <ArrowRight size={18} />}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 28,
                  marginBottom: 20,
                }}
              >
                <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>NEW TO LMS?</span>
                <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 9,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: C.navy,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => changeView('register_select')}
                >
                  Create an account or Register Organisation →
                </button>
              </div>
            </form>
          )}

          {/* 4. MANDATORY PASSWORD CHANGE FORM */}
          {view === 'force_change' && (
            <form onSubmit={submitRequest}>
              <div
                style={{
                  padding: '12px 14px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: 9,
                  color: '#92400e',
                  fontSize: 12,
                  lineHeight: 1.5,
                  marginBottom: 16,
                }}
              >
                <strong>Security Policy:</strong> You have logged in using an initial temporary password. Please enter a new private password (minimum 8 characters) to proceed.
              </div>

              <Field
                label="Temporary / Current password"
                name="current_password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={form.current_password}
                onChange={update}
                placeholder="Enter initial temporary password"
                disabled={loading}
                rightElement={passwordToggle(showCurrentPassword, () => setShowCurrentPassword(!showCurrentPassword))}
              />

              <Field
                label="New password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update}
                placeholder="Enter at least 8 characters"
                disabled={loading}
                rightElement={passwordToggle(showPassword, () => setShowPassword(!showPassword))}
              />

              <Field
                label="Confirm new password"
                name="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={update}
                placeholder="Re-enter new password"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.75 : 1,
                  marginTop: 8,
                }}
              >
                <span>{loading ? 'Updating Password...' : 'Save Password & Continue'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* 5. CANDIDATE REGISTRATION FORM */}
          {view === 'register_candidate' && (
            <form onSubmit={submitRequest}>
              <Field
                label="Full name"
                name="candidate_name"
                value={form.candidate_name}
                onChange={update}
                placeholder="e.g. John Doe"
                disabled={loading}
              />

              <Field
                label="Email address"
                name="candidate_email"
                type="email"
                value={form.candidate_email}
                onChange={update}
                placeholder="john@example.com"
                disabled={loading}
              />

              <Field
                label="Mobile number (optional)"
                name="candidate_mobile"
                value={form.candidate_mobile}
                onChange={update}
                placeholder="+91 98765 43210"
                required={false}
                disabled={loading}
              />

              <Field
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update}
                placeholder="Minimum 8 characters"
                disabled={loading}
                rightElement={passwordToggle(showPassword, () => setShowPassword(!showPassword))}
              />

              <Field
                label="Confirm password"
                name="password_confirmation"
                type={showPassword ? 'text' : 'password'}
                value={form.password_confirmation}
                onChange={update}
                placeholder="Re-enter password"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.75 : 1,
                  marginTop: 8,
                }}
              >
                <span>{loading ? 'Creating Account...' : 'Complete Candidate Registration'}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" style={secondaryButtonStyle} onClick={() => changeView('register_select')}>
                  ← Choose different role
                </button>
              </div>
            </form>
          )}

          {/* 6. TRAINING PARTNER REGISTRATION FORM */}
          {view === 'register_tp' && (
            <form onSubmit={submitRequest}>
              <Field
                label="Organisation Name"
                name="org_name"
                value={form.org_name}
                onChange={update}
                placeholder="e.g. National Skill Academy"
                disabled={loading}
              />

              <Field
                label="Organisation Code (Unique Identifier)"
                name="org_code"
                value={form.org_code}
                onChange={update}
                placeholder="e.g. TP-NSA"
                disabled={loading}
              />

              <Field
                label="Accreditation / Registration No"
                name="registration_no"
                value={form.registration_no}
                onChange={update}
                placeholder="e.g. REG-TP-2026-001"
                required={false}
                disabled={loading}
              />

              <Field
                label="Authorised Contact Person"
                name="contact_name"
                value={form.contact_name}
                onChange={update}
                placeholder="e.g. Dr. Rajesh Kumar"
                disabled={loading}
              />

              <Field
                label="Official Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="director@skillsacademy.org"
                disabled={loading}
              />

              <Field
                label="Contact Phone / Mobile"
                name="mobile"
                value={form.mobile}
                onChange={update}
                placeholder="+91 98765 00000"
                required={false}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.75 : 1,
                  marginTop: 8,
                }}
              >
                <span>{loading ? 'Submitting Application...' : 'Submit Application for Review'}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" style={secondaryButtonStyle} onClick={() => changeView('register_select')}>
                  ← Choose different role
                </button>
              </div>
            </form>
          )}

          {/* 7. TRAINING CENTRE REGISTRATION FORM */}
          {view === 'register_tc' && (
            <form onSubmit={submitRequest}>
              <Field
                label="Parent Training Partner Code"
                name="parent_org_code"
                value={form.parent_org_code}
                onChange={update}
                placeholder="e.g. TP-ALPHA (Must be approved TP)"
                disabled={loading}
              />

              <Field
                label="Training Centre Name"
                name="centre_name"
                value={form.centre_name}
                onChange={update}
                placeholder="e.g. South Campus Skill Center"
                disabled={loading}
              />

              <Field
                label="Training Centre Code"
                name="centre_code"
                value={form.centre_code}
                onChange={update}
                placeholder="e.g. TC-SOUTH-01"
                disabled={loading}
              />

              <Field
                label="Centre Manager / Contact Name"
                name="contact_name"
                value={form.contact_name}
                onChange={update}
                placeholder="e.g. Priya Sharma"
                disabled={loading}
              />

              <Field
                label="Centre Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="tc.south@skillsacademy.org"
                disabled={loading}
              />

              <Field
                label="Training Capacity (Students per batch)"
                name="capacity"
                type="number"
                value={form.capacity}
                onChange={update}
                placeholder="30"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.75 : 1,
                  marginTop: 8,
                }}
              >
                <span>{loading ? 'Submitting Application...' : 'Submit Centre Application'}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" style={secondaryButtonStyle} onClick={() => changeView('register_select')}>
                  ← Choose different role
                </button>
              </div>
            </form>
          )}

          {/* 8. EMPLOYER REGISTRATION FORM */}
          {view === 'register_employer' && (
            <form onSubmit={submitRequest}>
              <Field
                label="Company / Employer Name"
                name="org_name"
                value={form.org_name}
                onChange={update}
                placeholder="e.g. Tata Consultancy Services"
                disabled={loading}
              />

              <Field
                label="Employer Code"
                name="org_code"
                value={form.org_code}
                onChange={update}
                placeholder="e.g. EMP-TCS"
                disabled={loading}
              />

              <Field
                label="Corporate CIN / Registration No"
                name="registration_no"
                value={form.registration_no}
                onChange={update}
                placeholder="e.g. U72200MH1995PLC..."
                required={false}
                disabled={loading}
              />

              <Field
                label="HR / Authorised Contact Person"
                name="contact_name"
                value={form.contact_name}
                onChange={update}
                placeholder="e.g. Ananya Roy"
                disabled={loading}
              />

              <Field
                label="Corporate Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                placeholder="talent@employer.com"
                disabled={loading}
              />

              <Field
                label="Industry Sector"
                name="industry_sector"
                value={form.industry_sector}
                onChange={update}
                placeholder="e.g. IT & Software Development"
                required={false}
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.75 : 1,
                  marginTop: 8,
                }}
              >
                <span>{loading ? 'Submitting Application...' : 'Submit Employer Application'}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" style={secondaryButtonStyle} onClick={() => changeView('register_select')}>
                  ← Choose different role
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
