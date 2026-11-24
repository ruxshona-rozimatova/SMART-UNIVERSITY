import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Room, Student } from '../types/monitor';
import { calculateRiskBreakdown, clamp } from '../utils/risk';

interface StudentModalProps {
  isOpen: boolean;
  initialStudent: Student | null;
  existingIds: string[];
  onClose: () => void;
  onSave: (student: Student, isEdit: boolean) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  initialStudent,
  existingIds,
  onClose,
  onSave,
}) => {
  const isEdit = Boolean(initialStudent);

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('AT-21');
  const [attendancePct, setAttendancePct] = useState('85');
  const [lateCount, setLateCount] = useState('1');
  const [tasksTotal, setTasksTotal] = useState('20');
  const [tasksMissed, setTasksMissed] = useState('2');
  const [gradePrev, setGradePrev] = useState('82');
  const [gradeNow, setGradeNow] = useState('80');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialStudent) {
      setId(initialStudent.id);
      setName(initialStudent.name);
      setGroup(initialStudent.group);
      setAttendancePct(String(initialStudent.attendance_pct));
      setLateCount(String(initialStudent.late_count));
      setTasksTotal(String(initialStudent.tasks_total));
      setTasksMissed(String(initialStudent.tasks_missed));
      setGradePrev(String(initialStudent.grade_prev));
      setGradeNow(String(initialStudent.grade_now));
    } else {
      const nextNum = 1001 + existingIds.length;
      let candidate = `ST-${nextNum}`;
      let i = 1;
      while (existingIds.includes(candidate)) {
        candidate = `ST-${nextNum + i}`;
        i++;
      }
      setId(candidate);
      setName('');
      setGroup('AT-21');
      setAttendancePct('85');
      setLateCount('1');
      setTasksTotal('20');
      setTasksMissed('2');
      setGradePrev('82');
      setGradeNow('80');
    }
  }, [isOpen, initialStudent, existingIds]);

  if (!isOpen) return null;

  const previewStudent: Student = {
    id: id.trim() || 'ST-0000',
    name: name.trim() || 'Talaba',
    group: group.trim() || 'AT-21',
    attendance_pct: clamp(Number(attendancePct) || 0, 0, 100),
    late_count: Math.max(0, Number(lateCount) || 0),
    tasks_total: Math.max(0, Number(tasksTotal) || 0),
    tasks_missed: clamp(Number(tasksMissed) || 0, 0, Math.max(0, Number(tasksTotal) || 0)),
    grade_prev: clamp(Number(gradePrev) || 0, 0, 100),
    grade_now: clamp(Number(gradeNow) || 0, 0, 100),
  };
  const previewRisk = calculateRiskBreakdown(previewStudent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = id.trim();
    const trimmedName = name.trim();
    const trimmedGroup = group.trim();

    if (!trimmedId || !trimmedName || !trimmedGroup) {
      setError("ID, ism-familiya va guruh maydonlari to'ldirilishi shart.");
      return;
    }
    if (!isEdit && existingIds.includes(trimmedId)) {
      setError(`"${trimmedId}" ID raqamli talaba allaqachon mavjud.`);
      return;
    }

    const att = Number(attendancePct);
    const late = Number(lateCount);
    const total = Number(tasksTotal);
    const missed = Number(tasksMissed);
    const prev = Number(gradePrev);
    const now = Number(gradeNow);

    if (Number.isNaN(att) || att < 0 || att > 100) {
      setError("Davomat 0 dan 100 gacha bo'lishi kerak.");
      return;
    }
    if (Number.isNaN(late) || late < 0) {
      setError("Kechikishlar soni manfiy bo'lishi mumkin emas.");
      return;
    }
    if (Number.isNaN(total) || total < 1) {
      setError("Jami topshiriqlar soni kamida 1 ta bo'lishi kerak.");
      return;
    }
    if (Number.isNaN(missed) || missed < 0 || missed > total) {
      setError("Bajarilmagan topshiriqlar 0 dan jami topshiriqlar sonigacha bo'lishi kerak.");
      return;
    }
    if (
      Number.isNaN(prev) ||
      prev < 0 ||
      prev > 100 ||
      Number.isNaN(now) ||
      now < 0 ||
      now > 100
    ) {
      setError("Baholar 0 dan 100 gacha bo'lishi kerak.");
      return;
    }

    onSave(
      {
        id: trimmedId,
        name: trimmedName,
        group: trimmedGroup,
        attendance_pct: att,
        late_count: late,
        tasks_total: total,
        tasks_missed: missed,
        grade_prev: prev,
        grade_now: now,
      },
      isEdit
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="student-modal-title" className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Talaba ma’lumotlarini tahrirlash' : 'Yangi talaba qo‘shish'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Talaba ID</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isEdit}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="ST-1021"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Ism-familiya</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                placeholder="Masalan: Dilshod Karimov"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Guruh</label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                placeholder="AT-21"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Davomat (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={attendancePct}
                onChange={(e) => setAttendancePct(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Kechikishlar soni
              </label>
              <input
                type="number"
                min={0}
                value={lateCount}
                onChange={(e) => setLateCount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Jami topshiriqlar
              </label>
              <input
                type="number"
                min={1}
                value={tasksTotal}
                onChange={(e) => setTasksTotal(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Bajarilmagan
              </label>
              <input
                type="number"
                min={0}
                value={tasksMissed}
                onChange={(e) => setTasksMissed(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Avvalgi baho</label>
              <input
                type="number"
                min={0}
                max={100}
                value={gradePrev}
                onChange={(e) => setGradePrev(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Joriy baho</label>
              <input
                type="number"
                min={0}
                max={100}
                value={gradeNow}
                onChange={(e) => setGradeNow(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">Hisoblangan xavf balli (R):</span>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className="text-base font-semibold text-slate-900">
                {previewRisk.score.toFixed(1)}
              </span>
              <span
                className={`font-sans text-xs font-semibold ${
                  previewRisk.level === 'red'
                    ? 'text-red-600'
                    : previewRisk.level === 'yellow'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                }`}
              >
                {previewRisk.levelLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              {isEdit ? 'Saqlash' : 'Qo‘shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface RoomModalProps {
  isOpen: boolean;
  initialRoom: Room | null;
  onClose: () => void;
  onSave: (room: Room, isEdit: boolean) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  initialRoom,
  onClose,
  onSave,
}) => {
  const isEdit = Boolean(initialRoom);
  const [roomName, setRoomName] = useState('');
  const [bookedHours, setBookedHours] = useState('24');
  const [occupancyPct, setOccupancyPct] = useState('55');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialRoom) {
      setRoomName(initialRoom.room);
      setBookedHours(String(initialRoom.booked_hours_week));
      setOccupancyPct(String(initialRoom.avg_occupancy_pct));
    } else {
      setRoomName('');
      setBookedHours('22');
      setOccupancyPct('50');
    }
  }, [isOpen, initialRoom]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roomName.trim();
    const hours = Number(bookedHours);
    const occ = Number(occupancyPct);

    if (!trimmed) {
      setError("Xona nomi kiritilishi shart.");
      return;
    }
    if (Number.isNaN(hours) || hours < 0 || hours > 168) {
      setError("Haftalik band soatlar 0 dan 168 gacha bo'lishi kerak.");
      return;
    }
    if (Number.isNaN(occ) || occ < 0 || occ > 100) {
      setError("O'rtacha bandlik 0% dan 100% gacha bo'lishi kerak.");
      return;
    }

    onSave(
      {
        id: initialRoom ? initialRoom.id : `RM-${Date.now()}`,
        room: trimmed,
        booked_hours_week: hours,
        avg_occupancy_pct: occ,
      },
      isEdit
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="room-modal-title" className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Xona ma’lumotlarini tahrirlash' : 'Yangi xona qo‘shish'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Xona nomi / raqami</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              placeholder="Masalan: B-304 (Seminar xonasi)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Haftalik band (soat)
              </label>
              <input
                type="number"
                min={0}
                max={168}
                value={bookedHours}
                onChange={(e) => setBookedHours(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                O‘rtacha to‘lish (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={occupancyPct}
                onChange={(e) => setOccupancyPct(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              {isEdit ? 'Saqlash' : 'Qo‘shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "O'chirish",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 whitespace-nowrap shrink-0"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
