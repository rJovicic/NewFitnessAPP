import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { updateFastingWindow } from "./actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("eating_window_start, eating_window_end")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Account</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <SignOutButton />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm font-medium">Fasting window</p>
          <p className="text-xs text-muted-foreground">
            Your daily eating window. Adjust it if your schedule shifts.
          </p>
          <form action={updateFastingWindow} className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="eating_window_start" className="text-xs text-muted-foreground">
                Opens
              </label>
              <input
                id="eating_window_start"
                name="eating_window_start"
                type="time"
                defaultValue={profile?.eating_window_start?.slice(0, 5) ?? "10:00"}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="eating_window_end" className="text-xs text-muted-foreground">
                Closes
              </label>
              <input
                id="eating_window_end"
                name="eating_window_end"
                type="time"
                defaultValue={profile?.eating_window_end?.slice(0, 5) ?? "19:30"}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
            <Button type="submit" size="sm">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
