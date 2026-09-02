import Link from "next/link";
import { Camera, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/fitness/page-header";
import { addonRegistry } from "@/lib/addon-registry";
import { getDashboardData } from "@/lib/dashboard-data";
import { todayInAppTimezone } from "@/lib/timezone";
import { updateFastingWindow } from "./actions";

// Plain utility rows under a section label — no card wrapper. Settings is
// the screen where "quiet, not another rounded module" matters most: every
// row here is a boring, low-stakes preference, not a hero surface.
function SettingsSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label">{label}</p>
      <div className="flex flex-col divide-y divide-border border-t border-border">{children}</div>
    </div>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, dashboardData] = await Promise.all([
    user
      ? supabase
          .from("profiles")
          .select("eating_window_start, eating_window_end")
          .eq("id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    getDashboardData(todayInAppTimezone()),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-6 px-4 py-4">
        <SettingsSection label="Account">
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium">Account</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <SignOutButton />
          </div>
        </SettingsSection>

        <SettingsSection label="Plan">
          <div className="flex flex-col gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium">Fasting window</p>
              <p className="text-xs text-muted-foreground">
                Your daily eating window. Adjust it if your schedule shifts.
              </p>
            </div>
            <form action={updateFastingWindow} className="flex items-end gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="eating_window_start" className="text-xs text-muted-foreground">
                  Opens
                </label>
                <Input
                  id="eating_window_start"
                  name="eating_window_start"
                  type="time"
                  defaultValue={profile?.eating_window_start?.slice(0, 5) ?? "10:00"}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="eating_window_end" className="text-xs text-muted-foreground">
                  Closes
                </label>
                <Input
                  id="eating_window_end"
                  name="eating_window_end"
                  type="time"
                  defaultValue={profile?.eating_window_end?.slice(0, 5) ?? "19:30"}
                />
              </div>
              <Button type="submit" size="sm">
                Save
              </Button>
            </form>
          </div>
          {dashboardData && (
            <div className="py-3.5">
              <p className="text-sm font-medium">Nutrition targets</p>
              <p className="text-xs text-muted-foreground">
                Recalculated live from your latest weigh-in — not editable directly.
              </p>
              <p className="tabular-data mt-1.5 text-xs text-muted-foreground">
                {dashboardData.targets.targetKcal.toLocaleString()} kcal · P
                {dashboardData.targets.proteinG} C{dashboardData.targets.carbsG} F
                {dashboardData.targets.fatG}
              </p>
            </div>
          )}
        </SettingsSection>

        <SettingsSection label="Data">
          <Link
            href="/progress"
            className="-mx-1 flex min-h-14 items-center gap-3 rounded-md px-1 py-3.5 hover:bg-muted"
          >
            <Camera className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <p className="text-sm font-medium">Progress photos</p>
          </Link>
          <div className="py-3.5">
            <p className="text-sm font-medium">Health data</p>
            <p className="text-xs text-muted-foreground">
              Steps and sleep sync automatically once Health Auto Export is configured on your
              phone — see docs/apple-health-setup.md.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection label="App">
          <div className="flex items-center gap-3 py-3.5">
            <Smartphone className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium">Install app</p>
              <p className="text-xs text-muted-foreground">
                Add to your home screen from your browser&apos;s share menu for the full-screen
                app experience.
              </p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection label="Add-ons">
          <div className="flex flex-col gap-2 py-3.5">
            {addonRegistry.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No add-ons yet. Approved extras get a line here — nothing to configure until
                then.
              </p>
            ) : (
              addonRegistry.map((addon) => (
                <Link key={addon.id} href={addon.href} className="text-sm underline">
                  {addon.label}
                </Link>
              ))
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
