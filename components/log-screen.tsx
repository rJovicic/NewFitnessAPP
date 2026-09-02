"use client";

import { useRef, useState, useTransition } from "react";
import { Barcode, ChevronLeft, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { GfBadge, type GlutenStatus } from "@/components/gf-badge";
import { GfDisclaimer } from "@/components/gf-disclaimer";
import { BarcodeScannerModal } from "@/components/barcode-scanner";
import { QuantityStepper } from "@/components/fitness/quantity-stepper";
import { MEAL_SLOTS } from "@/lib/meal-slots";
import {
  logPlanMeal,
  logMeal,
  lookupBarcode,
  searchFoods,
  searchOffFoods,
  createManualFood,
  deleteMealLog,
  getRecentFoods,
  type PlanMealEntry,
  type FoodResult,
  type RecentFood,
  type LoggedCustomMeal,
  type OffSearchResult,
} from "@/app/(dashboard)/log/actions";

function macrosForQuantity(food: {
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
}, quantityG: number) {
  const factor = quantityG / 100;
  return {
    kcal: Math.round(food.kcal100g * factor),
    protein: Math.round(food.protein100g * factor),
    carbs: Math.round(food.carbs100g * factor),
    fat: Math.round(food.fat100g * factor),
  };
}

interface TimelineEntry {
  key: string;
  name: string;
  detail: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  glutenStatus: GlutenStatus | null;
  planMealId?: string;
  deletableId?: string;
}

function timelineForSlot(
  slotType: string,
  planMeals: PlanMealEntry[],
  loggedMeals: LoggedCustomMeal[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const plan = planMeals.find((p) => p.mealType === slotType);

  if (plan) {
    const m = macrosForQuantity(plan.food, 100);
    if (plan.isLogged && plan.loggedMealLogId) {
      entries.push({
        key: `plan-${plan.id}`,
        name: plan.food.name,
        detail: "Planned meal",
        kcal: m.kcal,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        glutenStatus: plan.food.glutenStatus,
        deletableId: plan.loggedMealLogId,
      });
    } else {
      entries.push({
        key: `plan-pending-${plan.id}`,
        name: plan.food.name,
        detail: `Planned · ${m.kcal} kcal`,
        kcal: m.kcal,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        glutenStatus: plan.food.glutenStatus,
        planMealId: plan.id,
      });
    }
  }

  for (const log of loggedMeals.filter((l) => l.mealType === slotType)) {
    const total = log.items.reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.kcal,
        protein: acc.protein + item.proteinG,
        carbs: acc.carbs + item.carbsG,
        fat: acc.fat + item.fatG,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );
    entries.push({
      key: `log-${log.id}`,
      name: log.items.map((i) => i.name).join(", ") || "Logged item",
      detail:
        log.items.length === 1
          ? `${Math.round(log.items[0].quantityG)}g`
          : `${log.items.length} items`,
      kcal: Math.round(total.kcal),
      protein: Math.round(total.protein),
      carbs: Math.round(total.carbs),
      fat: Math.round(total.fat),
      glutenStatus: log.items[0]?.glutenStatus ?? null,
      deletableId: log.id,
    });
  }

  return entries;
}

type SheetStep = "browse" | "quantity" | "manual";

export function LogScreen({
  planMeals,
  loggedMeals,
  loggedKcal,
  targetKcal,
}: {
  planMeals: PlanMealEntry[];
  loggedMeals: LoggedCustomMeal[];
  loggedKcal: number;
  targetKcal: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [addSheetSlot, setAddSheetSlot] = useState<string | null>(null);
  const [sheetStep, setSheetStep] = useState<SheetStep>("browse");
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [quantityG, setQuantityG] = useState(100);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [offResults, setOffResults] = useState<OffSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resolvingCode, setResolvingCode] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  function openAddSheet(slotType: string) {
    setAddSheetSlot(slotType);
    setSheetStep("browse");
    setSelectedFood(null);
    setSearchQuery("");
    setSearchResults([]);
    setOffResults([]);
    setScanMessage(null);
    setRecentLoading(true);
    getRecentFoods().then((foods) => {
      setRecentFoods(foods);
      setRecentLoading(false);
    });
  }

  function closeAddSheet() {
    setAddSheetSlot(null);
    setScannerOpen(false);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setOffResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const [local, off] = await Promise.all([searchFoods(value), searchOffFoods(value)]);
      setSearchResults(local);
      const localNames = new Set(local.map((f) => f.name.toLowerCase()));
      setOffResults(off.filter((f) => !localNames.has(f.name.toLowerCase())));
      setSearchLoading(false);
    }, 300);
  }

  function pickFood(food: FoodResult, quantity = 100) {
    setSelectedFood(food);
    setQuantityG(quantity);
    setSheetStep("quantity");
  }

  async function handleScan(barcode: string) {
    setScannerOpen(false);
    setScanMessage("Looking up...");
    const result = await lookupBarcode(barcode);
    if (result.status === "found") {
      setScanMessage(null);
      pickFood(result.food);
    } else if (result.status === "not_found") {
      setScanMessage("Not found in Open Food Facts — enter it manually.");
      setSheetStep("manual");
    } else {
      setScanMessage(result.message);
    }
  }

  async function handleSelectOffResult(result: OffSearchResult) {
    setResolvingCode(result.code);
    const lookup = await lookupBarcode(result.code);
    setResolvingCode(null);
    if (lookup.status === "found") {
      pickFood(lookup.food);
    } else {
      setScanMessage("Couldn't load that product's details. Try again.");
    }
  }

  function handleAddToMeal() {
    if (!selectedFood || !addSheetSlot) return;
    startTransition(async () => {
      const result = await logMeal(addSheetSlot, [
        {
          foodId: selectedFood.id,
          quantityG,
          kcal100g: selectedFood.kcal100g,
          protein100g: selectedFood.protein100g,
          carbs100g: selectedFood.carbs100g,
          fat100g: selectedFood.fat100g,
        },
      ]);
      if (result.ok) {
        closeAddSheet();
      } else {
        setScanMessage(result.message ?? "Couldn't save. Try again.");
      }
    });
  }

  function handleLogPlanMeal(planMealId: string) {
    setBusyKey(planMealId);
    startTransition(async () => {
      await logPlanMeal(planMealId);
      setBusyKey(null);
    });
  }

  function handleDelete(deletableId: string, name: string) {
    if (!window.confirm(`Remove "${name}" from today's log?`)) return;
    setBusyKey(deletableId);
    startTransition(async () => {
      await deleteMealLog(deletableId);
      setBusyKey(null);
    });
  }

  const activeSlotLabel = MEAL_SLOTS.find((s) => s.type === addSheetSlot)?.label ?? "";

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-muted-foreground">Today&apos;s total</p>
        <p className="tabular-data text-sm font-semibold">
          {loggedKcal.toLocaleString()}
          <span className="font-normal text-muted-foreground">
            {" "}
            / {targetKcal.toLocaleString()} kcal
          </span>
        </p>
      </div>

      {MEAL_SLOTS.map((slot) => {
        const entries = timelineForSlot(slot.type, planMeals, loggedMeals);
        return (
          <section key={slot.type} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-0.5">
              <div>
                <p className="text-sm font-semibold">{slot.label}</p>
                <p className="text-xs text-muted-foreground">{slot.time}</p>
              </div>
              <button
                type="button"
                onClick={() => openAddSheet(slot.type)}
                className="flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:bg-muted"
              >
                <Plus className="size-3.5" strokeWidth={2.5} /> Add food
              </button>
            </div>

            <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
              {entries.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground">Nothing logged yet</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="tabular-data text-xs text-muted-foreground">
                          {entry.detail} · {entry.kcal} kcal
                        </span>
                        {entry.glutenStatus && <GfBadge status={entry.glutenStatus} />}
                      </div>
                    </div>
                    {entry.planMealId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending && busyKey === entry.planMealId}
                        onClick={() => handleLogPlanMeal(entry.planMealId!)}
                      >
                        Log
                      </Button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Remove ${entry.name}`}
                        disabled={isPending && busyKey === entry.deletableId}
                        onClick={() => handleDelete(entry.deletableId!, entry.name)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}

      <GfDisclaimer />

      <Sheet
        open={addSheetSlot !== null && !scannerOpen}
        onClose={closeAddSheet}
        title={sheetStep === "quantity" ? selectedFood?.name ?? "Add food" : `Add to ${activeSlotLabel}`}
      >
        {sheetStep === "browse" && (
          <div className="flex flex-col gap-4 pb-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
              <Barcode className="size-4" /> Scan barcode
            </Button>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Search foods..."
                aria-label="Search foods"
                className="pl-10"
              />
            </div>

            {scanMessage && <p className="text-xs text-muted-foreground">{scanMessage}</p>}

            {searchQuery.trim().length >= 2 ? (
              <div className="flex flex-col gap-1">
                {searchLoading ? (
                  <p className="py-2 text-xs text-muted-foreground">Searching...</p>
                ) : searchResults.length === 0 && offResults.length === 0 ? (
                  <p className="py-2 text-xs text-muted-foreground">
                    No matches. Try a different search or add it manually.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {searchResults.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => pickFood(food)}
                        className="flex min-h-12 items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="truncate">{food.name}</span>
                        <GfBadge status={food.glutenStatus} />
                      </button>
                    ))}
                    {offResults.map((result) => (
                      <button
                        key={result.code}
                        type="button"
                        onClick={() => handleSelectOffResult(result)}
                        disabled={resolvingCode === result.code}
                        className="flex min-h-12 items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted disabled:opacity-50"
                      >
                        <span className="truncate">
                          {result.name}
                          {result.brand && (
                            <span className="text-muted-foreground"> · {result.brand}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {resolvingCode === result.code ? "Loading..." : "Open Food Facts"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Recent</p>
                {recentLoading ? (
                  <p className="py-2 text-xs text-muted-foreground">Loading...</p>
                ) : recentFoods.length === 0 ? (
                  <p className="py-2 text-xs text-muted-foreground">
                    Foods you log will show up here for a one-tap re-add.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                    {recentFoods.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => pickFood(food, food.lastQuantityG)}
                        className="flex min-h-12 items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                      >
                        <span className="truncate">{food.name}</span>
                        <GfBadge status={food.glutenStatus} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSheetStep("manual")}
              className="text-left text-xs font-medium text-primary"
            >
              Can&apos;t find it — enter manually
            </button>
          </div>
        )}

        {sheetStep === "quantity" && selectedFood && (
          <div className="flex flex-col gap-5 pb-2">
            <button
              type="button"
              onClick={() => setSheetStep("browse")}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
            >
              <ChevronLeft className="size-3.5" /> Back
            </button>

            <GfBadge status={selectedFood.glutenStatus} />

            <div className="flex justify-center py-2">
              <QuantityStepper value={quantityG} onChange={setQuantityG} step={10} min={5} />
            </div>

            {(() => {
              const m = macrosForQuantity(selectedFood, quantityG);
              return (
                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="tabular-data text-2xl font-semibold">{m.kcal} kcal</p>
                  <p className="tabular-data text-xs text-muted-foreground">
                    Protein {m.protein}g · Carbs {m.carbs}g · Fat {m.fat}g
                  </p>
                </div>
              );
            })()}

            {scanMessage && <p className="text-sm text-destructive">{scanMessage}</p>}

            <Button onClick={handleAddToMeal} disabled={isPending}>
              {isPending ? "Adding..." : "Add to meal"}
            </Button>
          </div>
        )}

        {sheetStep === "manual" && (
          <ManualEntryForm
            onBack={() => setSheetStep("browse")}
            onCreated={(food) => pickFood(food)}
          />
        )}
      </Sheet>

      {scannerOpen && (
        <BarcodeScannerModal
          onScan={handleScan}
          onClose={() => {
            setScannerOpen(false);
            setScanMessage(null);
          }}
        />
      )}
    </div>
  );
}

function ManualEntryForm({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (food: FoodResult) => void;
}) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [glutenStatus, setGlutenStatus] = useState<GlutenStatus>("unknown");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const food = await createManualFood({
      name,
      kcal100g: Number(kcal) || 0,
      protein100g: Number(protein) || 0,
      carbs100g: Number(carbs) || 0,
      fat100g: Number(fat) || 0,
      glutenStatus,
    });
    setSaving(false);
    if (food) onCreated(food);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pb-2">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ChevronLeft className="size-3.5" /> Back
      </button>
      <p className="text-xs text-muted-foreground">
        Enter macros per 100g — used to scale to whatever quantity you log.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="manual-name" className="text-xs font-medium text-muted-foreground">
          Name
        </label>
        <Input
          id="manual-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manual-kcal" className="text-xs font-medium text-muted-foreground">
            Calories
          </label>
          <Input
            id="manual-kcal"
            type="number"
            inputMode="decimal"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manual-protein" className="text-xs font-medium text-muted-foreground">
            Protein (g)
          </label>
          <Input
            id="manual-protein"
            type="number"
            inputMode="decimal"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manual-carbs" className="text-xs font-medium text-muted-foreground">
            Carbs (g)
          </label>
          <Input
            id="manual-carbs"
            type="number"
            inputMode="decimal"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="manual-fat" className="text-xs font-medium text-muted-foreground">
            Fat (g)
          </label>
          <Input
            id="manual-fat"
            type="number"
            inputMode="decimal"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="manual-gluten" className="text-xs font-medium text-muted-foreground">
          Gluten status
        </label>
        <select
          id="manual-gluten"
          value={glutenStatus}
          onChange={(e) => setGlutenStatus(e.target.value as GlutenStatus)}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="unknown">Unknown — check label</option>
          <option value="gf_labeled">Labeled GF</option>
          <option value="contains_gluten">Contains gluten</option>
        </select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Adding..." : "Continue"}
      </Button>
    </form>
  );
}
