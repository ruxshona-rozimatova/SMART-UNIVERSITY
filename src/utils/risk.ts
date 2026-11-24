import type { RiskBreakdown, RiskComponent, RiskLevel, Room, Student } from '../types/monitor';

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function calculateRiskBreakdown(student: Student): RiskBreakdown {
  const attendancePct = clamp(Number(student.attendance_pct) || 0, 0, 100);
  const lateCount = Math.max(0, Number(student.late_count) || 0);
  const tasksTotal = Math.max(0, Number(student.tasks_total) || 0);
  const tasksMissed = clamp(Number(student.tasks_missed) || 0, 0, tasksTotal);
  const gradePrev = clamp(Number(student.grade_prev) || 0, 0, 100);
  const gradeNow = clamp(Number(student.grade_now) || 0, 0, 100);

  const attendanceBase = 100 - attendancePct;
  const attendanceContrib = 0.4 * attendanceBase;

  const tasksBase = tasksTotal > 0 ? (tasksMissed / tasksTotal) * 100 : 0;
  const tasksContrib = 0.3 * tasksBase;

  const lateBase = Math.min(100, lateCount * 10);
  const lateContrib = 0.2 * lateBase;

  const gradeDrop = Math.max(0, gradePrev - gradeNow);
  const gradeBase = Math.min(100, gradeDrop * 5);
  const gradeContrib = 0.1 * gradeBase;

  const rawScore = attendanceContrib + tasksContrib + lateContrib + gradeContrib;
  const score = Math.round(rawScore * 10) / 10;

  let level: RiskLevel = 'green';
  let levelLabel = 'Past xavf';
  if (score >= 35) {
    level = 'red';
    levelLabel = 'Yuqori xavf';
  } else if (score >= 20) {
    level = 'yellow';
    levelLabel = "O'rta xavf";
  }

  const totalForShare = rawScore > 0 ? rawScore : 1;

  const components: RiskComponent[] = [
    {
      key: 'attendance',
      label: 'Davomat yetishmovchiligi',
      formulaText: '0.4 × (100 - davomat)',
      substitutedText: `0.4 × (100 - ${attendancePct}) = ${attendanceContrib.toFixed(1)}`,
      baseValue: attendanceBase,
      weight: 0.4,
      contribution: attendanceContrib,
      sharePct: rawScore > 0 ? (attendanceContrib / totalForShare) * 100 : 0,
    },
    {
      key: 'tasks',
      label: 'Bajarilmagan topshiriqlar',
      formulaText: '0.3 × (bajarilmagan / jami × 100)',
      substitutedText:
        tasksTotal > 0
          ? `0.3 × (${tasksMissed} / ${tasksTotal} × 100) = ${tasksContrib.toFixed(1)}`
          : '0.3 × 0 = 0.0',
      baseValue: tasksBase,
      weight: 0.3,
      contribution: tasksContrib,
      sharePct: rawScore > 0 ? (tasksContrib / totalForShare) * 100 : 0,
    },
    {
      key: 'late',
      label: 'Kechikishlar soni',
      formulaText: '0.2 × min(100, kechikish × 10)',
      substitutedText: `0.2 × min(100, ${lateCount} × 10) = ${lateContrib.toFixed(1)}`,
      baseValue: lateBase,
      weight: 0.2,
      contribution: lateContrib,
      sharePct: rawScore > 0 ? (lateContrib / totalForShare) * 100 : 0,
    },
    {
      key: 'grade',
      label: 'Baho pasayishi',
      formulaText: '0.1 × min(100, max(0, avvalgi - joriy) × 5)',
      substitutedText: `0.1 × min(100, max(0, ${gradePrev} - ${gradeNow}) × 5) = ${gradeContrib.toFixed(1)}`,
      baseValue: gradeBase,
      weight: 0.1,
      contribution: gradeContrib,
      sharePct: rawScore > 0 ? (gradeContrib / totalForShare) * 100 : 0,
    },
  ];

  const largestComponent = components.reduce((max, curr) =>
    curr.contribution > max.contribution ? curr : max
  );

  return {
    score,
    rawScore,
    level,
    levelLabel,
    components,
    largestComponent,
  };
}

export function isRoomInefficient(room: Room): boolean {
  return room.booked_hours_week > 20 && room.avg_occupancy_pct < 40;
}

const FIRST_NAMES = [
  'Azizbek',
  'Madina',
  'Javohir',
  'Dilnoza',
  'Sardorbek',
  'Mohinur',
  'Bekzod',
  'Sevinch',
  'Ulugbek',
  'Kamola',
  'Shohruh',
  'Nilufar',
  'Jasurbek',
  'Malika',
  'Dostonbek',
  'Zuhra',
  'Bobur',
  'Gulnoza',
  'Farrux',
  'Ruxshona',
  'Temur',
  'Asal',
  'Sanjar',
  'Shaxzoda',
];

const LAST_NAMES = [
  'Karimov',
  'Rustamova',
  'Toshmatov',
  'Yusupova',
  'Rahimov',
  'Alimova',
  'Nazarov',
  'Qodirova',
  'Mirzayev',
  'Saidova',
  'Ismoilov',
  'Ergasheva',
  'Abdullayev',
  'Xolmatova',
  'Umarov',
  'Tursunova',
  'Sobirov',
  'Mahmudova',
  'Hamidov',
  'Ortiqova',
  'Sultonov',
  'Sharipova',
  'Fayzullayev',
  'Bozorova',
];

