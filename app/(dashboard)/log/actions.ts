"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchOffProduct, searchOffProducts, type OffSearchResult } from "@/lib/off";
import { recomputeFastingHonored } from "@/lib/daily-activity";
import { todayInAppTimezone, weekdayIndex, zonedDayRangeUtc } from "@/lib/timezone";
import type { GlutenStatus } from "@/components/gf-badge";

export interface FoodResult {
  id: string;
  name: string;
  brand: string | null;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  glutenStatus: GlutenStatus;
}

interface FoodRow {
  id: string;
  name: string;
  brand: string | null;
  kcal_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  gluten_status: GlutenStatus;
}

function toFoodResult(row: FoodRow): FoodResult {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    kcal100g: Number(row.kcal_100g),
    protein100g: Number(row.protein_100g),
    carbs100g: Number(row.carbs_100g),
    fat100g: Number(row.fat_100g),
    glutenStatus: row.gluten_status,
  };
}

export type LookupResult =
  | { status: "found"; food: FoodResult }
  | { status: "not_found" }
  | { status: "error"; message: string };

export async function lookupBarcode(barcode: string): Promise<LookupResult> {
  const supabase = await createClient();

  const { data: cached } = await supabase
    .from("foods")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  if (cached) return { status: "found", food: toFoodResult(cached) };

  let product;
  try {
    product = await fetchOffProduct(barcode);
  } catch {
    return {
      status: "error",
      message: "Couldn't reach Open Food Facts. Try again or enter manually.",
    };
  }

  if (!product) return { status: "not_found" };

  const { data: inserted, error } = await supabase
    .from("foods")
    .insert({
      source: "off",
      barcode,
      name: product.name,
      brand: product.brand,
      kcal_100g: product.kcal100g,
      protein_100g: product.protein100g,
      carbs_100g: product.carbs100g,
      fat_100g: product.fat100g,
      gluten_status: product.glutenStatus,
      off_raw: product.raw,
    })
    .select()
    .single();

  if (error || !inserted) {
    // Possible race: a concurrent scan already cached this barcode.
    const { data: retryCached } = await supabase
      .from("foods")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();
    if (retryCached) return { status: "found", food: toFoodResult(retryCached) };
    return { status: "error", message: "Found the product but couldn't save it. Try again." };
  }

  return { status: "found", food: toFoodResult(inserted) };
}

export async function searchFoods(query: string): Promise<FoodResult[]> {
  if (!query.trim()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select("*")
    .ilike("name", `%${query.trim()}%`)
    .limit(20);
  return (data ?? []).map(toFoodResult);
}

export type { OffSearchResult };

// Text search against Open Food Facts for packaged products not yet in the
// local cache. Results are previews only (no macros) — selecting one
// re-resolves through lookupBarcode() so caching/gluten-status derivation
// stays on the single tested code path instead of being duplicated here.
export async function searchOffFoods(query: string): Promise<OffSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    return await searchOffProducts(trimmed);
  } catch {
    return [];
  }
}

export async function createManualFood(input: {
  name: string;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  glutenStatus: GlutenStatus;
}): Promise<FoodResult | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("foods")
    .insert({
      source: "manual",
      name: input.name,
      kcal_100g: input.kcal100g,
      protein_100g: input.protein100g,
      carbs_100g: input.carbs100g,
      fat_100g: input.fat100g,
      gluten_status: input.glutenStatus,
    })
    .select()
    .single();
  if (error || !data) return null;
  return toFoodResult(data);
}

export interface PlanMealEntry {
  id: string;
  mealType: string;
  food: FoodResult;
  isLogged: boolean;
}

export async function getTodaysPlanMeals(): Promise<PlanMealEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dateStr = todayInAppTimezone();
  const weekday = weekdayIndex(dateStr);

  const { data } = await supabase
    .from("plan_meals")
    .select("id, meal_type, foods(*)")
    .eq("weekday", weekday);

  let loggedPlanMealIds = new Set<string>();
  if (user) {
    const { start, end } = zonedDayRangeUtc(dateStr);
    const { data: todaysPlanLogs } = await supabase
      .from("meal_logs")
      .select("plan_day_ref")
      .eq("profile_id", user.id)
      .eq("source", "plan")
      .gte("logged_at", start.toISOString())
      .lt("logged_at", end.toISOString());
    loggedPlanMealIds = new Set((todaysPlanLogs ?? []).map((l) => l.plan_day_ref));
  }

  return (data ?? [])
    .filter((row) => row.foods)
    .map((row) => ({
      id: row.id,
      mealType: row.meal_type,
      food: toFoodResult(row.foods as unknown as FoodRow),
      isLogged: loggedPlanMealIds.has(row.id),
    }));
}

export interface LoggedCustomMealItem {
  name: string;
  quantityG: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  glutenStatus: GlutenStatus | null;
}

