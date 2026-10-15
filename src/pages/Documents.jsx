import React, { useState, useEffect } from 'react';
import {
  Lock,
  UploadCloud,
  FileText,
  Key,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  ShieldCheck
} from 'lucide-react';
import apiClient from '../api/client';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Upload Form
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar_card');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/files');
      setDocuments(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load document vault' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    try {
      await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({
        type: 'success',
        text: `Document '${file.name}' securely uploaded with SHA-256 integrity checksum calculated!`,
      });
      setFile(null);
      fetchDocuments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (doc) => {
    try {
      if (doc.signed_url) {
        window.open(doc.signed_url, '_blank');
        return;
      }

      const res = await apiClient.get(`/files/download/${doc.id}`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', doc.file_name || 'document.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      setMessage({ type: 'error', text: 'Failed to download document from secure storage.' });
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
            <Lock size={16} />
            Encrypted Document Vault Abstraction
          </div>

          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.5rem',
              color: '#ffffff',
            }}
          >
            Document Vault & Checksum Inspector
          </h1>

          <p style={{ margin: 0, color: '#a9c0c6', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Encrypted object storage with SHA-256 integrity hashes, candidate identity records, and time-bound signed access.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          title="Refresh Vault"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Box Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <h3
          style={{
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            color: '#0f172a',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <UploadCloud size={20} color="#2563eb" />
          <span>Upload Document to Encrypted Storage</span>
        </h3>

        <form onSubmit={handleFileUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Document Category *
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="aadhaar_card">Aadhaar National Identity</option>
              <option value="educational_certificate">Educational Certificate</option>
              <option value="experience_letter">Experience Letter</option>
              <option value="compliance_audit">Compliance Audit Report</option>
              <option value="scorm_package">SCORM Course Package (ZIP)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Select File (Max 10MB) *
            </label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: '#2563eb',
              color: '#ffffff',
              border: 0,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.7 : 1,
            }}
          >
            <UploadCloud size={18} />
            <span>{uploading ? 'Hashing SHA-256...' : 'Upload Document'}</span>
          </button>
        </form>
      </div>

      {/* Document Vault Table Card */}
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
            Stored Vault Documents
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {documents.length} objects stored
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700 }}>
                <th style={{ padding: '0.85rem 1.25rem' }}>File Name</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>MIME & Size</th>
                <th style={{ padding: '0.85rem 1.25rem' }}>SHA-256 Checksum Hash</th>
                <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Access</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                    No secure documents found in your vault.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: 600 }}>
                        <FileText size={18} color="#2563eb" />
                        <span>{doc.file_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: '#e0f2fe',
                          color: '#0369a1',
                        }}
                      >
                        {doc.document_type || 'GENERAL'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                      {doc.mime_type || 'application/octet-stream'} ({(doc.file_size_bytes ? doc.file_size_bytes / 1024 : 0).toFixed(1)} KB)
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        title={doc.sha256_hash}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {doc.sha256_hash ? `${doc.sha256_hash.slice(0, 16)}...` : 'VERIFIED'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.85rem',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
