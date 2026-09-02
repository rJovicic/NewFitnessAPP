import type { ReactNode } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { WaterTile } from "@/components/tiles/water-tile";
import { StepsTile } from "@/components/tiles/steps-tile";
import { StreakTile } from "@/components/tiles/streak-tile";
import { FastingTile } from "@/components/tiles/fasting-tile";
import { MoodTile } from "@/components/tiles/mood-tile";
import { WeeklySummaryTile } from "@/components/tiles/weekly-summary-tile";
import { ProgramProgressTile } from "@/components/tiles/program-progress-tile";

export interface DashboardTile {
  id: string;
  span: "full" | "half";
  render: (data: DashboardData) => ReactNode;
}

// The extension point Phase 9 proves out: adding a tile later is one
// entry here, not a rewrite of the dashboard layout — see CLAUDE.md §7.
// The calorie ring + macro bars are the one deliberate exception: they're
// fused into <CalorieHero> as the dashboard's signature surface (CLAUDE.md
// §16) and rendered directly by the Home page, not from this registry.
export const dashboardTiles: DashboardTile[] = [
  { id: "water", span: "half", render: (data) => <WaterTile data={data} /> },
  { id: "steps", span: "half", render: (data) => <StepsTile data={data} /> },
  { id: "streak", span: "half", render: (data) => <StreakTile streak={data.streak} /> },
  { id: "mood", span: "half", render: () => <MoodTile /> },
  { id: "weekly-summary", span: "half", render: () => <WeeklySummaryTile /> },
  { id: "program-progress", span: "half", render: () => <ProgramProgressTile /> },
  {
    id: "fasting",
    span: "full",
    render: (data) => (
      <FastingTile
        windowStart={data.fastingWindow.start}
        windowEnd={data.fastingWindow.end}
      />
    ),
  },
];
