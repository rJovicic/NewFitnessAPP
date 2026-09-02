"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { WeightPoint } from "@/app/(dashboard)/progress/actions";

const TIMEFRAMES = [
  { value: "7d", label: "7D", days: 7 },
  { value: "30d", label: "30D", days: 30 },
  { value: "90d", label: "90D", days: 90 },
  { value: "all", label: "ALL", days: null },
] as const;

type TimeframeValue = (typeof TIMEFRAMES)[number]["value"];

function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  const [timeframe, setTimeframe] = useState<TimeframeValue>("30d");

  const chartData = useMemo(() => {
    const def = TIMEFRAMES.find((t) => t.value === timeframe)!;
    let sliced = data;
    if (def.days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - def.days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      sliced = data.filter((p) => p.date >= cutoffStr);
    }
    return sliced.map((p) => ({ ...p, label: formatDateShort(p.date) }));
  }, [data, timeframe]);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Log a weight entry to see your trend here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        options={TIMEFRAMES.map((t) => ({ value: t.value, label: t.label }))}
        value={timeframe}
        onChange={setTimeframe}
      />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 1", "dataMax + 1"]}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value, name) => [
                `${Number(value).toFixed(1)} kg`,
                name === "weightKg" ? "Weight" : "7-day avg",
              ]}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              dot={{ r: 2 }}
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="rollingAvgKg"
              stroke="var(--calories)"
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
