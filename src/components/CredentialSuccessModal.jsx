import React, { useState } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  Download,
  KeyRound,
  User,
  Building,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function CredentialSuccessModal({ credentials, onClose, title = 'Initial Credentials Generated' }) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!credentials) return null;

  const {
    name,
    account_holder_name,
    user_identifier,
    user_id,
    email,
    initial_password,
    role,
    organisation_name,
    organisation_code,
    status = 'active',
  } = credentials;

  const displayName = name || account_holder_name || 'Account Holder';
  const displayId = user_identifier || user_id || 'N/A';
  const displayOrg = organisation_name ? `${organisation_name} (${organisation_code || ''})` : null;

  const credentialSummaryText = `=====================================================
NATIONAL SECTOR SKILL COUNCIL LMS - ACCOUNT CREDENTIALS
=====================================================
Account Holder : ${displayName}
User ID / Login: ${displayId}
Email Address  : ${email}
${displayOrg ? `Organisation   : ${displayOrg}\n` : ''}${role ? `Assigned Role  : ${role}\n` : ''}Initial Password: ${initial_password}
Status         : ${status}
Security Notice: Temporary password. You must establish a new permanent password on first login.
Issued At      : ${new Date().toLocaleString()}
=====================================================`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(credentialSummaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = credentialSummaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([credentialSummaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lms_credentials_${displayId || 'account'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #102a35, #193b46)',
            color: '#fff',
            padding: '1.5rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                background: '#c5f36a',
                color: '#102a35',
                padding: '0.5rem',
                borderRadius: '10px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <KeyRound size={22} />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a9c0c6' }}>
                Secure access credential successfully generated
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              color: '#cbd5e1',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.75rem' }}>
          {/* Warning Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              color: '#92400e',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Action Required:</strong> Plaintext passwords are never stored in the database.
              Copy or download this initial password now. The user will be required to change it on their first login.
            </div>
          </div>

          {/* Credential Details Card */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'grid',
              gap: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {displayOrg && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={16} /> Organisation:
                </span>
                <strong style={{ color: '#0f172a' }}>{displayOrg}</strong>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} /> Account Holder:
              </span>
              <strong style={{ color: '#0f172a' }}>{displayName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>User ID / Login ID:</span>
              <code
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                }}
              >
                {displayId}
              </code>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <span style={{ color: '#64748b' }}>Email:</span>
              <span style={{ color: '#0f172a' }}>{email}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Initial Password:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code
                  style={{
                    background: '#fef08a',
                    color: '#854d0e',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: showPassword ? '1px' : '3px',
                  }}
                >
                  {showPassword ? initial_password : '••••••••••••'}
                </code>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: '#e2e8f0',
                    border: 0,
                    borderRadius: '6px',
                    padding: '4px 6px',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#475569',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: copied ? '#15803d' : '#102a35',
                color: '#fff',
                border: 0,
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
            </button>

            <button
              onClick={handleDownload}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: '#f1f5f9',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <Download size={18} />
              Download (.txt)
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.65rem',
              background: 'transparent',
              border: 0,
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Done & Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
