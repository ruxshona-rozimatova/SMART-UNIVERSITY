import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Room } from '../types/monitor';
import { isRoomInefficient } from '../utils/risk';

interface RoomsTableProps {
  rooms: Room[];
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  compact?: boolean;
}

export const RoomsTable: React.FC<RoomsTableProps> = ({
  rooms,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  compact = false,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'inefficient'>('all');

  const inefficientCount = useMemo(
    () => rooms.filter((r) => isRoomInefficient(r)).length,
    [rooms]
  );

  const displayedRooms = useMemo(() => {
    if (filterMode === 'inefficient') {
      return rooms.filter((r) => isRoomInefficient(r));
    }
    return rooms;
  }, [rooms, filterMode]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Auditoriya va xonalar bandligi
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Haftasiga 20 soatdan ko‘p band qilingan, ammo o‘rtacha to‘lishi 40% dan past xonalar alohida ajratiladi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Barchasi ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('inefficient')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterMode === 'inefficient'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Samarasiz ({inefficientCount})
            </button>
          </div>

          {!compact && (
            <button
              type="button"
              onClick={onAddRoom}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Xona qo‘shish</span>
            </button>
          )}
        </div>
      </div>

      {displayedRooms.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-slate-500">
            {rooms.length === 0
              ? "Xonalar ro'yxati bo'sh. Yangi xona qo'shing yoki test ma'lumotlarini yuklang."
              : "Tanlangan filtr bo'yicha xonalar topilmadi."}
          </p>
          {rooms.length === 0 && (
            <button
              type="button"
              onClick={onAddRoom}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Birinchi xonani qo‘shish</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                <th className="px-5 py-3">Xona</th>
                <th className="px-5 py-3 text-right">Band qilingan (soat/hafta)</th>
                <th className="px-5 py-3 text-right">O‘rtacha to‘lish (%)</th>
                <th className="px-5 py-3">Holat</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {displayedRooms.map((room) => {
                const inefficient = isRoomInefficient(room);
                return (
                  <tr
                    key={room.id}
                    className={
                      inefficient
                        ? 'bg-amber-50/85 hover:bg-amber-100/70'
                        : 'bg-white hover:bg-slate-50/80'
                    }
                  >
                    <td className="px-5 py-3 font-medium text-slate-900">{room.room}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-800 tabular-nums">
                      {room.booked_hours_week} soat
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-2.5">
                        <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 sm:block">
                          <div
                            className={`h-full rounded-full ${
                              inefficient ? 'bg-amber-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, room.avg_occupancy_pct))}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-medium tabular-nums ${
                            inefficient ? 'text-amber-800' : 'text-slate-800'
                          }`}
                        >
                          {room.avg_occupancy_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {inefficient ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>Samarasiz bandlik (&gt;20s, &lt;40%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>Me’yoriy</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEditRoom(room)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
                          title="Tahrirlash"
                          aria-label={`${room.room} xonasini tahrirlash`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRoom(room)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-100 hover:text-red-700"
                          title="O‘chirish"
                          aria-label={`${room.room} xonasini o‘chirish`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
