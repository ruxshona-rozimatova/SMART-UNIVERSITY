import React, { useMemo, useState } from 'react';
import type { RiskBreakdown, Student } from '../types/monitor';

interface GroupStat {
  group: string;
  avgR: number;
  count: number;
  redCount: number;
}

interface ChartsProps {
  students: Student[];
  breakdowns: Map<string, RiskBreakdown>;
}

export const RiskBarChartByGroup: React.FC<ChartsProps> = ({ students, breakdowns }) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const groupStats = useMemo<GroupStat[]>(() => {
    const map = new Map<string, { sumR: number; count: number; redCount: number }>();
    for (const s of students) {
      const b = breakdowns.get(s.id);
      const r = b ? b.score : 0;
      const prev = map.get(s.group) ?? { sumR: 0, count: 0, redCount: 0 };
      map.set(s.group, {
        sumR: prev.sumR + r,
        count: prev.count + 1,
        redCount: prev.redCount + (r >= 35 ? 1 : 0),
      });
    }
    return Array.from(map.entries())
      .map(([group, val]) => ({
        group,
        avgR: val.count > 0 ? Math.round((val.sumR / val.count) * 10) / 10 : 0,
        count: val.count,
        redCount: val.redCount,
      }))
      .sort((a, b) => b.avgR - a.avgR);
  }, [students, breakdowns]);

  if (groupStats.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Guruhlar bo‘yicha ma’lumot mavjud emas.
      </div>
    );
  }

  const maxR = Math.max(50, ...groupStats.map((g) => Math.ceil(g.avgR / 10) * 10 + 10));
  const chartHeight = 220;
  const chartTopPad = 24;
  const chartBottomPad = 36;
  const plotHeight = chartHeight - chartTopPad - chartBottomPad;
  const svgWidth = Math.max(420, groupStats.length * 88 + 64);
  const leftPad = 42;
  const plotWidth = svgWidth - leftPad - 20;
  const barSlot = plotWidth / groupStats.length;
  const barWidth = Math.min(44, barSlot * 0.56);

  const yForValue = (val: number) => chartTopPad + plotHeight - (val / maxR) * plotHeight;

  const activeStat = groupStats.find((g) => g.group === hoveredGroup) ?? null;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-red-600" />
            <span>R ≥ 35 (Yuqori)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-600" />
            <span>20–34.9 (O‘rta)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
            <span>R &lt; 20 (Past)</span>
          </span>
        </div>
        {activeStat ? (
          <div className="font-mono text-xs text-slate-700 tabular-nums">
            {activeStat.group}: o‘rtacha R = {activeStat.avgR.toFixed(1)} · {activeStat.count} talaba ·{' '}
            {activeStat.redCount} qizil
          </div>
        ) : (
          <div className="text-xs text-slate-400">Batafsil ko‘rish uchun ustunga bosing</div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight}`}
          className="h-60 w-full min-w-[360px]"
          role="img"
          aria-label="Guruhlar bo'yicha o'rtacha xavf balli R diagrammasi"
        >
          {/* Horizontal grid lines */}
          {[0, 20, 35, maxR].map((tick) => {
            const y = yForValue(tick);
            const isThreshold = tick === 20 || tick === 35;
            return (
              <g key={tick}>
                <line
                  x1={leftPad}
                  y1={y}
                  x2={svgWidth - 16}
                  y2={y}
                  stroke={
                    tick === 35 ? '#FCA5A5' : tick === 20 ? '#FCD34D' : '#E2E8F0'
                  }
                  strokeWidth={isThreshold ? 1.25 : 1}
                  strokeDasharray={isThreshold ? '4 4' : undefined}
                />
                <text
                  x={leftPad - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 font-mono text-[11px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {groupStats.map((stat, idx) => {
            const centerX = leftPad + barSlot * idx + barSlot / 2;
            const x = centerX - barWidth / 2;
            const barTop = yForValue(stat.avgR);
            const barH = Math.max(2, chartTopPad + plotHeight - barTop);
            const fill =
              stat.avgR >= 35 ? '#DC2626' : stat.avgR >= 20 ? '#D97706' : '#16A34A';
            const isHovered = hoveredGroup === stat.group;

            return (
              <g
                key={stat.group}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredGroup(stat.group)}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() =>
                  setHoveredGroup((prev) => (prev === stat.group ? null : stat.group))
                }
              >
                <rect
                  x={x}
                  y={barTop}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill={fill}
                  opacity={hoveredGroup && !isHovered ? 0.55 : 1}
                  className="transition-opacity duration-150"
                />
                <text
                  x={centerX}
                  y={barTop - 6}
                  textAnchor="middle"
                  className="fill-slate-800 font-mono text-[11px] font-semibold tabular-nums"
                >
                  {stat.avgR.toFixed(1)}
                </text>
                <text
                  x={centerX}
                  y={chartTopPad + plotHeight + 18}
                  textAnchor="middle"
                  className="fill-slate-700 text-[12px] font-medium"
                >
                  {stat.group}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const RiskDistributionPieChart: React.FC<ChartsProps> = ({ students, breakdowns }) => {
  const [hoveredKey, setHoveredKey] = useState<'red' | 'yellow' | 'green' | null>(null);

  const counts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;
    for (const s of students) {
      const b = breakdowns.get(s.id);
      if (!b) continue;
      if (b.level === 'red') red++;
      else if (b.level === 'yellow') yellow++;
      else green++;
    }
    const total = red + yellow + green;
    return { red, yellow, green, total };
  }, [students, breakdowns]);

  if (counts.total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        Talabalar mavjud emas.
      </div>
    );
  }

  const segments = [
    {
      key: 'red' as const,
      label: 'Yuqori xavf (Qizil)',
      rule: 'R ≥ 35',
      count: counts.red,
      color: '#DC2626',
    },
    {
      key: 'yellow' as const,
      label: 'O‘rta xavf (Sariq)',
      rule: '20 – 34.9',
      count: counts.yellow,
      color: '#D97706',
    },
    {
      key: 'green' as const,
      label: 'Past xavf (Yashil)',
      rule: 'R < 20',
      count: counts.green,
      color: '#16A34A',
    },
  ];

  const radius = 68;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let cumulativeFraction = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex shrink-0 items-center justify-center">
        <svg
          width={184}
          height={184}
          viewBox="0 0 184 184"
          className="-rotate-90"
          role="img"
          aria-label="Xavf darajalari taqsimoti doiraviy diagrammasi"
        >
          <circle
            cx={92}
            cy={92}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => {
            const fraction = seg.count / counts.total;
            const dashLength = fraction * circumference;
            const dashOffset = -cumulativeFraction * circumference;
            cumulativeFraction += fraction;

            if (seg.count === 0) return null;

            return (
              <circle
                key={seg.key}
                cx={92}
                cy={92}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={hoveredKey === seg.key ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                opacity={hoveredKey && hoveredKey !== seg.key ? 0.5 : 1}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {counts.total}
          </span>
          <span className="text-xs text-slate-500">talaba</span>
        </div>
      </div>

      <div className="w-full flex-1 space-y-3">
        {segments.map((seg) => {
          const pct = counts.total > 0 ? (seg.count / counts.total) * 100 : 0;
          return (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredKey(seg.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                hoveredKey === seg.key
                  ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-xs"
                  style={{ backgroundColor: seg.color }}
                />
                <div>
                  <div className="text-sm font-medium text-slate-900">{seg.label}</div>
                  <div className="font-mono text-xs text-slate-500 tabular-nums">{seg.rule}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {seg.count} ta
                </div>
                <div className="font-mono text-xs text-slate-500 tabular-nums">
                  {pct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
