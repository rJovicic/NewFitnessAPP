import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { todayInAppTimezone } from "@/lib/timezone";

// Health Auto Export's REST API export shape:
// { "data": { "metrics": [ { "name": "step_count", "data": [{ "date": "...", "qty": 8532 }] } ] } }
// Different metric families use different value fields on each data point
// (heart_rate uses Avg, sleep_analysis uses asleep) — see extractValue below.
const METRIC_NAME_MAP: Record<string, string> = {
  step_count: "steps",
  heart_rate: "heart_rate",
  resting_heart_rate: "resting_heart_rate",
  sleep_analysis: "sleep_hours",
  active_energy: "active_energy_kcal",
  weight_body_mass: "weight_kg",
};

interface HealthAutoExportDataPoint {
  date: string;
  qty?: number;
  Avg?: number;
  asleep?: number;
}

interface HealthAutoExportMetric {
  name: string;
  data?: HealthAutoExportDataPoint[];
}

function parseRecordedAt(dateStr: string): Date {
  // "2024-01-15 08:30:00 +0000" -> "2024-01-15T08:30:00+00:00"
  const match = dateStr.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/
  );
  if (match) {
    const [, date, time, offH, offM] = match;
    return new Date(`${date}T${time}${offH}:${offM}`);
  }
  return new Date(dateStr);
}

function extractValue(metricName: string, point: HealthAutoExportDataPoint): number | null {
  if (metricName === "heart_rate" && typeof point.Avg === "number") return point.Avg;
  if (metricName === "sleep_analysis" && typeof point.asleep === "number") return point.asleep;
  if (typeof point.qty === "number") return point.qty;
  return null;
}

function checkAuth(request: NextRequest): NextResponse | null {
  const expectedToken = process.env.HEALTH_WEBHOOK_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Health Auto Export pings the endpoint with a GET/HEAD before the real
// POST sync when an automation is saved or run manually — without this,
// that connectivity check 405s and the app reports the automation as
// failed even though the actual sync would have worked.
export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  return NextResponse.json({ ok: true, message: "Health webhook is reachable. Use POST to sync data." });
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  let body: { data?: { metrics?: HealthAutoExportMetric[] } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase.from("profiles").select("id").single();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "No profile found" }, { status: 500 });
  }

  let rowsWritten = 0;
  let weightRowsWritten = 0;

  for (const metric of body.data?.metrics ?? []) {
    const metricType = METRIC_NAME_MAP[metric.name];
    if (!metricType) continue;

    for (const point of metric.data ?? []) {
      const value = extractValue(metric.name, point);
      if (value === null) continue;
      const recordedAt = parseRecordedAt(point.date);

      const { error } = await supabase.from("health_metrics").upsert(
        {
          profile_id: profile.id,
          metric_type: metricType,
          recorded_at: recordedAt.toISOString(),
          value,
          raw: point,
          source: "health_auto_export",
        },
        { onConflict: "profile_id,metric_type,recorded_at" }
      );
      if (!error) rowsWritten++;

      if (metricType === "weight_kg") {
        const dateStr = todayInAppTimezone(recordedAt);
        const { error: weightError } = await supabase.from("weight_logs").upsert(
          { profile_id: profile.id, logged_at: dateStr, weight_kg: value },
          { onConflict: "profile_id,logged_at" }
        );
        if (!weightError) weightRowsWritten++;
      }
    }
  }

  return NextResponse.json({ ok: true, rowsWritten, weightRowsWritten });
}