export interface LoggedCustomMeal {
  id: string;
  mealType: string;
  items: LoggedCustomMealItem[];
}

interface LoggedMealItemRow {
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  custom_name: string | null;
  foods: { name: string; gluten_status: GlutenStatus } | null;
}

export async function getTodaysCustomMeals(): Promise<LoggedCustomMeal[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const dateStr = todayInAppTimezone();
  const { start, end } = zonedDayRangeUtc(dateStr);

  const { data } = await supabase
    .from("meal_logs")
    .select(
      "id, meal_type, logged_at, meal_items(quantity_g, kcal, protein_g, carbs_g, fat_g, custom_name, foods(name, gluten_status))"
    )
    .eq("profile_id", user.id)
    .eq("source", "custom")
    .gte("logged_at", start.toISOString())
    .lt("logged_at", end.toISOString())
    .order("logged_at", { ascending: false });

  return (data ?? []).map((log) => ({
    id: log.id,
    mealType: log.meal_type,
    items: ((log.meal_items as unknown as LoggedMealItemRow[]) ?? []).map((item) => ({
      name: item.foods?.name ?? item.custom_name ?? "Item",
      quantityG: Number(item.quantity_g),
      kcal: Number(item.kcal),
      proteinG: Number(item.protein_g),
      carbsG: Number(item.carbs_g),
      fatG: Number(item.fat_g),
      glutenStatus: item.foods?.gluten_status ?? null,
    })),
  }));
}

async function finishMealLogging(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string
) {
  const dateStr = todayInAppTimezone();

  const { data: existing } = await supabase
    .from("daily_activity")
    .select("meals_logged_count")
    .eq("profile_id", profileId)
    .eq("activity_date", dateStr)
    .maybeSingle();

  await supabase.from("daily_activity").upsert(
    {
      profile_id: profileId,
      activity_date: dateStr,
      meals_logged_count: (existing?.meals_logged_count ?? 0) + 1,
    },
    { onConflict: "profile_id,activity_date" }
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("eating_window_start, eating_window_end")
    .eq("id", profileId)
    .single();

  if (profile) {
    await recomputeFastingHonored(
      profileId,
      dateStr,
      profile.eating_window_start,
      profile.eating_window_end
    );
  }

  revalidatePath("/");
  revalidatePath("/log");
}

export async function logPlanMeal(
  planMealId: string
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: planMeal } = await supabase
    .from("plan_meals")
    .select("meal_type, foods(*)")
    .eq("id", planMealId)
    .single();

  if (!planMeal?.foods) return { ok: false, message: "Couldn't find that meal." };
  const food = planMeal.foods as unknown as FoodRow;

  const { data: mealLog, error: mealLogError } = await supabase
    .from("meal_logs")
    .insert({
      profile_id: user.id,
      meal_type: planMeal.meal_type,
      source: "plan",
      plan_day_ref: planMealId,
    })
    .select()
    .single();

  if (mealLogError || !mealLog) {
    return { ok: false, message: "Couldn't log this meal. Try again." };
  }

  // quantity_g = 100 means "the full recipe" for source='recipe' foods,
  // per the convention documented in migration 0001.
  const { error: itemError } = await supabase.from("meal_items").insert({
    meal_log_id: mealLog.id,
    food_id: food.id,
    quantity_g: 100,
    kcal: food.kcal_100g,
    protein_g: food.protein_100g,
    carbs_g: food.carbs_100g,
    fat_g: food.fat_100g,
  });

  if (itemError) return { ok: false, message: "Couldn't save the meal item. Try again." };

  await finishMealLogging(supabase, user.id);
  return { ok: true };
}

export interface MealItemInput {
  foodId?: string;
  customName?: string;
  quantityG: number;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
}

export async function logMeal(
  mealType: string,
  items: MealItemInput[]
): Promise<{ ok: boolean; message?: string }> {
  if (items.length === 0) return { ok: false, message: "Add at least one item." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: mealLog, error: mealLogError } = await supabase
    .from("meal_logs")
    .insert({ profile_id: user.id, meal_type: mealType, source: "custom" })
    .select()
    .single();

  if (mealLogError || !mealLog) {
    return { ok: false, message: "Couldn't log this meal. Try again." };
  }

  const rows = items.map((item) => ({
    meal_log_id: mealLog.id,
    food_id: item.foodId ?? null,
    custom_name: item.customName ?? null,
    quantity_g: item.quantityG,
    kcal: (item.kcal100g * item.quantityG) / 100,
    protein_g: (item.protein100g * item.quantityG) / 100,
    carbs_g: (item.carbs100g * item.quantityG) / 100,
    fat_g: (item.fat100g * item.quantityG) / 100,
  }));

  const { error: itemsError } = await supabase.from("meal_items").insert(rows);
  if (itemsError) return { ok: false, message: "Couldn't save the items. Try again." };

  await finishMealLogging(supabase, user.id);
  return { ok: true };
}
