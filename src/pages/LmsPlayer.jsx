import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import {
  Play,
  CheckCircle2,
  FileText,
  PackageCheck,
  Video,
  Layers,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  BookOpen,
  Search,
  Filter,
  Download,
  AlertCircle,
  Award,
  Music,
  Check,
  CircleDot,
  GraduationCap
} from 'lucide-react';

export default function LmsPlayer() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view: 'player' or 'catalogue'
  const [activeTab, setActiveTab] = useState('player');

  // Courses & catalogue states
  const [catalogueCourses, setCatalogueCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolment, setEnrolment] = useState(null);
  const [contentTree, setContentTree] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Progress state
  const [progressMap, setProgressMap] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccessModel, setFilterAccessModel] = useState('all');
  const [filterDeliveryMode, setFilterDeliveryMode] = useState('all');

  // UI state
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Video progress debouncer ref
  const videoDebounceTimer = useRef(null);

  // Auth token for iframe & media URLs
  const authToken = localStorage.getItem('auth_token') || '';

  useEffect(() => {
    fetchCatalogue();
  }, []);

  // When catalogue is loaded or query param changes, select course
  useEffect(() => {
    const courseIdParam = searchParams.get('course_id');
    if (courseIdParam && catalogueCourses.length > 0) {
      const match = catalogueCourses.find(c => c.id === courseIdParam);
      if (match) {
        handleSelectCourse(match);
      }
    } else if (catalogueCourses.length > 0 && !selectedCourse) {
      handleSelectCourse(catalogueCourses[0]);
    }
  }, [catalogueCourses, searchParams]);

  const fetchCatalogue = () => {
    setLoading(true);
    apiClient.get('/courses/catalogue')
      .then(res => {
        const list = res.data.data?.data || res.data.data || [];
        setCatalogueCourses(list);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load catalogue', err);
        setErrorMsg('Failed to load published courses catalogue.');
        setLoading(false);
      });
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setErrorMsg('');
    setSuccessMsg('');
    setSearchParams({ course_id: course.id });
    setActiveTab('player');

    // 1. Fetch learner enrolment for this course
    apiClient.get(`/courses/${course.id}/my-enrolment`)
      .then(res => {
        const enrData = res.data.data?.enrolment;
        const progressPct = res.data.data?.overall_progress_percent || 0;
        setEnrolment(enrData);
        setOverallProgress(progressPct);

        // 2. Fetch course content tree
        loadCourseContentTree(course.id, enrData);
      })
      .catch(err => {
        console.error('No enrolment or error', err);
        setEnrolment(null);
        setOverallProgress(0);
        loadCourseContentTree(course.id, null);
      });
  };

  const loadCourseContentTree = (courseId, currentEnrolment) => {
    setLoading(true);
    apiClient.get(`/lms/courses/${courseId}/content-tree`)
      .then(res => {
        const tree = res.data.data?.modules || [];
        setContentTree(tree);

        // Expand all modules by default
        const exp = {};
        tree.forEach((mod, idx) => { exp[mod.id || idx] = true; });
        setExpandedModules(exp);

        // If enrolled, load real progress records
        if (currentEnrolment) {
          fetchLearningProgress(currentEnrolment.id, tree);
        } else {
          // Default first item
          const first = findFirstPlayableItem(tree);
          setActiveItem(first || null);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load content tree', err);
        setErrorMsg('Could not load course curriculum. Please ensure content has been added.');
        setContentTree([]);
        setActiveItem(null);
        setLoading(false);
      });
  };

  const fetchLearningProgress = (enrolmentId, tree) => {
    apiClient.get(`/lms/progress/${enrolmentId}`)
      .then(res => {
        const records = res.data.data || [];
        const map = {};
        records.forEach(r => {
          map[r.content_item_id] = r;
        });
        setProgressMap(map);

        // Resume: find first incomplete or last accessed item
        const playableItems = getAllPlayableItems(tree);
        let resumeTarget = null;

        for (const item of playableItems) {
          const p = map[item.id];
          if (!p || (p.status !== 'completed' && p.progress_percent < 100)) {
            resumeTarget = item;
            break;
          }
        }

        setActiveItem(resumeTarget || playableItems[0] || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load learning progress', err);
        const first = findFirstPlayableItem(tree);
        setActiveItem(first || null);
        setLoading(false);
      });
  };

  const handleSelfEnrol = (courseId) => {
    setEnrolling(true);
    setErrorMsg('');
    setSuccessMsg('');

    apiClient.post(`/courses/${courseId}/enrol`)
      .then(res => {
        setSuccessMsg('Successfully enrolled! Loading learning player...');
        setEnrolling(false);
        if (selectedCourse && selectedCourse.id === courseId) {
          handleSelectCourse(selectedCourse);
        } else {
          fetchCatalogue();
        }
      })
      .catch(err => {
        setEnrolling(false);
        setErrorMsg(err.response?.data?.message || 'Enrolment failed. Please check eligibility.');
      });
  };

  const handleUpdateItemProgress = (item, progressPct, status = 'in_progress', timeSpent = 30, lastPos = 0) => {
    if (!enrolment) return;

    apiClient.put(`/lms/progress/${enrolment.id}/${item.id}`, {
      status: status,
      progress_percent: progressPct,
      time_spent_seconds: timeSpent,
      last_position_seconds: lastPos
    })
      .then(res => {
        // Refresh local progress map
        const updated = res.data.data;
        setProgressMap(prev => ({
          ...prev,
          [item.id]: updated
        }));

        // Refresh overall enrolment progress
        apiClient.get(`/courses/${selectedCourse.id}/my-enrolment`)
          .then(enrRes => {
            setOverallProgress(enrRes.data.data?.overall_progress_percent || progressPct);
          })
          .catch(() => {});
      })
      .catch(err => console.error('Failed to update progress', err));
  };

  // Video player timeupdate tracking (debounced every 5 seconds)
  const handleVideoTimeUpdate = (e, item) => {
    const video = e.target;
    if (!video.duration || !enrolment) return;

    const currentSec = Math.floor(video.currentTime);
    const durationSec = Math.floor(video.duration);
    const pct = Math.min(100, Math.round((currentSec / durationSec) * 100));

    // Clear previous timer
    if (videoDebounceTimer.current) {
      clearTimeout(videoDebounceTimer.current);
    }

    videoDebounceTimer.current = setTimeout(() => {
      const isCompleted = pct >= 90;
      handleUpdateItemProgress(
        item,
        pct,
        isCompleted ? 'completed' : 'in_progress',
        currentSec,
        currentSec
      );
    }, 4000);
  };

  const handleVideoEnded = (item) => {
    if (videoDebounceTimer.current) clearTimeout(videoDebounceTimer.current);
    handleUpdateItemProgress(item, 100, 'completed', item.duration_seconds || 60, item.duration_seconds || 60);
    setSuccessMsg(`Completed "${item.title}"!`);
  };

  // Helper functions to traverse content tree
  const getAllPlayableItems = (modules) => {
    const items = [];
    if (!modules) return items;
    modules.forEach(mod => {
      // Mod might have lessons or direct items
      if (mod.children) {
        mod.children.forEach(sub => {
          if (sub.children && sub.children.length > 0) {
            sub.children.forEach(item => items.push(item));
          } else {
            items.push(sub);
          }
        });
      }
    });
    return items;
  };

  const findFirstPlayableItem = (modules) => {
    const all = getAllPlayableItems(modules);
    return all.length > 0 ? all[0] : null;
  };

  const getNextPlayableItem = () => {
    const all = getAllPlayableItems(contentTree);
    if (!activeItem || all.length === 0) return null;
    const idx = all.findIndex(i => i.id === activeItem.id);
    return (idx >= 0 && idx < all.length - 1) ? all[idx + 1] : null;
  };

  const getPrevPlayableItem = () => {
    const all = getAllPlayableItems(contentTree);
    if (!activeItem || all.length === 0) return null;
    const idx = all.findIndex(i => i.id === activeItem.id);
    return (idx > 0) ? all[idx - 1] : null;
  };

  const toggleModuleExpand = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={16} style={{ color: '#0284c7' }} />;
      case 'scorm':
        return <PackageCheck size={16} style={{ color: '#16a34a' }} />;
      case 'audio':
        return <Music size={16} style={{ color: '#8b5cf6' }} />;
      case 'document':
      default:
        return <FileText size={16} style={{ color: '#ea580c' }} />;
    }
  };

  // Stream URL generator with auth token
  const getAssetStreamUrl = (assetId) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${apiBase}/lms/assets/${assetId}/stream?token=${authToken}`;
  };

  const getAssetDownloadUrl = (assetId) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${apiBase}/lms/assets/${assetId}/download?token=${authToken}`;
  };

  const getScormLaunchUrl = (scormPackageId) => {
    if (!enrolment) return '';
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    return `${apiBase}/lms/scorm/${scormPackageId}/launch/${enrolment.id}?token=${authToken}`;
  };

  // Filtered catalogue
  const filteredCatalogue = catalogueCourses.filter(c => {
    const matchSearch = searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.short_description && c.short_description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchAccess = filterAccessModel === 'all' || c.access_model === filterAccessModel;
    const matchDelivery = filterDeliveryMode === 'all' || c.delivery_mode === filterDeliveryMode;

    return matchSearch && matchAccess && matchDelivery;
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #091e3a 0%, #1a365d 50%, #1e293b 100%)',
        borderRadius: '14px',
        padding: '2rem',
        color: '#fff',
        marginBottom: '2rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ background: '#38bdf8', padding: '6px', borderRadius: '8px', color: '#091e3a' }}>
                <BookOpen size={24} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                LMS Learner Campus & Interactive Player
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem', maxWidth: '750px', lineHeight: 1.6 }}>
              Sector Skill Council certified self-paced learning portal. Complete interactive video modules, SCORM 1.2/2004 packages, reading references, and track real certification milestones.
            </p>
          </div>

          {/* Navigation Mode Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('player')}
              style={{
                background: activeTab === 'player' ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'player' ? '#091e3a' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <Play size={16} /> Course Player
            </button>
            <button
              onClick={() => setActiveTab('catalogue')}
              style={{
                background: activeTab === 'catalogue' ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'catalogue' ? '#091e3a' : '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <Search size={16} /> Course Catalogue ({catalogueCourses.length})
            </button>
          </div>
        </div>

        {/* Selected Course Quick Bar (when in player mode) */}
        {activeTab === 'player' && selectedCourse && (
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                CURRENT COURSE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{selectedCourse.name}</strong>
                <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#e0f2fe' }}>
                  {selectedCourse.code}
                </code>
              </div>
            </div>

            {/* Overall Course Progress Bar */}
            <div style={{ minWidth: '280px', flex: '1', maxWidth: '400px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', color: '#cbd5e1' }}>
                <span>Curriculum Progress:</span>
                <strong style={{ color: overallProgress >= 100 ? '#4ade80' : '#38bdf8' }}>
                  {overallProgress}% Completed
                </strong>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: overallProgress >= 100
                    ? '#22c55e'
                    : 'linear-gradient(90deg, #38bdf8 0%, #4ade80 100%)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
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
      {/* VIEW 1: COURSE CATALOGUE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'catalogue' && (
        <div>
          {/* Catalogue Filter & Search Bar */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e2e8f0',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '280px' }}>
              <Search size={18} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search published courses by title, code or skills..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.95rem', color: '#1e293b' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b' }}>
                <Filter size={16} />
                <span>Access:</span>
                <select
                  value={filterAccessModel}
                  onChange={e => setFilterAccessModel(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="all">All Models</option>
                  <option value="free">Free / Open</option>
                  <option value="sponsored">Govt Sponsored</option>
                  <option value="paid">Commercial Paid</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b' }}>
                <span>Delivery:</span>
                <select
                  value={filterDeliveryMode}
                  onChange={e => setFilterDeliveryMode(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="all">All Modes</option>
                  <option value="online">Self-Paced Online</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="classroom">Classroom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalogue Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {filteredCatalogue.map(course => {
              const isSelected = selectedCourse?.id === course.id;

              return (
                <div
                  key={course.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  {/* Thumbnail / Header Gradient */}
                  <div style={{
                    height: '140px',
                    background: course.thumbnail_url
                      ? `url(${course.thumbnail_url}) center/cover no-repeat`
                      : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    position: 'relative',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    color: '#fff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        background: course.access_model === 'free' ? '#16a34a' : (course.access_model === 'sponsored' ? '#0284c7' : '#d97706'),
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {course.access_model}
                      </span>
                      <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px' }}>
                        {course.delivery_mode.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      Course Code: <code style={{ color: '#38bdf8' }}>{course.code}</code>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', color: '#0f172a' }}>{course.name}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 1rem 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.short_description || course.description || 'Comprehensive national skill council accredited curriculum.'}
                      </p>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={14} style={{ color: '#0284c7' }} />
                          <span>{course.duration_hours} hrs</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Layers size={14} style={{ color: '#0284c7' }} />
                          <span>Policy: <strong>{course.enrolment_policy}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleSelectCourse(course)}
                        style={{
                          flex: 1,
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.65rem 1rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <Play size={16} /> Open Player
                      </button>

                      <button
                        onClick={() => handleSelfEnrol(course.id)}
                        disabled={enrolling}
                        style={{
                          background: '#f8fafc',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.65rem 1rem',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Enrol
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: INTERACTIVE LEARNER PLAYER CANVAS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'player' && selectedCourse && (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Course Curriculum Hierarchy Sidebar */}
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            {/* Sidebar Header */}
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} style={{ color: '#0284c7' }} /> Curriculum Syllabus
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {getAllPlayableItems(contentTree).length} Learning Units
                </span>
              </div>

              {/* Enrolment Status Pill */}
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {enrolment ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <ShieldCheck size={14} /> Active Enrolment
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700 }}>
                    <AlertCircle size={14} /> Preview Mode (Not Enrolled)
                  </span>
                )}

                {/* Resume button */}
                {enrolment && (
                  <button
                    onClick={() => {
                      const all = getAllPlayableItems(contentTree);
                      const incomplete = all.find(i => {
                        const p = progressMap[i.id];
                        return !p || (p.status !== 'completed' && p.progress_percent < 100);
                      });
                      if (incomplete) setActiveItem(incomplete);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#0284c7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <RotateCcw size={12} /> Resume
                  </button>
                )}
              </div>
            </div>

            {/* Modules Tree */}
            <div style={{ padding: '0.75rem', maxHeight: '700px', overflowY: 'auto' }}>
              {contentTree.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No curriculum modules found for this course yet.
                </div>
              ) : (
                contentTree.map((mod, modIdx) => {
                  const isExpanded = expandedModules[mod.id || modIdx];
                  const modChildren = mod.children || [];

                  return (
                    <div key={mod.id || modIdx} style={{ marginBottom: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      {/* Module header toggle */}
                      <div
                        onClick={() => toggleModuleExpand(mod.id || modIdx)}
                        style={{
                          background: '#f8fafc',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: '#1e293b'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#0284c7', fontSize: '0.75rem' }}>M{modIdx + 1}</span>
                          <span>{mod.title}</span>
                        </div>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>

                      {/* Module contents (Lessons / Learning Items) */}
                      {isExpanded && (
                        <div style={{ padding: '0.4rem', background: '#fff' }}>
                          {modChildren.map((child) => {
                            // If child has subchildren (Lesson containing learning items)
                            if (child.children && child.children.length > 0) {
                              return (
                                <div key={child.id} style={{ marginBottom: '0.4rem' }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', padding: '0.35rem 0.6rem' }}>
                                    Lesson: {child.title}
                                  </div>
                                  <div style={{ paddingLeft: '0.5rem' }}>
                                    {child.children.map(item => renderItemRow(item))}
                                  </div>
                                </div>
                              );
                            }

                            // Direct item
                            return renderItemRow(child);
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Learning Item Canvas */}
          <div>
            {activeItem ? (
              <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '1.75rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
              }}>
                {/* Active Item Title & Navigation Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {activeItem.type}
                      </span>
                      {activeItem.is_mandatory && (
                        <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                          REQUIRED FOR CERTIFICATE
                        </span>
                      )}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.45rem', color: '#0f172a', fontWeight: 700 }}>
                      {activeItem.title}
                    </h2>
                  </div>

                  {/* Previous / Next & Mark Complete Controls */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      disabled={!getPrevPlayableItem()}
                      onClick={() => {
                        const prev = getPrevPlayableItem();
                        if (prev) setActiveItem(prev);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: getPrevPlayableItem() ? '#0f172a' : '#cbd5e1',
                        borderRadius: '6px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: getPrevPlayableItem() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>

                    <button
                      disabled={!getNextPlayableItem()}
                      onClick={() => {
                        const next = getNextPlayableItem();
                        if (next) setActiveItem(next);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: getNextPlayableItem() ? '#0f172a' : '#cbd5e1',
                        borderRadius: '6px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: getNextPlayableItem() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      Next <ChevronRight size={16} />
                    </button>

                    {enrolment && (
                      <button
                        onClick={() => handleUpdateItemProgress(activeItem, 100, 'completed')}
                        style={{
                          background: progressMap[activeItem.id]?.status === 'completed' ? '#dcfce7' : '#16a34a',
                          color: progressMap[activeItem.id]?.status === 'completed' ? '#166534' : '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <CheckCircle2 size={16} />
                        {progressMap[activeItem.id]?.status === 'completed' ? 'Completed' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* CONTENT ITEM PLAYER ENGINES                               */}
                {/* ========================================================= */}

                {/* 1. VIDEO PLAYER */}
                {activeItem.type === 'video' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    {activeItem.primary_asset ? (
                      <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                        <video
                          controls
                          controlsList="nodownload"
                          style={{ width: '100%', maxHeight: '520px', display: 'block' }}
                          src={getAssetStreamUrl(activeItem.primary_asset.id)}
                          onTimeUpdate={(e) => handleVideoTimeUpdate(e, activeItem)}
                          onEnded={() => handleVideoEnded(activeItem)}
                        >
                          Your browser does not support HTML5 video streaming.
                        </video>
                      </div>
                    ) : activeItem.external_url ? (
                      <div style={{ background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                        <iframe
                          src={activeItem.external_url}
                          title={activeItem.title}
                          style={{ width: '100%', height: '480px', border: 'none' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div style={{ background: '#0f172a', padding: '3.5rem 2rem', borderRadius: '10px', color: '#fff', textAlign: 'center' }}>
                        <Video size={52} style={{ color: '#38bdf8', marginBottom: '1rem' }} />
                        <h4 style={{ margin: 0, fontSize: '1.2rem' }}>No Video Asset Uploaded Yet</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                          The instructor has not uploaded a video file for this lesson item yet.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SCORM PACKAGE PLAYER */}
                {activeItem.type === 'scorm' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    {activeItem.scorm_package && enrolment ? (
                      <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        {/* Sandboxed SCORM Player Iframe */}
                        <iframe
                          src={getScormLaunchUrl(activeItem.scorm_package.id)}
                          title={`SCORM Player - ${activeItem.title}`}
                          style={{ width: '100%', height: '620px', border: 'none', background: '#fff' }}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                        <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PackageCheck size={16} style={{ color: '#16a34a' }} />
                            <span>SCORM {activeItem.scorm_package.version} Runtime Connected</span>
                          </div>
                          <button
                            onClick={() => fetchLearningProgress(enrolment.id, contentTree)}
                            style={{ background: 'transparent', border: 'none', color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Refresh Progress State
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#0f172a', padding: '3rem 2rem', borderRadius: '10px', color: '#fff', textAlign: 'center' }}>
                        <PackageCheck size={52} style={{ color: '#4ade80', marginBottom: '1rem' }} />
                        <h4 style={{ margin: 0, fontSize: '1.2rem' }}>SCORM Module Environment</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0 1rem 0' }}>
                          {!enrolment
                            ? 'Please enrol in this course to launch the interactive SCORM runtime session.'
                            : 'No SCORM zip archive is attached to this learning item.'}
                        </p>
                        {!enrolment && (
                          <button
                            onClick={() => handleSelfEnrol(selectedCourse.id)}
                            style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Enrol to Play SCORM
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. DOCUMENT / PDF VIEWER */}
                {activeItem.type === 'document' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    {activeItem.primary_asset ? (
                      <div>
                        {activeItem.primary_asset.mime_type === 'application/pdf' ? (
                          <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                            <iframe
                              src={getAssetStreamUrl(activeItem.primary_asset.id)}
                              title={activeItem.title}
                              style={{ width: '100%', height: '600px', border: 'none' }}
                            />
                          </div>
                        ) : null}

                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={28} style={{ color: '#ea580c' }} />
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>{activeItem.title}</strong>
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                File Size: {Math.round((activeItem.primary_asset.size_bytes || 0) / 1024)} KB • Type: {activeItem.primary_asset.mime_type}
                              </span>
                            </div>
                          </div>

                          <a
                            href={getAssetDownloadUrl(activeItem.primary_asset.id)}
                            download
                            style={{
                              background: '#0284c7',
                              color: '#fff',
                              textDecoration: 'none',
                              padding: '0.55rem 1.1rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Download size={16} /> Download File
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                        <FileText size={42} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
                        <h4 style={{ margin: 0, color: '#334155' }}>No Document Attached</h4>
                        <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>This reading unit does not have a downloadable PDF file.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. AUDIO PLAYER */}
                {activeItem.type === 'audio' && (
                  <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '1.5rem' }}>
                    <Music size={42} style={{ color: '#8b5cf6', marginBottom: '0.75rem' }} />
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Audio Lecture Player</h4>
                    {activeItem.primary_asset ? (
                      <audio
                        controls
                        style={{ width: '100%', maxWidth: '500px' }}
                        src={getAssetStreamUrl(activeItem.primary_asset.id)}
                        onEnded={() => handleUpdateItemProgress(activeItem, 100, 'completed')}
                      />
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No audio stream uploaded.</p>
                    )}
                  </div>
                )}

                {/* Item Description & Notes */}
                {activeItem.description && (
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1.25rem', border: '1px solid #e2e8f0', color: '#334155', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#0f172a' }}>Learning Notes & Summary:</strong>
                    {activeItem.description}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '4rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
                <Layers size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                <h3 style={{ margin: 0, color: '#475569' }}>Select a Learning Item</h3>
                <p style={{ fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Choose an item from the syllabus tree on the left to begin learning.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );

  // Helper row renderer for curriculum items in sidebar
  function renderItemRow(item) {
    const isActive = activeItem?.id === item.id;
    const prog = progressMap[item.id];
    const isCompleted = prog?.status === 'completed' || (prog?.progress_percent >= 100);

    return (
      <div
        key={item.id}
        onClick={() => setActiveItem(item)}
        style={{
          padding: '0.65rem 0.75rem',
          borderRadius: '6px',
          background: isActive ? '#f0f9ff' : 'transparent',
          borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
          cursor: 'pointer',
          marginBottom: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: isActive ? '#0284c7' : '#334155',
          transition: 'background 0.15s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
          {getItemIcon(item.type)}
          <span style={{ fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title}
          </span>
        </div>

        <div>
          {isCompleted ? (
            <CheckCircle2 size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
          ) : prog?.progress_percent > 0 ? (
            <CircleDot size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />
          ) : (
            <ChevronRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
          )}
        </div>
      </div>
    );
  }
}