const GROUPS = ['AT-21', 'DI-22', 'KI-23', 'SI-21'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateTestData(): { students: Student[]; rooms: Room[] } {
  const firstPool = shuffle(FIRST_NAMES);
  const lastPool = shuffle(LAST_NAMES);

  // Curated archetypes to guarantee realistic variety across red, yellow, green & varied dominant R components
  const archetypes = [
    // 5 Red risk students (various dominant components)
    { att: [45, 58], late: [4, 7], total: [18, 22], missed: [7, 11], prev: [78, 86], now: [60, 70] }, // low attendance + tasks
    { att: [52, 62], late: [6, 9], total: [16, 20], missed: [6, 10], prev: [80, 88], now: [58, 68] }, // heavy tardiness + missed
    { att: [68, 76], late: [2, 4], total: [20, 24], missed: [12, 16], prev: [82, 90], now: [64, 72] }, // mostly missed tasks
    { att: [40, 50], late: [3, 6], total: [16, 20], missed: [5, 8], prev: [74, 82], now: [55, 65] }, // severe absenteeism
    { att: [58, 66], late: [5, 8], total: [18, 22], missed: [8, 11], prev: [88, 94], now: [62, 70] }, // sharp grade drop + tasks
    // 6 Yellow risk students (20 - 34.9)
    { att: [72, 79], late: [3, 5], total: [18, 20], missed: [4, 6], prev: [80, 86], now: [72, 78] },
    { att: [76, 84], late: [4, 6], total: [16, 20], missed: [3, 5], prev: [84, 90], now: [70, 76] },
    { att: [68, 75], late: [2, 3], total: [20, 22], missed: [4, 6], prev: [76, 82], now: [71, 77] },
    { att: [78, 85], late: [5, 7], total: [18, 22], missed: [4, 6], prev: [82, 88], now: [74, 80] },
    { att: [70, 78], late: [2, 4], total: [16, 20], missed: [5, 7], prev: [79, 85], now: [73, 79] },
    { att: [75, 82], late: [3, 5], total: [18, 20], missed: [3, 5], prev: [88, 92], now: [72, 78] },
    // 9 Green risk students (< 20)
    { att: [90, 98], late: [0, 2], total: [18, 22], missed: [0, 2], prev: [86, 94], now: [88, 96] },
    { att: [88, 95], late: [1, 2], total: [20, 24], missed: [1, 3], prev: [82, 90], now: [83, 91] },
    { att: [92, 100], late: [0, 1], total: [16, 20], missed: [0, 1], prev: [90, 96], now: [91, 98] },
    { att: [86, 93], late: [1, 3], total: [18, 22], missed: [1, 3], prev: [78, 85], now: [80, 87] },
    { att: [94, 99], late: [0, 1], total: [20, 22], missed: [0, 2], prev: [88, 95], now: [87, 94] },
    { att: [85, 92], late: [1, 2], total: [18, 20], missed: [1, 2], prev: [84, 90], now: [81, 88] },
    { att: [91, 97], late: [0, 2], total: [18, 22], missed: [1, 2], prev: [80, 88], now: [84, 92] },
    { att: [89, 96], late: [0, 1], total: [20, 24], missed: [0, 2], prev: [85, 92], now: [86, 93] },
    { att: [87, 94], late: [1, 3], total: [16, 20], missed: [1, 3], prev: [83, 89], now: [82, 88] },
  ];

  const students: Student[] = archetypes.map((arc, idx) => {
    const tasksTotal = randInt(arc.total[0], arc.total[1]);
    const tasksMissed = Math.min(tasksTotal, randInt(arc.missed[0], arc.missed[1]));
    const first = firstPool[idx % firstPool.length];
    const last = lastPool[idx % lastPool.length];
    // Ensure gender-neutral / realistic pairing without awkward mismatches
    const adjustedLast =
      (first.endsWith('a') || first.endsWith('r') && ['Mohinur', 'Asal'].includes(first)) &&
      !last.endsWith('a')
        ? `${last}a`
        : !first.endsWith('a') &&
            !['Mohinur', 'Asal', 'Sevinch'].includes(first) &&
            last.endsWith('a')
          ? last.slice(0, -1)
          : last;

    return {
      id: `ST-${1001 + idx}`,
      name: `${first} ${adjustedLast}`,
      group: GROUPS[idx % GROUPS.length],
      attendance_pct: randInt(arc.att[0], arc.att[1]),
      late_count: randInt(arc.late[0], arc.late[1]),
      tasks_total: tasksTotal,
      tasks_missed: tasksMissed,
      grade_prev: randInt(arc.prev[0], arc.prev[1]),
      grade_now: randInt(arc.now[0], arc.now[1]),
    };
  });

  const rooms: Room[] = [
    {
      id: 'RM-1',
      room: 'A-104 (Katta ma’ruza zali)',
      booked_hours_week: randInt(26, 34),
      avg_occupancy_pct: randInt(24, 36),
    },
    {
      id: 'RM-2',
      room: 'B-205 (Kompyuter lab)',
      booked_hours_week: randInt(24, 30),
      avg_occupancy_pct: randInt(68, 84),
    },
    {
      id: 'RM-3',
      room: 'C-302 (Seminar xonasi)',
      booked_hours_week: randInt(22, 28),
      avg_occupancy_pct: randInt(28, 38),
    },
    {
      id: 'RM-4',
      room: 'A-210 (Amaliyot xonasi)',
      booked_hours_week: randInt(14, 19),
      avg_occupancy_pct: randInt(58, 76),
    },
    {
      id: 'RM-5',
      room: 'Lab-02 (Sun’iy intellekt)',
      booked_hours_week: randInt(28, 36),
      avg_occupancy_pct: randInt(74, 91),
    },
    {
      id: 'RM-6',
      room: 'D-108 (Konferens xona)',
      booked_hours_week: randInt(21, 25),
      avg_occupancy_pct: randInt(19, 32),
    },
  ];

  return { students, rooms };
}
