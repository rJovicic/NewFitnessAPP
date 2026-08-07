"use client";

import { useState, useTransition } from "react";
import { Barcode, Search, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GfBadge, type GlutenStatus } from "@/components/gf-badge";
import { GfDisclaimer } from "@/components/gf-disclaimer";
import { BarcodeScannerModal } from "@/components/barcode-scanner";
import { MEAL_SLOTS, mealSlotLabel } from "@/lib/meal-slots";
import {
  logPlanMeal,
  logMeal,
  lookupBarcode,
  searchFoods,
  createManualFood,
  type PlanMealEntry,
  type FoodResult,
  type MealItemInput,
  type LoggedCustomMeal,
} from "@/app/(dashboard)/log/actions";

interface CartItem extends MealItemInput {
  key: string;
  name: string;
  glutenStatus?: GlutenStatus;
}

function macrosForQuantity(item: MealItemInput) {
  const factor = item.quantityG / 100;
  return {
    kcal: Math.round(item.kcal100g * factor),
    protein: Math.round(item.protein100g * factor),
    carbs: Math.round(item.carbs100g * factor),
    fat: Math.round(item.fat100g * factor),
  };
}

export function LogScreen({
  planMeals,
  loggedMeals,
}: {
  planMeals: PlanMealEntry[];
  loggedMeals: LoggedCustomMeal[];
}) {
  const [isPending, startTransition] = useTransition();
  const [loggingPlanId, setLoggingPlanId] = useState<string | null>(null);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [mealType, setMealType] = useState<string>(MEAL_SLOTS[0].type);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodResult[]>([]);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function addToCart(food: FoodResult) {
    setCart((prev) => [
      ...prev,
      {
        key: `${food.id}-${Date.now()}`,
        foodId: food.id,
        name: food.name,
        quantityG: 100,
        kcal100g: food.kcal100g,
        protein100g: food.protein100g,
        carbs100g: food.carbs100g,
        fat100g: food.fat100g,
        glutenStatus: food.glutenStatus,
      },
    ]);
    setScanMessage(null);
    setSearchResults([]);
    setSearchQuery("");
  }

  function handleLogPlanMeal(planMealId: string) {
    setLoggingPlanId(planMealId);
    startTransition(async () => {
      await logPlanMeal(planMealId);
      setLoggingPlanId(null);
    });
  }

  async function handleScan(barcode: string) {
    setScannerOpen(false);
    setScanMessage("Looking up...");
    const result = await lookupBarcode(barcode);
    if (result.status === "found") {
      addToCart(result.food);
    } else if (result.status === "not_found") {
      setScanMessage("Not found in Open Food Facts — add it manually below.");
      setManualEntryOpen(true);
    } else {
      setScanMessage(result.message);
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query);
    setSearchResults(query.trim() ? await searchFoods(query) : []);
  }

  function updateQuantity(key: string, quantityG: number) {
    setCart((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantityG } : item))
    );
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }

  function handleSaveMeal() {
    startTransition(async () => {
      const result = await logMeal(mealType, cart);
      if (result.ok) {
        setCart([]);
        setBuilderOpen(false);
        setSaveMessage(null);
      } else {
        setSaveMessage(result.message ?? "Couldn't save. Try again.");
      }
    });
  }

  const subtotal = cart.reduce(
    (acc, item) => {
      const m = macrosForQuantity(item);
      return {
        kcal: acc.kcal + m.kcal,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Today&apos;s plan</h2>
        {planMeals.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">
                  {MEAL_SLOTS.find((s) => s.type === entry.mealType)?.label} ·{" "}
                  {MEAL_SLOTS.find((s) => s.type === entry.mealType)?.time}
                </p>
                <p className="text-sm font-medium">{entry.food.name}</p>
                <div className="flex items-center gap-2">
                  <span className="tabular-data text-xs text-muted-foreground">
                    {Math.round(entry.food.kcal100g)} kcal
                  </span>
                  <GfBadge status={entry.food.glutenStatus} />
                </div>
              </div>
              {entry.isLogged ? (
                <span className="flex items-center gap-1 text-xs font-medium text-fat">
                  <Check className="size-4" /> Logged
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending && loggingPlanId === entry.id}
                  onClick={() => handleLogPlanMeal(entry.id)}
                >
                  Log as eaten
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        <GfDisclaimer />
      </section>

      {loggedMeals.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-semibold">Logged today</h2>
          {loggedMeals.map((entry) => {
            const total = entry.items.reduce(
              (acc, item) => ({
                kcal: acc.kcal + item.kcal,
                protein: acc.protein + item.proteinG,
                carbs: acc.carbs + item.carbsG,
                fat: acc.fat + item.fatG,
              }),
              { kcal: 0, protein: 0, carbs: 0, fat: 0 }
            );
            return (
              <Card key={entry.id}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {mealSlotLabel(entry.mealType)}
                    </p>
                    <span className="tabular-data text-xs text-muted-foreground">
                      {Math.round(total.kcal)} kcal · P{Math.round(total.protein)} C
                      {Math.round(total.carbs)} F{Math.round(total.fat)}
                    </span>
                  </div>
                  {entry.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {item.quantityG}g
                        </span>
                      </div>
                      {item.glutenStatus && <GfBadge status={item.glutenStatus} />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {!builderOpen ? (
        <Button variant="outline" onClick={() => setBuilderOpen(true)}>
          <Plus className="size-4" /> Log something else
        </Button>
      ) : (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold">Log a meal</h2>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="meal-slot" className="text-xs text-muted-foreground">
              Which meal?
            </label>
            <select
              id="meal-slot"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {MEAL_SLOTS.map((slot) => (
                <option key={slot.type} value={slot.type}>
                  {slot.label} · {slot.time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
              <Barcode className="size-4" /> Scan barcode
            </Button>
            <Button variant="outline" onClick={() => setManualEntryOpen((v) => !v)}>
              <Plus className="size-4" /> Add manually
            </Button>
          </div>

          {scanMessage && <p className="text-xs text-muted-foreground">{scanMessage}</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="food-search" className="text-xs text-muted-foreground">
              Or search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="food-search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search foods..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="flex flex-col gap-1 rounded-md border border-border">
                {searchResults.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => addToCart(food)}
                    className="flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{food.name}</span>
                    <GfBadge status={food.glutenStatus} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {manualEntryOpen && (
            <ManualEntryForm
              onCreated={(food) => {
                addToCart(food);
                setManualEntryOpen(false);
              }}
            />
          )}

          {cart.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Items ({cart.length})</p>
              {cart.map((item) => {
                const m = macrosForQuantity(item);
                return (
                  <Card key={item.key}>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          {item.glutenStatus && <GfBadge status={item.glutenStatus} />}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.key)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantityG}
                          onChange={(e) =>
                            updateQuantity(item.key, Number(e.target.value) || 0)
                          }
                          className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">g</span>
                        <span className="tabular-data ml-auto text-xs text-muted-foreground">
                          {m.kcal} kcal · P{m.protein} C{m.carbs} F{m.fat}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Card>
                <CardContent className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="tabular-data text-sm">
                    {subtotal.kcal} kcal · P{subtotal.protein} C{subtotal.carbs} F
                    {subtotal.fat}
                  </span>
                </CardContent>
              </Card>

              {saveMessage && <p className="text-sm text-destructive">{saveMessage}</p>}

              <Button onClick={handleSaveMeal} disabled={isPending}>
                {isPending ? "Saving..." : "Save meal"}
              </Button>
            </div>
          )}
        </section>
      )}

      {scannerOpen && (
        <BarcodeScannerModal onScan={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}

function ManualEntryForm({ onCreated }: { onCreated: (food: FoodResult) => void }) {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">
        Enter macros per 100g.
      </p>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      />
      <div className="grid grid-cols-4 gap-2">
        <input
          placeholder="kcal"
          type="number"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          required
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <input
          placeholder="protein g"
          type="number"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          required
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <input
          placeholder="carbs g"
          type="number"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          required
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <input
          placeholder="fat g"
          type="number"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          required
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
      </div>
      <select
        value={glutenStatus}
        onChange={(e) => setGlutenStatus(e.target.value as GlutenStatus)}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="unknown">Unknown — check label</option>
        <option value="gf_labeled">Labeled GF</option>
        <option value="contains_gluten">Contains gluten</option>
      </select>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Adding..." : "Add to meal"}
      </Button>
    </form>
  );
}
