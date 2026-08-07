export const MEAL_SLOTS = [
  { type: "obrok_1", label: "Meal 1", time: "10:00" },
  { type: "snack_1", label: "Snack 1", time: "12:30" },
  { type: "obrok_2", label: "Meal 2", time: "14:30" },
  { type: "snack_2", label: "Snack 2", time: "17:00" },
  { type: "obrok_3", label: "Meal 3", time: "19:30" },
] as const;

export type MealType = (typeof MEAL_SLOTS)[number]["type"];

export function mealSlotLabel(type: string): string {
  return MEAL_SLOTS.find((s) => s.type === type)?.label ?? type;
}
