"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function updateFastingWindow(formData: FormData) {
  const start = formData.get("eating_window_start");
  const end = formData.get("eating_window_end");

  if (
    typeof start !== "string" ||
    typeof end !== "string" ||
    !TIME_PATTERN.test(start) ||
    !TIME_PATTERN.test(end)
  ) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ eating_window_start: start, eating_window_end: end })
    .eq("id", user.id);

  revalidatePath("/");
  revalidatePath("/settings");
}
