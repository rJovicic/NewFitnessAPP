import type { ReactNode } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { MacrosTile } from "@/components/tiles/macros-tile";
import { WaterTile } from "@/components/tiles/water-tile";
import { StreakTile } from "@/components/tiles/streak-tile";
import { FastingTile } from "@/components/tiles/fasting-tile";

export interface DashboardTile {
  id: string;
  span: "full" | "half";
  render: (data: DashboardData) => ReactNode;
}

// The extension point Phase 9 proves out: adding a tile later is one
// entry here, not a rewrite of the dashboard layout — see CLAUDE.md §7.
export const dashboardTiles: DashboardTile[] = [
  { id: "macros", span: "full", render: (data) => <MacrosTile data={data} /> },
  { id: "water", span: "half", render: (data) => <WaterTile data={data} /> },
  { id: "streak", span: "half", render: () => <StreakTile /> },
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
