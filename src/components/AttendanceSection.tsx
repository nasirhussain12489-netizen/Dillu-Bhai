import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Calendar, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { AttendanceItem, ClassItem, StudentItem } from '../types/portal';

interface AttendanceSectionProps {
  students: StudentItem[];
  classes: ClassItem[];
  attendance: AttendanceItem[];
  onMarkAttendance: (
    date: string,
    student: StudentItem,
    status: 'Present' | 'Absent' | 'Leave'
  ) => void;
  onMarkAllPresentForDate: (date: string) => void;
}

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  students,
  classes,
  attendance,
  onMarkAttendance,
  onMarkAllPresentForDate,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');

  const currentMonthPrefix = selectedDate.slice(0, 7); // YYYY-MM
  const formattedMonthLabel = useMemo(() => {
    const [year, month] = currentMonthPrefix.split('-').map(Number);
    if (!year || !month) return currentMonthPrefix;
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [currentMonthPrefix]);

  // All class names in order
  const allClassNames = useMemo(() => {
    const set = new Set<string>(['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']);
    classes.forEach((c) => {
      if (c.className) set.add(c.className);
    });
    students.forEach((s) => {
      if (s.className) set.add(s.className);
    });
    return Array.from(set);
  }, [classes, students]);

  // Summarize total daily attendance counts per student class for the current month
  const monthlyClassChartData = useMemo(() => {
    const monthRecords = (attendance || []).filter(
      (rec) => rec.date && rec.date.startsWith(currentMonthPrefix)
    );

    return allClassNames.map((className) => {
      const classRecords = monthRecords.filter((r) => r.className === className);
      const classStudents = students.filter((s) => s.className === className);

      let presentCount = classRecords.filter((r) => r.status === 'Present').length;
      const absentCount = classRecords.filter((r) => r.status === 'Absent').length;
      const leaveCount = classRecords.filter((r) => r.status === 'Leave').length;

      // If a student in this class has no explicit attendance record yet for the current month,
      // include their default active daily attendance so the chart is always populated
      const recordedStudentIds = new Set(classRecords.map((r) => r.studentId));
      const unrecordedStudentsCount = classStudents.filter(
        (s) => !recordedStudentIds.has(s.studentId)
      ).length;
      presentCount += unrecordedStudentsCount;

      const totalLogs = presentCount + absentCount + leaveCount;

      return {
        className,
        Present: presentCount,
        Absent: absentCount,
        Leave: leaveCount,
        Total: totalLogs,
        enrolledStudents: classStudents.length,
      };
    });
  }, [allClassNames, attendance, currentMonthPrefix, students]);

  // Summary metrics for the current month
  const monthSummary = useMemo(() => {
    return monthlyClassChartData.reduce(
      (acc, row) => {
        acc.present += row.Present;
        acc.absent += row.Absent;
        acc.leave += row.Leave;
        acc.total += row.Total;
        return acc;
      },
      { present: 0, absent: 0, leave: 0, total: 0 }
    );
  }, [monthlyClassChartData]);

  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'All') return students;
    return students.filter((s) => s.className === selectedClassFilter);
  }, [selectedClassFilter, students]);

  return (
    <div className="space-y-6">
      {/* Top Header & Date Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#dee6e1]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#11261d] flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-[#144734]" />
            Daily Student Attendance & Monthly Class Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#61786e] mt-0.5">
            Track daily student attendance and review total monthly attendance counts per class for{' '}
            <span className="font-bold text-[#144734]">{formattedMonthLabel}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#f4f7f5] px-3 py-2 rounded-xl border border-[#dee6e1]">
            <Calendar className="w-4 h-4 text-[#144734]" />
            <label htmlFor="attendance-date-picker" className="text-xs font-bold text-[#2d4239]">
              Date:
            </label>
            <input
              id="attendance-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || todayIso)}
              className="text-xs font-mono font-bold text-[#11261d] bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => onMarkAllPresentForDate(selectedDate)}
            className="px-4 py-2 rounded-xl bg-[#144734] hover:bg-[#0f3627] text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark All Present ({selectedDate})
          </button>
        </div>
      </div>

      {/* Visual Recharts Bar Chart Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#dee6e1] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#edf2ee] pb-3.5">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#11261d]">
              Monthly Attendance Summary by Student Class ({formattedMonthLabel})
            </h2>
            <p className="text-xs text-[#61786e]">
              Total daily attendance counts (Present, Absent, and Leave) aggregated per class for the current month
            </p>
          </div>
          <div className="text-xs text-[#52685e] font-mono">
            Month: {currentMonthPrefix}
          </div>
        </div>

        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyClassChartData}
              margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5ece8" vertical={false} />
              <XAxis
                dataKey="className"
                tick={{ fill: '#11261d', fontSize: 12, fontWeight: 700 }}
                axisLine={{ stroke: '#dee6e1' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#52685e', fontSize: 12 }}
                axisLine={{ stroke: '#dee6e1' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f4f7f5' }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#144734',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#11261d',
                  boxShadow: '0 8px 24px rgba(17, 38, 29, 0.12)',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }}
              />
              <Bar
                dataKey="Present"
                name="Present Days Count"
                fill="#144734"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
              <Bar
                dataKey="Absent"
                name="Absent Days Count"
                fill="#dc2626"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
              <Bar
                dataKey="Leave"
                name="Leave Days Count"
                fill="#d4942a"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Attendance Register Table */}
      <div className="bg-white rounded-2xl border border-[#dee6e1] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#dee6e1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#11261d]">
              Mark Daily Student Attendance — {selectedDate}
            </h3>
            <p className="text-xs text-[#61786e]">
              Clicking Present, Absent, or Leave immediately updates the database and recalculates the monthly class bar chart above.
            </p>
          </div>

          {/* Interactive Class Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-[#f4f7f5] rounded-xl overflow-x-auto">
            {['All', ...allClassNames].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClassFilter(cls)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedClassFilter === cls
                    ? 'bg-[#144734] text-white shadow-xs'
                    : 'text-[#52685e] hover:text-[#11261d]'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#f4f7f5] border-b border-[#dee6e1] text-[#52685e]">
                <th className="p-3.5 font-bold">Student ID</th>
                <th className="p-3.5 font-bold">Student Name</th>
                <th className="p-3.5 font-bold">Class / Roll</th>
                <th className="p-3.5 font-bold">Selected Date</th>
                <th className="p-3.5 font-bold">Mark Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((stu) => {
                const rec =
                  attendance.find(
                    (a) => a.studentId === stu.studentId && a.date === selectedDate
                  ) || attendance.find((a) => a.studentId === stu.studentId);
                const status = rec?.status || 'Present';
                return (
                  <tr key={stu.id} className="border-b border-[#edf2ee] hover:bg-[#f9fbfa]">
                    <td className="p-3.5 font-mono font-bold text-[#144734]">{stu.studentId}</td>
                    <td className="p-3.5 font-bold text-[#11261d]">{stu.name}</td>
                    <td className="p-3.5 text-[#52685e]">
                      {stu.className} · Roll #{stu.rollNo}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-[#52685e]">{selectedDate}</td>
                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5">
                        {(['Present', 'Absent', 'Leave'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onMarkAttendance(selectedDate, stu, st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              status === st
                                ? st === 'Present'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'Absent'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-amber-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
