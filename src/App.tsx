/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  LayoutGrid,
  Users,
  GraduationCap,
  UserCheck,
  School,
  BookOpen,
  ClipboardCheck,
  Calendar,
  BarChart3,
  FileText,
  Video,
  Bell,
  Rss,
  PieChart,
  Activity,
  LogOut,
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  Wand2,
  Globe,
  Menu,
  X,
  CheckCircle2,
  Eye,
  User,
  Sliders,
  KeyRound,
  Save,
  MessageSquare,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { AiStudioHub } from './components/AiStudioHub';
import { PublicHomePage } from './components/PublicHomePage';
import { AdmissionsAdminPanel } from './components/AdmissionsAdminPanel';
import { MadarsaSettingsPanel } from './components/MadarsaSettingsPanel';
import { OfficialGradeCard, StudentIdCardView } from './components/GradeCardView';
import { MadarsaLogo } from './components/MadarsaLogo';
import { AttendanceSection } from './components/AttendanceSection';
import { MadarsaChatHub } from './components/MadarsaChatHub';
import { uploadImageToImgBB } from './utils/imgbb';
import {
  AdmissionApplication,
  INITIAL_PORTAL_STATE,
  PortalState,
  ResultItem,
  RoleType,
  SUPER_ADMIN_EMAILS,
  UserAccount,
} from './types/portal';

type NavSectionId =
  | 'super-admin'
  | 'admissions'
  | 'madarsa-settings'
  | 'dashboard'
  | 'students'
  | 'teachers'
  | 'parents'
  | 'classes'
  | 'subjects'
  | 'attendance'
  | 'examinations'
  | 'results'
  | 'homework'
  | 'online-classes'
  | 'notices'
  | 'feed'
  | 'chat'
  | 'reports'
  | 'activity-logs'
  | 'profile'
  | 'ai-studio';

const PORTAL_STORAGE_KEY = 'gausiya_madarsa_portal_v3';

