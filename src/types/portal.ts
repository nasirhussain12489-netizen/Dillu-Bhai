export type RoleType = 'Super Admin' | 'Admin' | 'Teacher' | 'Student' | 'Parent';

export interface UserAccount {
  id: string;
  studentId?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  username?: string;
  password?: string;
  photoUrl?: string;
  role: RoleType;
  joinedDate: string;
  admissionStatus?: 'Pending' | 'Approved' | 'Rejected';
}

export interface AdminAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface ActivityLog {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  targetInfo: string;
  timestamp: string;
}

export interface AdmissionApplication {
  id: string;
  studentId: string;
  admissionNo: string;
  studentName: string;
  email: string;
  password?: string;
  fatherName: string;
  motherName: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female';
  classApplied: string;
  previousSchool: string;
  aadhaarNo: string;
  address: string;
  photoUrl?: string;
  appliedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  congratulationsNote?: string;
  assignedRollNo?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface StudentItem {
  id: string;
  studentId: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  email?: string;
  fatherName: string;
  motherName?: string;
  className: string;
  gender: 'Male' | 'Female';
  dob: string;
  phone: string;
  address: string;
  photoUrl?: string;
  feeStatus: 'Paid' | 'Pending' | 'Scholarship';
  status: 'Active' | 'Inactive';
}

export interface TeacherItem {
  id: string;
  name: string;
  qualification: string;
  subject: string;
  phone: string;
  email: string;
  salary: string;
  joiningDate: string;
  status: 'Active' | 'On Leave';
}

export interface ParentItem {
  id: string;
  name: string;
  studentName: string;
  studentClass: string;
  phone: string;
  occupation: string;
  address: string;
}

export interface ClassItem {
  id: string;
  className: string;
  section: string;
  classTeacher: string;
  roomNo: string;
  studentCount: number;
  timing: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  subjectName: string;
  className: string;
  teacherName: string;
  bookName: string;
  type: 'Islamic / Deeni' | 'Modern / Academic';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  className: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface ExamItem {
  id: string;
  examName: string;
  className: string;
  subject: string;
  examDate: string;
  startTime: string;
  totalMarks: number;
  passingMarks: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface GradeCardSubjectScore {
  name: string;
  score: number;
  max: number;
}

export interface ResultItem {
  id: string;
  resultCode: string;
  title: string;
  studentId: string;
  studentEmail?: string;
  studentName: string;
  rollNo: string;
  admissionNo: string;
  division: string;
  className: string;
  examName: string;
  examType: string;
  academicYear: string;
  issuedDate: string;
  photoUrl?: string;
  subjects: GradeCardSubjectScore[];
  quranNazra: number;
  urduAdab: number;
  arabicGrammar: number;
  islamicFiqh: number;
  modernMathEng: number;
  totalObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  remarks: string;
  fileUrl?: string;
  isPublished: boolean;
}

export interface HomeworkItem {
  id: string;
  title: string;
  className: string;
  subject: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  attachmentUrl?: string;
}

export interface OnlineClassItem {
  id: string;
  topic: string;
  className: string;
  subject: string;
  teacherName: string;
  scheduleTime: string;
  meetingLink: string;
  status: 'Live Now' | 'Scheduled' | 'Recorded';
}

export interface NoticeItem {
  id: string;
  title: string;
  category: 'General' | 'Exam' | 'Holiday' | 'Admission' | 'Committee';
  date: string;
  content: string;
  isPublic: boolean;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  title?: string;
  content: string;
  imageUrl?: string;
  attachmentUrl?: string;
  likes: number;
}

export type ChatRoomType = 'ai' | 'all-students' | 'class' | 'custom-group' | 'direct';

export interface ChatRoom {
  id: string;
  name: string;
  type: ChatRoomType;
  description?: string;
  className?: string;
  participantIds: string[]; // 'ALL' or list of studentIds / emails
  createdBy: string;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isAiResponse?: boolean;
  imageUrl?: string;
  sources?: Array<{ uri: string; title: string }>;
  places?: Array<{ uri: string; title: string; reviewSnippets?: string[] }>;
}

export interface CommitteeMember {
  id: string;
  name: string;
  designation: string;
  phone: string;
  city: string;
  since: string;
}

export interface PublicStatBox {
  id: string;
  label: string;
  value: string;
}

export interface PublicProgramCard {
  id: string;
  num: number;
  title: string;
  desc: string;
}

export interface PublicFeatureCard {
  id: string;
  title: string;
  desc: string;
}

export interface MadarsaSettings {
  logoUrl?: string;
  madarsaName: string;
  shortSubtitle: string;
  bismillahText: string;
  tagline: string;
  heroSubtitle: string;
  aboutHeading: string;
  aboutDescription: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  academicYear: string;
  principalName: string;
  admissionsOpen: boolean;
  admissionBannerText: string;
  statsBoxes: PublicStatBox[];
  programs: PublicProgramCard[];
  features: PublicFeatureCard[];
}

export interface PortalState {
  madarsaSettings: MadarsaSettings;
  admissions: AdmissionApplication[];
  allUsers: UserAccount[];
  admins: AdminAccount[];
  logs: ActivityLog[];
  committee: CommitteeMember[];
  students: StudentItem[];
  teachers: TeacherItem[];
  parents: ParentItem[];
  classes: ClassItem[];
  subjects: SubjectItem[];
  attendance: AttendanceRecord[];
  exams: ExamItem[];
  results: ResultItem[];
  homework: HomeworkItem[];
  onlineClasses: OnlineClassItem[];
  notices: NoticeItem[];
  feed: FeedPost[];
  chatRooms?: ChatRoom[];
  chatMessages?: ChatMessageItem[];
}

export const SUPER_ADMIN_EMAILS = [
  'nasirhussain12489@gmail.com',
  'gausiyamadarsa92@gmail.com',
];

export const INITIAL_PORTAL_STATE: PortalState = {
  madarsaSettings: {
    madarsaName: 'Madarsa Gausiya Razviya Islamnagar',
    shortSubtitle: 'Islamnagar',
    bismillahText: 'بِسْمِ ٱللّٰهِ ٱلرَّحْمٰنِ ٱلرَّحِيمِ',
    tagline: 'Ilm • Akhlaq • Taleem • Mustaqbil',
    heroSubtitle: 'Islamnagar, Horanda Alias Ramgarh, Kerala, India',
    aboutHeading: 'Nurturing Knowledge & Faith',
    aboutDescription:
      'Madarsa Gausiya Razviya, located in Islamnagar, Horanda Alias Ramgarh, Kerala, is dedicated to providing quality Islamic and modern education. We nurture students from Class 1 to 5 with a balanced curriculum that builds both Deeni knowledge and worldly understanding, shaping young minds for a bright future.',
    address: 'Islamnagar, Horanda Alias Ramgarh, Kerala, India',
    phone: '+91 9523608819',
    email: 'gausiyamadarsa92@gmail.com',
    whatsapp: '+91 9523608819',
    academicYear: '2026-2027',
    principalName: 'Maulana Abdul Qadir Razvi',
    admissionsOpen: true,
    admissionBannerText: 'Online Admissions Open for Academic Session 2026-2027 (Class 1 to 5, Hifz & Alimiyat)',
    statsBoxes: [
      { id: 'st-1', label: 'Classes', value: '1–5' },
      { id: 'st-2', label: 'Education', value: 'Islamic + Modern' },
      { id: 'st-3', label: 'Location', value: 'Kerala, India' },
      { id: 'st-4', label: 'Focus', value: 'Holistic Growth' },
    ],
    programs: [
      { id: 'pr-1', num: 1, title: 'Class 1', desc: 'Foundation of Islamic knowledge and basic education' },
      { id: 'pr-2', num: 2, title: 'Class 2', desc: 'Building upon foundational learning with deeper understanding' },
      { id: 'pr-3', num: 3, title: 'Class 3', desc: 'Intermediate Islamic studies and academic excellence' },
      { id: 'pr-4', num: 4, title: 'Class 4', desc: 'Advanced studies blending tradition with modern education' },
      { id: 'pr-5', num: 5, title: 'Class 5', desc: 'Senior level preparing students for the future' },
    ],
    features: [
      { id: 'ft-1', title: 'Islamic Education', desc: 'Comprehensive Deeni Taleem rooted in authentic traditions' },
      { id: 'ft-2', title: 'Modern Curriculum', desc: 'Balanced education integrating worldly knowledge' },
      { id: 'ft-3', title: 'Qualified Teachers', desc: 'Experienced and dedicated Asatiza and faculty' },
      { id: 'ft-4', title: 'Character Building', desc: 'Focus on Akhlaq, discipline and moral values' },
      { id: 'ft-5', title: 'Holistic Development', desc: 'Nurturing mind, body and spiritual growth' },
      { id: 'ft-6', title: 'Exam Excellence', desc: 'Regular assessments and structured evaluations' },
    ],
  },
  admissions: [
    {
      id: 'adm-101',
      studentId: 'MGR-2026-1001',
      admissionNo: 'ADM-2026-101',
      studentName: 'Mohammad Arshad Raza',
      email: 'arshad.raza@gmail.com',
      password: 'password123',
      fatherName: 'Haji Abdul Karim',
      motherName: 'Amina Khatoon',
      phone: '9876543210',
      dob: '2013-05-14',
      gender: 'Male',
      classApplied: 'Class 4',
      previousSchool: 'Islamia Maktab Primary',
      aadhaarNo: '4589-2310-8841',
      address: 'Islamnagar, Horanda Alias Ramgarh',
      appliedDate: '2026-10-08',
      status: 'Approved',
      congratulationsNote:
        'Congratulations! Mubarak Ho! Your admission to Madarsa Gausiya Razviya Islamnagar in Class 4 is officially confirmed. Your Student ID is MGR-2026-1001.',
      assignedRollNo: '01',
      reviewedBy: 'Super Admin',
      reviewedAt: '2026-10-09',
    },
    {
      id: 'adm-102',
      studentId: 'MGR-2026-1002',
      admissionNo: 'ADM-2026-102',
      studentName: 'Md Faizan Qadri',
      email: 'faizan.qadri@gmail.com',
      password: 'password123',
      fatherName: 'Md इलियास Qadri',
      motherName: 'Shabana Begum',
      phone: '9123456780',
      dob: '2014-08-20',
      gender: 'Male',
      classApplied: 'Class 3',
      previousSchool: 'Madarsa Noorul Islam',
      aadhaarNo: '7741-9920-1123',
      address: 'Ward 4, Ramgarh',
      appliedDate: '2026-10-10',
      status: 'Pending',
    },
  ],
  allUsers: [
    {
      id: 'usr-super-1',
      name: 'Nasir Hussain',
      email: 'nasirhussain12489@gmail.com',
      role: 'Super Admin',
      joinedDate: '10 Oct 2026',
    },
    {
      id: 'usr-super-2',
      name: 'dilshad ansari',
      email: 'gausiyamadarsa92@gmail.com',
      phone: '9523608819',
      role: 'Super Admin',
      joinedDate: '19 Mar 2026',
    },
    {
      id: 'usr-stu-1',
      studentId: 'MGR-2026-1001',
      name: 'Mohammad Arshad Raza',
      email: 'arshad.raza@gmail.com',
      phone: '9876543210',
      address: 'Islamnagar, Horanda Alias Ramgarh',
      username: 'MGR-2026-1001',
      password: 'password123',
      role: 'Student',
      joinedDate: '09 Oct 2026',
      admissionStatus: 'Approved',
    },
    {
      id: 'usr-stu-2',
      studentId: 'MGR-2026-1002',
      name: 'Md Faizan Qadri',
      email: 'faizan.qadri@gmail.com',
      phone: '9123456780',
      address: 'Ward 4, Ramgarh',
      username: 'MGR-2026-1002',
      password: 'password123',
      role: 'Student',
      joinedDate: '10 Oct 2026',
      admissionStatus: 'Pending',
    },
  ],
  admins: [
    {
      id: 'adm-1',
      name: 'Dilshad Ansari',
      phone: '9523608819',
      email: 'gausiyamadarsa92@gmail.com',
      status: 'Active',
    },
  ],
  logs: [
    {
      id: 'log-1',
      action: 'Approved Student Admission',
      actorName: 'Super Admin',
      actorRole: 'Super Admin',
      targetInfo: 'Mohammad Arshad Raza (MGR-2026-1001) — Class 4',
      timestamp: '09 Oct 2026, 04:15 PM',
    },
  ],
  committee: [
    {
      id: 'com-1',
      name: 'Al-Haj Maulana Ghulam Rasool Qadri',
      designation: 'Sadar (President)',
      phone: '9820112233',
      city: 'Islamnagar',
      since: '2015',
    },
    {
      id: 'com-2',
      name: 'Janab Dilshad Ansari Sahab',
      designation: 'Nazim-e-Aala (General Secretary)',
      phone: '9523608819',
      city: 'Islamnagar',
      since: '2018',
    },
  ],
  students: [
    {
      id: 'stu-1',
      studentId: 'MGR-2026-1001',
      admissionNo: 'ADM-2026-101',
      rollNo: '01',
      name: 'Mohammad Arshad Raza',
      email: 'arshad.raza@gmail.com',
      fatherName: 'Haji Abdul Karim',
      motherName: 'Amina Khatoon',
      className: 'Class 4',
      gender: 'Male',
      dob: '2013-05-14',
      phone: '9876543210',
      address: 'Islamnagar, Horanda Alias Ramgarh',
      feeStatus: 'Paid',
      status: 'Active',
    },
    {
      id: 'stu-2',
      studentId: 'MGR-2026-1003',
      admissionNo: 'ADM-2026-103',
      rollNo: '01',
      name: 'Md Danish Barkati',
      email: 'danish.barkati@gmail.com',
      fatherName: 'Md Shabbir Alam',
      motherName: 'Razia Begum',
      className: 'Class 1',
      gender: 'Male',
      dob: '2016-03-11',
      phone: '9812345001',
      address: 'Islamnagar, Ramgarh',
      feeStatus: 'Paid',
      status: 'Active',
    },
    {
      id: 'stu-3',
      studentId: 'MGR-2026-1004',
      admissionNo: 'ADM-2026-104',
      rollNo: '01',
      name: 'Syed Hassan Qadri',
      email: 'hassan.qadri@gmail.com',
      fatherName: 'Syed Irfan Ali',
      motherName: 'Fatima Bibi',
      className: 'Class 2',
      gender: 'Male',
      dob: '2015-07-19',
      phone: '9812345002',
      address: 'Horanda, Ramgarh',
      feeStatus: 'Paid',
      status: 'Active',
    },
    {
      id: 'stu-4',
      studentId: 'MGR-2026-1005',
      admissionNo: 'ADM-2026-105',
      rollNo: '01',
      name: 'Md Salman Razvi',
      email: 'salman.razvi@gmail.com',
      fatherName: 'Md Kalimuddin',
      motherName: 'Zainab Khatoon',
      className: 'Class 3',
      gender: 'Male',
      dob: '2014-09-22',
      phone: '9812345003',
      address: 'Islamnagar, Ramgarh',
      feeStatus: 'Paid',
      status: 'Active',
    },
    {
      id: 'stu-5',
      studentId: 'MGR-2026-1006',
      admissionNo: 'ADM-2026-106',
      rollNo: '01',
      name: 'Md Owais Noorani',
      email: 'owais.noorani@gmail.com',
      fatherName: 'Md Tariq Anwar',
      motherName: 'Salma Begum',
      className: 'Class 5',
      gender: 'Male',
      dob: '2012-11-05',
      phone: '9812345005',
      address: 'Islamnagar, Ramgarh',
      feeStatus: 'Paid',
      status: 'Active',
    },
  ],
  teachers: [
    {
      id: 'tch-1',
      name: 'Maulana Mufti Abdul Qadir Razvi',
      qualification: 'Fazil-e-Dars-e-Nizami & M.A. Arabic',
      subject: 'Fiqh, Hadith & Tafseer',
      phone: '9811223344',
      email: 'abdulqadir@gausiya.edu',
      salary: '₹24,000',
      joiningDate: '2019-06-10',
      status: 'Active',
    },
    {
      id: 'tch-2',
      name: 'Qari Mohammad Salman Barkati',
      qualification: 'Hafiz & Qari ( Saba Qiraat )',
      subject: 'Hifz-ul-Quran & Tajweed',
      phone: '9822334455',
      email: 'salman@gausiya.edu',
      salary: '₹19,500',
      joiningDate: '2020-01-15',
      status: 'Active',
    },
  ],
  parents: [
    {
      id: 'par-1',
      name: 'Haji Abdul Karim',
      studentName: 'Mohammad Arshad Raza',
      studentClass: 'Class 4',
      phone: '9876543210',
      occupation: 'Merchant',
      address: 'Islamnagar, Horanda Alias Ramgarh',
    },
  ],
  classes: [
    { id: 'cls-1', className: 'Class 1', section: 'A', classTeacher: 'Qari Mohammad Salman Barkati', roomNo: 'Room 101', studentCount: 35, timing: '07:30 AM - 01:00 PM' },
    { id: 'cls-2', className: 'Class 2', section: 'A', classTeacher: 'Qari Mohammad Salman Barkati', roomNo: 'Room 102', studentCount: 32, timing: '07:30 AM - 01:00 PM' },
    { id: 'cls-3', className: 'Class 3', section: 'A', classTeacher: 'Maulana Mufti Abdul Qadir Razvi', roomNo: 'Room 103', studentCount: 28, timing: '07:30 AM - 01:00 PM' },
    { id: 'cls-4', className: 'Class 4', section: 'A', classTeacher: 'Maulana Mufti Abdul Qadir Razvi', roomNo: 'Room 104', studentCount: 30, timing: '07:30 AM - 01:00 PM' },
    { id: 'cls-5', className: 'Class 5', section: 'A', classTeacher: 'Maulana Mufti Abdul Qadir Razvi', roomNo: 'Room 105', studentCount: 25, timing: '07:30 AM - 01:00 PM' },
  ],
  subjects: [
    { id: 'sub-1', code: 'SUB-1', subjectName: 'Tajweed & Quran Majeed', className: 'Class 4', teacherName: 'Qari Mohammad Salman Barkati', bookName: 'Muallem-ut-Tajweed', type: 'Islamic / Deeni' },
    { id: 'sub-2', code: 'SUB-2', subjectName: 'Fiqh & Aqaid-e-Ahle Sunnat', className: 'Class 4', teacherName: 'Maulana Mufti Abdul Qadir Razvi', bookName: 'Bahar-e-Shariat', type: 'Islamic / Deeni' },
    { id: 'sub-3', code: 'SUB-3', subjectName: 'Urdu & Arabic Grammar', className: 'Class 4', teacherName: 'Maulana Mufti Abdul Qadir Razvi', bookName: 'Nisab-us-Sarf', type: 'Islamic / Deeni' },
    { id: 'sub-4', code: 'SUB-4', subjectName: 'Mathematics & English', className: 'Class 4', teacherName: 'Master Imran Ahmad Khan', bookName: 'NCERT Class 4', type: 'Modern / Academic' },
  ],
  attendance: [
    { id: 'att-1', date: '2026-10-11', studentId: 'MGR-2026-1001', studentName: 'Mohammad Arshad Raza', rollNo: '01', className: 'Class 4', status: 'Present' },
    { id: 'att-2', date: '2026-10-10', studentId: 'MGR-2026-1001', studentName: 'Mohammad Arshad Raza', rollNo: '01', className: 'Class 4', status: 'Present' },
    { id: 'att-3', date: '2026-10-09', studentId: 'MGR-2026-1001', studentName: 'Mohammad Arshad Raza', rollNo: '01', className: 'Class 4', status: 'Present' },
    { id: 'att-4', date: '2026-10-08', studentId: 'MGR-2026-1001', studentName: 'Mohammad Arshad Raza', rollNo: '01', className: 'Class 4', status: 'Leave' },
    { id: 'att-5', date: '2026-10-11', studentId: 'MGR-2026-1003', studentName: 'Md Danish Barkati', rollNo: '01', className: 'Class 1', status: 'Present' },
    { id: 'att-6', date: '2026-10-10', studentId: 'MGR-2026-1003', studentName: 'Md Danish Barkati', rollNo: '01', className: 'Class 1', status: 'Present' },
    { id: 'att-7', date: '2026-10-09', studentId: 'MGR-2026-1003', studentName: 'Md Danish Barkati', rollNo: '01', className: 'Class 1', status: 'Absent' },
    { id: 'att-8', date: '2026-10-11', studentId: 'MGR-2026-1004', studentName: 'Syed Hassan Qadri', rollNo: '01', className: 'Class 2', status: 'Present' },
    { id: 'att-9', date: '2026-10-10', studentId: 'MGR-2026-1004', studentName: 'Syed Hassan Qadri', rollNo: '01', className: 'Class 2', status: 'Present' },
    { id: 'att-10', date: '2026-10-09', studentId: 'MGR-2026-1004', studentName: 'Syed Hassan Qadri', rollNo: '01', className: 'Class 2', status: 'Present' },
    { id: 'att-11', date: '2026-10-11', studentId: 'MGR-2026-1005', studentName: 'Md Salman Razvi', rollNo: '01', className: 'Class 3', status: 'Present' },
    { id: 'att-12', date: '2026-10-10', studentId: 'MGR-2026-1005', studentName: 'Md Salman Razvi', rollNo: '01', className: 'Class 3', status: 'Absent' },
    { id: 'att-13', date: '2026-10-09', studentId: 'MGR-2026-1005', studentName: 'Md Salman Razvi', rollNo: '01', className: 'Class 3', status: 'Leave' },
    { id: 'att-14', date: '2026-10-11', studentId: 'MGR-2026-1006', studentName: 'Md Owais Noorani', rollNo: '01', className: 'Class 5', status: 'Present' },
    { id: 'att-15', date: '2026-10-10', studentId: 'MGR-2026-1006', studentName: 'Md Owais Noorani', rollNo: '01', className: 'Class 5', status: 'Present' },
  ],
  exams: [
    { id: 'exm-1', examName: 'Shashmahi (Half-Yearly) Examination 2026', className: 'Class 4', subject: 'Fiqh & Tajweed', examDate: '2026-10-25', startTime: '09:00 AM', totalMarks: 100, passingMarks: 40, status: 'Upcoming' },
    { id: 'exm-2', examName: 'Annual Board Assessment', className: 'Class 1 to Class 5', subject: 'All Subjects', examDate: '2026-11-10', startTime: '09:30 AM', totalMarks: 100, passingMarks: 40, status: 'Upcoming' },
  ],
  results: [
    {
      id: 'res-1',
      resultCode: 'RES-MGR-1001',
      title: 'First Terminal Examination 2026 - Grade Card',
      studentId: 'MGR-2026-1001',
      studentEmail: 'arshad.raza@gmail.com',
      studentName: 'Mohammad Arshad Raza',
      rollNo: '01',
      admissionNo: 'ADM-2026-101',
      division: 'A',
      className: 'Class 4',
      examName: 'First Terminal Examination 2026',
      examType: 'First Terminal Exam',
      academicYear: '2026-2027',
      issuedDate: '10/10/2026',
      subjects: [
        { name: 'Quran Nazra & Tajweed', score: 96, max: 100 },
        { name: 'Urdu Adab & Qawaid', score: 88, max: 100 },
        { name: 'Arabic Grammar (Nahw & Sarf)', score: 91, max: 100 },
        { name: 'Islamic Fiqh & Seerat', score: 94, max: 100 },
        { name: 'Modern Math & English', score: 89, max: 100 },
      ],
      quranNazra: 96,
      urduAdab: 88,
      arabicGrammar: 91,
      islamicFiqh: 94,
      modernMathEng: 89,
      totalObtained: 458,
      maxMarks: 500,
      percentage: 91.6,
      grade: 'A+',
      remarks: 'MashaAllah! Outstanding academic and Deeni performance.',
      isPublished: true,
    },
  ],
  homework: [
    {
      id: 'hw-1',
      title: 'Memorize Surah Al-Mulk Verses 1-15 with Tajweed Rules',
      className: 'Class 4',
      subject: 'Tajweed & Quran Majeed',
      teacherName: 'Qari Mohammad Salman Barkati',
      assignedDate: '2026-10-10',
      dueDate: '2026-10-13',
      description: 'Recite with proper Makharij and Madd rules.',
    },
  ],
  onlineClasses: [
    {
      id: 'oc-1',
      topic: 'Live Dars-e-Hadith & Tajweed Session',
      className: 'Class 4',
      subject: 'Fiqh & Tajweed',
      teacherName: 'Maulana Mufti Abdul Qadir Razvi',
      scheduleTime: 'Daily 08:00 PM IST',
      meetingLink: 'https://meet.google.com/gausiya-dars-live',
      status: 'Live Now',
    },
  ],
  notices: [
    {
      id: 'not-1',
      title: 'New Online Admissions Open for Session 2026-27',
      category: 'Admission',
      date: '10 Oct 2026',
      content: 'Online admission forms are now live on the Madarsa Gausiya Razviya portal. Students can apply online with their Gmail and track Super Admin approval status.',
      isPublic: true,
    },
    {
      id: 'not-2',
      title: 'Shashmahi (Half-Yearly) Examination Schedule Announced',
      category: 'Exam',
      date: '09 Oct 2026',
      content: 'Half-yearly examinations for Classes 1 to 5 will begin from 25th October 2026.',
      isPublic: true,
    },
  ],
  feed: [
    {
      id: 'fd-1',
      authorName: 'Dilshad Ansari',
      authorRole: 'Super Admin',
      createdAt: '10 Oct 2026',
      title: 'Welcome to Madarsa Gausiya Razviya Digital Portal',
      content: 'Alhamdulillah, our online admission system, student ID cards, and digital grade cards are now live for all students and parents.',
      likes: 48,
    },
  ],
  chatRooms: [
    {
      id: 'room-ai-ustaz',
      name: 'Madarsa AI Ustaz (24/7 Smart AI)',
      type: 'ai',
      description: 'Ask any question in Hinglish, Urdu, Hindi, English, or Arabic — Deeni, Academic, Math, Science, or General!',
      participantIds: ['ALL'],
      createdBy: 'System',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-all-students',
      name: 'All Madarsa Students & Teachers Lounge',
      type: 'all-students',
      description: 'Common discussion room for all students, teachers, and Super Admin',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-class-1',
      name: 'Class 1 — Official Group',
      type: 'class',
      className: 'Class 1',
      description: 'Class 1 students and teachers discussion group',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-class-2',
      name: 'Class 2 — Official Group',
      type: 'class',
      className: 'Class 2',
      description: 'Class 2 students and teachers discussion group',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-class-3',
      name: 'Class 3 — Official Group',
      type: 'class',
      className: 'Class 3',
      description: 'Class 3 students and teachers discussion group',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-class-4',
      name: 'Class 4 — Official Group',
      type: 'class',
      className: 'Class 4',
      description: 'Class 4 students and teachers discussion group',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-class-5',
      name: 'Class 5 — Official Group',
      type: 'class',
      className: 'Class 5',
      description: 'Class 5 students and teachers discussion group',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '10 Oct 2026',
    },
    {
      id: 'room-hifz-group',
      name: 'Hifz & Tajweed Study Circle',
      type: 'custom-group',
      description: 'Special group for Quran Nazra, Hifz, and Naat competition preparation',
      participantIds: ['ALL'],
      createdBy: 'Super Admin',
      createdAt: '11 Oct 2026',
    },
  ],
  chatMessages: [
    {
      id: 'msg-ai-welcome',
      roomId: 'room-ai-ustaz',
      senderId: 'AI-USTAZ',
      senderName: 'Madarsa AI Ustaz',
      senderRole: 'AI Assistant',
      text: 'Assalamu Alaikum Wa Rahmatullahi Wa Barakatuh! Main Madarsa Gausiya Razviya ka Advanced AI Assistant hoon. Aap mujhse Deeni taleem (Quran, Tajweed, Fiqh, Hadith, Seerat), Duniyaawi subjects (Math, Science, English, GK, Coding), Homework, Exam preparation, ya koi bhi sawal puch sakte hain!',
      timestamp: '10:00 AM',
      isAiResponse: true,
    },
    {
      id: 'msg-all-1',
      roomId: 'room-all-students',
      senderId: 'usr-super-2',
      senderName: 'Dilshad Ansari',
      senderRole: 'Super Admin',
      text: 'Assalamu Alaikum pyare talaba! Is chat hub mein aap sabhi students ek saath baat kar sakte hain, apne Class Group mein padhai discuss kar sakte hain, aur kisi bhi student se alag-alag (1-on-1) bhi baat kar sakte hain.',
      timestamp: '10:15 AM',
    },
    {
      id: 'msg-cls4-1',
      roomId: 'room-class-4',
      senderId: 'MGR-2026-1001',
      senderName: 'Mohammad Arshad Raza',
      senderRole: 'Student',
      text: 'Assalamu Alaikum Class 4 ke dosto! Kal Tajweed class mein Surah Al-Mulk ki tilawat hogi.',
      timestamp: '11:20 AM',
    },
  ],
};
