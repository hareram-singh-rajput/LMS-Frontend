
import React, { useEffect, useState } from 'react';
import './App.css';

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Navigate,
  Outlet,
} from 'react-router-dom';

import apiClient from './api/client';
import { useAuthStore } from './store/useAuthStore';

import Login from './pages/Login';
import AuditLogs from './pages/AuditLogs';
import MasterData from './pages/MasterData';
import Organisations from './pages/Organisations';
import Candidates from './pages/Candidates';
import Offerings from './pages/Offerings';
import LmsPlayer from './pages/LmsPlayer';
import TrainingOperations from './pages/TrainingOperations';
import Assessments from './pages/Assessments';
import Certificates from './pages/Certificates';
import Enrolments from './pages/Enrolments';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import Integrations from './pages/Integrations';
import MisReporting from './pages/MisReporting';
import Placements from './pages/Placements';
import Workflows from './pages/Workflows';
import Documents from './pages/Documents';
import CouncilOfficers from './pages/CouncilOfficers';
import RegistrationRequests from './pages/RegistrationRequests';
import TrainerAssessorManagement from './pages/TrainerAssessorManagement';

import {
  ShieldCheck,
  LogOut,
  Users,
  Building2,
  Building,
  BookOpen,
  Activity,
  ArrowRight,
  PlusCircle,
  FileCheck,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Clock,
  KeyRound,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| Role Configuration
|--------------------------------------------------------------------------
| These are frontend navigation/dashboard settings.
| Backend authorization must still enforce actual access permissions.
*/

const ROLE_CONFIG = {
  super_admin: {
    title: 'Super Admin Command Center',
    description:
      'Manage platform tenants, Council Officers, registration queues, organisations, qualifications, and governance.',
    links: [
      { path: '/council-officers', label: 'Council Officers', icon: Users },
      { path: '/registration-requests', label: 'Registration Queue', icon: Clock },
      { path: '/organisations', label: 'Manage Organisations', icon: Building2 },
      { path: '/trainers-assessors', label: 'Trainers & Assessors', icon: GraduationCap },
      { path: '/candidates', label: 'Candidates & Learners', icon: Users },
      { path: '/master-data', label: 'Qualifications', icon: BookOpen },
      { path: '/workflows', label: 'Workflow Inbox', icon: ClipboardCheck },
      { path: '/mis-reporting', label: 'Reports & Analytics', icon: ChartNoAxesCombined },
      { path: '/audit-logs', label: 'Audit Trail', icon: Activity },
      { path: '/documents', label: 'Document Vault', icon: FileCheck },
      { path: '/payments', label: 'Payments & Billing', icon: BriefcaseBusiness },
      { path: '/notifications', label: 'Notifications', icon: Activity },
      { path: '/integrations', label: 'Integrations', icon: Building2 },
    ],
  },

  council_officer: {
    title: 'Council Officer Dashboard',
    description:
      'Review registration requests, oversee accredited organisations, issue credentials, and manage qualifications.',
    links: [
      { path: '/registration-requests', label: 'Registration Approval Queue', icon: Clock },
      { path: '/organisations', label: 'Accredited Organisations', icon: Building2 },
      { path: '/trainers-assessors', label: 'Assessors & Trainers', icon: GraduationCap },
      { path: '/master-data', label: 'Qualifications', icon: BookOpen },
      { path: '/offerings', label: 'Courses & Offerings', icon: GraduationCap },
      { path: '/workflows', label: 'Workflow Inbox', icon: ClipboardCheck },
      { path: '/mis-reporting', label: 'Reports & Analytics', icon: ChartNoAxesCombined },
      { path: '/audit-logs', label: 'Audit Trail', icon: Activity },
    ],
  },

  tp_admin: {
    title: 'Training Partner Dashboard',
    description:
      'Manage training centres, onboard trainers, oversee candidate enrolments, and track batch delivery.',
    links: [
      { path: '/organisations', label: 'Training Centres', icon: Building2 },
      { path: '/trainers-assessors', label: 'Manage Trainers', icon: GraduationCap },
      { path: '/training-operations', label: 'Batches & Attendance', icon: BookOpen },
      { path: '/candidates', label: 'Candidates & Learners', icon: Users },
      { path: '/enrolments', label: 'Enrolments', icon: ClipboardCheck },
      { path: '/assessments', label: 'Assessments', icon: FileCheck },
      { path: '/certificates', label: 'Certificates', icon: BookOpen },
      { path: '/mis-reporting', label: 'Reports & Analytics', icon: ChartNoAxesCombined },
    ],
  },

  tc_admin: {
    title: 'Training Centre Dashboard',
    description:
      'Manage centre-level trainers, batch schedules, session attendance, and candidate rosters.',
    links: [
      { path: '/trainers-assessors', label: 'Centre Trainers', icon: GraduationCap },
      { path: '/training-operations', label: 'Sessions & Attendance', icon: GraduationCap },
      { path: '/candidates', label: 'Centre Learners', icon: Users },
      { path: '/enrolments', label: 'Centre Enrolments', icon: ClipboardCheck },
      { path: '/assessments', label: 'Centre Assessments', icon: FileCheck },
      { path: '/certificates', label: 'Certificates', icon: BookOpen },
    ],
  },

  trainer: {
    title: 'Trainer Dashboard',
    description:
      'Access assigned batches, schedule sessions, record attendance, and track learner progress.',
    links: [
      { path: '/training-operations', label: 'My Batches & Attendance', icon: GraduationCap },
      { path: '/lms', label: 'Course Learning Content', icon: BookOpen },
      { path: '/candidates', label: 'My Learners', icon: Users },
      { path: '/assessments', label: 'Assessments', icon: ClipboardCheck },
    ],
  },

  assessor: {
    title: 'Assessor Dashboard',
    description:
      'Review assigned candidate assessments, score examination attempts, and moderate results.',
    links: [
      { path: '/assessments', label: 'Assigned Assessments & Scoring', icon: ClipboardCheck },
      { path: '/candidates', label: 'Assessed Candidates', icon: Users },
      { path: '/certificates', label: 'Certificate Verification', icon: FileCheck },
    ],
  },

  candidate: {
    title: 'Candidate Learning Dashboard',
    description:
      'Access enrolled courses, track interactive SCORM lessons, take assessments, and verify certificates.',
    links: [
      { path: '/lms', label: 'My Learning & Course Player', icon: BookOpen },
      { path: '/enrolments', label: 'My Enrolments', icon: GraduationCap },
      { path: '/assessments', label: 'My Assessments', icon: ClipboardCheck },
      { path: '/certificates', label: 'My Certificates', icon: FileCheck },
    ],
  },

  employer: {
    title: 'Employer Dashboard',
    description:
      'Explore verified skilled talent, post employment vacancies, and track recruitment placements.',
    links: [
      { path: '/candidates', label: 'Candidate Talent Pool', icon: Users },
      { path: '/placements', label: 'Vacancies & Placements', icon: BriefcaseBusiness },
    ],
  },
};

const ALL_NAVIGATION_GROUPS = [
  {
    title: 'OVERVIEW',
    links: [
      { path: '/', label: 'Dashboard' },
      { path: '/registration-requests', label: 'Registration Queue' },
      { path: '/council-officers', label: 'Council Officers' },
      { path: '/workflows', label: 'Workflow Inbox' },
      { path: '/mis-reporting', label: 'Reports & Analytics' },
    ],
  },
  {
    title: 'PEOPLE & PARTNERS',
    links: [
      { path: '/candidates', label: 'Candidates & Learners' },
      { path: '/organisations', label: 'Organisations' },
      { path: '/trainers-assessors', label: 'Trainers & Assessors' },
      { path: '/enrolments', label: 'Enrolments' },
      { path: '/placements', label: 'Placements & Careers' },
    ],
  },
  {
    title: 'LEARNING',
    links: [
      { path: '/master-data', label: 'Qualifications' },
      { path: '/offerings', label: 'Courses & Offerings' },
      { path: '/lms', label: 'LMS Content' },
      { path: '/training-operations', label: 'Training & Attendance' },
      { path: '/assessments', label: 'Assessments' },
      { path: '/certificates', label: 'Certificates' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    links: [
      { path: '/documents', label: 'Document Vault' },
      { path: '/payments', label: 'Payments & Billing' },
      { path: '/notifications', label: 'Notifications' },
      { path: '/integrations', label: 'Integrations' },
      { path: '/audit-logs', label: 'Audit Trail' },
    ],
  },
];

function getUserRole(user) {
  console.log('Logged-in user:', user);
  if (!Array.isArray(user?.roles) || user.roles.length === 0) {
    return null;
  }

  return user.roles[0];
}

function getRoleConfig(user) {
  const role = getUserRole(user);

  return ROLE_CONFIG[role] || {
    title: 'Dashboard',
    description: 'Welcome to your LMS workspace.',
    links: [],
  };
}

/*
|--------------------------------------------------------------------------
| Protected Route
|--------------------------------------------------------------------------
*/

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const authInitialized = useAuthStore(
    (state) => state.authInitialized
  );

  if (!authInitialized) {
    return <div>Verifying your session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/*
|--------------------------------------------------------------------------
| Protected Layout
|--------------------------------------------------------------------------
*/

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <div className="app-container">
        <NavigationHeader />

        <main
          style={{
            marginLeft: '258px',
            paddingTop: '76px',
            minHeight: '100vh',
            width: 'calc(100% - 258px)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

/*
|--------------------------------------------------------------------------
| Navigation Header
|--------------------------------------------------------------------------
*/

function NavigationHeader() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const logout = useAuthStore((state) => state.logout);

  const location = useLocation();
  const navigate = useNavigate();

  const role = getUserRole(user);
  const roleConfig = getRoleConfig(user);

  const allowedPaths = new Set([
    '/',
    ...roleConfig.links.map((item) => item.path),
  ]);

  const navigationGroups = ALL_NAVIGATION_GROUPS
    .map((group) => ({
      ...group,
      links: group.links.filter((item) =>
        allowedPaths.has(item.path)
      ),
    }))
    .filter((group) => group.links.length > 0);

  const handleLogout = async () => {
    try {
      if (useAuthStore.getState().token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Server logout failed:', error);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const currentPage = navigationGroups
    .flatMap((group) => group.links)
    .find((item) => item.path === location.pathname);

  return (
    <>
      <aside className="app-sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-icon">
            <ShieldCheck size={23} />
          </span>

          <span className="brand-copy">
            <strong>Sector Skill Council</strong>
            <small>Skills & Training Platform</small>
          </span>
        </Link>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-navigation">
          {navigationGroups.map((group) => (
            <section
              className="sidebar-group"
              key={group.title}
            >
              <div className="sidebar-group-title">
                {group.title}
              </div>

              {group.links.map((item) => {
                const active =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.path ||
                      location.pathname.startsWith(
                        `${item.path}/`
                      );

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${
                      active ? 'active' : ''
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Platform Workspace</span>
        </div>
      </aside>

      <header className="app-topbar">
        <div className="topbar-page-info">
          <span className="topbar-eyebrow">
            SECTOR SKILL COUNCIL
          </span>

          <strong>
            {location.pathname === '/'
              ? 'Dashboard'
              : currentPage?.label || 'Workspace'}
          </strong>
        </div>

        <div className="topbar-user">
          {isAuthenticated && user ? (
            <>
              <div className="topbar-user-info">
                <strong>
                  {user.name || user.email || 'User'}
                </strong>

                <span>
                  {role || 'Platform User'}
                </span>
              </div>

              <button
                type="button"
                className="topbar-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="topbar-login">
              Sign In
            </Link>
          )}
        </div>
      </header>
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Role-Based Dashboard
|--------------------------------------------------------------------------
*/

function RoleDashboard() {
  const user = useAuthStore((state) => state.user);
  const config = getRoleConfig(user);

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#fff',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          <LayoutDashboard size={17} />
          SECTOR SKILL COUNCIL LMS
        </div>

        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            margin: '0 0 0.75rem',
            color: '#ffffff',
          }}
        >
          {config.title}
        </h1>

        <p
          style={{
            color: '#cbd5e1',
            margin: 0,
            maxWidth: '750px',
            lineHeight: 1.7,
          }}
        >
          Welcome, {user?.name || 'User'}. {config.description}
        </p>
      </section>

      <section>
        <h2
          style={{
            fontSize: '1.25rem',
            marginBottom: '1.25rem',
            color: '#0f172a',
          }}
        >
          Quick Access
        </h2>

        {config.links.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem',
              color: '#64748b',
            }}
          >
            No dashboard modules are configured for this role yet.
            Please contact your administrator.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {config.links.map((item) => {
              const Icon = item.icon || ArrowRight;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#0f172a',
                    textDecoration: 'none',
                    fontWeight: 600,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '42px',
                      height: '42px',
                      flexShrink: 0,
                      borderRadius: '9px',
                      background: '#eff6ff',
                      color: '#2563eb',
                    }}
                  >
                    <Icon size={21} />
                  </span>

                  <span style={{ flex: 1 }}>
                    {item.label}
                  </span>

                  <ArrowRight size={16} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Existing Super Admin Platform Dashboard
|--------------------------------------------------------------------------
*/

function PlatformDashboard() {
  const user = useAuthStore((state) => state.user);

  const [stats, setStats] = useState({
    candidatesCount: 0,
    orgsCount: 0,
    qualificationsCount: 0,
    auditCount: 0,
  });

  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const results = await Promise.allSettled([
          apiClient.get('/candidates?per_page=1'),
          apiClient.get('/organisations?per_page=1'),
          apiClient.get('/qualifications'),
          apiClient.get('/audit-logs?per_page=5'),
        ]);

        if (cancelled) return;

        const getResultData = (index) => {
          const result = results[index];

          return result.status === 'fulfilled'
            ? result.value.data
            : null;
        };

        const candidatesData = getResultData(0);
        const organisationsData = getResultData(1);
        const qualificationsData = getResultData(2);
        const auditData = getResultData(3);

        setStats({
          candidatesCount:
            candidatesData?.data?.total ??
            candidatesData?.data?.data?.length ??
            0,

          orgsCount:
            organisationsData?.data?.total ??
            organisationsData?.data?.data?.length ??
            0,

          qualificationsCount: Array.isArray(
            qualificationsData?.data?.data
          )
            ? qualificationsData.data.data.length
            : Array.isArray(qualificationsData?.data)
              ? qualificationsData.data.length
              : 0,

          auditCount:
            auditData?.data?.total ??
            auditData?.data?.data?.total ??
            0,
        });

        const logs =
          auditData?.data?.data?.data ??
          (Array.isArray(auditData?.data?.data)
            ? auditData.data.data
            : []);

        setRecentLogs(logs.slice(0, 5));
      } catch (error) {
        console.error('Unable to load dashboard data:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = [
    {
      label: 'Candidates & Learners',
      value: stats.candidatesCount,
      icon: Users,
      color: '#0284c7',
      background: '#e0f2fe',
      path: '/candidates',
      action: 'Manage Candidates',
    },
    {
      label: 'Partner Organisations',
      value: stats.orgsCount,
      icon: Building2,
      color: '#b45309',
      background: '#fef3c7',
      path: '/organisations',
      action: 'Manage Organisations',
    },
    {
      label: 'Qualification Packs',
      value: stats.qualificationsCount,
      icon: BookOpen,
      color: '#15803d',
      background: '#dcfce7',
      path: '/master-data',
      action: 'View Qualifications',
    },
    {
      label: 'System Audit Events',
      value: stats.auditCount,
      icon: Activity,
      color: '#7e22ce',
      background: '#f3e8ff',
      path: '/audit-logs',
      action: 'View Audit Trail',
    },
  ];

  const shortcuts = [
    {
      path: '/candidates',
      label: 'Manage Candidates',
      description: 'View and manage candidate records.',
      icon: PlusCircle,
    },
    {
      path: '/organisations',
      label: 'Manage Organisations',
      description: 'Access partner organisation records.',
      icon: Building2,
    },
    {
      path: '/master-data',
      label: 'Qualification Packs',
      description: 'Access qualification master data.',
      icon: FileCheck,
    },
    {
      path: '/audit-logs',
      label: 'Governance Audit Trail',
      description: 'Review available system audit events.',
      icon: Activity,
    },
  ];

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          borderRadius: '12px',
          padding: '2rem 2.5rem',
          color: '#fff',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#38bdf8',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
          }}
        >
          <Sparkles size={16} />
          National Skill Ecosystem Command Center
        </div>

        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            margin: '0 0 0.75rem',
            color: '#fff',
          }}
        >
          Welcome back, {user?.name || 'Administrator'}
        </h1>

        <p
          style={{
            color: '#cbd5e1',
            margin: 0,
            maxWidth: '750px',
            lineHeight: 1.7,
          }}
        >
          Monitor the platform, partner organisations,
          qualification data, and available audit activity.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.path}
              style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <span
                    style={{
                      color: '#64748b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    {card.label}
                  </span>

                  <h2
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      margin: '0.4rem 0 0',
                      color: '#0f172a',
                    }}
                  >
                    {loading ? '...' : card.value}
                  </h2>
                </div>

                <span
                  style={{
                    background: card.background,
                    color: card.color,
                    padding: '0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  <Icon size={22} />
                </span>
              </div>

              <Link
                to={card.path}
                style={{
                  color: card.color,
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {card.action}
                <ArrowRight size={14} />
              </Link>
            </article>
          );
        })}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '1.25rem',
              fontSize: '1.1rem',
              color: '#0f172a',
            }}
          >
            Platform Shortcuts
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
            }}
          >
            {shortcuts.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#0f172a',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <Icon size={20} />
                    <strong style={{ fontSize: '0.9rem' }}>
                      {item.label}
                    </strong>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8rem',
                      color: '#64748b',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.1rem',
                color: '#0f172a',
              }}
            >
              Recent System Activity
            </h2>

            <Link
              to="/audit-logs"
              style={{
                fontSize: '0.8rem',
                color: '#0284c7',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              View All
            </Link>
          </div>

          {loading ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Loading activity...
            </p>
          ) : recentLogs.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
              No recent audit activity available.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              {recentLogs.map((log, index) => (
                <article
                  key={log.id ?? index}
                  style={{
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <strong style={{ color: '#0284c7' }}>
                      {log.event_type || 'System event'}
                    </strong>

                    <span style={{ color: '#64748b' }}>
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : ''}
                    </span>
                  </div>

                  <div style={{ color: '#334155' }}>
                    Entity: {log.entity_type || 'N/A'}
                    {' · '}
                    ID: {log.entity_id ?? 'N/A'}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Dashboard Selector
|--------------------------------------------------------------------------
*/

function DashboardHome() {
  const user = useAuthStore((state) => state.user);
  const role = getUserRole(user);

  if (role === 'super_admin') {
    return <PlatformDashboard />;
  }

  return <RoleDashboard />;
}

/*
|--------------------------------------------------------------------------
| Main Application
|--------------------------------------------------------------------------
*/

export default function App() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const setAuthInitialized = useAuthStore(
    (state) => state.setAuthInitialized
  );

  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!token) {
        setAuthInitialized();
        setCheckingSession(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');

        if (cancelled) return;

        const currentUser = response.data?.user;

        if (!currentUser) {
          logout();
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        if (cancelled) return;

        if (error.response?.status === 401) {
          logout();
        } else {
          console.error(
            'Unable to verify the saved session.',
            error
          );
        }
      } finally {
        if (!cancelled) {
          setAuthInitialized();
          setCheckingSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [token, setUser, logout, setAuthInitialized]);

  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: '#64748b',
          background: '#f5f7fb',
        }}
      >
        Verifying your session...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/mis-reporting" element={<MisReporting />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/enrolments" element={<Enrolments />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route
            path="/training-operations"
            element={<TrainingOperations />}
          />
          <Route path="/lms" element={<LmsPlayer />} />
          <Route path="/offerings" element={<Offerings />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/organisations" element={<Organisations />} />
          <Route path="/council-officers" element={<CouncilOfficers />} />
          <Route path="/registration-requests" element={<RegistrationRequests />} />
          <Route path="/trainers-assessors" element={<TrainerAssessorManagement />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
