import React, { useMemo } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import type { RiskBreakdown, Room, Student } from '../types/monitor';
import { RiskBarChartByGroup, RiskDistributionPieChart } from './Charts';
import { RoomsTable } from './RoomsTable';

interface DashboardViewProps {
  students: Student[];
  rooms: Room[];
  breakdowns: Map<string, RiskBreakdown>;
  onSelectStudent: (studentId: string) => void;
  onNavigateStudents: () => void;
  onLoadTestData: () => void;
  onAddStudent: () => void;
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  rooms,
  breakdowns,
  onSelectStudent,
  onNavigateStudents,
  onLoadTestData,
  onAddStudent,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
}) => {
  const kpis = useMemo(() => {
    const total = students.length;
    let redCount = 0;
    let yellowCount = 0;
    let attendanceSum = 0;

    for (const s of students) {
      attendanceSum += s.attendance_pct;
      const b = breakdowns.get(s.id);
      if (b?.level === 'red') redCount++;
      else if (b?.level === 'yellow') yellowCount++;
    }

    const avgAttendance = total > 0 ? attendanceSum / total : 0;
    return { total, redCount, yellowCount, avgAttendance };
  }, [students, breakdowns]);

  const topRiskStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const rA = breakdowns.get(a.id)?.score ?? 0;
        const rB = breakdowns.get(b.id)?.score ?? 0;
        return rB - rA;
      })
      .slice(0, 5);
  }, [students, breakdowns]);

  if (students.length === 0 && rooms.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          SmartUni Monitor boshqaruv paneli
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Hozircha talabalar va auditoriyalar ma’lumotlari kiritilmagan. Tizim imkoniyatlarini
          sinash uchun 20 nafar talaba va 6 ta xonani bir tugma bilan yuklang.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onLoadTestData}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
          >
            Test ma’lumotlarini yuklash
          </button>
          <button
            type="button"
            onClick={onAddStudent}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            <span>Talaba qo‘shish</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-column KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Jami talabalar</div>
          <div className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {kpis.total}
          </div>
          <div className="mt-1 text-xs text-slate-500">Faol monitoring ro‘yxati</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Qizil xavf (R ≥ 35)</div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-bold text-red-600 tabular-nums">
              {kpis.redCount}
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {kpis.total > 0 ? `${((kpis.redCount / kpis.total) * 100).toFixed(1)}%` : '0.0%'}
            </span>
          </div>
          <div className="mt-1 text-xs font-medium text-red-700">Shoshilinch e’tibor talab</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Sariq xavf (20–34.9)</div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-bold text-amber-600 tabular-nums">
              {kpis.yellowCount}
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {kpis.total > 0 ? `${((kpis.yellowCount / kpis.total) * 100).toFixed(1)}%` : '0.0%'}
            </span>
          </div>
          <div className="mt-1 text-xs font-medium text-amber-700">Kuzatuv ostidagi guruh</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">O‘rtacha davomat</div>
          <div className="mt-2 font-mono text-3xl font-bold text-slate-900 tabular-nums">
            {kpis.avgAttendance.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">Barcha guruhlar bo‘yicha</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Guruhlar bo‘yicha o‘rtacha xavf balli (R)
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Har bir akademik guruh uchun o‘rtacha R ko‘rsatkichi
              </p>
            </div>
          </div>
          <RiskBarChartByGroup students={students} breakdowns={breakdowns} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Xavf darajalari taqsimoti
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Qizil, sariq va yashil toifadagi talabalar ulushi
            </p>
          </div>
          <RiskDistributionPieChart students={students} breakdowns={breakdowns} />
        </div>
      </div>

      {/* Top Risk Students Quick Access */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Eng yuqori xavf darajasidagi talabalar
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              R formulasi tafsilotlari va AI tavsiya uchun talaba ustiga bosing
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateStudents}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap shrink-0"
          >
            <span>Barchasini ko‘rish</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-5 py-3">Talaba</th>
                <th className="px-4 py-3">Guruh</th>
                <th className="px-4 py-3 text-right">Davomat</th>
                <th className="px-4 py-3 text-right">Bajarilmagan topshiriq</th>
                <th className="px-4 py-3">Asosiy omil</th>
                <th className="px-4 py-3 text-right">Xavf balli (R)</th>
                <th className="px-5 py-3">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {topRiskStudents.map((s) => {
                const b = breakdowns.get(s.id)!;
                const levelClass =
                  b.level === 'red'
                    ? 'text-red-700'
                    : b.level === 'yellow'
                      ? 'text-amber-700'
                      : 'text-emerald-700';

                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectStudent(s.id)}
                    className="cursor-pointer bg-white transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900 hover:text-blue-700">
                        {s.name}
                      </span>
                      <span className="ml-2 font-mono text-xs text-slate-400 tabular-nums">
                        {s.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.group}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {s.attendance_pct}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {s.tasks_missed}/{s.tasks_total}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {b.largestComponent.label}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {b.score.toFixed(1)}
                    </td>
                    <td className={`px-5 py-3 text-xs font-semibold ${levelClass}`}>
                      {b.levelLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rooms Table */}
      <RoomsTable
        rooms={rooms}
        onAddRoom={onAddRoom}
        onEditRoom={onEditRoom}
        onDeleteRoom={onDeleteRoom}
      />
    </div>
  );
};
