import React, { useMemo, useState } from 'react';
import { ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { RiskBreakdown, RiskLevel, Student } from '../types/monitor';

interface StudentsTableProps {
  students: Student[];
  breakdowns: Map<string, RiskBreakdown>;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onLoadTestData: () => void;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  breakdowns,
  onSelectStudent,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onLoadTestData,
}) => {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'name'>('risk_desc');

  const groups = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.group))).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        if (q && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) {
          return false;
        }
        if (groupFilter !== 'all' && s.group !== groupFilter) {
          return false;
        }
        if (riskFilter !== 'all') {
          const b = breakdowns.get(s.id);
          if (!b || b.level !== riskFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rA = breakdowns.get(a.id)?.score ?? 0;
        const rB = breakdowns.get(b.id)?.score ?? 0;
        if (sortBy === 'risk_desc') return rB - rA;
        if (sortBy === 'risk_asc') return rA - rB;
        return a.name.localeCompare(b.name);
      });
  }, [students, breakdowns, search, groupFilter, riskFilter, sortBy]);

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
        <h2 className="text-base font-semibold text-slate-900">Talabalar ro‘yxati bo‘sh</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">
          Monitoringni boshlash uchun yangi talaba qo‘shing yoki 20 nafar test talaba ma’lumotlarini yuklang.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onLoadTestData}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Test ma’lumotlarini yuklash
          </button>
          <button
            type="button"
            onClick={onAddStudent}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            <span>Talaba qo‘shish</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki ID bo‘yicha qidirish..."
              className="w-60 rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            aria-label="Guruh bo‘yicha filtrlash"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="all">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'risk_desc' | 'risk_asc' | 'name')}
            aria-label="Saralash"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="risk_desc">Xavf balli (yuqoridan pastga)</option>
            <option value="risk_asc">Xavf balli (pastdan yuqoriga)</option>
            <option value="name">Ism bo‘yicha (A–Z)</option>
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              { key: 'all', label: 'Barchasi' },
              { key: 'red', label: 'Qizil' },
              { key: 'yellow', label: 'Sariq' },
              { key: 'green', label: 'Yashil' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRiskFilter(item.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                riskFilter === item.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th className="px-5 py-3">Talaba</th>
              <th className="px-4 py-3">Guruh</th>
              <th className="px-4 py-3 text-right">Davomat</th>
              <th className="px-4 py-3 text-right">Kechikish</th>
              <th className="px-4 py-3 text-right">Topshiriqlar</th>
              <th className="px-4 py-3 text-right">Baho</th>
              <th className="px-4 py-3 text-right">Xavf balli (R)</th>
              <th className="px-4 py-3">Holat</th>
              <th className="px-5 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500">
                  Filtr shartlariga mos talaba topilmadi.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const b = breakdowns.get(student.id)!;
                const levelTextClass =
                  b.level === 'red'
                    ? 'text-red-700'
                    : b.level === 'yellow'
                      ? 'text-amber-700'
                      : 'text-emerald-700';

                return (
                  <tr
                    key={student.id}
                    className="group cursor-pointer bg-white transition-colors hover:bg-slate-50"
                    onClick={() => onSelectStudent(student.id)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-slate-900 group-hover:text-blue-700">
                            {student.name}
                          </div>
                          <div className="font-mono text-xs text-slate-500 tabular-nums">
                            {student.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{student.group}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {student.attendance_pct}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {student.late_count}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {student.tasks_missed}/{student.tasks_total}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {student.grade_prev} → {student.grade_now}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {b.score.toFixed(1)}
                    </td>
                    <td className={`px-4 py-3 text-xs font-semibold ${levelTextClass}`}>
                      {b.levelLabel}
                    </td>
                    <td
                      className="px-5 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditStudent(student)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
                          title="Tahrirlash"
                          aria-label={`${student.name} ma'lumotlarini tahrirlash`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStudent(student)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700"
                          title="O‘chirish"
                          aria-label={`${student.name}ni o‘chirish`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-blue-700"
                          title="Batafsil"
                          aria-label={`${student.name} tafsilotlari`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