export default function App() {
  const [state, setState] = useState<PortalState>(() => {
    try {
      const saved = localStorage.getItem(PORTAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PORTAL_STATE,
          ...parsed,
          madarsaSettings: {
            ...INITIAL_PORTAL_STATE.madarsaSettings,
            ...(parsed.madarsaSettings || {}),
          },
          admissions: parsed.admissions || INITIAL_PORTAL_STATE.admissions,
        };
      }
    } catch {
      // fallback
    }
    return INITIAL_PORTAL_STATE;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedUser = localStorage.getItem('gausiya_current_user_v3');
      if (savedUser) return JSON.parse(savedUser);
    } catch {
      // ignore
    }
    return null;
  });

  const [showPublicSite, setShowPublicSite] = useState<boolean>(!currentUser);
  const [activeNav, setActiveNav] = useState<NavSectionId>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Super Admin Modals & Search
  const [userSearch, setUserSearch] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Add Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [isUploadingStudentPhoto, setIsUploadingStudentPhoto] = useState(false);
  const [studentForm, setStudentForm] = useState({
    studentId: '',
    admissionNo: '',
    rollNo: '',
    name: '',
    email: '',
    fatherName: '',
    className: 'Class 4',
    gender: 'Male' as 'Male' | 'Female',
    dob: '2013-01-01',
    phone: '',
    address: '',
    photoUrl: '',
  });

  // Add Teacher Modal
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    qualification: '',
    subject: '',
    phone: '',
    email: '',
    salary: '₹20,000',
  });

  // Add Result / Grade Card Modal
  const [showAddResultModal, setShowAddResultModal] = useState(false);
  const [selectedGradeCard, setSelectedGradeCard] = useState<ResultItem | null>(null);
  const [resultForm, setResultForm] = useState({
    selectedStudentId: '',
    examName: 'First Terminal Examination 2026',
    examType: 'First Terminal Exam',
    academicYear: '2026-2027',
    division: 'A',
    quranNazra: 92,
    urduAdab: 88,
    arabicGrammar: 85,
    islamicFiqh: 90,
    modernMathEng: 86,
    remarks: 'MashaAllah! Very good academic progress.',
  });

  // Add Notice Modal
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'General' as 'General' | 'Exam' | 'Holiday' | 'Admission' | 'Committee',
    content: '',
    isPublic: true,
  });

  // Add Homework Modal
  const [showAddHomeworkModal, setShowAddHomeworkModal] = useState(false);
  const [isUploadingHomeworkImg, setIsUploadingHomeworkImg] = useState(false);
  const [homeworkForm, setHomeworkForm] = useState({
    title: '',
    className: 'Class 4',
    subject: 'Tajweed & Quran Majeed',
    dueDate: '2026-10-20',
    description: '',
    attachmentUrl: '',
  });

  // Add Online Class Modal
  const [showAddOnlineClassModal, setShowAddOnlineClassModal] = useState(false);
  const [onlineClassForm, setOnlineClassForm] = useState({
    topic: '',
    className: 'Class 4',
    subject: 'Fiqh & Tajweed',
    scheduleTime: '08:00 PM IST',
    meetingLink: 'https://meet.google.com/gausiya-live',
  });

  // Add Feed Post & Search
  const [feedText, setFeedText] = useState('');
  const [feedTitle, setFeedTitle] = useState('');
  const [feedImageUrl, setFeedImageUrl] = useState('');
  const [isUploadingFeedImg, setIsUploadingFeedImg] = useState(false);
  const [feedSearchQuery, setFeedSearchQuery] = useState('');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    password: '',
    photoUrl: '',
  });
  const [isUploadingProfilePhoto, setIsUploadingProfilePhoto] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isAdminOrSuper = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isStudent = currentUser?.role === 'Student';

  // Sync profile form when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        password: currentUser.password || '',
        photoUrl: currentUser.photoUrl || '',
      });
    }
  }, [currentUser]);

  // Load state from backend & Firestore on mount
  useEffect(() => {
    let mounted = true;
    async function loadInitialState() {
      try {
        const res = await fetch('/api/portal/state');
        if (res.ok) {
          const data = await res.json();
          if (data?.state && mounted) {
            setState((prev) => ({
              ...prev,
              ...data.state,
              madarsaSettings: {
                ...prev.madarsaSettings,
                ...(data.state.madarsaSettings || {}),
              },
            }));
          }
        }
      } catch {
        // ignore network error
      }
    }
    loadInitialState();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen to Firebase Auth state & handle Google redirect result
  useEffect(() => {
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || !fbUser.email) return;
      const emailLower = fbUser.email.toLowerCase();

      // Load Firestore state if signed in
      try {
        const snap = await getDoc(doc(db, 'portal_state', 'main'));
        if (snap.exists()) {
          const data = snap.data();
          if (data?.payloadJson) {
            const parsed = JSON.parse(data.payloadJson);
            setState((prev) => ({
              ...prev,
              ...parsed,
              madarsaSettings: {
                ...prev.madarsaSettings,
                ...(parsed.madarsaSettings || {}),
              },
            }));
          }
        }
      } catch {
        // ignore permission error for non-owners
      }

      setState((prev) => {
        const existingUser = prev.allUsers.find((u) => u.email.toLowerCase() === emailLower);
        const existingAdm = prev.admissions.find((a) => a.email.toLowerCase() === emailLower);
        const isPreAdmin = prev.admins.some(
          (a) => a.email.toLowerCase() === emailLower && a.status === 'Active'
        );

        let role: RoleType = 'Student';
        if (SUPER_ADMIN_EMAILS.includes(emailLower)) {
          role = 'Super Admin';
        } else if (existingUser) {
          role = existingUser.role;
        } else if (isPreAdmin) {
          role = 'Admin';
        }

        const loggedUser: UserAccount = existingUser
          ? { ...existingUser, role }
          : {
              id: fbUser.uid,
              studentId: existingAdm?.studentId || `MGR-2026-${1000 + prev.allUsers.length + 1}`,
              name: fbUser.displayName || existingAdm?.studentName || emailLower.split('@')[0],
              email: emailLower,
              phone: existingAdm?.phone,
              address: existingAdm?.address,
              role,
              joinedDate: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              admissionStatus: existingAdm?.status || 'Approved',
            };

        setCurrentUser(loggedUser);
        localStorage.setItem('gausiya_current_user_v3', JSON.stringify(loggedUser));
        setShowPublicSite(false);

        if (role === 'Super Admin') {
          setActiveNav('super-admin');
        } else {
          setActiveNav('dashboard');
        }

        const updatedUsers = existingUser
          ? prev.allUsers.map((u) => (u.email.toLowerCase() === emailLower ? loggedUser : u))
          : [loggedUser, ...prev.allUsers];

        return { ...prev, allUsers: updatedUsers };
      });
    });
    return () => unsub();
  }, []);

  // Unified helper to persist state to localStorage, Express Server, and Firestore
  const updatePortalState = (
    updater: (prev: PortalState) => PortalState,
    logAction?: string,
    logTarget?: string
  ) => {
    setState((prev) => {
      const next = updater(prev);
      const finalState: PortalState = logAction
        ? {
            ...next,
            logs: [
              {
                id: `log-${Date.now()}`,
                action: logAction,
                actorName: currentUser?.name || 'User',
                actorRole: currentUser?.role || 'Public',
                targetInfo: logTarget || '',
                timestamp: new Date().toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
              ...(next.logs || []),
            ],
          }
        : next;

      try {
        localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(finalState));
      } catch {
        // ignore quota
      }

      fetch('/api/portal/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: finalState }),
      }).catch(() => {});

      if (auth.currentUser) {
        setDoc(doc(db, 'portal_state', 'main'), {
          ownerId: auth.currentUser.uid,
          payloadJson: JSON.stringify(finalState),
          updatedAt: new Date().toISOString(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.WRITE, 'portal_state/main');
          } catch {
            // handled
          }
        });
      }

      return finalState;
    });
  };

  // Google Sign-In handler (with popup + redirect fallback & direct Google Email sign-in support)
  const handleGoogleLogin = async (fallbackEmail?: string, fallbackName?: string) => {
    setAuthLoading(true);
    setAuthError(null);

    if (fallbackEmail && fallbackEmail.includes('@')) {
      const emailLower = fallbackEmail.trim().toLowerCase();
      setState((prev) => {
        const existingUser = prev.allUsers.find((u) => u.email.toLowerCase() === emailLower);
        const existingAdm = prev.admissions.find((a) => a.email.toLowerCase() === emailLower);
        const isPreAdmin = prev.admins.some(
          (a) => a.email.toLowerCase() === emailLower && a.status === 'Active'
        );

        let role: RoleType = 'Student';
        if (SUPER_ADMIN_EMAILS.includes(emailLower)) {
          role = 'Super Admin';
        } else if (existingUser) {
          role = existingUser.role;
        } else if (isPreAdmin) {
          role = 'Admin';
        }

        const loggedUser: UserAccount = existingUser
          ? { ...existingUser, role }
          : {
              id: `usr-google-${Date.now()}`,
              studentId: existingAdm?.studentId || `MGR-2026-${1000 + prev.allUsers.length + 1}`,
              name:
                fallbackName?.trim() ||
                existingAdm?.studentName ||
                emailLower.split('@')[0],
              email: emailLower,
              phone: existingAdm?.phone,
              address: existingAdm?.address,
              role,
              joinedDate: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              admissionStatus: existingAdm?.status || 'Approved',
            };

        setCurrentUser(loggedUser);
        localStorage.setItem('gausiya_current_user_v3', JSON.stringify(loggedUser));
        setShowPublicSite(false);
        setActiveNav(role === 'Super Admin' ? 'super-admin' : 'dashboard');

        const updatedUsers = existingUser
          ? prev.allUsers.map((u) => (u.email.toLowerCase() === emailLower ? loggedUser : u))
          : [loggedUser, ...prev.allUsers];

        const nextState = { ...prev, allUsers: updatedUsers };
        try {
          localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(nextState));
        } catch {
          // ignore
        }
        fetch('/api/portal/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: nextState }),
        }).catch(() => {});

        return nextState;
      });
      setAuthLoading(false);
      return;
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred?.user?.email) {
        const emailLower = cred.user.email.toLowerCase();
        setState((prev) => {
          const existingUser = prev.allUsers.find((u) => u.email.toLowerCase() === emailLower);
          const existingAdm = prev.admissions.find((a) => a.email.toLowerCase() === emailLower);
          const isPreAdmin = prev.admins.some(
            (a) => a.email.toLowerCase() === emailLower && a.status === 'Active'
          );

          let role: RoleType = 'Student';
          if (SUPER_ADMIN_EMAILS.includes(emailLower)) {
            role = 'Super Admin';
          } else if (existingUser) {
            role = existingUser.role;
          } else if (isPreAdmin) {
            role = 'Admin';
          }

          const loggedUser: UserAccount = existingUser
            ? { ...existingUser, role }
            : {
                id: cred.user.uid,
                studentId: existingAdm?.studentId || `MGR-2026-${1000 + prev.allUsers.length + 1}`,
                name: cred.user.displayName || existingAdm?.studentName || emailLower.split('@')[0],
                email: emailLower,
                phone: existingAdm?.phone,
                address: existingAdm?.address,
                role,
                joinedDate: new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }),
                admissionStatus: existingAdm?.status || 'Approved',
              };

          setCurrentUser(loggedUser);
          localStorage.setItem('gausiya_current_user_v3', JSON.stringify(loggedUser));
          setShowPublicSite(false);
          setActiveNav(role === 'Super Admin' ? 'super-admin' : 'dashboard');

          const updatedUsers = existingUser
            ? prev.allUsers.map((u) => (u.email.toLowerCase() === emailLower ? loggedUser : u))
            : [loggedUser, ...prev.allUsers];

          return { ...prev, allUsers: updatedUsers };
        });
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          // fall through
        }
      }
      setAuthError(
        'Google popup could not complete in this browser window. Please enter your Google / Gmail address below to continue with Google, or use Create Account / Login.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Create New Account (Sign Up) handler
  const handleCreateAccount = async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    photoUrl?: string;
  }): Promise<{ ok: boolean; error?: string; user?: UserAccount }> => {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name.trim();
    const cleanPassword = payload.password.trim();

    if (!cleanName) {
      return { ok: false, error: 'Please enter your Full Name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Please enter a valid Gmail / Email address.' };
    }
    if (cleanPassword.length < 4) {
      return { ok: false, error: 'Password must be at least 4 characters.' };
    }

    // Also attempt Firebase Auth registration if password >= 6 chars
    if (cleanPassword.length >= 6) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        if (cred.user) {
          await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
        }
      } catch {
        // Even if email already exists in Firebase Auth or email provider isn't enabled, proceed with portal DB registration
      }
    }

    const existingAdm = state.admissions.find((a) => a.email.toLowerCase() === cleanEmail);
    const isSuper = SUPER_ADMIN_EMAILS.includes(cleanEmail);
    const isPreAdmin = state.admins.some(
      (a) => a.email.toLowerCase() === cleanEmail && a.status === 'Active'
    );

    const assignedRole: RoleType = isSuper ? 'Super Admin' : isPreAdmin ? 'Admin' : 'Student';
    const generatedStudentId =
      existingAdm?.studentId ||
      `MGR-2026-${1001 + (state.allUsers?.length || 0) + Math.floor(Math.random() * 50)}`;

    const newAccount: UserAccount = {
      id: `usr-${Date.now()}`,
      studentId: generatedStudentId,
      name: cleanName,
      email: cleanEmail,
      phone: payload.phone.trim(),
      address: payload.address?.trim() || existingAdm?.address || '',
      username: generatedStudentId,
      password: cleanPassword,
      photoUrl: payload.photoUrl || existingAdm?.photoUrl,
      role: assignedRole,
      joinedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      admissionStatus: existingAdm?.status || 'Approved',
    };

    updatePortalState(
      (prev) => {
        const existsIdx = prev.allUsers.findIndex(
          (u) => u.email.toLowerCase() === cleanEmail
        );
        const updatedUsers =
          existsIdx >= 0
            ? prev.allUsers.map((u, idx) => (idx === existsIdx ? newAccount : u))
            : [newAccount, ...prev.allUsers];

        return {
          ...prev,
          allUsers: updatedUsers,
        };
      },
      'Created New Portal Account',
      `${cleanName} (${cleanEmail}) — ID: ${generatedStudentId}`
    );

    setCurrentUser(newAccount);
    localStorage.setItem('gausiya_current_user_v3', JSON.stringify(newAccount));
    setShowPublicSite(false);
    setActiveNav(assignedRole === 'Super Admin' ? 'super-admin' : 'dashboard');

    return { ok: true, user: newAccount };
  };

  // Direct Gmail / Student ID + Password Login handler
  const handleCredentialsLogin = (
    identifier: string,
    password: string
  ): { ok: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();

    // Check in allUsers
    const matchedUser = state.allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        (u.studentId && u.studentId.toLowerCase() === cleanId) ||
        (u.username && u.username.toLowerCase() === cleanId)
    );

    // Also check in admissions
    const matchedAdm = state.admissions.find(
      (a) =>
        a.email.toLowerCase() === cleanId ||
        a.studentId.toLowerCase() === cleanId ||
        a.admissionNo.toLowerCase() === cleanId
    );

    if (matchedUser) {
      if (matchedUser.password && password && matchedUser.password !== password) {
        return { ok: false, error: 'Incorrect password for this account.' };
      }
      const syncedUser: UserAccount = {
        ...matchedUser,
        studentId: matchedUser.studentId || matchedAdm?.studentId,
        admissionStatus: matchedAdm?.status || matchedUser.admissionStatus,
      };
      setCurrentUser(syncedUser);
      localStorage.setItem('gausiya_current_user_v3', JSON.stringify(syncedUser));
      setShowPublicSite(false);
      setActiveNav(syncedUser.role === 'Super Admin' ? 'super-admin' : 'dashboard');
      return { ok: true };
    }

    if (matchedAdm) {
      if (matchedAdm.password && password && matchedAdm.password !== password) {
        return { ok: false, error: 'Incorrect password for this Student Gmail account.' };
      }
      const newAccount: UserAccount = {
        id: `usr-${Date.now()}`,
        studentId: matchedAdm.studentId,
        name: matchedAdm.studentName,
        email: matchedAdm.email,
        phone: matchedAdm.phone,
        address: matchedAdm.address,
        password: matchedAdm.password,
        role: 'Student',
        joinedDate: matchedAdm.appliedDate,
        admissionStatus: matchedAdm.status,
      };
      setCurrentUser(newAccount);
      localStorage.setItem('gausiya_current_user_v3', JSON.stringify(newAccount));
      setShowPublicSite(false);
      setActiveNav('dashboard');
      return { ok: true };
    }

    return {
      ok: false,
      error:
        'No account found with this Gmail or Student ID. If you are a new student, please fill the Online Admission Form first!',
    };
  };

  // Pre-Login Online Admission Form Submission
  const handleAdmissionSubmit = (newApp: AdmissionApplication) => {
    updatePortalState(
      (prev) => {
        const newStudentAccount: UserAccount = {
          id: `usr-${Date.now()}`,
          studentId: newApp.studentId,
          name: newApp.studentName,
          email: newApp.email,
          phone: newApp.phone,
          address: newApp.address,
          username: newApp.studentId,
          password: newApp.password,
          photoUrl: newApp.photoUrl,
          role: 'Student',
          joinedDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          admissionStatus: 'Pending',
        };

        const existingIdx = prev.allUsers.findIndex(
          (u) => u.email.toLowerCase() === newApp.email.toLowerCase()
        );

        const updatedUsers =
          existingIdx >= 0
            ? prev.allUsers.map((u, i) => (i === existingIdx ? newStudentAccount : u))
            : [newStudentAccount, ...prev.allUsers];

        return {
          ...prev,
          admissions: [newApp, ...(prev.admissions || [])],
          allUsers: updatedUsers,
        };
      },
      'Submitted Online Admission Form',
      `${newApp.studentName} (${newApp.studentId}) — ${newApp.classApplied}`
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    localStorage.removeItem('gausiya_current_user_v3');
    setShowPublicSite(true);
  };

  // If not logged in OR viewing public website, show PublicHomePage
  if (!currentUser || showPublicSite) {
    return (
      <PublicHomePage
        state={state}
        currentUser={currentUser}
        onReturnToDashboard={currentUser ? () => setShowPublicSite(false) : undefined}
        onGoogleLogin={handleGoogleLogin}
        onCredentialsLogin={handleCredentialsLogin}
        onCreateAccount={handleCreateAccount}
        onSubmitAdmission={handleAdmissionSubmit}
        authLoading={authLoading}
        authError={authError}
      />
    );
  }

  // Find current student's admission application & student record
  const myAdmissionApp = state.admissions.find(
    (a) =>
      (currentUser.studentId && a.studentId.toLowerCase() === currentUser.studentId.toLowerCase()) ||
      a.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  const myStudentRecord = state.students.find(
    (s) =>
      (currentUser.studentId && s.studentId.toLowerCase() === currentUser.studentId.toLowerCase()) ||
      (s.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      s.name.toLowerCase() === currentUser.name.toLowerCase()
  );

  const myEffectiveStudentId =
    currentUser.studentId ||
    myStudentRecord?.studentId ||
    myAdmissionApp?.studentId ||
    `MGR-2026-1001`;

  // STRICT STUDENT RESULT ISOLATION: Student ONLY sees their own Result!
  const myPersonalResults = state.results.filter(
    (r) =>
      r.studentId.toLowerCase() === myEffectiveStudentId.toLowerCase() ||
      (r.studentEmail && r.studentEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
      r.studentName.toLowerCase() === currentUser.name.toLowerCase()
  );

  const visibleResults = isAdminOrSuper ? state.results : myPersonalResults;

  // Sidebar items strictly separated by Role
  const pendingAdmissionsCount = (state.admissions || []).filter(
    (a) => a.status === 'Pending'
  ).length;

  const adminSidebarItems: { id: NavSectionId; label: string; icon: React.ElementType; badge?: number }[] = [
    ...(isSuperAdmin
      ? [
          { id: 'super-admin' as NavSectionId, label: 'Super Admin', icon: Settings },
        ]
      : []),
    {
      id: 'admissions' as NavSectionId,
      label: 'Online Admissions',
      icon: UserCheck,
      badge: pendingAdmissionsCount,
    },
    ...(isSuperAdmin
      ? [
          { id: 'madarsa-settings' as NavSectionId, label: 'Madarsa Settings', icon: Sliders },
        ]
      : []),
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'chat', label: 'AI & Student Chat Hub', icon: MessageSquare },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'parents', label: 'Parents', icon: Users },
    { id: 'classes', label: 'Classes', icon: School },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'examinations', label: 'Examinations', icon: Calendar },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'homework', label: 'Homework', icon: FileText },
    { id: 'online-classes', label: 'Online Classes', icon: Video },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'feed', label: 'Feed', icon: Rss },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'activity-logs', label: 'Activity Logs', icon: Activity },
    { id: 'ai-studio', label: 'AI Smart Tools', icon: Wand2 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // Student strictly gets ONLY their own read-only views + AI & Student Chat Hub!
  const studentSidebarItems: { id: NavSectionId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'My Dashboard & Status', icon: LayoutGrid },
    { id: 'chat', label: 'AI & Student Chat Hub', icon: MessageSquare },
    { id: 'results', label: 'My Result (Grade Card)', icon: BarChart3 },
    { id: 'profile', label: 'My Profile & ID Card', icon: User },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'homework', label: 'Homework', icon: FileText },
    { id: 'online-classes', label: 'Online Classes', icon: Video },
    { id: 'feed', label: 'Feed', icon: Rss },
  ];

  const navItems = isAdminOrSuper ? adminSidebarItems : studentSidebarItems;

  return (
    <div className="min-h-screen flex bg-[#f6f9f7] text-[#11261d]">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar matching screenshot */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-50 flex flex-col bg-[#144734] text-white transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <MadarsaLogo
            customLogoUrl={state.madarsaSettings.logoUrl}
            className="w-10 h-10 flex-shrink-0 drop-shadow-md"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-extrabold truncate text-white">Madarsa Portal</h2>
            <p className="text-[11px] text-emerald-200/80 truncate">{currentUser.role}</p>
          </div>
          <button
            className="lg:hidden text-white/70"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#d4942a] text-white shadow-sm'
                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </span>
                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-300 text-[#11261d]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <div
            onClick={() => setActiveNav('profile')}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-extrabold text-amber-300 flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-emerald-200/70 truncate">
                {isStudent ? `ID: ${myEffectiveStudentId}` : currentUser.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPublicSite(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-emerald-100/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" /> Public Website
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-red-300 hover:bg-red-500/20 hover:text-red-200 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-[#dee6e1] px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              className="lg:hidden p-1.5 rounded-lg border border-[#dee6e1]"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-[#144734]" />
            </button>
            <MadarsaLogo
              customLogoUrl={state.madarsaSettings.logoUrl}
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="text-xs sm:text-sm font-bold text-[#144734] truncate">
              {state.madarsaSettings.madarsaName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isStudent && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-[#144734] font-mono text-xs font-extrabold">
                Student ID: {myEffectiveStudentId}
              </span>
            )}
            <button
              onClick={() => setActiveNav('profile')}
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#11261d] hover:text-[#144734] cursor-pointer"
            >
              <User className="w-4 h-4 text-[#144734]" />
              <span>{currentUser.name}</span>
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-6 flex-1 max-w-6xl w-full mx-auto">
          {/* 1. SUPER ADMIN PANEL (Exact Screenshot Design) */}
          {activeNav === 'super-admin' && isSuperAdmin && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-7 h-7 text-[#144734]" />
                  <div>
                    <h1 className="text-2xl font-extrabold text-[#11261d]">Super Admin Panel</h1>
                    <p className="text-xs text-[#61786e]">Manage administrators, user roles, admissions, and master settings</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveNav('admissions')}
                    className="px-4 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Online Admissions ({pendingAdmissionsCount} Pending)
                  </button>
                  <button
                    onClick={() => setActiveNav('madarsa-settings')}
                    className="px-4 py-2 rounded-lg border border-[#144734] text-[#144734] bg-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    Madarsa Settings
                  </button>
                  <button
                    onClick={() => {
                      setEditingAdminId(null);
                      setAdminForm({ name: '', phone: '', email: '', status: 'Active' });
                      setShowAddAdminModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Admin
                  </button>
                </div>
              </div>

              {/* All Users Card */}
              <div className="bg-white rounded-2xl border border-[#dee6e1] shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-[#edf2ee] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-extrabold text-[#11261d] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#144734]" />
                      All Users ({state.allUsers.length})
                    </h2>
                    <p className="text-xs text-[#61786e]">
                      Everyone who has signed in or registered via Admission Form. Change their role here.
                    </p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#7c9086] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#d6e0da]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#f4f7f5] text-[#52685e] border-b border-[#dee6e1]">
                        <th className="p-3.5 font-bold">Name</th>
                        <th className="p-3.5 font-bold">Student ID</th>
                        <th className="p-3.5 font-bold">Email / Gmail</th>
                        <th className="p-3.5 font-bold">Current Role</th>
                        <th className="p-3.5 font-bold text-right">Change Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.allUsers
                        .filter(
                          (u) =>
                            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                            (u.studentId || '').toLowerCase().includes(userSearch.toLowerCase())
                        )
                        .map((usr) => (
                          <tr key={usr.id} className="border-b border-[#edf2ee] hover:bg-[#f9fbf9]">
                            <td className="p-3.5 font-bold text-[#11261d]">{usr.name}</td>
                            <td className="p-3.5 font-mono text-xs text-[#144734] font-bold">
                              {usr.studentId || '—'}
                            </td>
                            <td className="p-3.5 text-[#52685e]">{usr.email}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  usr.role === 'Super Admin'
                                    ? 'bg-amber-500 text-white'
                                    : usr.role === 'Admin'
                                    ? 'bg-[#144734] text-white'
                                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                                }`}
                              >
                                {usr.role}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <select
                                value={usr.role}
                                onChange={(e) => {
                                  const newRole = e.target.value as RoleType;
                                  updatePortalState(
                                    (prev) => ({
                                      ...prev,
                                      allUsers: prev.allUsers.map((u) =>
                                        u.id === usr.id ? { ...u, role: newRole } : u
                                      ),
                                    }),
                                    `Changed User Role to ${newRole}`,
                                    `${usr.name} (${usr.email})`
                                  );
                                }}
                                className="px-3 py-1.5 rounded-lg border border-[#d6e0da] bg-white text-xs font-semibold cursor-pointer"
                              >
                                <option value="Super Admin">Super Admin</option>
                                <option value="Admin">Admin</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Student">Student</option>
                                <option value="Parent">Parent</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pre-created Admins Card */}
              <div className="bg-white rounded-2xl border border-[#dee6e1] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#edf2ee]">
                  <h2 className="text-sm font-extrabold text-[#11261d]">Admins (Pre-created)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#f4f7f5] text-[#52685e] border-b border-[#dee6e1]">
                        <th className="p-3.5 font-bold">Name</th>
                        <th className="p-3.5 font-bold">Phone</th>
                        <th className="p-3.5 font-bold">Email</th>
                        <th className="p-3.5 font-bold">Status</th>
                        <th className="p-3.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.admins.map((adm) => (
                        <tr key={adm.id} className="border-b border-[#edf2ee]">
                          <td className="p-3.5 font-bold">{adm.name}</td>
                          <td className="p-3.5 text-[#52685e]">{adm.phone}</td>
                          <td className="p-3.5 text-[#52685e]">{adm.email}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#144734] text-white">
                              {adm.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingAdminId(adm.id);
                                setAdminForm({
                                  name: adm.name,
                                  phone: adm.phone,
                                  email: adm.email,
                                  status: adm.status,
                                });
                                setShowAddAdminModal(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-[#52685e] cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 inline" />
                            </button>
                            <button
                              onClick={() =>
                                updatePortalState(
                                  (prev) => ({
                                    ...prev,
                                    admins: prev.admins.filter((a) => a.id !== adm.id),
                                  }),
                                  'Removed Admin',
                                  adm.name
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. ONLINE ADMISSIONS SECTION (Super Admin & Admin) */}
          {activeNav === 'admissions' && isAdminOrSuper && (
            <AdmissionsAdminPanel
              state={state}
              currentUserName={currentUser.name}
              onUpdateState={updatePortalState}
            />
          )}

          {/* 3. MADARSA MASTER SETTINGS (Super Admin) */}
          {activeNav === 'madarsa-settings' && isSuperAdmin && (
            <MadarsaSettingsPanel state={state} onUpdateState={updatePortalState} />
          )}

          {/* 4. DASHBOARD (Tailored for Student vs Admin) */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {isStudent ? (
                /* STUDENT PERSONAL DASHBOARD */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold text-[#11261d]">
                        Assalamu Alaikum, {currentUser.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-[#61786e]">
                        Student Portal • Official Student ID:{' '}
                        <b className="font-mono text-[#144734]">{myEffectiveStudentId}</b>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveNav('results')}
                        className="px-4 py-2 rounded-xl bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
                      >
                        View My Result (Grade Card) →
                      </button>
                    </div>
                  </div>

                  {/* Student ID Card & Live Admission Approval / Congratulations / Rejection Status */}
                  <StudentIdCardView
                    settings={state.madarsaSettings}
                    studentId={myEffectiveStudentId}
                    admissionNo={myStudentRecord?.admissionNo || myAdmissionApp?.admissionNo}
                    name={currentUser.name}
                    fatherName={myStudentRecord?.fatherName || myAdmissionApp?.fatherName}
                    className={myStudentRecord?.className || myAdmissionApp?.classApplied}
                    rollNo={myStudentRecord?.rollNo || myAdmissionApp?.assignedRollNo}
                    dob={myStudentRecord?.dob || myAdmissionApp?.dob}
                    email={currentUser.email}
                    phone={currentUser.phone || myStudentRecord?.phone || myAdmissionApp?.phone}
                    address={currentUser.address || myStudentRecord?.address || myAdmissionApp?.address}
                    photoUrl={currentUser.photoUrl || myStudentRecord?.photoUrl || myAdmissionApp?.photoUrl}
                    admissionStatus={
                      myAdmissionApp?.status || currentUser.admissionStatus || 'Approved'
                    }
                    congratulationsNote={myAdmissionApp?.congratulationsNote}
                    rejectionReason={myAdmissionApp?.rejectionReason}
                  />
                </div>
              ) : (
                /* ADMIN / SUPER ADMIN DASHBOARD */
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h1 className="text-2xl font-extrabold text-[#11261d]">
                        Madarsa Dashboard
                      </h1>
                      <p className="text-xs text-[#61786e]">
                        Welcome back, {currentUser.name} ({currentUser.role})
                      </p>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setActiveNav('admissions')}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-extrabold cursor-pointer"
                        >
                          Pending Admissions ({pendingAdmissionsCount})
                        </button>
                        <button
                          onClick={() => setActiveNav('madarsa-settings')}
                          className="px-4 py-2 rounded-xl bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
                        >
                          Madarsa Settings
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-[#dee6e1] shadow-xs">
                      <div className="text-xs font-bold text-[#61786e]">Total Students</div>
                      <div className="text-3xl font-extrabold text-[#144734] mt-1">
                        {state.students.length}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#dee6e1] shadow-xs">
                      <div className="text-xs font-bold text-[#61786e]">Online Admissions</div>
                      <div className="text-3xl font-extrabold text-amber-600 mt-1">
                        {state.admissions.length}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#dee6e1] shadow-xs">
                      <div className="text-xs font-bold text-[#61786e]">Teachers (Asatiza)</div>
                      <div className="text-3xl font-extrabold text-[#144734] mt-1">
                        {state.teachers.length}
                      </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-[#dee6e1] shadow-xs">
                      <div className="text-xs font-bold text-[#61786e]">Published Grade Cards</div>
                      <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                        {state.results.length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. RESULTS / GRADE CARDS (Strict Student Isolation vs Super Admin Builder) */}
          {activeNav === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#11261d] flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-[#144734]" />
                    {isStudent ? 'My Personal Result & Grade Card' : 'Student Results & Grade Cards'}
                  </h1>
                  <p className="text-xs text-[#61786e]">
                    {isStudent
                      ? `Showing official result exclusively for Student ID: ${myEffectiveStudentId} (${currentUser.name})`
                      : 'Create, publish, or manage individual Student Grade Cards.'}
                  </p>
                </div>

                {isAdminOrSuper && (
                  <button
                    onClick={() => {
                      const firstStu = state.students[0];
                      setResultForm((prev) => ({
                        ...prev,
                        selectedStudentId: firstStu?.studentId || '',
                      }));
                      setShowAddResultModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create Student Grade Card
                  </button>
                )}
              </div>

              {visibleResults.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#dee6e1] p-10 text-center space-y-2">
                  <div className="text-base font-extrabold text-[#11261d]">
                    No Result Published Yet for {currentUser.name} ({myEffectiveStudentId})
                  </div>
                  <p className="text-xs text-[#61786e]">
                    Once the Super Admin publishes your examination Grade Card for Student ID{' '}
                    <b className="font-mono">{myEffectiveStudentId}</b>, it will appear right here.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {visibleResults.map((res) => (
                    <div key={res.id} className="space-y-2">
                      {isAdminOrSuper && (
                        <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-[#dee6e1]">
                          <div className="text-xs font-bold">
                            Student: <span className="text-[#144734]">{res.studentName}</span> (
                            <span className="font-mono">{res.studentId}</span>)
                          </div>
                          <button
                            onClick={() =>
                              updatePortalState(
                                (prev) => ({
                                  ...prev,
                                  results: prev.results.filter((r) => r.id !== res.id),
                                }),
                                'Deleted Result Grade Card',
                                `${res.studentName} (${res.studentId})`
                              )
                            }
                            className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Result
                          </button>
                        </div>
                      )}
                      <OfficialGradeCard result={res} settings={state.madarsaSettings} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. MY PROFILE & STUDENT ID CARD */}
          {activeNav === 'profile' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h1 className="text-2xl font-extrabold text-[#11261d]">
                  My Profile & Official Identity Card
                </h1>
                <p className="text-xs text-[#61786e]">
                  Your permanent Student ID and personal account credentials.
                </p>
              </div>

              <StudentIdCardView
                settings={state.madarsaSettings}
                studentId={myEffectiveStudentId}
                admissionNo={myStudentRecord?.admissionNo || myAdmissionApp?.admissionNo}
                name={currentUser.name}
                fatherName={myStudentRecord?.fatherName || myAdmissionApp?.fatherName}
                className={myStudentRecord?.className || myAdmissionApp?.classApplied || currentUser.role}
                rollNo={myStudentRecord?.rollNo || myAdmissionApp?.assignedRollNo}
                dob={myStudentRecord?.dob || myAdmissionApp?.dob}
                email={currentUser.email}
                phone={profileForm.phone || myStudentRecord?.phone || myAdmissionApp?.phone}
                address={profileForm.address || myStudentRecord?.address || myAdmissionApp?.address}
                photoUrl={currentUser.photoUrl || myStudentRecord?.photoUrl || myAdmissionApp?.photoUrl}
                admissionStatus={myAdmissionApp?.status || currentUser.admissionStatus || 'Approved'}
                congratulationsNote={myAdmissionApp?.congratulationsNote}
                rejectionReason={myAdmissionApp?.rejectionReason}
              />

              <div className="bg-white rounded-2xl border border-[#dee6e1] p-6 shadow-xs space-y-4">
                <h3 className="text-base font-extrabold text-[#11261d]">
                  Update Personal Contact & Login Password
                </h3>
                {profileSavedMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    Profile updated successfully!
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-[#2d4239] mb-1">
                      Official ID (Read-Only)
                    </label>
                    <input
                      value={myEffectiveStudentId}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] bg-gray-100 font-mono font-bold text-[#144734]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2d4239] mb-1">
                      Gmail Account (Read-Only)
                    </label>
                    <input
                      value={currentUser.email}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] bg-gray-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2d4239] mb-1">Full Name</label>
                    <input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2d4239] mb-1">Phone Number</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2d4239] mb-1">Address</label>
                    <input
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#2d4239] mb-1 flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-[#144734]" /> Login Password
                    </label>
                    <input
                      type="text"
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      placeholder="Set or update password"
                      className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#2d4239] mb-1">
                      Profile & ID Card Photo (Automatically Saved on ImgBB)
                    </label>
                    <div className="flex items-center gap-3">
                      {(profileForm.photoUrl ||
                        currentUser.photoUrl ||
                        myStudentRecord?.photoUrl ||
                        myAdmissionApp?.photoUrl) && (
                        <img
                          src={
                            profileForm.photoUrl ||
                            currentUser.photoUrl ||
                            myStudentRecord?.photoUrl ||
                            myAdmissionApp?.photoUrl
                          }
                          alt={currentUser.name}
                          className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-600 flex-shrink-0"
                        />
                      )}
                      <label className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#144734]/40 bg-[#f9fbf9] cursor-pointer hover:bg-emerald-50/40">
                        <Upload className="w-4 h-4 text-[#144734]" />
                        <span className="text-[#52685e] font-semibold">
                          {isUploadingProfilePhoto
                            ? 'Uploading photo to ImgBB (https://imgbb.com/)...'
                            : profileForm.photoUrl
                            ? 'Photo Saved on ImgBB ✓ (Click to change photo)'
                            : 'Upload Profile / ID Card Photo (Saves to ImgBB)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingProfilePhoto(true);
                            try {
                              const uploaded = await uploadImageToImgBB(
                                file,
                                `profile_${myEffectiveStudentId}`
                              );
                              setProfileForm((prev) => ({ ...prev, photoUrl: uploaded.url }));
                            } finally {
                              setIsUploadingProfilePhoto(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    disabled={isUploadingProfilePhoto}
                    onClick={() => {
                      const newPhotoUrl =
                        profileForm.photoUrl ||
                        currentUser.photoUrl ||
                        myStudentRecord?.photoUrl ||
                        myAdmissionApp?.photoUrl;
                      const updatedUser: UserAccount = {
                        ...currentUser,
                        name: profileForm.name.trim() || currentUser.name,
                        phone: profileForm.phone.trim(),
                        address: profileForm.address.trim(),
                        password: profileForm.password.trim() || currentUser.password,
                        photoUrl: newPhotoUrl,
                      };
                      setCurrentUser(updatedUser);
                      localStorage.setItem('gausiya_current_user_v3', JSON.stringify(updatedUser));
                      updatePortalState((prev) => ({
                        ...prev,
                        allUsers: prev.allUsers.map((u) =>
                          u.email.toLowerCase() === currentUser.email.toLowerCase()
                            ? updatedUser
                            : u
                        ),
                        students: prev.students.map((s) =>
                          s.studentId.toLowerCase() === myEffectiveStudentId.toLowerCase()
                            ? { ...s, photoUrl: newPhotoUrl || s.photoUrl }
                            : s
                        ),
                        admissions: prev.admissions.map((a) =>
                          a.studentId.toLowerCase() === myEffectiveStudentId.toLowerCase()
                            ? { ...a, photoUrl: newPhotoUrl || a.photoUrl }
                            : a
                        ),
                      }));
                      setProfileSavedMsg(true);
                      setTimeout(() => setProfileSavedMsg(false), 2500);
                    }}
                    className="px-5 py-2 rounded-xl bg-[#144734] disabled:opacity-60 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isUploadingProfilePhoto ? 'Uploading to ImgBB...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7. STUDENTS MANAGEMENT (Admin / Super Admin Only) */}
          {activeNav === 'students' && isAdminOrSuper && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#11261d]">
                    Enrolled Students ({state.students.length})
                  </h1>
                  <p className="text-xs text-[#61786e]">
                    Every student has an official Student ID shown in their Profile & Grade Card.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStudentForm({
                      studentId: `MGR-2026-${1001 + state.students.length}`,
                      admissionNo: `ADM-2026-${101 + state.students.length}`,
                      rollNo: String(state.students.length + 1).padStart(2, '0'),
                      name: '',
                      email: '',
                      fatherName: '',
                      className: 'Class 4',
                      gender: 'Male',
                      dob: '2013-01-01',
                      phone: '',
                      address: '',
                      photoUrl: '',
                    });
                    setShowAddStudentModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Student
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#dee6e1] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#f4f7f5] text-[#52685e] border-b border-[#dee6e1]">
                      <th className="p-3.5 font-bold">Student ID</th>
                      <th className="p-3.5 font-bold">Name</th>
                      <th className="p-3.5 font-bold">Gmail</th>
                      <th className="p-3.5 font-bold">Father's Name</th>
                      <th className="p-3.5 font-bold">Class / Roll</th>
                      <th className="p-3.5 font-bold">Phone</th>
                      <th className="p-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.students.map((stu) => (
                      <tr key={stu.id} className="border-b border-[#edf2ee]">
                        <td className="p-3.5 font-mono font-extrabold text-[#144734]">
                          {stu.studentId}
                        </td>
                        <td className="p-3.5 font-bold">{stu.name}</td>
                        <td className="p-3.5 font-mono text-xs text-[#52685e]">
                          {stu.email || '—'}
                        </td>
                        <td className="p-3.5 text-[#52685e]">{stu.fatherName}</td>
                        <td className="p-3.5">
                          {stu.className} (#{stu.rollNo})
                        </td>
                        <td className="p-3.5 text-[#52685e]">{stu.phone}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() =>
                              updatePortalState(
                                (prev) => ({
                                  ...prev,
                                  students: prev.students.filter((s) => s.id !== stu.id),
                                }),
                                'Deleted Student',
                                `${stu.name} (${stu.studentId})`
                              )
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. TEACHERS (Admin / Super Admin Only) */}
          {activeNav === 'teachers' && isAdminOrSuper && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-[#11261d]">
                  Teachers / Asatiza ({state.teachers.length})
                </h1>
                <button
                  onClick={() => setShowAddTeacherModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Teacher
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.teachers.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white p-5 rounded-2xl border border-[#dee6e1] flex items-start justify-between"
                  >
                    <div>
                      <h3 className="font-extrabold text-base text-[#11261d]">{t.name}</h3>
                      <p className="text-xs text-[#144734] font-semibold">{t.qualification}</p>
                      <p className="text-xs text-[#52685e] mt-1">Subject: {t.subject}</p>
                      <p className="text-xs text-[#52685e]">Phone: {t.phone}</p>
                    </div>
                    <button
                      onClick={() =>
                        updatePortalState(
                          (prev) => ({
                            ...prev,
                            teachers: prev.teachers.filter((x) => x.id !== t.id),
                          }),
                          'Removed Teacher',
                          t.name
                        )
                      }
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. NOTICES (Read-Only for Students, Editable for Super Admin) */}
          {activeNav === 'notices' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-[#11261d]">Official Notice Board</h1>
                {isAdminOrSuper && (
                  <button
                    onClick={() => setShowAddNoticeModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Publish Notice
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {state.notices.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white p-5 rounded-2xl border border-[#dee6e1] flex items-start justify-between gap-4"
                  >
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#144734]/10 text-[#144734]">
                        {n.category} • {n.date}
                      </span>
                      <h3 className="font-extrabold text-base text-[#11261d] mt-1">{n.title}</h3>
                      <p className="text-xs sm:text-sm text-[#52685e] mt-1">{n.content}</p>
                    </div>
                    {isAdminOrSuper && (
                      <button
                        onClick={() =>
                          updatePortalState(
                            (prev) => ({
                              ...prev,
                              notices: prev.notices.filter((x) => x.id !== n.id),
                            }),
                            'Deleted Notice',
                            n.title
                          )
                        }
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. HOMEWORK (Read-Only for Students, Editable for Super Admin) */}
          {activeNav === 'homework' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-[#11261d]">Daily Homework</h1>
                {isAdminOrSuper && (
                  <button
                    onClick={() => setShowAddHomeworkModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Assign Homework
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {state.homework.map((hw) => (
                  <div
                    key={hw.id}
                    className="bg-white p-5 rounded-2xl border border-[#dee6e1] flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        {hw.className} • {hw.subject} • Due: {hw.dueDate}
                      </span>
                      <h3 className="font-extrabold text-base text-[#11261d] mt-1">{hw.title}</h3>
                      <p className="text-xs sm:text-sm text-[#52685e] mt-1">{hw.description}</p>
                      {hw.attachmentUrl && (
                        <img
                          src={hw.attachmentUrl}
                          alt={hw.title}
                          className="mt-3 max-h-60 rounded-xl border border-[#dee6e1] object-contain"
                        />
                      )}
                    </div>
                    {isAdminOrSuper && (
                      <button
                        onClick={() =>
                          updatePortalState(
                            (prev) => ({
                              ...prev,
                              homework: prev.homework.filter((x) => x.id !== hw.id),
                            }),
                            'Deleted Homework',
                            hw.title
                          )
                        }
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. ONLINE CLASSES (Read-Only for Students, Editable for Super Admin) */}
          {activeNav === 'online-classes' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold text-[#11261d]">Online Live Classes</h1>
                {isAdminOrSuper && (
                  <button
                    onClick={() => setShowAddOnlineClassModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Online Class
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.onlineClasses.map((oc) => (
                  <div
                    key={oc.id}
                    className="bg-white p-5 rounded-2xl border border-[#dee6e1] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {oc.status} • {oc.className}
                      </span>
                      {isAdminOrSuper && (
                        <button
                          onClick={() =>
                            updatePortalState(
                              (prev) => ({
                                ...prev,
                                onlineClasses: prev.onlineClasses.filter((x) => x.id !== oc.id),
                              }),
                              'Deleted Online Class',
                              oc.topic
                            )
                          }
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-[#11261d]">{oc.topic}</h3>
                    <p className="text-xs text-[#52685e]">
                      {oc.subject} • {oc.teacherName} • {oc.scheduleTime}
                    </p>
                    <a
                      href={oc.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-4 py-2 rounded-lg bg-[#144734] text-white text-xs font-bold"
                    >
                      Join Live Dars →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. FEED (Read-Only for Students, Post/Delete for Super Admin) */}
          {activeNav === 'feed' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-[#11261d]">Madarsa Feed & Updates</h1>
                  <p className="text-xs text-[#61786e] mt-0.5">
                    Official announcements, updates, and daily news from the Madarsa
                  </p>
                </div>

                {/* Search Bar to quickly filter through past announcements and posts */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#61786e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={feedSearchQuery}
                    onChange={(e) => setFeedSearchQuery(e.target.value)}
                    placeholder="Search announcements & posts..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#dee6e1] text-xs sm:text-sm text-[#11261d] focus:outline-none focus:border-[#144734]"
                  />
                  {feedSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFeedSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#61786e] hover:text-[#11261d] cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isAdminOrSuper && (
                <div className="bg-white p-4 rounded-2xl border border-[#dee6e1] space-y-3">
                  <input
                    value={feedTitle}
                    onChange={(e) => setFeedTitle(e.target.value)}
                    placeholder="Post Title..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] text-xs font-bold"
                  />
                  <textarea
                    rows={2}
                    value={feedText}
                    onChange={(e) => setFeedText(e.target.value)}
                    placeholder="Share an announcement or update with the Madarsa..."
                    className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] text-xs"
                  />
                  {feedImageUrl && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={feedImageUrl}
                          alt="Feed attachment"
                          className="w-10 h-10 rounded-lg object-cover border border-emerald-500 flex-shrink-0"
                        />
                        <span className="font-bold text-emerald-900 truncate">
                          ✓ Image Saved on ImgBB ({feedImageUrl})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFeedImageUrl('')}
                        className="text-red-600 font-bold cursor-pointer ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="px-3.5 py-2 rounded-lg border border-dashed border-[#144734]/40 bg-[#f9fbf9] hover:bg-emerald-50 text-xs font-bold text-[#144734] flex items-center gap-1.5 cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      <span>
                        {isUploadingFeedImg
                          ? 'Uploading to ImgBB...'
                          : feedImageUrl
                          ? 'Change Image (ImgBB)'
                          : 'Upload Image (Saves to ImgBB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingFeedImg(true);
                          try {
                            const uploaded = await uploadImageToImgBB(
                              file,
                              `feed_${Date.now()}`
                            );
                            setFeedImageUrl(uploaded.url);
                          } finally {
                            setIsUploadingFeedImg(false);
                          }
                        }}
                      />
                    </label>
                    <button
                      disabled={isUploadingFeedImg}
                      onClick={() => {
                        if (!feedText.trim() && !feedImageUrl) return;
                        updatePortalState(
                          (prev) => ({
                            ...prev,
                            feed: [
                              {
                                id: `fd-${Date.now()}`,
                                authorName: currentUser.name,
                                authorRole: currentUser.role,
                                createdAt: new Date().toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }),
                                title: feedTitle.trim() || undefined,
                                content: feedText.trim() || 'Shared a photo update',
                                imageUrl: feedImageUrl || undefined,
                                likes: 1,
                              },
                              ...prev.feed,
                            ],
                          }),
                          'Published Feed Update',
                          feedTitle || 'Feed post'
                        );
                        setFeedTitle('');
                        setFeedText('');
                        setFeedImageUrl('');
                      }}
                      className="px-4 py-2 rounded-lg bg-[#144734] disabled:opacity-60 text-white text-xs font-extrabold cursor-pointer"
                    >
                      {isUploadingFeedImg ? 'Uploading Image...' : 'Publish Update'}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {(() => {
                  const q = feedSearchQuery.trim().toLowerCase();
                  const filteredFeed = q
                    ? state.feed.filter(
                        (post) =>
                          (post.title && post.title.toLowerCase().includes(q)) ||
                          post.content.toLowerCase().includes(q) ||
                          post.authorName.toLowerCase().includes(q) ||
                          post.authorRole.toLowerCase().includes(q) ||
                          post.createdAt.toLowerCase().includes(q)
                      )
                    : state.feed;

                  if (filteredFeed.length === 0) {
                    return (
                      <div className="bg-white p-8 rounded-2xl border border-[#dee6e1] text-center space-y-2">
                        <p className="text-sm font-bold text-[#11261d]">
                          No announcements or posts match &ldquo;{feedSearchQuery}&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => setFeedSearchQuery('')}
                          className="text-xs font-extrabold text-[#144734] hover:underline cursor-pointer"
                        >
                          Clear search filter
                        </button>
                      </div>
                    );
                  }

                  return filteredFeed.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white p-5 rounded-2xl border border-[#dee6e1] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#144734]">
                          {post.authorName} ({post.authorRole}) • {post.createdAt}
                        </div>
                        {isAdminOrSuper && (
                          <button
                            onClick={() =>
                              updatePortalState((prev) => ({
                                ...prev,
                                feed: prev.feed.filter((f) => f.id !== post.id),
                              }))
                            }
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {post.title && <h3 className="font-extrabold text-base">{post.title}</h3>}
                      <p className="text-xs sm:text-sm text-[#52685e]">{post.content}</p>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt={post.title || 'Feed post'}
                          className="w-full max-h-80 object-contain rounded-xl border border-[#dee6e1] mt-2"
                        />
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* 13. PARENTS / CLASSES / SUBJECTS / ATTENDANCE / EXAMS / REPORTS / LOGS / AI STUDIO (Admin Only) */}
          {activeNav === 'parents' && isAdminOrSuper && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">Parents Directory ({state.parents.length})</h1>
              <div className="bg-white rounded-2xl border border-[#dee6e1] overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#f4f7f5] border-b border-[#dee6e1]">
                      <th className="p-3.5 font-bold">Parent Name</th>
                      <th className="p-3.5 font-bold">Student</th>
                      <th className="p-3.5 font-bold">Class</th>
                      <th className="p-3.5 font-bold">Phone</th>
                      <th className="p-3.5 font-bold">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.parents.map((p) => (
                      <tr key={p.id} className="border-b border-[#edf2ee]">
                        <td className="p-3.5 font-bold">{p.name}</td>
                        <td className="p-3.5">{p.studentName}</td>
                        <td className="p-3.5">{p.studentClass}</td>
                        <td className="p-3.5">{p.phone}</td>
                        <td className="p-3.5">{p.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeNav === 'classes' && isAdminOrSuper && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">Classes ({state.classes.length})</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.classes.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-[#dee6e1]">
                    <h3 className="text-lg font-extrabold text-[#144734]">
                      {c.className} (Sec {c.section})
                    </h3>
                    <p className="text-xs text-[#52685e] mt-1">Teacher: {c.classTeacher}</p>
                    <p className="text-xs text-[#52685e]">
                      Room: {c.roomNo} • Timing: {c.timing}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'subjects' && isAdminOrSuper && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">Subjects ({state.subjects.length})</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.subjects.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-2xl border border-[#dee6e1]">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#144734]">
                      {s.code} • {s.type}
                    </span>
                    <h3 className="text-base font-extrabold mt-1">{s.subjectName}</h3>
                    <p className="text-xs text-[#52685e]">
                      {s.className} • Book: {s.bookName} • Teacher: {s.teacherName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'attendance' && isAdminOrSuper && (
            <AttendanceSection
              students={state.students}
              classes={state.classes}
              attendance={state.attendance}
              onMarkAttendance={(date, stu, status) => {
                updatePortalState(
                  (prev) => {
                    const filtered = (prev.attendance || []).filter(
                      (a) => !(a.studentId === stu.studentId && a.date === date)
                    );
                    return {
                      ...prev,
                      attendance: [
                        {
                          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          date,
                          studentId: stu.studentId,
                          studentName: stu.name,
                          rollNo: stu.rollNo,
                          className: stu.className,
                          status,
                        },
                        ...filtered,
                      ],
                    };
                  },
                  `Marked Attendance (${status})`,
                  `${stu.name} (${stu.className}) on ${date}`
                );
              }}
              onMarkAllPresentForDate={(date) => {
                updatePortalState(
                  (prev) => {
                    const otherDates = (prev.attendance || []).filter((a) => a.date !== date);
                    const batchForDate = prev.students.map((stu, idx) => ({
                      id: `att-${Date.now()}-${idx}`,
                      date,
                      studentId: stu.studentId,
                      studentName: stu.name,
                      rollNo: stu.rollNo,
                      className: stu.className,
                      status: 'Present' as const,
                    }));
                    return {
                      ...prev,
                      attendance: [...batchForDate, ...otherDates],
                    };
                  },
                  'Marked All Students Present',
                  `Date: ${date}`
                );
              }}
            />
          )}

          {activeNav === 'examinations' && isAdminOrSuper && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">Examinations Schedule</h1>
              <div className="space-y-3">
                {state.exams.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white p-5 rounded-2xl border border-[#dee6e1] flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-extrabold text-base">{ex.examName}</h3>
                      <p className="text-xs text-[#52685e]">
                        {ex.className} • {ex.subject} • {ex.examDate} ({ex.startTime})
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#144734] text-xs font-bold">
                      {ex.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'reports' && isAdminOrSuper && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">Academic & Admission Reports</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#dee6e1]">
                  <div className="text-xs text-[#61786e] font-bold">Approved Admissions</div>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-1">
                    {state.admissions.filter((a) => a.status === 'Approved').length}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#dee6e1]">
                  <div className="text-xs text-[#61786e] font-bold">Pending Admissions</div>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">
                    {state.admissions.filter((a) => a.status === 'Pending').length}
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#dee6e1]">
                  <div className="text-xs text-[#61786e] font-bold">Rejected Admissions</div>
                  <div className="text-2xl font-extrabold text-red-600 mt-1">
                    {state.admissions.filter((a) => a.status === 'Rejected').length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeNav === 'activity-logs' && isAdminOrSuper && (
            <div className="space-y-4">
              <h1 className="text-2xl font-extrabold">Activity Logs ({state.logs.length})</h1>
              <div className="bg-white rounded-2xl border border-[#dee6e1] divide-y divide-[#edf2ee]">
                {state.logs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <b className="text-[#11261d]">{log.action}</b> —{' '}
                      <span className="text-[#52685e]">{log.targetInfo}</span>
                      <div className="text-[11px] text-[#7c9086] mt-0.5">
                        By {log.actorName} ({log.actorRole})
                      </div>
                    </div>
                    <span className="text-[#7c9086] font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'chat' && (
            <MadarsaChatHub
              state={state}
              currentUser={currentUser}
              effectiveStudentId={myEffectiveStudentId}
              onUpdateState={updatePortalState}
            />
          )}

          {activeNav === 'ai-studio' && isAdminOrSuper && <AiStudioHub />}
        </main>
      </div>

      {/* ADD ADMIN MODAL */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold">
              {editingAdminId ? 'Edit Administrator' : 'Add Pre-Created Admin'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Full Name *</label>
                <input
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Phone Number *</label>
                <input
                  value={adminForm.phone}
                  onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Gmail Address *</label>
                <input
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!adminForm.name.trim()) return;
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      admins: editingAdminId
                        ? prev.admins.map((a) =>
                            a.id === editingAdminId ? { ...a, ...adminForm } : a
                          )
                        : [{ id: `adm-${Date.now()}`, ...adminForm }, ...prev.admins],
                    }),
                    editingAdminId ? 'Updated Admin' : 'Added Admin',
                    adminForm.name
                  );
                  setShowAddAdminModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
              >
                Save Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold">Add New Student with Official ID</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Student ID *</label>
                <input
                  value={studentForm.studentId}
                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Admission No *</label>
                <input
                  value={studentForm.admissionNo}
                  onChange={(e) => setStudentForm({ ...studentForm, admissionNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Student Full Name *</label>
                <input
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Student Gmail *</label>
                <input
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="student@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Father's Name *</label>
                <input
                  value={studentForm.fatherName}
                  onChange={(e) => setStudentForm({ ...studentForm, fatherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Class *</label>
                <select
                  value={studentForm.className}
                  onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-white"
                >
                  <option value="Class 1">Class 1</option>
                  <option value="Class 2">Class 2</option>
                  <option value="Class 3">Class 3</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 5">Class 5</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Roll No</label>
                <input
                  value={studentForm.rollNo}
                  onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Phone</label>
                <input
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div className="col-span-2">
                <label className="font-bold block mb-1">
                  Student Photo (Automatically Saved on ImgBB)
                </label>
                <div className="flex items-center gap-3">
                  {studentForm.photoUrl && (
                    <img
                      src={studentForm.photoUrl}
                      alt="Student preview"
                      className="w-11 h-11 rounded-xl object-cover border border-emerald-500 flex-shrink-0"
                    />
                  )}
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#144734]/40 bg-[#f9fbf9] cursor-pointer hover:bg-emerald-50">
                    <Upload className="w-4 h-4 text-[#144734]" />
                    <span className="text-[#52685e]">
                      {isUploadingStudentPhoto
                        ? 'Uploading photo to ImgBB...'
                        : studentForm.photoUrl
                        ? 'Saved on ImgBB ✓ (Click to change)'
                        : 'Upload Student Photo (Saves to ImgBB)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploadingStudentPhoto(true);
                        try {
                          const uploaded = await uploadImageToImgBB(
                            file,
                            `student_${studentForm.studentId}`
                          );
                          setStudentForm((prev) => ({ ...prev, photoUrl: uploaded.url }));
                        } finally {
                          setIsUploadingStudentPhoto(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isUploadingStudentPhoto}
                onClick={() => {
                  if (!studentForm.name.trim()) return;
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      students: [
                        {
                          id: `stu-${Date.now()}`,
                          ...studentForm,
                          photoUrl: studentForm.photoUrl || undefined,
                          feeStatus: 'Paid',
                          status: 'Active',
                        },
                        ...prev.students,
                      ],
                    }),
                    'Added Student',
                    `${studentForm.name} (${studentForm.studentId})`
                  );
                  setShowAddStudentModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#144734] disabled:opacity-60 text-white text-xs font-extrabold cursor-pointer"
              >
                {isUploadingStudentPhoto ? 'Uploading to ImgBB...' : 'Save Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STUDENT GRADE CARD MODAL */}
      {showAddResultModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold">Publish Personal Student Grade Card</h3>
            <p className="text-xs text-[#61786e]">
              Select the Student below. Only that specific student will see this Grade Card in their account.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Select Student *</label>
                <select
                  value={resultForm.selectedStudentId}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, selectedStudentId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border bg-white font-bold"
                >
                  {state.students.map((s) => (
                    <option key={s.id} value={s.studentId}>
                      {s.name} — ID: {s.studentId} ({s.className})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Examination Name *</label>
                <input
                  value={resultForm.examName}
                  onChange={(e) => setResultForm({ ...resultForm, examName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Quran Nazra & Tajweed (100)</label>
                  <input
                    type="number"
                    value={resultForm.quranNazra}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, quranNazra: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Urdu Adab & Qawaid (100)</label>
                  <input
                    type="number"
                    value={resultForm.urduAdab}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, urduAdab: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Arabic Grammar (100)</label>
                  <input
                    type="number"
                    value={resultForm.arabicGrammar}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, arabicGrammar: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Islamic Fiqh & Seerat (100)</label>
                  <input
                    type="number"
                    value={resultForm.islamicFiqh}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, islamicFiqh: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold block mb-1">Modern Math & English (100)</label>
                  <input
                    type="number"
                    value={resultForm.modernMathEng}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, modernMathEng: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">Principal / Teacher Remarks</label>
                <input
                  value={resultForm.remarks}
                  onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddResultModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const stu = state.students.find(
                    (s) => s.studentId === resultForm.selectedStudentId
                  );
                  if (!stu) return;
                  const subjects = [
                    { name: 'Quran Nazra & Tajweed', score: resultForm.quranNazra, max: 100 },
                    { name: 'Urdu Adab & Qawaid', score: resultForm.urduAdab, max: 100 },
                    { name: 'Arabic Grammar (Nahw & Sarf)', score: resultForm.arabicGrammar, max: 100 },
                    { name: 'Islamic Fiqh & Seerat', score: resultForm.islamicFiqh, max: 100 },
                    { name: 'Modern Math & English', score: resultForm.modernMathEng, max: 100 },
                  ];
                  const total = subjects.reduce((acc, s) => acc + s.score, 0);
                  const pct = Number(((total / 500) * 100).toFixed(1));
                  const newResult: ResultItem = {
                    id: `res-${Date.now()}`,
                    resultCode: `RES-${stu.studentId}`,
                    title: `${resultForm.examName} - Grade Card`,
                    studentId: stu.studentId,
                    studentEmail: stu.email,
                    studentName: stu.name,
                    rollNo: stu.rollNo,
                    admissionNo: stu.admissionNo,
                    division: resultForm.division,
                    className: stu.className,
                    examName: resultForm.examName,
                    examType: resultForm.examType,
                    academicYear: resultForm.academicYear,
                    issuedDate: new Date().toLocaleDateString('en-GB'),
                    photoUrl: stu.photoUrl,
                    subjects,
                    quranNazra: resultForm.quranNazra,
                    urduAdab: resultForm.urduAdab,
                    arabicGrammar: resultForm.arabicGrammar,
                    islamicFiqh: resultForm.islamicFiqh,
                    modernMathEng: resultForm.modernMathEng,
                    totalObtained: total,
                    maxMarks: 500,
                    percentage: pct,
                    grade: pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : 'B',
                    remarks: resultForm.remarks,
                    isPublished: true,
                  };
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      results: [newResult, ...prev.results],
                    }),
                    'Published Student Grade Card',
                    `${stu.name} (${stu.studentId})`
                  );
                  setShowAddResultModal(false);
                }}
                className="px-5 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
              >
                Publish Grade Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NOTICE MODAL */}
      {showAddNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold">Publish Official Notice</h3>
            <div className="space-y-3 text-xs">
              <input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                placeholder="Notice Title..."
                className="w-full px-3 py-2 rounded-lg border"
              />
              <textarea
                rows={3}
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                placeholder="Notice Content..."
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddNoticeModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!noticeForm.title.trim()) return;
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      notices: [
                        {
                          id: `not-${Date.now()}`,
                          ...noticeForm,
                          date: new Date().toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }),
                        },
                        ...prev.notices,
                      ],
                    }),
                    'Published Notice',
                    noticeForm.title
                  );
                  setShowAddNoticeModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TEACHER MODAL */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold">Add Teacher (Ustad)</h3>
            <div className="space-y-3 text-xs">
              <input
                value={teacherForm.name}
                onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                placeholder="Teacher Full Name"
                className="w-full px-3 py-2 rounded-lg border"
              />
              <input
                value={teacherForm.qualification}
                onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                placeholder="Qualification (e.g. Fazil / Hafiz)"
                className="w-full px-3 py-2 rounded-lg border"
              />
              <input
                value={teacherForm.subject}
                onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                placeholder="Subject Taught"
                className="w-full px-3 py-2 rounded-lg border"
              />
              <input
                value={teacherForm.phone}
                onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                placeholder="Phone Number"
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!teacherForm.name.trim()) return;
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      teachers: [
                        {
                          id: `tch-${Date.now()}`,
                          ...teacherForm,
                          joiningDate: new Date().toISOString().slice(0, 10),
                          status: 'Active',
                        },
                        ...prev.teachers,
                      ],
                    }),
                    'Added Teacher',
                    teacherForm.name
                  );
                  setShowAddTeacherModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
              >
                Save Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD HOMEWORK MODAL */}
      {showAddHomeworkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold">Assign Homework</h3>
            <div className="space-y-3 text-xs">
              <input
                value={homeworkForm.title}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                placeholder="Homework Title"
                className="w-full px-3 py-2 rounded-lg border"
              />
              <input
                value={homeworkForm.className}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, className: e.target.value })}
                placeholder="Class (e.g. Class 4)"
                className="w-full px-3 py-2 rounded-lg border"
              />
              <textarea
                rows={3}
                value={homeworkForm.description}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                placeholder="Homework Instructions..."
                className="w-full px-3 py-2 rounded-lg border"
              />
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[#144734]/40 bg-[#f9fbf9] cursor-pointer hover:bg-emerald-50">
                <Upload className="w-4 h-4 text-[#144734]" />
                <span className="text-[#52685e]">
                  {isUploadingHomeworkImg
                    ? 'Uploading image to ImgBB...'
                    : homeworkForm.attachmentUrl
                    ? 'Worksheet Image Saved on ImgBB ✓'
                    : 'Upload Homework / Page Photo (Saves to ImgBB)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsUploadingHomeworkImg(true);
                    try {
                      const uploaded = await uploadImageToImgBB(
                        file,
                        `homework_${Date.now()}`
                      );
                      setHomeworkForm((prev) => ({ ...prev, attachmentUrl: uploaded.url }));
                    } finally {
                      setIsUploadingHomeworkImg(false);
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddHomeworkModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isUploadingHomeworkImg}
                onClick={() => {
                  if (!homeworkForm.title.trim()) return;
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      homework: [
                        {
                          id: `hw-${Date.now()}`,
                          ...homeworkForm,
                          attachmentUrl: homeworkForm.attachmentUrl || undefined,
                          teacherName: currentUser.name,
                          assignedDate: new Date().toISOString().slice(0, 10),
                        },
                        ...prev.homework,
                      ],
                    }),
                    'Assigned Homework',
                    homeworkForm.title
                  );
                  setShowAddHomeworkModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#144734] disabled:opacity-60 text-white text-xs font-extrabold cursor-pointer"
              >
                {isUploadingHomeworkImg ? 'Uploading to ImgBB...' : 'Save Homework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ONLINE CLASS MODAL */}
      {showAddOnlineClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-extrabold">Schedule Online Live Class</h3>
            <div className="space-y-3 text-xs">
              <input
                value={onlineClassForm.topic}
                onChange={(e) =>
                  setOnlineClassForm({ ...onlineClassForm, topic: e.target.value })
                }
                placeholder="Class Topic"
                className="w-full px-3 py-2 rounded-lg border"
              />
              <input
                value={onlineClassForm.meetingLink}
                onChange={(e) =>
                  setOnlineClassForm({ ...onlineClassForm, meetingLink: e.target.value })
                }
                placeholder="Google Meet / Zoom Link"
                className="w-full px-3 py-2 rounded-lg border"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddOnlineClassModal(false)}
                className="px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!onlineClassForm.topic.trim()) return;
                  updatePortalState(
                    (prev) => ({
                      ...prev,
                      onlineClasses: [
                        {
                          id: `oc-${Date.now()}`,
                          ...onlineClassForm,
                          teacherName: currentUser.name,
                          status: 'Live Now',
                        },
                        ...prev.onlineClasses,
                      ],
                    }),
                    'Added Online Class',
                    onlineClassForm.topic
                  );
                  setShowAddOnlineClassModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
              >
                Save Online Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
