import React from 'react';
import { Printer, Award, ShieldCheck, Mail, Phone, MapPin, Calendar, Hash, User } from 'lucide-react';
import { MadarsaSettings, ResultItem, StudentItem, AdmissionApplication } from '../types/portal';
import { MadarsaLogo } from './MadarsaLogo';

function calcGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function calcGpa(pct: number): number {
  if (pct >= 90) return 5.0;
  if (pct >= 80) return 4.5;
  if (pct >= 70) return 4.0;
  if (pct >= 60) return 3.5;
  if (pct >= 50) return 3.0;
  if (pct >= 40) return 2.0;
  return 0.0;
}

function calcPerformance(pct: number): string {
  if (pct >= 85) return 'Outstanding';
  if (pct >= 70) return 'Excellent';
  if (pct >= 55) return 'Very Good';
  if (pct >= 40) return 'Satisfactory';
  return 'Needs Improvement';
}

export const OfficialGradeCard: React.FC<{
  result: ResultItem;
  settings: MadarsaSettings;
}> = ({ result, settings }) => {
  const subjects =
    result.subjects && result.subjects.length > 0
      ? result.subjects
      : [
          { name: 'Quran Nazra & Tajweed', score: result.quranNazra, max: 100 },
          { name: 'Urdu Adab & Qawaid', score: result.urduAdab, max: 100 },
          { name: 'Arabic Grammar (Nahw & Sarf)', score: result.arabicGrammar, max: 100 },
          { name: 'Islamic Fiqh & Seerat', score: result.islamicFiqh, max: 100 },
          { name: 'Modern Math & English', score: result.modernMathEng, max: 100 },
        ];

  let totalScored = 0;
  let totalMax = 0;
  let failedCount = 0;
  subjects.forEach((s) => {
    totalScored += Number(s.score) || 0;
    totalMax += Number(s.max) || 100;
    if ((Number(s.score) || 0) < (Number(s.max) || 100) * 0.4) {
      failedCount++;
    }
  });

  const pct = totalMax > 0 ? (totalScored / totalMax) * 100 : 0;
  const overallGrade = calcGrade(pct);
  const gpa = calcGpa(pct);
  const perf = calcPerformance(pct);
  const statusText = failedCount === 0 && pct >= 40 ? 'PASSED / PROMOTED' : 'NEEDS RE-EXAM';

  return (
    <div className="bg-white text-black p-5 sm:p-7 border-2 border-black rounded-lg shadow-sm text-[13px] leading-snug max-w-3xl mx-auto">
      {/* Top Print Action */}
      <div className="flex justify-end mb-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#144734] text-white text-xs font-semibold hover:bg-[#0f3627] transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / Save Grade Card
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2.5 gap-3">
        <div className="flex items-center gap-2.5">
          <MadarsaLogo customLogoUrl={settings.logoUrl} className="w-12 h-12 flex-shrink-0" />
          <div className="text-xs font-bold">Academic Year: {result.academicYear || settings.academicYear}</div>
        </div>
        <div className="text-center flex-1 px-2">
          <div className="text-[11px] font-bold text-emerald-800 mb-0.5">{settings.bismillahText}</div>
          <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight">{settings.madarsaName}</h2>
          <div className="text-[11px] font-semibold mt-0.5 text-gray-700">{settings.address}</div>
        </div>
        <div className="text-right text-xs font-bold">Issued: {result.issuedDate || '10/10/2026'}</div>
      </div>

      {/* Title */}
      <div className="text-center my-2.5">
        <div className="text-2xl font-extrabold text-emerald-700 tracking-wide">GRADE CARD</div>
        <div className="text-sm sm:text-base font-extrabold uppercase mt-0.5">{result.examName || result.title}</div>
        <div className="text-[11px] font-mono font-bold text-gray-600 mt-0.5">Result Code: {result.resultCode}</div>
      </div>

      {/* Student Metadata Box */}
      <div className="flex border-2 border-black">
        <div className="flex-1 p-3 text-sm leading-7 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div>
            <b className="inline-block w-32 text-gray-800">Student ID:</b>{' '}
            <span className="font-mono font-extrabold text-emerald-800">{result.studentId}</span>
          </div>
          <div>
            <b className="inline-block w-32 text-gray-800">Adm No:</b>{' '}
            <span className="font-semibold">{result.admissionNo || '—'}</span>
          </div>
          <div>
            <b className="inline-block w-32 text-gray-800">Student Name:</b>{' '}
            <span className="font-bold">{result.studentName}</span>
          </div>
          <div>
            <b className="inline-block w-32 text-gray-800">Class / Div:</b>{' '}
            <span className="font-semibold">
              {result.className} {result.division ? `(${result.division})` : ''}
            </span>
          </div>
          <div>
            <b className="inline-block w-32 text-gray-800">Roll No:</b>{' '}
            <span className="font-semibold">{result.rollNo}</span>
          </div>
          {result.studentEmail && (
            <div>
              <b className="inline-block w-32 text-gray-800">Gmail:</b>{' '}
              <span className="text-xs font-mono">{result.studentEmail}</span>
            </div>
          )}
        </div>
        <div className="w-[105px] h-[125px] border-l-2 border-black flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
          {result.photoUrl ? (
            <img src={result.photoUrl} alt={result.studentName} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center mx-auto mb-1 text-base">
                {result.studentName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] text-gray-500 font-bold">STUDENT</span>
            </div>
          )}
        </div>
      </div>

      {/* Marks Table */}
      <table className="w-full border-collapse mt-0">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black p-1.5 w-10 text-center">Sl</th>
            <th className="border border-black p-1.5 w-20 text-center">Code</th>
            <th className="border border-black p-1.5 text-left">Subject</th>
            <th className="border border-black p-1.5 w-16 text-center">Scored</th>
            <th className="border border-black p-1.5 w-16 text-center">Max</th>
            <th className="border border-black p-1.5 w-14 text-center">Grade</th>
            <th className="border border-black p-1.5 w-14 text-center">Avg %</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((sub, idx) => {
            const subPct = sub.max > 0 ? (sub.score / sub.max) * 100 : 0;
            return (
              <tr key={idx}>
                <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                <td className="border border-black p-1.5 text-center font-mono text-xs">SUB-{idx + 1}</td>
                <td className="border border-black p-1.5 font-medium">{sub.name}</td>
                <td className="border border-black p-1.5 text-center font-bold">{sub.score}</td>
                <td className="border border-black p-1.5 text-center">{sub.max}</td>
                <td className="border border-black p-1.5 text-center font-bold">{calcGrade(subPct)}</td>
                <td className="border border-black p-1.5 text-center">{Math.round(subPct)}%</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-bold bg-gray-100">
            <td colSpan={3} className="border border-black p-1.5 text-center uppercase">
              Grand Total
            </td>
            <td className="border border-black p-1.5 text-center text-emerald-800">{totalScored}</td>
            <td className="border border-black p-1.5 text-center">{totalMax}</td>
            <td className="border border-black p-1.5 text-center text-emerald-800">{overallGrade}</td>
            <td className="border border-black p-1.5 text-center">{Math.round(pct)}%</td>
          </tr>
        </tfoot>
      </table>

      {/* Academic Report Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 border-2 border-black border-t-0">
        <div className="border-b-2 sm:border-b-0 sm:border-r-2 border-black">
          <div className="bg-gray-100 p-2 border-b-2 border-black font-extrabold text-center text-xs uppercase">
            ACADEMIC REPORT
          </div>
          <table className="w-full text-xs">
            <tbody>
              {[
                ['Grand Total', `${totalScored}`, `${totalMax}`],
                ['Overall %', `${pct.toFixed(2)}%`, '100%'],
                ['Subjects Failed', `${failedCount}`, `${subjects.length}`],
                ['Overall Grade', overallGrade, '-'],
                ['Performance', perf, '-'],
                ['GPA', gpa.toFixed(2), '5.00'],
              ].map(([label, val, maxVal], i) => (
                <tr key={i} className="border-b border-gray-300 last:border-b-0">
                  <td className="p-1.5 font-bold border-r border-gray-300">{label}</td>
                  <td className="p-1.5 text-center font-extrabold text-emerald-800 border-r border-gray-300">{val}</td>
                  <td className="p-1.5 text-center text-gray-600">{maxVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between p-3 bg-gray-50/50">
          <div>
            <div className="text-xs font-extrabold uppercase text-gray-700 mb-1">Result Status & Remarks:</div>
            <div
              className={`inline-block px-2.5 py-1 rounded text-xs font-extrabold mb-2 ${
                failedCount === 0 && pct >= 40
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {statusText}
            </div>
            <p className="text-xs text-gray-700 italic">
              "{result.remarks || 'MashaAllah! Keep striving for excellence in Deeni and Modern education.'}"
            </p>
          </div>

          <div className="pt-6 mt-4 border-t border-dashed border-gray-400 flex items-end justify-between text-[11px] font-bold">
            <div>
              <div>Class Teacher</div>
              <div className="text-[10px] font-normal text-gray-500">Signature</div>
            </div>
            <div className="text-right">
              <div>{settings.principalName}</div>
              <div className="text-[10px] font-normal text-gray-500">Mohtamim / Principal Seal</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentIdCardView: React.FC<{
  settings: MadarsaSettings;
  studentId: string;
  admissionNo?: string;
  name: string;
  fatherName?: string;
  className?: string;
  rollNo?: string;
  dob?: string;
  email: string;
  phone?: string;
  address?: string;
  photoUrl?: string;
  admissionStatus?: 'Pending' | 'Approved' | 'Rejected';
  congratulationsNote?: string;
  rejectionReason?: string;
}> = ({
  settings,
  studentId,
  admissionNo,
  name,
  fatherName,
  className,
  rollNo,
  dob,
  email,
  phone,
  address,
  photoUrl,
  admissionStatus = 'Approved',
  congratulationsNote,
  rejectionReason,
}) => {
  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {admissionStatus === 'Approved' && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500/40 text-emerald-950 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                  Admission Confirmed & Approved
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  Student ID: {studentId}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-emerald-900 mt-1">
                🎉 Congratulations! Mubarak Ho, {name}!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-0.5 leading-relaxed">
                {congratulationsNote ||
                  `Congratulations! Your admission in ${settings.madarsaName} is officially approved by the Super Admin. Your permanent Student ID is ${studentId}.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {admissionStatus === 'Rejected' && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-950 shadow-sm">
          <div className="font-extrabold text-sm text-red-800 uppercase tracking-wide">
            Admission Application Rejected by Super Admin
          </div>
          <p className="text-xs sm:text-sm text-red-700 mt-1 font-medium">
            <b>Reason:</b> {rejectionReason || 'Incomplete documentation or eligibility criteria not met.'}
          </p>
        </div>
      )}

      {admissionStatus === 'Pending' && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 shadow-sm">
          <div className="font-extrabold text-sm text-amber-900 uppercase tracking-wide">
            Admission Status: Pending Super Admin Approval
          </div>
          <p className="text-xs sm:text-sm text-amber-800 mt-1">
            Your application (Reference ID: <b className="font-mono">{studentId}</b>) has been submitted and is awaiting verification by the Super Admin.
          </p>
        </div>
      )}

      {/* Official Digital Student Identity Card */}
      <div className="max-w-xl bg-white rounded-2xl border-2 border-[#144734] shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#123f2e] to-[#1d5e45] p-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <MadarsaLogo customLogoUrl={settings.logoUrl} className="w-12 h-12 flex-shrink-0 drop-shadow-md" />
            <div>
              <div className="text-[10px] text-amber-300 font-semibold">{settings.bismillahText}</div>
              <h3 className="text-base font-extrabold tracking-tight">{settings.madarsaName}</h3>
              <p className="text-[11px] text-emerald-100/80">{settings.address}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-block px-2.5 py-1 rounded-md bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
              STUDENT ID CARD
            </span>
            <div className="text-[11px] font-mono text-emerald-100 mt-1">{settings.academicYear}</div>
          </div>
        </div>

        <div className="p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="w-24 h-28 rounded-xl border-2 border-[#144734]/30 bg-emerald-50/50 flex flex-col items-center justify-center overflow-hidden flex-shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[#144734] text-white font-extrabold text-xl flex items-center justify-center">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] font-bold text-[#144734] mt-1.5">STUDENT</span>
              </>
            )}
          </div>

          <div className="flex-1 w-full space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">Official Student ID</div>
                <div className="font-mono text-base font-extrabold text-[#144734]">{studentId}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-gray-400">Admission No</div>
                <div className="font-mono font-bold text-gray-800">{admissionNo || 'ADM-2026'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#144734]" />
                <span className="text-gray-500">Name:</span>
                <b className="text-gray-900">{name}</b>
              </div>
              {fatherName && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#144734]" />
                  <span className="text-gray-500">Father:</span>
                  <b className="text-gray-900">{fatherName}</b>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#144734]" />
                <span className="text-gray-500">Class:</span>
                <b className="text-emerald-800">{className || 'Assigned Class'}</b>
              </div>
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#144734]" />
                <span className="text-gray-500">Roll No:</span>
                <b className="text-gray-900">{rollNo || '01'}</b>
              </div>
              {dob && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#144734]" />
                  <span className="text-gray-500">DOB:</span>
                  <b className="text-gray-900">{dob}</b>
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#144734]" />
                  <span className="text-gray-500">Phone:</span>
                  <b className="text-gray-900">{phone}</b>
                </div>
              )}
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-xs text-gray-600">
              <Mail className="w-3.5 h-3.5 text-[#144734]" />
              <span>Gmail Account:</span>
              <b className="font-mono text-gray-900">{email}</b>
            </div>
            {address && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-[#144734]" />
                <span>Address:</span>
                <span className="text-gray-800">{address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
