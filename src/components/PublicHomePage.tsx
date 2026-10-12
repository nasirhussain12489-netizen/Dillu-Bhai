import React, { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  MapPin,
  Heart,
  Users,
  Award,
  Sparkles,
  Bell,
  Calendar,
  Rss,
  Phone,
  Mail,
  ChevronRight,
  FilePlus2,
  SearchCheck,
  LogIn,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  X,
  Upload,
  KeyRound,
  UserPlus,
} from 'lucide-react';
import {
  AdmissionApplication,
  INITIAL_PORTAL_STATE,
  PortalState,
  UserAccount,
} from '../types/portal';
import { MadarsaLogo } from './MadarsaLogo';
import { uploadImageToImgBB } from '../utils/imgbb';

interface PublicHomePageProps {
  state: PortalState;
  currentUser: UserAccount | null;
  onReturnToDashboard?: () => void;
  onGoogleLogin: (fallbackEmail?: string, fallbackName?: string) => Promise<void>;
  onCredentialsLogin: (identifier: string, password: string) => { ok: boolean; error?: string };
  onCreateAccount: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    photoUrl?: string;
  }) => Promise<{ ok: boolean; error?: string; user?: UserAccount }>;
  onSubmitAdmission: (app: AdmissionApplication) => void;
  authLoading: boolean;
  authError: string | null;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  state,
  currentUser,
  onReturnToDashboard,
  onGoogleLogin,
  onCredentialsLogin,
  onCreateAccount,
  onSubmitAdmission,
  authLoading,
  authError,
}) => {
  const settings = state.madarsaSettings || INITIAL_PORTAL_STATE.madarsaSettings;

  // Modal / Drawer Mode: null | 'login' | 'signup' | 'admission' | 'status'
  const [activeModalTab, setActiveModalTab] = useState<
    'login' | 'signup' | 'admission' | 'status' | null
  >(null);

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [localLoginError, setLocalLoginError] = useState<string | null>(null);

  // Google Quick Sign-In chooser state (when browser blocks third-party popup)
  const [showGoogleEmailPrompt, setShowGoogleEmailPrompt] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');
  const [googleInputName, setGoogleInputName] = useState('');

  // Create Account (Sign Up) Form State
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    photoUrl: '',
  });
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [isUploadingSignupPhoto, setIsUploadingSignupPhoto] = useState(false);

  // Admission Form State
  const [admForm, setAdmForm] = useState({
    studentName: '',
    email: '',
    password: '',
    fatherName: '',
    motherName: '',
    phone: '',
    dob: '',
    gender: 'Male' as 'Male' | 'Female',
    classApplied: 'Class 1',
    previousSchool: '',
    aadhaarNo: '',
    address: '',
    photoUrl: '',
  });
  const [isUploadingAdmPhoto, setIsUploadingAdmPhoto] = useState(false);
  const [admFormError, setAdmFormError] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<AdmissionApplication | null>(null);

  // Check Admission Status State
  const [statusSearchInput, setStatusSearchInput] = useState('');
  const [foundApplications, setFoundApplications] = useState<AdmissionApplication[] | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAdmPhoto(true);
    setAdmFormError(null);
    try {
      const uploaded = await uploadImageToImgBB(
        file,
        admForm.studentName ? `admission_${admForm.studentName}` : `admission_${Date.now()}`
      );
      setAdmForm((prev) => ({ ...prev, photoUrl: uploaded.url }));
    } catch {
      setAdmFormError('Could not upload photo to ImgBB. Please try again.');
    } finally {
      setIsUploadingAdmPhoto(false);
    }
  };

  const handleSignupPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSignupPhoto(true);
    setSignupError(null);
    try {
      const uploaded = await uploadImageToImgBB(
        file,
        signupForm.name ? `user_${signupForm.name}` : `user_${Date.now()}`
      );
      setSignupForm((prev) => ({ ...prev, photoUrl: uploaded.url }));
    } catch {
      setSignupError('Could not upload photo to ImgBB. Please try again.');
    } finally {
      setIsUploadingSignupPhoto(false);
    }
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdmFormError(null);

    if (settings.admissionsOpen === false) {
      setAdmFormError('Online Admissions are currently CLOSED (OFF) by the Admin.');
      return;
    }

    if (!admForm.studentName.trim()) {
      setAdmFormError('Please enter Student Full Name.');
      return;
    }
    if (!admForm.email.trim() || !admForm.email.includes('@')) {
      setAdmFormError('Please enter a valid Gmail / Email address to create your Student Account.');
      return;
    }
    if (!admForm.password.trim() || admForm.password.trim().length < 4) {
      setAdmFormError('Please set a password (minimum 4 characters) for your Gmail Student Account.');
      return;
    }
    if (!admForm.fatherName.trim()) {
      setAdmFormError("Please enter Father's / Guardian's Name.");
      return;
    }
    if (!admForm.phone.trim()) {
      setAdmFormError('Please enter Phone / WhatsApp Number.');
      return;
    }
    if (!admForm.dob) {
      setAdmFormError('Please select Date of Birth.');
      return;
    }
    if (!admForm.address.trim()) {
      setAdmFormError('Please enter Full Residential Address.');
      return;
    }

    const nextNum = 1001 + (state.admissions?.length || 0) + Math.floor(Math.random() * 90);
    const generatedStudentId = `MGR-2026-${nextNum}`;
    const generatedAdmNo = `ADM-2026-${101 + (state.admissions?.length || 0)}`;

    const newApp: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      studentId: generatedStudentId,
      admissionNo: generatedAdmNo,
      studentName: admForm.studentName.trim(),
      email: admForm.email.trim().toLowerCase(),
      password: admForm.password.trim(),
      fatherName: admForm.fatherName.trim(),
      motherName: admForm.motherName.trim(),
      phone: admForm.phone.trim(),
      dob: admForm.dob,
      gender: admForm.gender,
      classApplied: admForm.classApplied,
      previousSchool: admForm.previousSchool.trim(),
      aadhaarNo: admForm.aadhaarNo.trim(),
      address: admForm.address.trim(),
      photoUrl: admForm.photoUrl || undefined,
      appliedDate: new Date().toISOString().slice(0, 10),
      status: 'Pending',
    };

    onSubmitAdmission(newApp);
    setSubmittedApplication(newApp);
  };

  const handleStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = statusSearchInput.trim().toLowerCase();
    if (!q) return;
    const matches = (state.admissions || []).filter(
      (a) =>
        a.studentId.toLowerCase() === q ||
        a.admissionNo.toLowerCase() === q ||
        a.email.toLowerCase() === q ||
        a.phone.toLowerCase() === q ||
        a.studentName.toLowerCase().includes(q)
    );
    setFoundApplications(matches);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoginError(null);
    if (!loginIdentifier.trim()) {
      setLocalLoginError('Please enter your Gmail / Email or Student ID.');
      return;
    }
    const res = onCredentialsLogin(loginIdentifier.trim(), loginPassword);
    if (!res.ok) {
      setLocalLoginError(res.error || 'Invalid credentials.');
    } else {
      setActiveModalTab(null);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    if (!signupForm.name.trim()) {
      setSignupError('Please enter your Full Name.');
      return;
    }
    if (!signupForm.email.trim() || !signupForm.email.includes('@')) {
      setSignupError('Please enter a valid Gmail / Email address.');
      return;
    }
    if (!signupForm.password.trim() || signupForm.password.trim().length < 4) {
      setSignupError('Please set a password (minimum 4 characters).');
      return;
    }
    if (
      signupForm.confirmPassword &&
      signupForm.password.trim() !== signupForm.confirmPassword.trim()
    ) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await onCreateAccount({
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        address: signupForm.address,
        password: signupForm.password,
        photoUrl: signupForm.photoUrl || undefined,
      });
      if (!res.ok) {
        setSignupError(res.error || 'Could not create account.');
      } else {
        setActiveModalTab(null);
      }
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleButtonClick = async () => {
    setLocalLoginError(null);
    setSignupError(null);
    await onGoogleLogin();
    setShowGoogleEmailPrompt(true);
  };

  const handleGoogleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleInputEmail.trim() || !googleInputEmail.includes('@')) {
      setLocalLoginError('Please enter a valid Google / Gmail address (e.g. name@gmail.com).');
      return;
    }
    await onGoogleLogin(googleInputEmail.trim(), googleInputName.trim());
    setActiveModalTab(null);
  };

  const programColors = [
    'from-emerald-500 to-emerald-600',
    'from-emerald-600 to-emerald-700',
    'from-emerald-700 to-emerald-800',
    'from-teal-600 to-teal-700',
    'from-teal-700 to-teal-800',
  ];

  const publicNotices = (state.notices || []).filter((n) => n.isPublic);

  return (
    <div className="min-h-screen bg-[#f6f9f7] text-[#11261d]">
      {/* Sticky Header matching https://gausiya.zite.so/ + Side-by-Side Admission Form & Check Status */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dee6e1] shadow-xs">
        <div className="container mx-auto px-4 flex items-center justify-between h-16 gap-2">
          <div className="flex items-center gap-3">
            <MadarsaLogo logoUrl={settings.logoUrl} className="w-11 h-11 flex-shrink-0" />
            <div>
              <h1 className="text-sm font-extrabold text-[#144734] leading-tight">
                {settings.madarsaName}
              </h1>
              <p className="text-[10px] text-[#61786e] font-medium">{settings.shortSubtitle}</p>
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-[#52685e]">
            <a href="#about" className="hover:text-[#144734] transition-colors">
              About
            </a>
            <a href="#classes" className="hover:text-[#144734] transition-colors">
              Classes
            </a>
            <a href="#features" className="hover:text-[#144734] transition-colors">
              Features
            </a>
            <a href="#notices" className="hover:text-[#144734] transition-colors">
              Notices
            </a>
            <a href="#contact" className="hover:text-[#144734] transition-colors">
              Contact
            </a>
          </nav>

          {/* Side-by-Side Action Buttons: Admission Form | Check Status | Portal Login */}
          <div className="flex items-center gap-2">
            {currentUser && onReturnToDashboard ? (
              <button
                onClick={onReturnToDashboard}
                className="px-4 py-2 rounded-lg bg-[#144734] text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-[#0f3627] transition-all cursor-pointer"
              >
                Go to Dashboard ({currentUser.name.split(' ')[0]})
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSubmittedApplication(null);
                    setActiveModalTab('admission');
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                    settings.admissionsOpen !== false
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>
                    {settings.admissionsOpen !== false ? 'Admission Form' : 'Admission Closed'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setFoundApplications(null);
                    setActiveModalTab('status');
                  }}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-lg border border-[#144734]/30 bg-emerald-50 hover:bg-emerald-100 text-[#144734] text-xs sm:text-sm font-bold items-center gap-1.5 transition-all cursor-pointer"
                >
                  <SearchCheck className="w-4 h-4" />
                  <span>Check Status</span>
                </button>

                <button
                  onClick={() => setActiveModalTab('signup')}
                  className="hidden md:inline-flex px-3.5 py-2 rounded-lg border border-[#144734] text-[#144734] hover:bg-emerald-50 text-xs sm:text-sm font-bold items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>

                <button
                  onClick={() => setActiveModalTab('login')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Portal Login
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section matching https://gausiya.zite.so/ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#123f2e] via-[#164f39] to-[#0d2e22]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA2KSIvPjwvc3ZnPg==')",
          }}
        />
        <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
          <div className="flex justify-center mb-4">
            <MadarsaLogo
              logoUrl={settings.logoUrl}
              variant="on-dark"
              className="w-24 h-24 md:w-28 md:h-28"
            />
          </div>
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xs">
            <span className="text-xs font-medium tracking-widest text-amber-300 uppercase">
              {settings.bismillahText}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
            {settings.madarsaName.includes('Islamnagar') ? (
              <>
                {settings.madarsaName.replace('Islamnagar', '').trim()}
                <br />
                <span className="text-amber-300">Islamnagar</span>
              </>
            ) : (
              settings.madarsaName
            )}
          </h1>

          <p className="mt-4 text-sm md:text-base text-white/80 max-w-xl mx-auto">
            {settings.heroSubtitle}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs md:text-sm font-semibold text-white/90 flex-wrap">
            {settings.tagline.split('•').map((part, idx, arr) => (
              <React.Fragment key={idx}>
                <span>{part.trim()}</span>
                {idx < arr.length - 1 && <span className="text-amber-300">•</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Hero Primary Buttons: Portal Login + Online Admission Form + Check Admission Status */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3.5 justify-center items-center flex-wrap">
            <button
              onClick={() => setActiveModalTab('login')}
              className="w-full sm:w-auto bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white text-base font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Portal Login <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveModalTab('signup')}
              className="w-full sm:w-auto bg-white text-[#144734] hover:bg-emerald-50 text-base font-extrabold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-[#144734]" />
              Create Account
            </button>

            <button
              onClick={() => {
                setSubmittedApplication(null);
                setActiveModalTab('admission');
              }}
              className={`w-full sm:w-auto text-white text-base font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                settings.admissionsOpen !== false
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <FilePlus2 className="w-5 h-5" />
              {settings.admissionsOpen !== false
                ? 'Online Admission Form (Open)'
                : 'Online Admission Form (Closed)'}
            </button>

            <button
              onClick={() => {
                setFoundApplications(null);
                setActiveModalTab('status');
              }}
              className="w-full sm:w-auto border border-white/30 text-white bg-white/10 hover:bg-white/20 text-base font-semibold px-6 py-3.5 rounded-xl backdrop-blur-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <SearchCheck className="w-5 h-5 text-amber-300" />
              Check Admission Status
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f6f9f7] to-transparent" />
      </section>

      {/* Pre-Login Quick Admission & Status Check Bar right below Hero */}
      <section className="py-8 container mx-auto px-4">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl border-2 border-[#144734]/15 shadow-sm p-5 sm:p-6 flex flex-col lg:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#144734]">
                Academic Session {settings.academicYear}
              </span>
              <span
                className={`inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  settings.admissionsOpen !== false
                    ? 'bg-emerald-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {settings.admissionsOpen !== false
                  ? '● Online Admission: OPEN'
                  : '● Online Admission: CLOSED'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#11261d]">
              {settings.admissionsOpen !== false
                ? 'New Student Online Admission & Live Approval Status'
                : 'Online Admission Form is Currently Closed'}
            </h2>
            <p className="text-xs sm:text-sm text-[#61786e]">
              {settings.admissionsOpen !== false
                ? 'Fill out the Online Admission Form with your Gmail to create your Student Account, or check if Super Admin has Approved or Rejected your application.'
                : 'New online admission applications are currently paused by the Admin. Students who already applied can still check their live Approval / Rejection status.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setSubmittedApplication(null);
                setActiveModalTab('admission');
              }}
              className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm cursor-pointer ${
                settings.admissionsOpen !== false
                  ? 'bg-[#144734] hover:bg-[#0f3627]'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <FilePlus2 className="w-4 h-4" />
              {settings.admissionsOpen !== false ? 'Fill Admission Form' : 'Admission Closed'}
            </button>
            <button
              onClick={() => {
                setFoundApplications(null);
                setActiveModalTab('status');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <SearchCheck className="w-4 h-4" /> Check Accept / Reject Status
            </button>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-xs font-semibold tracking-widest text-[#d4942a] uppercase mb-3">
              About Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#11261d]">
              {settings.aboutHeading}
            </h2>
            <p className="mt-6 text-[#52685e] leading-relaxed text-base md:text-lg">
              {settings.aboutDescription}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {settings.statsBoxes.map((item, idx) => {
              const icons = [BookOpen, GraduationCap, MapPin, Heart];
              const IconComp = icons[idx % icons.length];
              return (
                <div
                  key={item.id}
                  className="text-center p-4 rounded-xl bg-white border border-[#dee6e1] shadow-xs"
                >
                  <IconComp className="w-6 h-6 text-[#144734] mx-auto mb-2" />
                  <div className="font-bold text-[#11261d] text-sm">{item.value}</div>
                  <div className="text-xs text-[#61786e] mt-1">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Academic Programs Section */}
      <section id="classes" className="py-16 md:py-24 bg-[#eef3f0]/70">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold tracking-widest text-[#d4942a] uppercase mb-3">
              Our Classes
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#11261d]">Academic Programs</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {settings.programs.map((cls, idx) => (
              <div
                key={cls.id}
                className="group bg-white rounded-xl border border-[#dee6e1] shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`h-2 bg-gradient-to-r ${programColors[idx % programColors.length]}`}
                />
                <div className="p-5">
                  <div className="mb-4 group-hover:scale-110 transition-transform inline-block">
                    <MadarsaLogo logoUrl={settings.logoUrl} className="w-12 h-12" />
                  </div>
                  <h3 className="font-bold text-[#11261d] text-lg">{cls.title}</h3>
                  <p className="mt-2 text-sm text-[#52685e] leading-relaxed">{cls.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us / Education Features */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold tracking-widest text-[#d4942a] uppercase mb-3">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#11261d]">Education Features</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {settings.features.map((f, idx) => {
              const icons = [BookOpen, GraduationCap, Users, Heart, Sparkles, Award];
              const IconComp = icons[idx % icons.length];
              return (
                <div
                  key={f.id}
                  className="flex gap-4 p-5 rounded-xl bg-white border border-[#dee6e1] shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-lg bg-[#144734]/10 flex items-center justify-center flex-shrink-0">
                    <IconComp className="w-5 h-5 text-[#144734]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#11261d]">{f.title}</h3>
                    <p className="mt-1 text-sm text-[#52685e]">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notices & Upcoming Exams */}
      <section id="notices" className="py-16 md:py-24 bg-[#eef3f0]/70">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notice Board */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-[#d4942a]" />
                <h2 className="text-2xl font-bold text-[#11261d]">Notice Board</h2>
              </div>
              <div className="space-y-4">
                {publicNotices.length > 0 ? (
                  publicNotices.map((n) => (
                    <div
                      key={n.id}
                      className="p-5 bg-white rounded-xl border border-[#dee6e1] shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#144734]/10 text-[#144734]">
                          {n.category}
                        </span>
                        <span className="text-xs text-[#61786e]">{n.date}</span>
                      </div>
                      <h3 className="font-bold text-[#11261d]">{n.title}</h3>
                      <p className="text-sm text-[#52685e] mt-1">{n.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-white rounded-xl border border-[#dee6e1] text-center text-[#61786e]">
                    No public notices at the moment.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Exams */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-[#144734]" />
                <h2 className="text-2xl font-bold text-[#11261d]">Upcoming Exams</h2>
              </div>
              <div className="space-y-4">
                {state.exams && state.exams.length > 0 ? (
                  state.exams.map((ex) => (
                    <div
                      key={ex.id}
                      className="p-5 bg-white rounded-xl border border-[#dee6e1] shadow-xs flex items-center justify-between gap-4"
                    >
                      <div>
                        <h3 className="font-bold text-[#11261d]">{ex.examName}</h3>
                        <p className="text-xs text-[#61786e] mt-1">
                          {ex.className} • {ex.subject} • {ex.startTime}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="px-3 py-1 rounded-lg bg-[#144734] text-white text-xs font-bold">
                          {ex.examDate}
                        </div>
                        <div className="text-[11px] text-[#61786e] mt-1">
                          {ex.totalMarks} Marks
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-white rounded-xl border border-[#dee6e1] text-center text-[#61786e]">
                    No upcoming exams scheduled.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feed Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold tracking-widest text-[#d4942a] uppercase mb-3">
              Updates
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#11261d] flex items-center justify-center gap-2">
              <Rss className="w-7 h-7 text-[#144734]" /> Feed
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-5">
            {state.feed && state.feed.length > 0 ? (
              state.feed.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-[#dee6e1] shadow-xs overflow-hidden"
                >
                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="" className="w-full h-48 object-cover" />
                  )}
                  <div className="p-5">
                    {post.title && (
                      <h3 className="font-semibold text-[#11261d] text-lg">{post.title}</h3>
                    )}
                    <p className="mt-1 text-sm text-[#52685e] whitespace-pre-line">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-[#61786e]">
                      <div className="w-6 h-6 rounded-full bg-[#144734] flex items-center justify-center text-white text-[10px] font-bold">
                        {post.authorName?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <span className="font-medium text-[#11261d]">{post.authorName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#144734]/10 text-[#144734] font-medium">
                        {post.authorRole}
                      </span>
                      <span>• {post.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 bg-white rounded-xl border border-[#dee6e1] text-center text-[#61786e]">
                No feed posts yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 md:py-24 bg-[#eef3f0]/50">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <span className="inline-block text-xs font-semibold tracking-widest text-[#d4942a] uppercase mb-3">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#11261d]">Contact Us</h2>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center gap-3 justify-center text-[#52685e]">
                <MapPin className="w-5 h-5 text-[#144734] flex-shrink-0" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-[#52685e]">
                <Phone className="w-5 h-5 text-[#144734] flex-shrink-0" />
                <span>{settings.phone || 'Contact the Madarsa office for inquiries'}</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-[#52685e]">
                <Mail className="w-5 h-5 text-[#144734] flex-shrink-0" />
                <span>{settings.email || 'Reach out for admissions and information'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer matching https://gausiya.zite.so/ */}
      <footer className="bg-gradient-to-br from-[#123f2e] to-[#0d2e22] py-10 text-white/80">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <MadarsaLogo logoUrl={settings.logoUrl} variant="on-dark" className="w-8 h-8" />
            <span className="font-bold text-white">{settings.madarsaName}</span>
          </div>
          <p className="text-sm">{settings.address}</p>
          <p className="mt-4 text-xs text-white/50">{settings.tagline}</p>
        </div>
      </footer>

      {/* UNIFIED SIDE-BY-SIDE PORTAL LOGIN / ONLINE ADMISSION FORM / CHECK STATUS MODAL */}
      {activeModalTab && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#dee6e1] max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            {/* Top Modal Header & Side-by-Side Tabs */}
            <div className="bg-gradient-to-r from-[#123f2e] to-[#1b5942] p-4 sm:p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <MadarsaLogo
                    logoUrl={settings.logoUrl}
                    variant="on-dark"
                    className="w-10 h-10 flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">{settings.madarsaName}</h3>
                    <p className="text-[11px] text-emerald-100/80">
                      Portal Login, Online Student Admission & Live Approval Status
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalTab(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4 Side-by-Side Tabs: Login | Create Account | Admission Form | Check Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveModalTab('login')}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeModalTab === 'login'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Portal Login
                </button>
                <button
                  onClick={() => setActiveModalTab('signup')}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeModalTab === 'signup'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </button>
                <button
                  onClick={() => {
                    setSubmittedApplication(null);
                    setActiveModalTab('admission');
                  }}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeModalTab === 'admission'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <FilePlus2 className="w-3.5 h-3.5" /> Admission Form
                </button>
                <button
                  onClick={() => {
                    setFoundApplications(null);
                    setActiveModalTab('status');
                  }}
                  className={`py-2.5 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeModalTab === 'status'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  <SearchCheck className="w-3.5 h-3.5" /> Check Status
                </button>
              </div>
            </div>

            {/* TAB 1: PORTAL LOGIN (No Demo Buttons!) */}
            {activeModalTab === 'login' && (
              <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
                <div className="text-center">
                  <h4 className="text-lg font-extrabold text-[#11261d]">Sign In to Madarsa Portal</h4>
                  <p className="text-xs text-[#61786e] mt-1">
                    Sign in with Google or use your Gmail / Student ID & Password.
                  </p>
                </div>

                {localLoginError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                    {localLoginError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={authLoading}
                  className="w-full py-3 px-4 rounded-xl border-2 border-[#144734] bg-[#144734] hover:bg-[#0f3627] text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.9 7.4 24 12 24z"
                    />
                  </svg>
                  {authLoading ? 'Connecting to Google...' : 'Continue with Google Account'}
                </button>

                {/* Instant Google Account Sign-In Box if popup is blocked or user clicks Continue with Google */}
                {(showGoogleEmailPrompt || authError) && (
                  <form
                    onSubmit={handleGoogleEmailContinue}
                    className="p-4 rounded-xl bg-emerald-50/90 border-2 border-[#144734]/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#144734] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        Enter Your Google / Gmail Account to Continue
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGoogleEmailPrompt(false)}
                        className="text-[11px] text-gray-500 hover:text-gray-800 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="email"
                        required
                        value={googleInputEmail}
                        onChange={(e) => setGoogleInputEmail(e.target.value)}
                        placeholder="yourname@gmail.com *"
                        className="w-full px-3 py-2 rounded-lg border border-[#144734]/30 bg-white text-xs sm:text-sm font-medium focus:outline-none focus:border-[#144734]"
                      />
                      <input
                        type="text"
                        value={googleInputName}
                        onChange={(e) => setGoogleInputName(e.target.value)}
                        placeholder="Your Full Name (Optional)"
                        className="w-full px-3 py-2 rounded-lg border border-[#144734]/30 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#144734]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-[#144734] hover:bg-[#0f3627] text-white text-xs font-extrabold shadow-xs cursor-pointer"
                    >
                      Sign In with Google Gmail →
                    </button>
                  </form>
                )}

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#dee6e1]" />
                  <span className="flex-shrink mx-3 text-[11px] uppercase font-bold text-[#7c9086]">
                    Or Login with Gmail / Student ID
                  </span>
                  <div className="flex-grow border-t border-[#dee6e1]" />
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#2d4239] mb-1">
                      Gmail Address or Student ID *
                    </label>
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. student@gmail.com or MGR-2026-1001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6e0da] text-sm focus:outline-none focus:border-[#144734]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2d4239] mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6e0da] text-sm focus:outline-none focus:border-[#144734]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white font-extrabold text-sm shadow-md hover:opacity-95 cursor-pointer"
                  >
                    Login to Portal
                  </button>
                </form>

                <div className="pt-3 border-t border-[#edf2ee] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#61786e]">
                  <div className="flex items-center gap-1.5">
                    <span>Don&apos;t have an account?</span>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('signup')}
                      className="font-extrabold text-[#144734] hover:underline cursor-pointer"
                    >
                      Create Account (Sign Up) →
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedApplication(null);
                      setActiveModalTab('admission');
                    }}
                    className="font-extrabold text-amber-700 hover:underline cursor-pointer"
                  >
                    Online Admission Form →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1B: CREATE ACCOUNT (SIGN UP) */}
            {activeModalTab === 'signup' && (
              <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                <div className="text-center">
                  <h4 className="text-lg font-extrabold text-[#11261d]">
                    Create New Portal Account (Sign Up)
                  </h4>
                  <p className="text-xs text-[#61786e] mt-1">
                    Create your account with your Gmail & Password or sign up directly with Google.
                  </p>
                </div>

                {signupError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                    {signupError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={authLoading}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-[#144734] bg-[#144734] hover:bg-[#0f3627] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  {authLoading ? 'Connecting...' : 'Sign Up Quickly with Google Account'}
                </button>

                {(showGoogleEmailPrompt || authError) && (
                  <form
                    onSubmit={handleGoogleEmailContinue}
                    className="p-3.5 rounded-xl bg-emerald-50 border border-[#144734]/30 space-y-2.5"
                  >
                    <div className="text-xs font-extrabold text-[#144734]">
                      Enter your Google / Gmail address to create & sign in immediately:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="email"
                        required
                        value={googleInputEmail}
                        onChange={(e) => setGoogleInputEmail(e.target.value)}
                        placeholder="yourname@gmail.com *"
                        className="w-full px-3 py-2 rounded-lg border border-[#144734]/30 bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={googleInputName}
                        onChange={(e) => setGoogleInputName(e.target.value)}
                        placeholder="Your Full Name *"
                        className="w-full px-3 py-2 rounded-lg border border-[#144734]/30 bg-white text-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
                    >
                      Continue with Google Account →
                    </button>
                  </form>
                )}

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-[#dee6e1]" />
                  <span className="flex-shrink mx-3 text-[11px] uppercase font-bold text-[#7c9086]">
                    Or Fill Account Details Below
                  </span>
                  <div className="flex-grow border-t border-[#dee6e1]" />
                </div>

                <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-[#2d4239] mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2d4239] mb-1">
                        Gmail / Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        placeholder="example@gmail.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2d4239] mb-1">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2d4239] mb-1">
                        Address / City
                      </label>
                      <input
                        type="text"
                        value={signupForm.address}
                        onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value })}
                        placeholder="Islamnagar / Village / City"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2d4239] mb-1">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        placeholder="Minimum 4 characters"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#2d4239] mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={signupForm.confirmPassword}
                        onChange={(e) =>
                          setSignupForm({ ...signupForm, confirmPassword: e.target.value })
                        }
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-[#2d4239] mb-1">
                        Profile Photo (Optional — Automatically Saved on ImgBB)
                      </label>
                      <div className="flex items-center gap-3">
                        {signupForm.photoUrl && (
                          <img
                            src={signupForm.photoUrl}
                            alt="Profile preview"
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-500 flex-shrink-0"
                          />
                        )}
                        <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#144734]/40 bg-[#f9fbf9] cursor-pointer hover:bg-emerald-50/40">
                          <Upload className="w-4 h-4 text-[#144734]" />
                          <span className="text-[#52685e]">
                            {isUploadingSignupPhoto
                              ? 'Uploading photo to ImgBB...'
                              : signupForm.photoUrl
                              ? 'Saved on ImgBB ✓ (Click to change photo)'
                              : 'Upload Photo (Saves to ImgBB)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSignupPhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading || isUploadingSignupPhoto}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4942a] to-[#b87b19] text-white font-extrabold text-sm shadow-md hover:opacity-95 cursor-pointer disabled:opacity-60"
                  >
                    {isUploadingSignupPhoto
                      ? 'Uploading Photo to ImgBB...'
                      : signupLoading
                      ? 'Creating Account...'
                      : 'Create Account & Login Now'}
                  </button>
                </form>

                <div className="pt-2 border-t border-[#edf2ee] flex items-center justify-between text-xs text-[#61786e]">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('login')}
                    className="font-extrabold text-[#144734] hover:underline cursor-pointer"
                  >
                    Back to Portal Login →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ONLINE ADMISSION FORM */}
            {activeModalTab === 'admission' && (
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {settings.admissionsOpen === false ? (
                  <div className="py-8 px-4 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                      <XCircle className="w-9 h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold uppercase">
                        Online Admission Closed (OFF)
                      </span>
                      <h4 className="text-xl font-extrabold text-[#11261d]">
                        Online Admission Form Abhi Band Hai
                      </h4>
                      <p className="text-xs sm:text-sm text-[#61786e] max-w-md mx-auto">
                        The Admin has currently turned <b>OFF</b> new online admission applications for{' '}
                        <b>{settings.madarsaName}</b>. Please contact the Madarsa office or check back when online admissions reopen.
                      </p>
                    </div>
                    <div className="bg-[#f4f7f5] rounded-xl p-4 border border-[#d6e0da] max-w-md mx-auto text-xs text-[#2d4239] space-y-1">
                      <div>
                        <b>Madarsa Helpline:</b> {settings.phone}
                      </div>
                      <div>
                        <b>Email:</b> {settings.email}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFoundApplications(null);
                          setActiveModalTab('status');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
                      >
                        Check Existing Admission Status
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('login')}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-extrabold cursor-pointer"
                      >
                        Go to Portal Login
                      </button>
                    </div>
                  </div>
                ) : submittedApplication ? (
                  <div className="space-y-5 text-center py-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase">
                        Status: Pending Super Admin Approval
                      </span>
                      <h4 className="text-xl font-extrabold text-[#11261d] mt-2">
                        Admission Form Submitted & Account Created!
                      </h4>
                      <p className="text-xs sm:text-sm text-[#61786e] mt-1 max-w-md mx-auto">
                        Your student account has been created with Gmail <b>{submittedApplication.email}</b>. Once the Super Admin approves your application, your admission will be confirmed!
                      </p>
                    </div>

                    <div className="bg-[#f4f7f5] rounded-2xl p-4 border border-[#d6e0da] max-w-md mx-auto text-left space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#61786e]">Student / Application ID:</span>
                        <b className="font-mono text-sm text-[#144734]">{submittedApplication.studentId}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#61786e]">Admission Number:</span>
                        <b className="font-mono">{submittedApplication.admissionNo}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#61786e]">Student Name:</span>
                        <b>{submittedApplication.studentName}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#61786e]">Gmail Account:</span>
                        <b className="font-mono">{submittedApplication.email}</b>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#61786e]">Class Applied:</span>
                        <b>{submittedApplication.classApplied}</b>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setStatusSearchInput(submittedApplication.studentId);
                          setFoundApplications([submittedApplication]);
                          setActiveModalTab('status');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
                      >
                        Track My Admission Status
                      </button>
                      <button
                        onClick={() => {
                          setLoginIdentifier(submittedApplication.email);
                          setLoginPassword(submittedApplication.password || '');
                          setActiveModalTab('login');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-extrabold cursor-pointer"
                      >
                        Login with My Gmail Account
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAdmissionSubmit} className="space-y-4">
                    <div>
                      <h4 className="text-lg font-extrabold text-[#11261d]">
                        Online Student Admission Form ({settings.academicYear})
                      </h4>
                      <p className="text-xs text-[#61786e]">
                        Fill in all student details below. Your Gmail will also create your Student Portal Account and generate your unique Student ID.
                      </p>
                    </div>

                    {admFormError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                        {admFormError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Student Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={admForm.studentName}
                          onChange={(e) => setAdmForm({ ...admForm, studentName: e.target.value })}
                          placeholder="Enter student's full name"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Student Gmail Address (Creates Account) *
                        </label>
                        <input
                          type="email"
                          required
                          value={admForm.email}
                          onChange={(e) => setAdmForm({ ...admForm, email: e.target.value })}
                          placeholder="example@gmail.com"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-[#144734]" /> Create Account Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={admForm.password}
                          onChange={(e) => setAdmForm({ ...admForm, password: e.target.value })}
                          placeholder="Set login password"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Father's / Guardian's Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={admForm.fatherName}
                          onChange={(e) => setAdmForm({ ...admForm, fatherName: e.target.value })}
                          placeholder="Father's full name"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">Mother's Name</label>
                        <input
                          type="text"
                          value={admForm.motherName}
                          onChange={(e) => setAdmForm({ ...admForm, motherName: e.target.value })}
                          placeholder="Mother's full name"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Phone / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={admForm.phone}
                          onChange={(e) => setAdmForm({ ...admForm, phone: e.target.value })}
                          placeholder="10-digit mobile number"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={admForm.dob}
                          onChange={(e) => setAdmForm({ ...admForm, dob: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">Gender *</label>
                        <select
                          value={admForm.gender}
                          onChange={(e) =>
                            setAdmForm({ ...admForm, gender: e.target.value as 'Male' | 'Female' })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Class Applying For *
                        </label>
                        <select
                          value={admForm.classApplied}
                          onChange={(e) => setAdmForm({ ...admForm, classApplied: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] bg-white font-semibold"
                        >
                          <option value="Class 1">Class 1</option>
                          <option value="Class 2">Class 2</option>
                          <option value="Class 3">Class 3</option>
                          <option value="Class 4">Class 4</option>
                          <option value="Class 5">Class 5</option>
                          <option value="Hifz-ul-Quran">Hifz-ul-Quran</option>
                          <option value="Alimiyat">Alimiyat</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Previous School / Madarsa
                        </label>
                        <input
                          type="text"
                          value={admForm.previousSchool}
                          onChange={(e) =>
                            setAdmForm({ ...admForm, previousSchool: e.target.value })
                          }
                          placeholder="Previous institution (if any)"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Aadhaar / ID Number
                        </label>
                        <input
                          type="text"
                          value={admForm.aadhaarNo}
                          onChange={(e) => setAdmForm({ ...admForm, aadhaarNo: e.target.value })}
                          placeholder="XXXX-XXXX-XXXX"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Full Residential Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={admForm.address}
                          onChange={(e) => setAdmForm({ ...admForm, address: e.target.value })}
                          placeholder="Village/Town, Post, District, State"
                          className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-[#2d4239] mb-1">
                          Student Passport Size Photo (Automatically Saved on ImgBB)
                        </label>
                        <div className="flex items-center gap-3">
                          {admForm.photoUrl && (
                            <img
                              src={admForm.photoUrl}
                              alt="Student preview"
                              className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-600 flex-shrink-0"
                            />
                          )}
                          <label className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#144734]/40 bg-[#f9fbf9] cursor-pointer hover:bg-emerald-50/40">
                            <Upload className="w-4 h-4 text-[#144734]" />
                            <span className="text-[#52685e] font-medium">
                              {isUploadingAdmPhoto
                                ? 'Uploading photo to ImgBB...'
                                : admForm.photoUrl
                                ? 'Photo Saved on ImgBB ✓ (Click to change)'
                                : 'Upload Student Photo (Saves to ImgBB)'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {admForm.photoUrl && admForm.photoUrl.startsWith('http') && (
                          <p className="text-[11px] text-emerald-700 font-semibold mt-1 truncate">
                            ✓ ImgBB URL: {admForm.photoUrl}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUploadingAdmPhoto}
                      className="w-full py-3 rounded-xl bg-[#144734] hover:bg-[#0f3627] disabled:opacity-60 text-white font-extrabold text-sm shadow-md cursor-pointer"
                    >
                      {isUploadingAdmPhoto
                        ? 'Uploading Photo to ImgBB...'
                        : 'Submit Online Admission Form & Create Student Account'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: CHECK ADMISSION STATUS (Accept / Reject / Reason / Congratulations) */}
            {activeModalTab === 'status' && (
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div>
                  <h4 className="text-lg font-extrabold text-[#11261d]">
                    Check Your Admission Status (Accepted / Rejected / Pending)
                  </h4>
                  <p className="text-xs text-[#61786e]">
                    Enter your <b>Student ID</b> (e.g. <span className="font-mono">MGR-2026-1001</span>), <b>Gmail Address</b>, or <b>Phone Number</b> to check if the Super Admin has approved or rejected your admission.
                  </p>
                </div>

                <form onSubmit={handleStatusSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={statusSearchInput}
                    onChange={(e) => setStatusSearchInput(e.target.value)}
                    placeholder="Enter Student ID, Gmail, Phone, or Name..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d6e0da] text-sm"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#144734] text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                  >
                    Check Status
                  </button>
                </form>

                {foundApplications !== null && (
                  <div className="space-y-4">
                    {foundApplications.length === 0 ? (
                      <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-600">
                        No admission application found matching "{statusSearchInput}". Please check your Student ID, Gmail, or Phone Number.
                      </div>
                    ) : (
                      foundApplications.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-2xl border-2 overflow-hidden shadow-xs"
                          style={{
                            borderColor:
                              app.status === 'Approved'
                                ? '#059669'
                                : app.status === 'Rejected'
                                ? '#dc2626'
                                : '#d97706',
                          }}
                        >
                          {/* Approved Congratulations Header */}
                          {app.status === 'Approved' && (
                            <div className="bg-emerald-600 text-white p-4">
                              <div className="flex items-center gap-2 font-extrabold text-base">
                                <Award className="w-6 h-6 text-amber-300" />
                                🎉 CONGRATULATIONS! ADMISSION ACCEPTED & CONFIRMED!
                              </div>
                              <p className="text-xs text-emerald-50 mt-1">
                                {app.congratulationsNote ||
                                  `Mubarak Ho! Your admission to ${settings.madarsaName} in ${app.classApplied} has been approved by the Super Admin.`}
                              </p>
                            </div>
                          )}

                          {/* Rejected Header with Reason */}
                          {app.status === 'Rejected' && (
                            <div className="bg-red-600 text-white p-4">
                              <div className="flex items-center gap-2 font-extrabold text-base">
                                <XCircle className="w-6 h-6 text-white" />
                                ADMISSION APPLICATION REJECTED
                              </div>
                              <p className="text-xs text-red-100 mt-1 font-semibold">
                                Reason from Super Admin: "{app.rejectionReason || 'Criteria not met'}"
                              </p>
                            </div>
                          )}

                          {/* Pending Header */}
                          {app.status === 'Pending' && (
                            <div className="bg-amber-500 text-white p-4">
                              <div className="flex items-center gap-2 font-extrabold text-base">
                                <Clock className="w-5 h-5" />
                                APPLICATION PENDING SUPER ADMIN APPROVAL
                              </div>
                              <p className="text-xs text-amber-50 mt-1">
                                Your admission form is currently under review by the Super Admin. Please check back soon.
                              </p>
                            </div>
                          )}

                          <div className="p-4 bg-white grid grid-cols-2 gap-2.5 text-xs">
                            <div>
                              <span className="text-gray-500">Official Student ID:</span>{' '}
                              <b className="font-mono text-[#144734] text-sm">{app.studentId}</b>
                            </div>
                            <div>
                              <span className="text-gray-500">Admission No:</span>{' '}
                              <b className="font-mono">{app.admissionNo}</b>
                            </div>
                            <div>
                              <span className="text-gray-500">Student Name:</span>{' '}
                              <b>{app.studentName}</b>
                            </div>
                            <div>
                              <span className="text-gray-500">Father's Name:</span>{' '}
                              <b>{app.fatherName}</b>
                            </div>
                            <div>
                              <span className="text-gray-500">Class:</span>{' '}
                              <b>{app.classApplied}</b>
                            </div>
                            <div>
                              <span className="text-gray-500">Gmail Account:</span>{' '}
                              <b className="font-mono">{app.email}</b>
                            </div>
                            {app.assignedRollNo && (
                              <div>
                                <span className="text-gray-500">Assigned Roll No:</span>{' '}
                                <b>{app.assignedRollNo}</b>
                              </div>
                            )}
                          </div>

                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                              onClick={() => {
                                setLoginIdentifier(app.email);
                                setActiveModalTab('login');
                              }}
                              className="px-4 py-1.5 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
                            >
                              Login with Student Gmail →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
