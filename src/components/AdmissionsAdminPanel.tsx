import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  UserCheck,
  Award,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  FileText,
  Sparkles,
  Power,
  Lock,
  Unlock,
} from 'lucide-react';
import { AdmissionApplication, PortalState, StudentItem } from '../types/portal';

interface AdmissionsAdminPanelProps {
  state: PortalState;
  currentUserName: string;
  onUpdateState: (updater: (prev: PortalState) => PortalState, logAction?: string, logTarget?: string) => void;
}

export const AdmissionsAdminPanel: React.FC<AdmissionsAdminPanelProps> = ({
  state,
  currentUserName,
  onUpdateState,
}) => {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Approve modal state
  const [approvingApp, setApprovingApp] = useState<AdmissionApplication | null>(null);
  const [approveStudentId, setApproveStudentId] = useState('');
  const [approveAdmNo, setApproveAdmNo] = useState('');
  const [approveRollNo, setApproveRollNo] = useState('01');
  const [congratsNote, setCongratsNote] = useState('');

  // Reject modal state
  const [rejectingApp, setRejectingApp] = useState<AdmissionApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Edit application modal
  const [editingApp, setEditingApp] = useState<AdmissionApplication | null>(null);

  const admissions = state.admissions || [];
  const totalCount = admissions.length;
  const pendingCount = admissions.filter((a) => a.status === 'Pending').length;
  const approvedCount = admissions.filter((a) => a.status === 'Approved').length;
  const rejectedCount = admissions.filter((a) => a.status === 'Rejected').length;

  const filtered = admissions.filter((a) => {
    if (filterStatus !== 'All' && a.status !== filterStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.studentName.toLowerCase().includes(q) ||
      a.studentId.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.classApplied.toLowerCase().includes(q) ||
      a.fatherName.toLowerCase().includes(q)
    );
  });

  const openApproveModal = (app: AdmissionApplication) => {
    setApprovingApp(app);
    setApproveStudentId(app.studentId || `MGR-2026-${1000 + admissions.length + 1}`);
    setApproveAdmNo(app.admissionNo || `ADM-2026-${100 + admissions.length + 1}`);
    setApproveRollNo(app.assignedRollNo || String(state.students.length + 1).padStart(2, '0'));
    setCongratsNote(
      app.congratulationsNote ||
        `Congratulations! Mubarak Ho! Your admission to ${state.madarsaSettings.madarsaName} in ${app.classApplied} has been officially APPROVED by the Super Admin. Your permanent Student ID is ${app.studentId}.`
    );
  };

  const confirmApprove = () => {
    if (!approvingApp) return;
    const finalStudentId = approveStudentId.trim() || approvingApp.studentId;
    const finalAdmNo = approveAdmNo.trim() || approvingApp.admissionNo;
    const finalRoll = approveRollNo.trim() || '01';
    const finalCongrats =
      congratsNote.trim() ||
      `Congratulations! Mubarak Ho! Your admission in ${approvingApp.classApplied} is confirmed. Student ID: ${finalStudentId}`;

    onUpdateState(
      (prev) => {
        const updatedAdmissions = prev.admissions.map((item) =>
          item.id === approvingApp.id
            ? {
                ...item,
                studentId: finalStudentId,
                admissionNo: finalAdmNo,
                assignedRollNo: finalRoll,
                status: 'Approved' as const,
                congratulationsNote: finalCongrats,
                rejectionReason: undefined,
                reviewedBy: currentUserName,
                reviewedAt: new Date().toLocaleDateString('en-GB'),
              }
            : item
        );

        // Add or update in students registry
        const existingStuIdx = prev.students.findIndex(
          (s) =>
            s.studentId.toLowerCase() === finalStudentId.toLowerCase() ||
            (s.email && s.email.toLowerCase() === approvingApp.email.toLowerCase())
        );

        const newStudentRecord: StudentItem = {
          id: existingStuIdx >= 0 ? prev.students[existingStuIdx].id : `stu-${Date.now()}`,
          studentId: finalStudentId,
          admissionNo: finalAdmNo,
          rollNo: finalRoll,
          name: approvingApp.studentName,
          email: approvingApp.email,
          fatherName: approvingApp.fatherName,
          motherName: approvingApp.motherName,
          className: approvingApp.classApplied,
          gender: approvingApp.gender,
          dob: approvingApp.dob,
          phone: approvingApp.phone,
          address: approvingApp.address,
          photoUrl: approvingApp.photoUrl,
          feeStatus: 'Paid',
          status: 'Active',
        };

        const updatedStudents =
          existingStuIdx >= 0
            ? prev.students.map((s, idx) => (idx === existingStuIdx ? newStudentRecord : s))
            : [newStudentRecord, ...prev.students];

        // Update or create Student Gmail Account in allUsers
        const existingUserIdx = prev.allUsers.findIndex(
          (u) => u.email.toLowerCase() === approvingApp.email.toLowerCase()
        );

        const updatedUsers =
          existingUserIdx >= 0
            ? prev.allUsers.map((u, idx) =>
                idx === existingUserIdx
                  ? {
                      ...u,
                      studentId: finalStudentId,
                      name: approvingApp.studentName,
                      phone: approvingApp.phone,
                      address: approvingApp.address,
                      admissionStatus: 'Approved' as const,
                    }
                  : u
              )
            : [
                {
                  id: `usr-${Date.now()}`,
                  studentId: finalStudentId,
                  name: approvingApp.studentName,
                  email: approvingApp.email,
                  phone: approvingApp.phone,
                  address: approvingApp.address,
                  username: finalStudentId,
                  password: approvingApp.password || 'student123',
                  role: 'Student' as const,
                  joinedDate: new Date().toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                  admissionStatus: 'Approved' as const,
                },
                ...prev.allUsers,
              ];

        return {
          ...prev,
          admissions: updatedAdmissions,
          students: updatedStudents,
          allUsers: updatedUsers,
        };
      },
      'Approved Online Admission',
      `${approvingApp.studentName} (${finalStudentId}) — ${approvingApp.classApplied}`
    );

    setApprovingApp(null);
  };

  const openRejectModal = (app: AdmissionApplication) => {
    setRejectingApp(app);
    setRejectionReason(app.rejectionReason || '');
  };

  const confirmReject = () => {
    if (!rejectingApp) return;
    if (!rejectionReason.trim()) return;

    onUpdateState(
      (prev) => {
        const updatedAdmissions = prev.admissions.map((item) =>
          item.id === rejectingApp.id
            ? {
                ...item,
                status: 'Rejected' as const,
                rejectionReason: rejectionReason.trim(),
                congratulationsNote: undefined,
                reviewedBy: currentUserName,
                reviewedAt: new Date().toLocaleDateString('en-GB'),
              }
            : item
        );

        const updatedUsers = prev.allUsers.map((u) =>
          u.email.toLowerCase() === rejectingApp.email.toLowerCase()
            ? { ...u, admissionStatus: 'Rejected' as const }
            : u
        );

        return {
          ...prev,
          admissions: updatedAdmissions,
          allUsers: updatedUsers,
        };
      },
      'Rejected Online Admission',
      `${rejectingApp.studentName} (${rejectingApp.studentId}) — Reason: ${rejectionReason.trim()}`
    );

    setRejectingApp(null);
    setRejectionReason('');
  };

  const handleDeleteApplication = (app: AdmissionApplication) => {
    onUpdateState(
      (prev) => ({
        ...prev,
        admissions: prev.admissions.filter((a) => a.id !== app.id),
      }),
      'Deleted Admission Application',
      `${app.studentName} (${app.studentId})`
    );
  };

  const handleSaveEditedApp = () => {
    if (!editingApp) return;
    onUpdateState(
      (prev) => ({
        ...prev,
        admissions: prev.admissions.map((a) => (a.id === editingApp.id ? editingApp : a)),
      }),
      'Updated Admission Application Details',
      `${editingApp.studentName} (${editingApp.studentId})`
    );
    setEditingApp(null);
  };

  const isAdmissionOpen = state.madarsaSettings?.admissionsOpen !== false;

  const handleSetAdmissionFormStatus = (openState: boolean) => {
    onUpdateState(
      (prev) => ({
        ...prev,
        madarsaSettings: {
          ...prev.madarsaSettings,
          admissionsOpen: openState,
        },
      }),
      openState ? 'Turned ON Online Admission Form' : 'Turned OFF Online Admission Form',
      openState
        ? 'Online Admission Form is now OPEN (ON) for new students'
        : 'Online Admission Form is now CLOSED (OFF) on public website'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header + Top ON / OFF Button for Online Admission Form */}
      <div className="bg-white rounded-2xl border-2 border-[#dee6e1] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#11261d] flex items-center gap-2.5">
                <UserCheck className="w-6 h-6 text-[#144734]" />
                Online Admissions Management
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 ${
                  isAdmissionOpen
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAdmissionOpen ? 'bg-emerald-600 animate-pulse' : 'bg-red-600'
                  }`}
                />
                {isAdmissionOpen ? 'ADMISSION FORM: ON (OPEN)' : 'ADMISSION FORM: OFF (CLOSED)'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#61786e] mt-1">
              {isAdmissionOpen
                ? 'Online Admission Form abhi ON (Chalu) hai — Students website par naya admission form bhar sakte hain.'
                : 'Online Admission Form abhi OFF (Band) hai — Website par naya admission form bharna band kar diya gaya hai.'}
            </p>
          </div>

          {/* Dedicated ON / OFF Switch & Action Buttons at the Top */}
          <div className="flex flex-wrap items-center gap-2.5 bg-[#f4f7f5] p-2 rounded-xl border border-[#d6e0da] self-start lg:self-auto">
            <span className="text-xs font-extrabold text-[#11261d] px-2 flex items-center gap-1.5">
              <Power className={`w-4 h-4 ${isAdmissionOpen ? 'text-emerald-600' : 'text-red-600'}`} />
              Admission Form:
            </span>

            <button
              type="button"
              onClick={() => handleSetAdmissionFormStatus(true)}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAdmissionOpen
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-white text-[#4b6358] hover:bg-emerald-50 border border-[#d6e0da]'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              ON (Open)
            </button>

            <button
              type="button"
              onClick={() => handleSetAdmissionFormStatus(false)}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isAdmissionOpen
                  ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
                  : 'bg-white text-[#4b6358] hover:bg-red-50 border border-[#d6e0da]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              OFF (Close)
            </button>
          </div>
        </div>
      </div>

      {/* Summary Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#dee6e1] p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-[#61786e]">Total Applications</div>
          <div className="text-2xl font-extrabold text-[#11261d] mt-1">{totalCount}</div>
        </div>
        <div className="bg-amber-50/80 rounded-xl border border-amber-300 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-emerald-50/80 rounded-xl border border-emerald-300 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved & Confirmed
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{approvedCount}</div>
        </div>
        <div className="bg-red-50/80 rounded-xl border border-red-300 p-4 shadow-xs">
          <div className="text-xs font-bold uppercase text-red-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </div>
          <div className="text-2xl font-extrabold text-red-900 mt-1">{rejectedCount}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-[#dee6e1] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterStatus === tab
                  ? 'bg-[#144734] text-white'
                  : 'bg-[#f4f7f5] text-[#4b6358] hover:bg-[#e6ece8]'
              }`}
            >
              {tab} (
              {tab === 'All'
                ? totalCount
                : tab === 'Pending'
                ? pendingCount
                : tab === 'Approved'
                ? approvedCount
                : rejectedCount}
              )
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#7c9086] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Student Name, ID, Gmail, Phone..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#d6e0da] bg-[#f9fbf9] focus:outline-none focus:border-[#144734]"
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filtered.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-2xl border border-[#dee6e1] shadow-xs overflow-hidden"
          >
            <div className="p-5 flex flex-col lg:flex-row items-start justify-between gap-5">
              {/* Left Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-16 h-16 rounded-xl bg-[#144734]/10 border border-[#144734]/20 flex items-center justify-center flex-shrink-0 overflow-hidden font-extrabold text-xl text-[#144734]">
                  {app.photoUrl ? (
                    <img src={app.photoUrl} alt={app.studentName} className="w-full h-full object-cover" />
                  ) : (
                    app.studentName.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg font-extrabold text-[#11261d]">{app.studentName}</h3>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#144734]/10 text-[#144734] font-mono text-xs font-extrabold">
                      ID: {app.studentId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                      Applying for: {app.classApplied}
                    </span>
                    {app.status === 'Pending' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-extrabold">
                        Pending Approval
                      </span>
                    )}
                    {app.status === 'Approved' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold">
                        ✓ Approved & Confirmed
                      </span>
                    )}
                    {app.status === 'Rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-extrabold">
                        ✕ Rejected
                      </span>
                    )}
                  </div>

                  {/* Full Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-xs text-[#3b5249] pt-1">
                    <div>
                      <b className="text-[#11261d]">Father's Name:</b> {app.fatherName}
                    </div>
                    <div>
                      <b className="text-[#11261d]">Mother's Name:</b> {app.motherName || '—'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#144734]" />
                      <b className="text-[#11261d]">Gmail Account:</b>{' '}
                      <span className="font-mono font-semibold text-emerald-800">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#144734]" />
                      <b className="text-[#11261d]">Phone:</b> {app.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#144734]" />
                      <b className="text-[#11261d]">DOB / Gender:</b> {app.dob} ({app.gender})
                    </div>
                    <div>
                      <b className="text-[#11261d]">Aadhaar / ID No:</b> {app.aadhaarNo || '—'}
                    </div>
                    <div>
                      <b className="text-[#11261d]">Previous School:</b> {app.previousSchool || '—'}
                    </div>
                    <div>
                      <b className="text-[#11261d]">Admission No:</b> {app.admissionNo}
                    </div>
                    <div>
                      <b className="text-[#11261d]">Applied Date:</b> {app.appliedDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#3b5249]">
                    <MapPin className="w-3.5 h-3.5 text-[#144734] flex-shrink-0" />
                    <b className="text-[#11261d]">Full Address:</b> {app.address}
                  </div>

                  {app.status === 'Approved' && app.congratulationsNote && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <b className="flex items-center gap-1 text-emerald-800">
                        <Award className="w-3.5 h-3.5" /> Congratulations Message Sent to Student:
                      </b>
                      <p className="mt-0.5">{app.congratulationsNote}</p>
                    </div>
                  )}

                  {app.status === 'Rejected' && app.rejectionReason && (
                    <div className="mt-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                      <b className="flex items-center gap-1 text-red-800">
                        <AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason Shown to Student:
                      </b>
                      <p className="mt-0.5">{app.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex flex-wrap lg:flex-col items-stretch gap-2 w-full lg:w-48 flex-shrink-0">
                <button
                  onClick={() => openApproveModal(app)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {app.status === 'Approved' ? 'Update Approval' : 'Approve & Congratulate'}
                </button>

                <button
                  onClick={() => openRejectModal(app)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  {app.status === 'Rejected' ? 'Update Rejection Reason' : 'Reject with Reason'}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingApp({ ...app })}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#d6e0da] hover:bg-[#f4f7f5] text-xs font-semibold text-[#2d4239] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteApplication(app)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 flex items-center justify-center gap-1 cursor-pointer"
                    title="Delete Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#dee6e1] p-10 text-center text-[#61786e] text-sm">
            No admission applications match the current filter.
          </div>
        )}
      </div>

      {/* APPROVE & CONGRATULATE MODAL */}
      {approvingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#dee6e1] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-800">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-extrabold">Approve Admission & Send Congratulations</h3>
            </div>
            <p className="text-xs text-[#61786e]">
              Approving <b>{approvingApp.studentName}</b> ({approvingApp.email}) will confirm their admission, assign their permanent Student ID, and add them to the active Students list.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2d4239] mb-1">Student ID *</label>
                <input
                  type="text"
                  value={approveStudentId}
                  onChange={(e) => setApproveStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2d4239] mb-1">Admission No *</label>
                <input
                  type="text"
                  value={approveAdmNo}
                  onChange={(e) => setApproveAdmNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2d4239] mb-1">Assigned Roll No *</label>
                <input
                  type="text"
                  value={approveRollNo}
                  onChange={(e) => setApproveRollNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#d6e0da]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2d4239] mb-1">
                Congratulations Message (Shown to Student on Check Status & Profile) *
              </label>
              <textarea
                rows={3}
                value={congratsNote}
                onChange={(e) => setCongratsNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d6e0da]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovingApp(null)}
                className="px-4 py-2 rounded-lg border border-[#d6e0da] text-xs font-bold text-[#4b6358] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Confirm Approval & Send Congratulations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT WITH REASON MODAL */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#dee6e1] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-700">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold">Reject Admission & Specify Reason</h3>
            </div>
            <p className="text-xs text-[#61786e]">
              Please specify the reason for rejecting <b>{rejectingApp.studentName}</b>'s admission application. The student will see this exact reason when checking their admission status.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#2d4239] mb-1">
                Reason for Rejection (Required) *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Incomplete birth certificate / Age criteria not met for Class 4 / Seats full..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#d6e0da]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 rounded-lg border border-[#d6e0da] text-xs font-bold text-[#4b6358] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-extrabold cursor-pointer"
              >
                Confirm Rejection & Save Reason
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION MODAL */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#dee6e1] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-[#11261d] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#144734]" /> Edit Admission Application
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Student Name</label>
                <input
                  value={editingApp.studentName}
                  onChange={(e) => setEditingApp({ ...editingApp, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Student ID</label>
                <input
                  value={editingApp.studentId}
                  onChange={(e) => setEditingApp({ ...editingApp, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da] font-mono"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Father's Name</label>
                <input
                  value={editingApp.fatherName}
                  onChange={(e) => setEditingApp({ ...editingApp, fatherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Mother's Name</label>
                <input
                  value={editingApp.motherName}
                  onChange={(e) => setEditingApp({ ...editingApp, motherName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Gmail Address</label>
                <input
                  value={editingApp.email}
                  onChange={(e) => setEditingApp({ ...editingApp, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Phone Number</label>
                <input
                  value={editingApp.phone}
                  onChange={(e) => setEditingApp({ ...editingApp, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Class Applied</label>
                <input
                  value={editingApp.classApplied}
                  onChange={(e) => setEditingApp({ ...editingApp, classApplied: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editingApp.dob}
                  onChange={(e) => setEditingApp({ ...editingApp, dob: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">Full Address</label>
                <input
                  value={editingApp.address}
                  onChange={(e) => setEditingApp({ ...editingApp, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d6e0da]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 rounded-lg border border-[#d6e0da] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedApp}
                className="px-5 py-2 rounded-lg bg-[#144734] text-white text-xs font-extrabold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
