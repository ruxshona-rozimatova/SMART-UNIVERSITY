import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Database,
  LayoutDashboard,
  Menu,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { DashboardView } from './components/DashboardView';
import { ConfirmModal, RoomModal, StudentModal } from './components/Modals';
import { RoomsTable } from './components/RoomsTable';
import { StudentDetail } from './components/StudentDetail';
import { StudentsTable } from './components/StudentsTable';
import type { RiskBreakdown, Room, Student } from './types/monitor';
import { calculateRiskBreakdown, generateTestData } from './utils/risk';

type ActiveTab = 'dashboard' | 'students' | 'rooms';

const STORAGE_STUDENTS_KEY = 'smartuni_students_v1';
const STORAGE_ROOMS_KEY = 'smartuni_rooms_v1';

function loadInitialState(): { students: Student[]; rooms: Room[] } {
  try {
    const rawStudents = localStorage.getItem(STORAGE_STUDENTS_KEY);
    const rawRooms = localStorage.getItem(STORAGE_ROOMS_KEY);
    if (rawStudents && rawRooms) {
      return {
        students: JSON.parse(rawStudents) as Student[],
        rooms: JSON.parse(rawRooms) as Room[],
      };
    }
  } catch {
    // Fallback to fresh generated test dataset
  }
  return generateTestData();
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);
  const [students, setStudents] = useState<Student[]>(initial.students);
  const [rooms, setRooms] = useState<Room[]>(initial.rooms);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'student'; item: Student }
    | { type: 'room'; item: Room }
    | null
  >(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STUDENTS_KEY, JSON.stringify(students));
      localStorage.setItem(STORAGE_ROOMS_KEY, JSON.stringify(rooms));
    } catch {
      // Ignore storage quota errors
    }
  }, [students, rooms]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const breakdowns = useMemo(() => {
    const map = new Map<string, RiskBreakdown>();
    for (const s of students) {
      map.set(s.id, calculateRiskBreakdown(s));
    }
    return map;
  }, [students]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const handleLoadTestData = () => {
    const data = generateTestData();
    setStudents(data.students);
    setRooms(data.rooms);
    setSelectedStudentId(null);
    showToast("20 nafar talaba va 6 ta xona test ma'lumotlari yuklandi.");
  };

  const handleSaveStudent = (student: Student, isEdit: boolean) => {
    if (isEdit) {
      setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
      showToast(`${student.name} ma'lumotlari yangilandi.`);
    } else {
      setStudents((prev) => [student, ...prev]);
      showToast(`${student.name} ro'yxatga qo'shildi.`);
    }
    setStudentModalOpen(false);
    setEditingStudent(null);
  };

  const handleSaveRoom = (room: Room, isEdit: boolean) => {
    if (isEdit) {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
      showToast(`${room.room} ma'lumotlari yangilandi.`);
    } else {
      setRooms((prev) => [room, ...prev]);
      showToast(`${room.room} xonasi qo'shildi.`);
    }
    setRoomModalOpen(false);
    setEditingRoom(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'student') {
      const target = deleteTarget.item;
      setStudents((prev) => prev.filter((s) => s.id !== target.id));
      if (selectedStudentId === target.id) {
        setSelectedStudentId(null);
      }
      showToast(`${target.name} ro'yxatdan o'chirildi.`);
    } else {
      const target = deleteTarget.item;
      setRooms((prev) => prev.filter((r) => r.id !== target.id));
      showToast(`${target.room} xonasi o'chirildi.`);
    }
    setDeleteTarget(null);
  };

  const navigateTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSelectedStudentId(null);
    setMobileMenuOpen(false);
  };

  const pageTitle = selectedStudent
    ? selectedStudent.name
    : activeTab === 'dashboard'
      ? 'Boshqaruv paneli'
      : activeTab === 'students'
        ? 'Talabalar'
        : 'Xonalar';

  const redTotal = Array.from(breakdowns.values()).filter((b) => b.level === 'red').length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            SmartUni Monitor
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Asosiy menyu">
          <button
            type="button"
            onClick={() => navigateTab('dashboard')}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'dashboard' && !selectedStudent
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Boshqaruv paneli</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('students')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'students' || selectedStudent
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="h-4 w-4 shrink-0" />
              <span>Talabalar</span>
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('rooms')}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'rooms' && !selectedStudent
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Xonalar</span>
            </span>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {rooms.length}
            </span>
          </button>
        </nav>

        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <span>Yuqori xavfli talabalar</span>
            <span className="font-mono font-semibold text-red-600 tabular-nums">
              {redTotal} ta
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span>Jami auditoriyalar</span>
            <span className="font-mono font-semibold text-slate-700 tabular-nums">
              {rooms.length} ta
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-50 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                SmartUni Monitor
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Menyuni yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 p-4">
              <button
                type="button"
                onClick={() => navigateTab('dashboard')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Boshqaruv paneli</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTab('students')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Users className="h-4 w-4" />
                <span>Talabalar ({students.length})</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTab('rooms')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Building2 className="h-4 w-4" />
                <span>Xonalar ({rooms.length})</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Menyuni ochish"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-slate-400 sm:inline">SmartUni Monitor</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              {selectedStudent ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentId(null)}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    Talabalar
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="font-semibold text-slate-900">{selectedStudent.name}</span>
                </>
              ) : (
                <span className="font-semibold text-slate-900">{pageTitle}</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleLoadTestData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Database className="h-3.5 w-3.5 text-slate-500" />
              <span>Test ma’lumotlarini yuklash</span>
            </button>

            {activeTab === 'rooms' && !selectedStudent ? (
              <button
                type="button"
                onClick={() => {
                  setEditingRoom(null);
                  setRoomModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Xona qo‘shish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setStudentModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Talaba qo‘shish</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8">
          {toastMessage && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-900"
            >
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="ml-4 text-blue-700 hover:text-blue-900"
                aria-label="Xabarni yopish"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {selectedStudent ? (
            <StudentDetail
              student={selectedStudent}
              onBack={() => setSelectedStudentId(null)}
              onEdit={(s) => {
                setEditingStudent(s);
                setStudentModalOpen(true);
              }}
              onDelete={(s) => setDeleteTarget({ type: 'student', item: s })}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardView
              students={students}
              rooms={rooms}
              breakdowns={breakdowns}
              onSelectStudent={(id) => setSelectedStudentId(id)}
              onNavigateStudents={() => setActiveTab('students')}
              onLoadTestData={handleLoadTestData}
              onAddStudent={() => {
                setEditingStudent(null);
                setStudentModalOpen(true);
              }}
              onAddRoom={() => {
                setEditingRoom(null);
                setRoomModalOpen(true);
              }}
              onEditRoom={(r) => {
                setEditingRoom(r);
                setRoomModalOpen(true);
              }}
              onDeleteRoom={(r) => setDeleteTarget({ type: 'room', item: r })}
            />
          ) : activeTab === 'students' ? (
            <StudentsTable
              students={students}
              breakdowns={breakdowns}
              onSelectStudent={(id) => setSelectedStudentId(id)}
              onAddStudent={() => {
                setEditingStudent(null);
                setStudentModalOpen(true);
              }}
              onEditStudent={(s) => {
                setEditingStudent(s);
                setStudentModalOpen(true);
              }}
              onDeleteStudent={(s) => setDeleteTarget({ type: 'student', item: s })}
              onLoadTestData={handleLoadTestData}
            />
          ) : (
            <RoomsTable
              rooms={rooms}
              onAddRoom={() => {
                setEditingRoom(null);
                setRoomModalOpen(true);
              }}
              onEditRoom={(r) => {
                setEditingRoom(r);
                setRoomModalOpen(true);
              }}
              onDeleteRoom={(r) => setDeleteTarget({ type: 'room', item: r })}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={studentModalOpen}
        initialStudent={editingStudent}
        existingIds={students.map((s) => s.id)}
        onClose={() => {
          setStudentModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveStudent}
      />

      <RoomModal
        isOpen={roomModalOpen}
        initialRoom={editingRoom}
        onClose={() => {
          setRoomModalOpen(false);
          setEditingRoom(null);
        }}
        onSave={handleSaveRoom}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === 'student'
            ? "Talabani o'chirish"
            : "Xonani o'chirish"
        }
        description={
          deleteTarget?.type === 'student'
            ? `"${deleteTarget.item.name}" (${deleteTarget.item.id}) ma'lumotlarini o'chirishni tasdiqlaysizmi?`
            : deleteTarget?.type === 'room'
              ? `"${deleteTarget.item.room}" xonasini ro'yxatdan o'chirishni tasdiqlaysizmi?`
              : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
