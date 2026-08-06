import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    </div>
  );
}
