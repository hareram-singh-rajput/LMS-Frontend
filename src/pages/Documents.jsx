import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  UploadCloud,
  ShieldCheck,
  Lock,
  Download,
  Eye,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Key
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Upload Form
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('aadhaar_card');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/files`, { headers: getHeaders() });
      setDocuments(res.data.data || []);
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
      const res = await axios.post(`${API_BASE}/files/upload`, formData, {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessage({ type: 'success', text: `Document '${file.name}' uploaded successfully with SHA-256 checksum calculated!` });
      setFile(null);
      fetchDocuments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload document' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Secure Document Vault & Checksum Inspector</h1>
            <p className="text-slate-400 text-sm">Encrypted Storage Abstraction, SHA-256 Hash Integrity & Signed Time-Bound URLs</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDocuments}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700"
            title="Refresh Vault"
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

      {/* Upload Form Box */}
      <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-blue-400" />
          <span>Upload Candidate / Governance Document</span>
        </h3>

        <form onSubmit={handleFileUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="aadhaar_card">Aadhaar National Identity</option>
              <option value="educational_certificate">Educational Certificate</option>
              <option value="experience_letter">Experience Letter</option>
              <option value="compliance_audit">Compliance Audit Report</option>
              <option value="scorm_package">SCORM Course Package (ZIP)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select File (Max 10MB)</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium rounded-xl text-sm shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Calculating SHA-256...' : 'Upload to Secure Vault'}</span>
          </button>
        </form>
      </div>

      {/* Document Vault List */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Document File</th>
                <th className="p-4">Category</th>
                <th className="p-4">MIME & Size</th>
                <th className="p-4">SHA-256 Checksum Hash</th>
                <th className="p-4 text-right">Signed URL Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-800/30">
                  <td className="p-4">
                    <div className="font-bold text-white flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>{doc.file_name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs uppercase font-bold border border-blue-500/20">
                      {doc.document_type}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-400">
                    {doc.mime_type || 'application/pdf'} ({(doc.file_size_bytes / 1024).toFixed(1)} KB)
                  </td>
                  <td className="p-4 font-mono text-xs text-amber-400 max-w-xs truncate" title={doc.sha256_hash}>
                    {doc.sha256_hash ? doc.sha256_hash.slice(0, 16) + '...' : 'CALCULATED'}
                  </td>
                  <td className="p-4 text-right">
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium border border-slate-700"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Signed Access</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {documents.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400">No secure documents stored in vault yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
