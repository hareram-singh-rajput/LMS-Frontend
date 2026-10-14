import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import {
  GraduationCap,
  BookOpen,
  Layers,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  IndianRupee,
  Calendar,
  Sparkles,
  FileCheck,
  Video,
  FileText,
  PackageCheck,
  Music,
  Trash2,
  Upload,
  Play,
  Eye,
  Archive,
  Send,
  AlertTriangle,
  FolderPlus,
  FilePlus,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function Offerings() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('courses'); // courses, offerings, programmes

  const [offerings, setOfferings] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  const [loading, setLoading] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState(null);

  // Modals & Drawers
  const [showAddProgrammeModal, setShowAddProgrammeModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddOfferingModal, setShowAddOfferingModal] = useState(false);
  const [showContentBuilderModal, setShowContentBuilderModal] = useState(false);
  const [showUploadAssetModal, setShowUploadAssetModal] = useState(false);
  const [showUploadScormModal, setShowUploadScormModal] = useState(false);

  // Active course in builder
  const [builderCourse, setBuilderCourse] = useState(null);
  const [contentTree, setContentTree] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [targetItemForUpload, setTargetItemForUpload] = useState(null);

  // Notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Course Form (Extended for complete Course lifecycle)
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    delivery_mode: 'online',
    language: 'en',
    duration_hours: 40,
    short_description: '',
    description: '',
    thumbnail_url: '',
    visibility: 'public',
    enrolment_policy: 'open',
    access_model: 'free',
    learning_objectives: '',
    prerequisites: ''
  });

  // Content Item Form
  const [itemForm, setItemForm] = useState({
    type: 'module', // module, lesson, video, scorm, document, audio
    title: '',
    description: '',
    duration_seconds: 600,
    is_mandatory: true,
    external_url: '',
    parent_id: ''
  });

  // File Upload States
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('video'); // video, pdf, audio, document
  const [uploadProgress, setUploadProgress] = useState(false);

  // Programme & Offering Forms
  const [programmeForm, setProgrammeForm] = useState({
    code: '',
    name: '',
    funding_type: 'fee_based',
    description: ''
  });

  const [offeringForm, setOfferingForm] = useState({
    programme_id: '',
    course_id: '',
    qualification_version_id: '',
    tuition_fee: 15000,
    tax_percent: 18,
    min_age: 18,
    min_education: '12th Pass',
    pass_assessment_percent: 60,
    min_attendance_percent: 80
  });

  useEffect(() => {
    fetchCourses();
    fetchOfferings();
    fetchProgrammes();
    fetchQualifications();
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    apiClient.get('/courses')
      .then(res => {
        setCourses(res.data.data?.data || res.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load courses', err);
        setLoading(false);
      });
  };

  const fetchOfferings = () => {
    apiClient.get('/offerings')
      .then(res => {
        const list = res.data.data || [];
        setOfferings(list);
        if (list.length > 0 && !selectedOffering) {
          setSelectedOffering(list[0]);
        }
      })
      .catch(err => console.error('Failed to load offerings', err));
  };

  const fetchProgrammes = () => {
    apiClient.get('/programmes')
      .then(res => setProgrammes(res.data.data || []))
      .catch(err => console.error('Failed to load programmes', err));
  };

  const fetchQualifications = () => {
    apiClient.get('/master-data/qualifications')
      .then(res => setQualifications(res.data.data || []))
      .catch(err => console.error('Failed to load qualifications', err));
  };

  // Open Curriculum Builder for a Course
  const handleOpenContentBuilder = (course) => {
    setBuilderCourse(course);
    setErrorMsg('');
    setSuccessMsg('');
    setShowContentBuilderModal(true);
    fetchCourseTree(course.id);
  };

  const fetchCourseTree = (courseId) => {
    apiClient.get(`/lms/courses/${courseId}/content-tree`)
      .then(res => {
        setContentTree(res.data.data?.modules || []);
      })
      .catch(err => {
        console.error('Failed to load course content tree', err);
        setContentTree([]);
      });
  };

  // Create Course Handler
  const handleCreateCourse = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.post('/courses', courseForm)
      .then(res => {
        setSuccessMsg(`Course [${res.data.data.name}] created as Draft with initial Version 1.0.`);
        setShowAddCourseModal(false);
        fetchCourses();
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to create course');
      });
  };

  // Publish Course Handler
  const handlePublishCourse = (courseId) => {
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.post(`/courses/${courseId}/publish`)
      .then(res => {
        setSuccessMsg(`Course successfully published! It is now accessible in the Learner Catalogue.`);
        fetchCourses();
        if (builderCourse && builderCourse.id === courseId) {
          setBuilderCourse({ ...builderCourse, status: 'published' });
        }
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Publication failed. Please verify that at least 1 module and 1 item exist.');
      });
  };

  // Archive Course Handler
  const handleArchiveCourse = (courseId) => {
    if (!window.confirm('Are you sure you want to archive this course? It will be hidden from new enrolments.')) return;
    setErrorMsg('');

    apiClient.post(`/courses/${courseId}/archive`)
      .then(res => {
        setSuccessMsg('Course has been archived.');
        fetchCourses();
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to archive course');
      });
  };

  // Create Content Item (Module / Lesson / Item)
  const handleCreateContentItem = (e) => {
    e.preventDefault();
    if (!builderCourse) return;
    setErrorMsg('');

    const versionId = builderCourse.published_version_id || builderCourse.latest_version?.id || builderCourse.id;

    apiClient.post('/lms/content-items', {
      course_version_id: versionId,
      parent_id: itemForm.parent_id || null,
      type: itemForm.type,
      title: itemForm.title,
      description: itemForm.description,
      duration_seconds: itemForm.duration_seconds || 600,
      is_mandatory: itemForm.is_mandatory,
      external_url: itemForm.external_url || null
    })
      .then(res => {
        setSuccessMsg(`Created ${itemForm.type.toUpperCase()}: "${res.data.data.title}"`);
        setItemForm({
          type: 'module',
          title: '',
          description: '',
          duration_seconds: 600,
          is_mandatory: true,
          external_url: '',
          parent_id: ''
        });
        fetchCourseTree(builderCourse.id);
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to create curriculum item');
      });
  };

  // Delete Content Item
  const handleDeleteContentItem = (itemId) => {
    if (!window.confirm('Are you sure you want to delete this curriculum item?')) return;
    setErrorMsg('');

    apiClient.delete(`/lms/content-items/${itemId}`)
      .then(res => {
        setSuccessMsg('Curriculum item removed.');
        fetchCourseTree(builderCourse.id);
      })
      .catch(err => {
        setErrorMsg(err.response?.data?.message || 'Failed to delete curriculum item');
      });
  };

  // Handle Asset Upload (Video, PDF, Audio, Document)
  const handleUploadAssetSubmit = (e) => {
    e.preventDefault();
    if (!targetItemForUpload || !uploadFile) return;
    setUploadProgress(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('asset_type', uploadType);
    formData.append('title', targetItemForUpload.title);

    apiClient.post(`/lms/content-items/${targetItemForUpload.id}/assets`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        setUploadProgress(false);
        setSuccessMsg(`Asset successfully uploaded and SHA-256 verified!`);
        setShowUploadAssetModal(false);
        setUploadFile(null);
        fetchCourseTree(builderCourse.id);
      })
      .catch(err => {
        setUploadProgress(false);
        setErrorMsg(err.response?.data?.message || 'Asset upload failed. Check file type and size.');
      });
  };

  // Handle SCORM Package Upload
  const handleUploadScormSubmit = (e) => {
    e.preventDefault();
    if (!targetItemForUpload || !uploadFile) return;
    setUploadProgress(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', uploadFile);

    apiClient.post(`/lms/content-items/${targetItemForUpload.id}/scorm`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        setUploadProgress(false);
        setSuccessMsg(`Genuine SCORM package validated, extracted and registered!`);
        setShowUploadScormModal(false);
        setUploadFile(null);
        fetchCourseTree(builderCourse.id);
      })
      .catch(err => {
        setUploadProgress(false);
        setErrorMsg(err.response?.data?.message || 'SCORM package validation failed.');
      });
  };

  // Programme & Offering Handlers
  const handleCreateProgramme = (e) => {
    e.preventDefault();
    apiClient.post('/programmes', programmeForm)
      .then(() => {
        setSuccessMsg('Programme created successfully.');
        setShowAddProgrammeModal(false);
        fetchProgrammes();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to create programme'));
  };

  const handleCreateOffering = (e) => {
    e.preventDefault();
    apiClient.post('/offerings', offeringForm)
      .then(() => {
        setSuccessMsg('Offering created successfully.');
        setShowAddOfferingModal(false);
        fetchOfferings();
      })
      .catch(err => setErrorMsg(err.response?.data?.message || 'Failed to create offering'));
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #091e3a 0%, #1a365d 60%, #1e293b 100%)',
        borderRadius: '14px',
        padding: '2rem',
        color: '#fff',
        marginBottom: '2rem',
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ background: '#38bdf8', padding: '6px', borderRadius: '8px', color: '#091e3a' }}>
                <BookOpen size={24} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>
                Course Management & Content Builder
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.6 }}>
              Create certified courses, organize multi-level curriculum (Course → Module → Lesson → Item), upload recorded videos, SCORM packages, PDFs, and configure access governance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowAddCourseModal(true)}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Plus size={16} /> New Course
            </button>
            <button
              onClick={() => setShowAddOfferingModal(true)}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <GraduationCap size={16} /> New Offering
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}>
          <button
            onClick={() => setActiveTab('courses')}
            style={{
              background: activeTab === 'courses' ? '#38bdf8' : 'transparent',
              color: activeTab === 'courses' ? '#091e3a' : '#cbd5e1',
              border: 'none',
              padding: '0.55rem 1.3rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BookOpen size={16} /> Courses Management ({courses.length})
          </button>

          <button
            onClick={() => setActiveTab('offerings')}
            style={{
              background: activeTab === 'offerings' ? '#38bdf8' : 'transparent',
              color: activeTab === 'offerings' ? '#091e3a' : '#cbd5e1',
              border: 'none',
              padding: '0.55rem 1.3rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <GraduationCap size={16} /> Offerings ({offerings.length})
          </button>

          <button
            onClick={() => setActiveTab('programmes')}
            style={{
              background: activeTab === 'programmes' ? '#38bdf8' : 'transparent',
              color: activeTab === 'programmes' ? '#091e3a' : '#cbd5e1',
              border: 'none',
              padding: '0.55rem 1.3rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Layers size={16} /> Programmes ({programmes.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={20} />
          <span style={{ fontSize: '0.9rem' }}>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '0.9rem' }}>{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: COURSES MANAGEMENT & CONTENT BUILDER                               */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Sector Courses Directory</h2>
              <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                All course definitions with lifecycle versioning, curriculum builders, and publication controls.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {courses.map(course => {
              const isPublished = course.status === 'published';
              const isArchived = course.status === 'archived';

              return (
                <div
                  key={course.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    {/* Header: Title & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{course.name}</strong>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: isPublished ? '#dcfce7' : (isArchived ? '#f1f5f9' : '#fef3c7'),
                        color: isPublished ? '#166534' : (isArchived ? '#64748b' : '#b45309')
                      }}>
                        {course.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <code style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {course.code}
                      </code>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {course.delivery_mode.toUpperCase()}
                      </span>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {course.visibility || 'PUBLIC'}
                      </span>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {course.access_model || 'FREE'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                      {course.short_description || course.description || 'National skill council curriculum.'}
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={14} style={{ color: '#0284c7' }} />
                        <span>{course.duration_hours} hrs</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Layers size={14} style={{ color: '#0284c7' }} />
                        <span>{course.enrolment_policy || 'open'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <button
                      onClick={() => handleOpenContentBuilder(course)}
                      style={{
                        flex: 1,
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Layers size={14} /> Curriculum Builder
                    </button>

                    {!isPublished && (
                      <button
                        onClick={() => handlePublishCourse(course.id)}
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem 0.75rem',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Send size={14} /> Publish
                      </button>
                    )}

                    <button
                      onClick={() => navigate(`/lms?course_id=${course.id}`)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        borderRadius: '6px',
                        padding: '0.5rem 0.75rem',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Eye size={14} /> Player
                    </button>

                    {!isArchived && (
                      <button
                        onClick={() => handleArchiveCourse(course.id)}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#991b1b',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          cursor: 'pointer'
                        }}
                        title="Archive Course"
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OFFERINGS CATALOG (EXISTING)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'offerings' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedOffering ? '1fr 1.1fr' : '1fr', gap: '2rem' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1e293b' }}>
              Active Programme-Course Offerings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {offerings.map(off => (
                <div
                  key={off.id}
                  onClick={() => setSelectedOffering(off)}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: selectedOffering?.id === off.id ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: selectedOffering?.id === off.id ? '#f0f9ff' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ color: '#0f172a', display: 'block' }}>{off.course?.name || 'Course Offering'}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Programme: {off.programme?.name || 'Central Programme'} • Fee: ₹{off.fee_config_json?.total_fee || '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedOffering && (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Offering Specification</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Course: <strong>{selectedOffering.course?.name}</strong>
              </p>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div>Total Tuition: <strong>₹{selectedOffering.fee_config_json?.total_fee || '0'}</strong></div>
                <div>Min Attendance: <strong>{selectedOffering.completion_rules_json?.min_attendance_percent || 80}%</strong></div>
                <div>Pass Score: <strong>{selectedOffering.completion_rules_json?.pass_assessment_percent || 60}%</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PROGRAMMES (EXISTING)                                              */}
      {/* ========================================================================= */}
      {activeTab === 'programmes' && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.75rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Programmes Directory</h3>
            <button
              onClick={() => setShowAddProgrammeModal(true)}
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              + Add Programme
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {programmes.map(p => (
              <div key={p.id} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>{p.name}</strong>
                <code style={{ fontSize: '0.75rem', color: '#0284c7' }}>{p.code}</code>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{p.description || 'No description'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: COURSE CONTENT BUILDER                                    */}
      {/* ========================================================================= */}
      {showContentBuilderModal && builderCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '14px', width: '1100px', maxWidth: '96%', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  CURRICULUM ARCHITECT & CONTENT BUILDER
                </span>
                <h2 style={{ margin: '0.2rem 0 0 0', fontSize: '1.45rem', color: '#0f172a' }}>
                  {builderCourse.name} ({builderCourse.code})
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  onClick={() => handlePublishCourse(builderCourse.id)}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Send size={15} /> Publish Course
                </button>
                <button
                  onClick={() => setShowContentBuilderModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', color: '#64748b', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Main Content Builder Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              
              {/* Left Column: Curriculum Tree View */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} style={{ color: '#0284c7' }} /> Curriculum Structure
                </h3>

                {contentTree.length === 0 ? (
                  <div style={{ background: '#f8fafc', padding: '3rem 1.5rem', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                    <FolderPlus size={36} style={{ color: '#94a3b8', marginBottom: '0.5rem' }} />
                    <strong style={{ display: 'block' }}>No modules added yet</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Add your first module using the form on the right.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {contentTree.map((mod, modIdx) => (
                      <div key={mod.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', overflow: 'hidden' }}>
                        {/* Module header */}
                        <div style={{ padding: '0.75rem 1rem', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.85rem' }}>Module {modIdx + 1}:</span>
                            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{mod.title}</strong>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => setItemForm(prev => ({ ...prev, parent_id: mod.id, type: 'lesson' }))}
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                              title="Add lesson inside module"
                            >
                              + Lesson
                            </button>
                            <button
                              onClick={() => handleDeleteContentItem(mod.id)}
                              style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Module items / lessons */}
                        <div style={{ padding: '0.5rem 0.75rem' }}>
                          {(!mod.children || mod.children.length === 0) ? (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No lessons or items in this module.</span>
                          ) : (
                            mod.children.map(child => (
                              <div key={child.id} style={{ marginBottom: '0.5rem', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '0.65rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {child.type === 'video' && <Video size={15} style={{ color: '#0284c7' }} />}
                                    {child.type === 'scorm' && <PackageCheck size={15} style={{ color: '#16a34a' }} />}
                                    {child.type === 'document' && <FileText size={15} style={{ color: '#ea580c' }} />}
                                    {child.type === 'audio' && <Music size={15} style={{ color: '#8b5cf6' }} />}
                                    {child.type === 'lesson' && <Layers size={15} style={{ color: '#64748b' }} />}
                                    
                                    <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{child.title}</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>({child.type})</span>
                                  </div>

                                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                    {/* Upload asset trigger */}
                                    {child.type !== 'lesson' && child.type !== 'scorm' && (
                                      <button
                                        onClick={() => { setTargetItemForUpload(child); setUploadType(child.type === 'video' ? 'video' : 'pdf'); setShowUploadAssetModal(true); }}
                                        style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                      >
                                        <Upload size={12} /> {child.primary_asset ? 'Replace File' : 'Upload File'}
                                      </button>
                                    )}

                                    {/* Upload SCORM trigger */}
                                    {child.type === 'scorm' && (
                                      <button
                                        onClick={() => { setTargetItemForUpload(child); setShowUploadScormModal(true); }}
                                        style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                                      >
                                        <PackageCheck size={12} /> {child.scorm_package ? 'Update SCORM' : 'Upload ZIP'}
                                      </button>
                                    )}

                                    {child.type === 'lesson' && (
                                      <button
                                        onClick={() => setItemForm(prev => ({ ...prev, parent_id: child.id, type: 'video' }))}
                                        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                        title="Add learning item under lesson"
                                      >
                                        + Item
                                      </button>
                                    )}

                                    <button
                                      onClick={() => handleDeleteContentItem(child.id)}
                                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>

                                {/* Render sub-items if lesson */}
                                {child.children && child.children.length > 0 && (
                                  <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {child.children.map(subItem => (
                                      <div key={subItem.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          {subItem.type === 'video' && <Video size={13} style={{ color: '#0284c7' }} />}
                                          {subItem.type === 'scorm' && <PackageCheck size={13} style={{ color: '#16a34a' }} />}
                                          {subItem.type === 'document' && <FileText size={13} style={{ color: '#ea580c' }} />}
                                          <span>{subItem.title}</span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                          {subItem.type === 'scorm' ? (
                                            <button
                                              onClick={() => { setTargetItemForUpload(subItem); setShowUploadScormModal(true); }}
                                              style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                              {subItem.scorm_package ? 'SCORM Ready' : 'Upload ZIP'}
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => { setTargetItemForUpload(subItem); setUploadType(subItem.type === 'video' ? 'video' : 'pdf'); setShowUploadAssetModal(true); }}
                                              style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                              {subItem.primary_asset ? 'File Ready' : 'Upload File'}
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteContentItem(subItem.id)}
                                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer' }}
                                          >
                                            <Trash2 size={11} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Add Item Form */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', color: '#0f172a' }}>
                  + Add Curriculum Element
                </h3>

                <form onSubmit={handleCreateContentItem}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Element Type</label>
                    <select
                      value={itemForm.type}
                      onChange={e => setItemForm({ ...itemForm, type: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="module">Top-Level Module</option>
                      <option value="lesson">Lesson / Topic</option>
                      <option value="video">Recorded Video Unit</option>
                      <option value="scorm">SCORM Package (1.2 / 2004)</option>
                      <option value="document">PDF / Document Unit</option>
                      <option value="audio">Audio Lecture Unit</option>
                    </select>
                  </div>

                  {itemForm.type !== 'module' && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Parent Container</label>
                      <select
                        value={itemForm.parent_id}
                        onChange={e => setItemForm({ ...itemForm, parent_id: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="">-- Select Parent Container --</option>
                        {contentTree.map(mod => (
                          <optgroup key={mod.id} label={`Module: ${mod.title}`}>
                            <option value={mod.id}>{mod.title} (Module)</option>
                            {mod.children && mod.children.filter(c => c.type === 'lesson').map(les => (
                              <option key={les.id} value={les.id}>&nbsp;&nbsp;↳ Lesson: {les.title}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Introduction to Safety Standards"
                      value={itemForm.title}
                      onChange={e => setItemForm({ ...itemForm, title: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Description / Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Summary and key learning outcomes..."
                      value={itemForm.description}
                      onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  {itemForm.type !== 'module' && itemForm.type !== 'lesson' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Duration (Seconds)</label>
                        <input
                          type="number"
                          value={itemForm.duration_seconds}
                          onChange={e => setItemForm({ ...itemForm, duration_seconds: parseInt(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Mandatory?</label>
                        <select
                          value={itemForm.is_mandatory ? 'yes' : 'no'}
                          onChange={e => setItemForm({ ...itemForm, is_mandatory: e.target.value === 'yes' })}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        >
                          <option value="yes">Yes (Required)</option>
                          <option value="no">No (Optional)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      background: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.65rem 1rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Add to Curriculum
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD ASSET (VIDEO, PDF, AUDIO, DOCUMENT)                         */}
      {/* ========================================================================= */}
      {showUploadAssetModal && targetItemForUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '480px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Upload Content Asset</h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              For item: <strong>{targetItemForUpload.title}</strong>
            </p>

            <form onSubmit={handleUploadAssetSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Asset Type</label>
                <select
                  value={uploadType}
                  onChange={e => setUploadType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="video">Video (MP4, WebM)</option>
                  <option value="pdf">PDF Document</option>
                  <option value="document">Document (DOCX, PPTX, TXT)</option>
                  <option value="audio">Audio (MP3, WAV)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Select File (Max 150MB)</label>
                <input
                  type="file"
                  required
                  onChange={e => setUploadFile(e.target.files[0])}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadAssetModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {uploadProgress ? 'Uploading & Verifying SHA-256...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD SCORM ZIP PACKAGE                                           */}
      {/* ========================================================================= */}
      {showUploadScormModal && targetItemForUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '520px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <PackageCheck size={24} style={{ color: '#16a34a' }} />
              <h3 style={{ margin: 0, color: '#0f172a' }}>Upload SCORM ZIP Archive</h3>
            </div>
            <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              Item: <strong>{targetItemForUpload.title}</strong>. Validates imsmanifest.xml, launch resource, and extracts to isolated sandbox storage.
            </p>

            <form onSubmit={handleUploadScormSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Select SCORM ZIP Archive (Max 200MB)</label>
                <input
                  type="file"
                  required
                  accept=".zip"
                  onChange={e => setUploadFile(e.target.files[0])}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadScormModal(false)}
                  style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {uploadProgress ? 'Parsing imsmanifest.xml & Extracting...' : 'Validate & Extract SCORM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD COURSE                                                         */}
      {/* ========================================================================= */}
      {showAddCourseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '14px', width: '680px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Create New Certified Course</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '-0.2rem 0 1.25rem 0' }}>
              Creates the course record with auto-initialized Version 1.0 (Draft) and default offering.
            </p>

            <form onSubmit={handleCreateCourse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Course Code</label>
                  <input type="text" required placeholder="e.g. CRS-SSC-2026-01" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Course Name</label>
                  <input type="text" required placeholder="e.g. Full-Stack Web Development & DevOps" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Delivery Mode</label>
                  <select value={courseForm.delivery_mode} onChange={e => setCourseForm({ ...courseForm, delivery_mode: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="online">Self-Paced Online</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="classroom">Classroom</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Language</label>
                  <input type="text" value={courseForm.language} onChange={e => setCourseForm({ ...courseForm, language: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Estimated Hours</label>
                  <input type="number" required value={courseForm.duration_hours} onChange={e => setCourseForm({ ...courseForm, duration_hours: parseFloat(e.target.value) || 1 })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Visibility</label>
                  <select value={courseForm.visibility} onChange={e => setCourseForm({ ...courseForm, visibility: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="public">Public (Catalogue)</option>
                    <option value="restricted">Restricted (Eligible)</option>
                    <option value="private">Private (Invitation)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Enrolment Policy</label>
                  <select value={courseForm.enrolment_policy} onChange={e => setCourseForm({ ...courseForm, enrolment_policy: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="open">Open Self-Enrolment</option>
                    <option value="eligibility_based">Eligibility-Based</option>
                    <option value="invitation_based">Invitation-Based</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Access Model</label>
                  <select value={courseForm.access_model} onChange={e => setCourseForm({ ...courseForm, access_model: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="free">Free</option>
                    <option value="sponsored">Govt Sponsored</option>
                    <option value="paid">Commercial Paid</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Short Description</label>
                <input type="text" placeholder="One sentence summary for catalogue card..." value={courseForm.short_description} onChange={e => setCourseForm({ ...courseForm, short_description: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Detailed Description</label>
                <textarea rows={3} placeholder="Comprehensive course overview..." value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddCourseModal(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}>Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PROGRAMME                                                      */}
      {/* ========================================================================= */}
      {showAddProgrammeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Add New Programme</h3>
            <form onSubmit={handleCreateProgramme}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Programme Code</label>
                <input type="text" required placeholder="e.g. PRG-PMKVY-4" value={programmeForm.code} onChange={e => setProgrammeForm({ ...programmeForm, code: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Programme Name</label>
                <input type="text" required placeholder="e.g. PMKVY 4.0 Skill Training Scheme" value={programmeForm.name} onChange={e => setProgrammeForm({ ...programmeForm, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Funding Type</label>
                <select value={programmeForm.funding_type} onChange={e => setProgrammeForm({ ...programmeForm, funding_type: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="gov_funded">Government Funded</option>
                  <option value="fee_based">Fee Based (B2C/B2B)</option>
                  <option value="corporate">Corporate CSR</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddProgrammeModal(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Programme</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE OFFERING                                                    */}
      {/* ========================================================================= */}
      {showAddOfferingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Create Programme-Course Offering</h3>
            <form onSubmit={handleCreateOffering}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Programme</label>
                <select required value={offeringForm.programme_id} onChange={e => setOfferingForm({ ...offeringForm, programme_id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- Select Programme --</option>
                  {programmes.map(p => (<option key={p.id} value={p.id}>{p.name} ({p.code})</option>))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Course</label>
                <select required value={offeringForm.course_id} onChange={e => setOfferingForm({ ...offeringForm, course_id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.code})</option>))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>Tuition Fee (₹)</label>
                  <input type="number" required value={offeringForm.tuition_fee} onChange={e => setOfferingForm({ ...offeringForm, tuition_fee: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>GST Tax %</label>
                  <input type="number" required value={offeringForm.tax_percent} onChange={e => setOfferingForm({ ...offeringForm, tax_percent: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddOfferingModal(false)} style={{ background: '#e2e8f0', color: '#475569', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save Offering</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
