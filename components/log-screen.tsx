"use client";

import { useRef, useState, useTransition } from "react";
import { Barcode, ChevronLeft, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { AlertDialog } from "@/components/ui/alert-dialog";
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
  type MealItemInput,
  type LoggedCustomMeal,
  type OffSearchResult,
} from "@/app/(dashboard)/log/actions";

interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

function macrosForQuantity(
  food: { kcal100g: number; protein100g: number; carbs100g: number; fat100g: number },
  quantityG: number
): Macros {
  const factor = quantityG / 100;
  return {
    kcal: Math.round(food.kcal100g * factor),
    protein: Math.round(food.protein100g * factor),
    carbs: Math.round(food.carbs100g * factor),
    fat: Math.round(food.fat100g * factor),
  };
}

function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

interface TimelineEntry extends Macros {
  key: string;
  name: string;
  detail: string;
  glutenStatus: GlutenStatus | null;
  /** Present = a planned meal not yet logged (shows a "Log" action). */
  planMealId?: string;
  /** Present = an actually-logged entry (shows a delete action, counts toward the slot total). */
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
        ...m,
        glutenStatus: plan.food.glutenStatus,
        deletableId: plan.loggedMealLogId,
      });
    } else {
      entries.push({
        key: `plan-pending-${plan.id}`,
        name: plan.food.name,
        detail: `Planned · ${m.kcal} kcal`,
        ...m,
        glutenStatus: plan.food.glutenStatus,
        planMealId: plan.id,
      });
    }
  }

  for (const log of loggedMeals.filter((l) => l.mealType === slotType)) {
    const total = sumMacros(
      log.items.map((item) => ({
        kcal: item.kcal,
        protein: item.proteinG,
        carbs: item.carbsG,
        fat: item.fatG,
      }))
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

interface CartItem {
  key: string;
  food: FoodResult;
  quantityG: number;
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
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const [addSheetSlot, setAddSheetSlot] = useState<string | null>(null);
  const [sheetStep, setSheetStep] = useState<SheetStep>("browse");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [quantityG, setQuantityG] = useState(100);
  const [editingCartKey, setEditingCartKey] = useState<string | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [sheetMessage, setSheetMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [offResults, setOffResults] = useState<OffSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [resolvingCode, setResolvingCode] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against a slower, older search response overwriting a faster,
  // newer one — only the response whose seq still matches the latest
  // dispatched search is applied.
  const searchSeq = useRef(0);

  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  function openAddSheet(slotType: string) {
    setAddSheetSlot(slotType);
    setSheetStep("browse");
    setCart([]);
    setSelectedFood(null);
    setEditingCartKey(null);
    setSearchQuery("");
    setSearchResults([]);
    setOffResults([]);
    setSheetMessage(null);
    setRecentLoading(true);
    getRecentFoods().then((foods) => {
      setRecentFoods(foods);
      setRecentLoading(false);
    });
  }

  function closeAddSheet() {
    setAddSheetSlot(null);
    setScannerOpen(false);
    setCart([]);
    setSelectedFood(null);
    setEditingCartKey(null);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      searchSeq.current += 1;
      setSearchResults([]);
      setOffResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      const seq = ++searchSeq.current;
      const [local, off] = await Promise.all([searchFoods(value), searchOffFoods(value)]);
      if (seq !== searchSeq.current) return; // superseded by a newer search
      setSearchResults(local);
      const localNames = new Set(local.map((f) => f.name.toLowerCase()));
      setOffResults(off.filter((f) => !localNames.has(f.name.toLowerCase())));
      setSearchLoading(false);
    }, 300);
  }

  function pickNewFood(food: FoodResult, quantity = 100) {
    setSelectedFood(food);
    setQuantityG(quantity);
    setEditingCartKey(null);
    setSheetMessage(null);
    setSheetStep("quantity");
  }

  function editCartItem(item: CartItem) {
    setSelectedFood(item.food);
    setQuantityG(item.quantityG);
    setEditingCartKey(item.key);
    setSheetMessage(null);
    setSheetStep("quantity");
  }

  function removeCartItem(key: string) {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }

  function commitQuantity() {
    if (!selectedFood) return;
    if (editingCartKey) {
      setCart((prev) =>
        prev.map((item) => (item.key === editingCartKey ? { ...item, quantityG } : item))
      );
    } else {
      setCart((prev) => [
        ...prev,
        { key: `${selectedFood.id}-${Date.now()}`, food: selectedFood, quantityG },
      ]);
    }
    setSelectedFood(null);
    setEditingCartKey(null);
    setSheetStep("browse");
  }

  async function handleScan(barcode: string) {
    setScannerOpen(false);
    setSheetMessage("Looking up...");
    const result = await lookupBarcode(barcode);
    if (result.status === "found") {
      setSheetMessage(null);
      pickNewFood(result.food);
    } else if (result.status === "not_found") {
      setSheetMessage("Not found in Open Food Facts — enter it manually.");
      setSheetStep("manual");
    } else {
      setSheetMessage(result.message);
    }
  }

  async function handleSelectOffResult(result: OffSearchResult) {
    setResolvingCode(result.code);
    const lookup = await lookupBarcode(result.code);
    setResolvingCode(null);
    if (lookup.status === "found") {
      pickNewFood(lookup.food);
    } else {
      setSheetMessage("Couldn't load that product's details. Try again.");
    }
  }

  function handleSaveMeal() {
    if (!addSheetSlot || cart.length === 0) return;
    startTransition(async () => {
      const items: MealItemInput[] = cart.map((item) => ({
        foodId: item.food.id,
        quantityG: item.quantityG,
        kcal100g: item.food.kcal100g,
        protein100g: item.food.protein100g,
        carbs100g: item.food.carbs100g,
        fat100g: item.food.fat100g,
      }));
      const result = await logMeal(addSheetSlot, items);
      if (result.ok) {
        closeAddSheet();
      } else {
        setSheetMessage(result.message ?? "Couldn't save this meal. Try again.");
      }
    });
  }

  function handleLogPlanMeal(planMealId: string) {
    setBusyPlanId(planMealId);
    setListError(null);
    startTransition(async () => {
      const result = await logPlanMeal(planMealId);
      setBusyPlanId(null);
      if (!result.ok) setListError(result.message ?? "Couldn't log this meal. Try again.");
    });
  }

  function requestDelete(id: string, name: string) {
    setListError(null);
    setPendingDelete({ id, name });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    startTransition(async () => {
      const result = await deleteMealLog(id);
      setPendingDelete(null);
      if (!result.ok) setListError(result.message ?? "Couldn't remove that entry. Try again.");
    });
  }

  const activeSlotLabel = MEAL_SLOTS.find((s) => s.type === addSheetSlot)?.label ?? "";
  const cartTotals = sumMacros(cart.map((item) => macrosForQuantity(item.food, item.quantityG)));

  const sheetTitle =
    sheetStep === "quantity"
      ? editingCartKey
        ? `Edit ${selectedFood?.name ?? ""}`
        : (selectedFood?.name ?? "Add food")
      : sheetStep === "manual"
        ? "Add manually"
        : `Add to ${activeSlotLabel}`;

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

      {listError && <p className="text-sm text-destructive">{listError}</p>}

      {MEAL_SLOTS.map((slot) => {
        const entries = timelineForSlot(slot.type, planMeals, loggedMeals);
        const loggedEntries = entries.filter((e) => e.deletableId);
        const totals = sumMacros(loggedEntries);

        return (
          <section key={slot.type} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3 px-0.5">
              <div>
                <p className="text-sm font-semibold">{slot.label}</p>
                <p className="text-xs text-muted-foreground">{slot.time}</p>
              </div>
              {loggedEntries.length > 0 && (
                <div className="text-right">
                  <p className="tabular-data text-sm font-semibold">{totals.kcal} kcal</p>
                  <p className="tabular-data text-xs text-muted-foreground">
                    {loggedEntries.length} food{loggedEntries.length !== 1 ? "s" : ""} · P
                    {totals.protein} C{totals.carbs} F{totals.fat}
                  </p>
                </div>
              )}
            </div>

            {entries.length === 0 ? (
              <p className="py-1 text-xs text-muted-foreground">Nothing planned or logged</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {entries.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between gap-3 py-2.5">
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
                        disabled={isPending && busyPlanId === entry.planMealId}
                        onClick={() => handleLogPlanMeal(entry.planMealId!)}
                      >
                        Log
                      </Button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Remove ${entry.name}`}
                        onClick={() => requestDelete(entry.deletableId!, entry.name)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => openAddSheet(slot.type)}
              className="flex min-h-9 w-fit items-center gap-1 rounded-md text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <Plus className="size-3.5" strokeWidth={2.5} /> Add food
            </button>
          </section>
        );
      })}

      <GfDisclaimer />

      <Sheet open={addSheetSlot !== null && !scannerOpen} onClose={closeAddSheet} title={sheetTitle}>
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

            {sheetMessage && <p className="text-xs text-muted-foreground">{sheetMessage}</p>}

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
                        onClick={() => pickNewFood(food)}
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
                        onClick={() => pickNewFood(food, food.lastQuantityG)}
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
              onClick={() => {
                setSheetMessage(null);
                setSheetStep("manual");
              }}
              className="flex min-h-9 items-center text-left text-xs font-medium text-primary outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Can&apos;t find it — enter manually
            </button>

            {cart.length > 0 && (
              <div className="sticky bottom-0 -mx-4 mt-2 flex flex-col gap-2 border-t border-border bg-surface-sheet px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <p className="text-xs font-medium text-muted-foreground">Selected</p>
                <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
                  {cart.map((item) => {
                    const m = macrosForQuantity(item.food, item.quantityG);
                    return (
                      <div key={item.key} className="flex items-center justify-between gap-2 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => editCartItem(item)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-medium">{item.food.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="tabular-data text-xs text-muted-foreground">
                              {item.quantityG}g · {m.kcal} kcal
                            </span>
                            <GfBadge status={item.food.glutenStatus} />
                          </div>
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${item.food.name} from meal`}
                          onClick={() => removeCartItem(item.key)}
                          className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-medium">Meal total</span>
                  <span className="tabular-data text-sm font-semibold">{cartTotals.kcal} kcal</span>
                </div>
                <p className="tabular-data text-xs text-muted-foreground">
                  P {cartTotals.protein}g · C {cartTotals.carbs}g · F {cartTotals.fat}g
                </p>
                <Button onClick={handleSaveMeal} disabled={isPending}>
                  {isPending ? "Saving..." : `Add meal (${cart.length} item${cart.length > 1 ? "s" : ""})`}
                </Button>
              </div>
            )}
          </div>
        )}

        {sheetStep === "quantity" && selectedFood && (
          <div className="flex flex-col gap-5 pb-2">
            <button
              type="button"
              onClick={() => {
                setSheetStep("browse");
                setSelectedFood(null);
                setEditingCartKey(null);
              }}
              className="flex min-h-9 w-fit items-center gap-1 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
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

            <Button onClick={commitQuantity}>
              {editingCartKey ? "Save changes" : "Add to meal"}
            </Button>
            {editingCartKey && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  removeCartItem(editingCartKey);
                  setSheetStep("browse");
                  setSelectedFood(null);
                  setEditingCartKey(null);
                }}
              >
                Remove from meal
              </Button>
            )}
          </div>
        )}

        {sheetStep === "manual" && (
          <ManualEntryForm
            onBack={() => setSheetStep("browse")}
            onCreated={(food) => pickNewFood(food)}
          />
        )}
      </Sheet>

      {scannerOpen && (
        <BarcodeScannerModal
          onScan={handleScan}
          onClose={() => {
            setScannerOpen(false);
            setSheetMessage(null);
          }}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        title="Remove meal?"
        description={
          pendingDelete ? `${pendingDelete.name} will be removed from today's log.` : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        pending={isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const food = await createManualFood({
      name,
      kcal100g: Number(kcal) || 0,
      protein100g: Number(protein) || 0,
      carbs100g: Number(carbs) || 0,
      fat100g: Number(fat) || 0,
      glutenStatus,
    });
    setSaving(false);
    if (food) {
      onCreated(food);
    } else {
      setError("Couldn't save that food. Try again.");
    }
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Adding..." : "Continue"}
      </Button>
    </form>
  );
}
