import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { AIRecommendation, Student } from '../types/monitor';
import { calculateRiskBreakdown } from '../utils/risk';

interface StudentDetailProps {
  student: Student;
  onBack: () => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export const StudentDetail: React.FC<StudentDetailProps> = ({
  student,
  onBack,
  onEdit,
  onDelete,
}) => {
  const breakdown = calculateRiskBreakdown(student);

  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset AI state when switching or updating student numbers
  useEffect(() => {
    setRecommendation(null);
    setAiError(null);
    setCopied(false);
  }, [
    student.id,
    student.attendance_pct,
    student.late_count,
    student.tasks_total,
    student.tasks_missed,
    student.grade_prev,
    student.grade_now,
  ]);

  const handleRequestAI = async () => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student,
          riskScore: breakdown.score,
          riskLevelLabel: breakdown.levelLabel,
          components: breakdown.components,
          largestComponent: breakdown.largestComponent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Server bilan bog'lanishda xatolik yuz berdi.");
      }

      setRecommendation(data as AIRecommendation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Noma'lum xatolik yuz berdi.";
      setAiError(msg);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!recommendation?.studentMessage) return;
    try {
      await navigator.clipboard.writeText(recommendation.studentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const levelColorClass =
    breakdown.level === 'red'
      ? 'text-red-700 bg-red-50 border-red-200'
      : breakdown.level === 'yellow'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  const gradeDelta = student.grade_now - student.grade_prev;

  return (
    <div className="space-y-6">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Ro‘yxatga qaytish</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Tahrirlash</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(student)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-50 whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>O‘chirish</span>
          </button>
        </div>
      </div>

      {/* Student Header Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono tabular-nums">{student.id}</span>
              <span aria-hidden="true">·</span>
              <span>Guruh: {student.group}</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {student.name}
            </h1>
          </div>

          <div className={`rounded-xl border px-4 py-3 text-right ${levelColorClass}`}>
            <div className="text-xs font-medium">Xavf balli (R)</div>
            <div className="mt-0.5 flex items-baseline justify-end gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums">
                {breakdown.score.toFixed(1)}
              </span>
              <span className="text-xs font-semibold">{breakdown.levelLabel}</span>
            </div>
          </div>
        </div>

        {/* 4 Raw Metrics Row */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-4">
          <div>
            <div className="text-xs text-slate-500">Davomat</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {student.attendance_pct}%
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Kechikishlar</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {student.late_count} marta
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Bajarilmagan topshiriqlar</div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {student.tasks_missed} / {student.tasks_total}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Baholar dinamikasi</div>
            <div className="mt-1 flex items-baseline gap-2 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              <span>
                {student.grade_prev} → {student.grade_now}
              </span>
              <span
                className={`text-xs font-medium ${
                  gradeDelta < 0
                    ? 'text-red-600'
                    : gradeDelta > 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
                }`}
              >
                ({gradeDelta > 0 ? `+${gradeDelta}` : gradeDelta})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* R Calculation Breakdown */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Xavf balli (R) hisoblash tarkibi
          </h2>
          <p className="mt-1 font-mono text-xs text-slate-500">
            R = 0.4×(100 - davomat) + 0.3×(bajarilmagan/jami×100) + 0.2×min(100, kechikish×10) +
            0.1×min(100, max(0, avvalgi - joriy)×5)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-6 py-3">Komponent</th>
                <th className="px-6 py-3">Hisoblash ifodasi</th>
                <th className="px-6 py-3 text-right">Vazn</th>
                <th className="px-6 py-3 text-right">Ball</th>
                <th className="px-6 py-3 text-right">Ulushi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {breakdown.components.map((comp) => {
                const isLargest =
                  comp.key === breakdown.largestComponent.key && breakdown.rawScore > 0;
                return (
                  <tr key={comp.key} className={isLargest ? 'bg-blue-50/50' : 'bg-white'}>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{comp.label}</div>
                      {isLargest && (
                        <div className="mt-0.5 text-xs font-medium text-blue-700">
                          Eng katta ta’sir ko‘rsatgan omil
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-700 tabular-nums">
                      {comp.substitutedText}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-600 tabular-nums">
                      {(comp.weight * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {comp.contribution.toFixed(1)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 sm:block">
                          <div
                            className={`h-full rounded-full ${
                              isLargest ? 'bg-blue-700' : 'bg-slate-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, comp.sharePct))}%` }}
                          />
                        </div>
                        <span className="w-12 font-mono text-xs text-slate-700 tabular-nums">
                          {comp.sharePct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-900">
                <td className="px-6 py-3.5" colSpan={3}>
                  Jami xavf balli (R)
                </td>
                <td className="px-6 py-3.5 text-right font-mono text-base tabular-nums">
                  {breakdown.score.toFixed(1)}
                </td>
                <td className="px-6 py-3.5 text-right font-mono text-xs text-slate-600 tabular-nums">
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* AI Tavsiya Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              AI akademik tahlil va tavsiya
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Talabaning aniq raqamlari va to‘rtta R komponenti asosida Gemini yordamida tavsiya olish
            </p>
          </div>

          <button
            type="button"
            onClick={handleRequestAI}
            disabled={loadingAI}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loadingAI ? 'Tavsiya tayyorlanmoqda...' : 'AI tavsiya'}</span>
          </button>
        </div>

        {loadingAI && (
          <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
          </div>
        )}

        {aiError && (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{aiError}</span>
          </div>
        )}

        {recommendation && !loadingAI && (
          <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500">
                a) Asosiy sabab
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-900">
                {recommendation.mainCause}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-wide text-slate-500">
                b) 2 haftalik 3 bosqichli reja
              </h3>
              <ol className="mt-2.5 space-y-2.5">
                {recommendation.twoWeekPlan.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-800">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 font-mono text-xs font-semibold text-blue-700 tabular-nums">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-slate-500">
                  c) Talabaga yuboriladigan xabar
                </h3>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Nusxalandi</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Nusxalash</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                {recommendation.studentMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
