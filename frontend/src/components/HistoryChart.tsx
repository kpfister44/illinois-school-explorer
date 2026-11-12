// ABOUTME: Line chart of a metric from 2010 to the current year
// ABOUTME: Leaves gaps at missing years, can shade the SAT period and add a dashed benchmark line, and reads out a year on touch or hover

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMetric, type MetricKind } from '@/lib/format';
import {
  FIRST_YEAR,
  SAT_YEARS,
  firstReported,
  isSatYear,
  latestReported,
  type YearValue,
} from '@/lib/history';
import { CURRENT_YEAR } from '@/lib/trendUtils';

interface HistoryChartProps {
  label: string;
  series: YearValue[];
  kind: MetricKind;
  satYears?: boolean;
  benchmark?: { label: string; series: YearValue[] };
}

interface ChartPoint extends YearValue {
  benchmark: number | null;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

interface ReadoutProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartPoint }>;
}

const INK = 'hsl(var(--ink))';
const INK_2 = 'hsl(var(--ink-2))';
const BENCHMARK = 'hsl(var(--benchmark))';
const YEARS_BETWEEN_TICKS = 4;
const YEAR_TICKS = Array.from(
  { length: Math.floor((CURRENT_YEAR - FIRST_YEAR) / YEARS_BETWEEN_TICKS) + 1 },
  (_, index) => FIRST_YEAR + index * YEARS_BETWEEN_TICKS
);
const AXIS_TEXT = { fontSize: 11, fill: INK_2 };

export default function HistoryChart({
  label,
  series,
  kind,
  satYears = false,
  benchmark,
}: HistoryChartProps) {
  const first = firstReported(series);
  const latest = latestReported(series);

  if (!first || !latest) {
    return <p className="text-sm text-muted-foreground">No history published.</p>;
  }

  const firstText = `${formatMetric(first.value, kind)} in ${first.year}`;
  const latestText = `${formatMetric(latest.value, kind)} in ${latest.year}`;
  const schoolSummary =
    first.year === latest.year
      ? `${label}: ${latestText}.`
      : `${label} from ${first.year} to ${latest.year}: ${firstText}, ${latestText}.`;

  const latestBenchmark = benchmark ? latestReported(benchmark.series) : null;
  const summary =
    benchmark && latestBenchmark
      ? `${schoolSummary} ${benchmark.label}: ${formatMetric(latestBenchmark.value, kind)} in ${latestBenchmark.year}.`
      : schoolSummary;

  const benchmarkByYear = new Map(benchmark?.series.map((point) => [point.year, point.value]));
  const data: ChartPoint[] = series.map((point) => ({
    ...point,
    benchmark: benchmarkByYear.get(point.year) ?? null,
  }));

  const hasValue = (index: number) => series[index]?.value != null;

  const renderDot = ({ cx, cy, index }: DotProps) => {
    const point = index === undefined ? undefined : series[index];
    if (!point || point.value === null || cx == null || cy == null || index === undefined) {
      return <g key={index} />;
    }

    const isFirst = point.year === first.year;
    const isLatest = point.year === latest.year;
    const standsAlone = !hasValue(index - 1) && !hasValue(index + 1);
    // The label sits on the side of the point that the line does not head towards
    const neighbour = series[isLatest ? index - 1 : index + 1]?.value ?? null;
    const labelBelow = neighbour !== null && neighbour > point.value;

    return (
      <g key={index}>
        {isLatest ? (
          <circle cx={cx} cy={cy} r={4.5} fill="hsl(var(--highlighter))" stroke={INK} strokeWidth={1.5} />
        ) : (
          standsAlone && <circle cx={cx} cy={cy} r={2.6} fill={INK} />
        )}
        {(isFirst || isLatest) && (
          <text
            x={cx}
            y={labelBelow ? cy + 20 : cy - 10}
            textAnchor={isLatest && !isFirst ? 'end' : 'start'}
            fontSize={12}
            fontWeight={700}
            fill={INK}
          >
            {formatMetric(point.value, kind)}
          </text>
        )}
      </g>
    );
  };

  // A benchmark year with no neighbour has no line through it, so it gets a dot
  const renderBenchmarkDot = ({ cx, cy, index }: DotProps) => {
    const standsAlone =
      index !== undefined &&
      data[index]?.benchmark != null &&
      data[index - 1]?.benchmark == null &&
      data[index + 1]?.benchmark == null;
    if (!standsAlone || cx == null || cy == null) {
      return <g key={index} />;
    }
    return <circle key={index} cx={cx} cy={cy} r={2} fill={BENCHMARK} />;
  };

  const Readout = ({ active, payload }: ReadoutProps) => {
    const point = payload?.[0]?.payload;
    if (!active || !point || point.value === null) {
      return null;
    }
    return (
      <div className="rounded-md border bg-card px-2 py-1 text-sm tabular-nums shadow-sm">
        {point.year} <strong>{formatMetric(point.value, kind)}</strong>
        {satYears && isSatYear(point.year) && ' (SAT, converted)'}
        {point.benchmark !== null && (
          <span className="block text-muted-foreground">
            Illinois {formatMetric(point.benchmark, kind)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div role="img" aria-label={summary}>
        <LineChart
          responsive
          data={data}
          style={{ width: '100%', height: 240 }}
          margin={{ top: 8, right: 14, bottom: 0, left: 0 }}
          accessibilityLayer={false}
        >
          {satYears && (
            <ReferenceArea
              x1={SAT_YEARS.first - 0.5}
              x2={SAT_YEARS.last + 0.5}
              fill="hsl(var(--wash))"
              fillOpacity={1}
              stroke="none"
              label={{ value: 'SAT years, converted', position: 'insideTop', ...AXIS_TEXT }}
            />
          )}
          <CartesianGrid vertical={false} stroke="hsl(var(--rule))" />
          <XAxis
            dataKey="year"
            type="number"
            domain={[FIRST_YEAR, CURRENT_YEAR]}
            ticks={YEAR_TICKS}
            tickLine={false}
            axisLine={{ stroke: INK_2 }}
            tick={AXIS_TEXT}
          />
          <YAxis
            width={kind === 'count' ? 44 : 34}
            domain={['auto', 'auto']}
            padding={{ top: 24, bottom: 24 }}
            allowDecimals={kind !== 'count'}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TEXT}
            tickFormatter={(value: number) => (kind === 'count' ? value.toLocaleString('en-US') : `${value}`)}
          />
          <Tooltip content={<Readout />} cursor={{ stroke: BENCHMARK }} />
          {latestBenchmark && (
            <Line
              dataKey="benchmark"
              stroke={BENCHMARK}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              connectNulls={false}
              dot={renderBenchmarkDot}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
          <Line
            dataKey="value"
            stroke={INK}
            strokeWidth={2.2}
            strokeLinejoin="round"
            connectNulls={false}
            dot={renderDot}
            activeDot={{ r: 5, fill: 'hsl(var(--highlighter))', stroke: INK, strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
      {benchmark && latestBenchmark && (
        <ul role="list" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-foreground" aria-hidden="true" />
            This school
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed border-benchmark" aria-hidden="true" />
            {benchmark.label}
          </li>
        </ul>
      )}
    </div>
  );
}
