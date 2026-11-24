export type RiskLevel = 'red' | 'yellow' | 'green';

export interface Student {
  id: string;
  name: string;
  group: string;
  attendance_pct: number;
  late_count: number;
  tasks_total: number;
  tasks_missed: number;
  grade_prev: number;
  grade_now: number;
}

export interface Room {
  id: string;
  room: string;
  booked_hours_week: number;
  avg_occupancy_pct: number;
}

export interface RiskComponent {
  key: 'attendance' | 'tasks' | 'late' | 'grade';
  label: string;
  formulaText: string;
  substitutedText: string;
  baseValue: number;
  weight: number;
  contribution: number;
  sharePct: number;
}

export interface RiskBreakdown {
  score: number;
  rawScore: number;
  level: RiskLevel;
  levelLabel: string;
  components: RiskComponent[];
  largestComponent: RiskComponent;
}

export interface AIRecommendation {
  mainCause: string;
  twoWeekPlan: string[];
  studentMessage: string;
}
