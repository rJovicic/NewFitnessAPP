// Macro target calculation — single source of truth, per CLAUDE.md section 2.
// Formula and carb/fat split ratio come from docs/source-plan.pdf Poglavlje 1.

export interface MacroProfile {
  height_cm: number;
  activity_factor: number;
  protein_g_per_kg: number;
  deficit_kcal: number;
}

export interface MacroTargets {
  bmr: number;
  tdee: number;
  targetKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

// Carb/fat split of the PDF's day-1 remainder after protein (1080 kcal carbs :
// 630 kcal fat), expressed as a ratio so it holds even when the real target
// calorie figure differs from the PDF's placeholder numbers.
const CARB_KCAL_RATIO = 1080 / (1080 + 630);
const FAT_KCAL_RATIO = 630 / (1080 + 630);

/**
 * Age in whole years as of today. Always derive age this way from
 * profile.date_of_birth — never hardcode an age value (the PDF's "28" was a
 * placeholder for its own worked example, not a stored constant).
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/**
 * Mifflin-St Jeor targets, recalculated live from the latest weight log —
 * never from profile.starting_weight_kg. Pass age from calculateAge(profile.date_of_birth).
 */
export function calculateTargets(
  profile: MacroProfile,
  latestWeightKg: number,
  age: number
): MacroTargets {
  const bmr = 10 * latestWeightKg + 6.25 * profile.height_cm - 5 * age + 5;
  const tdee = bmr * profile.activity_factor;
  const targetKcal = tdee - profile.deficit_kcal;

  const proteinG = profile.protein_g_per_kg * latestWeightKg;
  const proteinKcal = proteinG * 4;

  const remainingKcal = Math.max(targetKcal - proteinKcal, 0);
  const carbsG = (remainingKcal * CARB_KCAL_RATIO) / 4;
  const fatG = (remainingKcal * FAT_KCAL_RATIO) / 9;

  return { bmr, tdee, targetKcal, proteinG, carbsG, fatG };
}
