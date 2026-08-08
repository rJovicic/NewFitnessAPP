import type { GlutenStatus } from "@/components/gf-badge";

// Open Food Facts API v2 — no auth key required, but OFF asks for a
// descriptive User-Agent. Shape verified from training knowledge only;
// context7/npm don't apply to a REST API and this sandbox can't reach
// off's docs directly (see CLAUDE.md's known environment constraint) —
// real-device barcode scans are the actual verification for this.
const OFF_BASE = "https://world.openfoodfacts.org/api/v2";
const USER_AGENT = "NewFitnessApp/1.0 (personal use; contact via app owner)";

export interface OffProduct {
  name: string;
  brand: string | null;
  kcal100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  glutenStatus: GlutenStatus;
  raw: unknown;
}

export interface OffSearchResult {
  code: string;
  name: string;
  brand: string | null;
}

// Text search by product name — separate endpoint from the barcode lookup
// above. Same sandbox caveat as the rest of this file: shape verified from
// training knowledge / OFF's public API docs, not a live sandbox request
// (world.openfoodfacts.org is proxy-blocked here same as *.vercel.app).
// On select, the caller re-resolves via fetchOffProduct(code) so the actual
// macro/gluten parsing only has one code path to trust.
export async function searchOffProducts(query: string, limit = 10): Promise<OffSearchResult[]> {
  const params = new URLSearchParams({
    search_terms: query,
    fields: "code,product_name,brands",
    page_size: String(limit),
  });
  const res = await fetch(`${OFF_BASE}/search?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) return [];

  const json = await res.json();
  const products = (json.products as Record<string, unknown>[]) ?? [];
  return products
    .filter((p) => p.code && p.product_name)
    .map((p) => ({
      code: String(p.code),
      name: p.product_name as string,
      brand: (p.brands as string) || null,
    }));
}

export async function fetchOffProduct(barcode: string): Promise<OffProduct | null> {
  const res = await fetch(`${OFF_BASE}/product/${encodeURIComponent(barcode)}.json`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return null;
  const json = await res.json();

  if (json.status === 0 || !json.product) return null;

  return parseOffProduct(json.product);
}

export function parseOffProduct(product: Record<string, unknown>): OffProduct {
  const nutriments = (product.nutriments as Record<string, unknown>) ?? {};
  const labelsTags = (product.labels_tags as string[]) ?? [];
  const allergensTags = (product.allergens_tags as string[]) ?? [];

  return {
    name: (product.product_name as string) || "Unknown product",
    brand: (product.brands as string) || null,
    kcal100g: Number(nutriments["energy-kcal_100g"]) || 0,
    protein100g: Number(nutriments["proteins_100g"]) || 0,
    carbs100g: Number(nutriments["carbohydrates_100g"]) || 0,
    fat100g: Number(nutriments["fat_100g"]) || 0,
    glutenStatus: deriveGlutenStatus(labelsTags, allergensTags),
    raw: product,
  };
}

// Never default to "safe" — per CLAUDE.md §2, absence of a gluten
// allergen tag does not mean gluten-free.
function deriveGlutenStatus(labelsTags: string[], allergensTags: string[]): GlutenStatus {
  if (allergensTags.some((t) => t.includes("gluten"))) return "contains_gluten";
  if (labelsTags.some((t) => t.includes("gluten-free") || t.includes("no-gluten"))) {
    return "gf_labeled";
  }
  return "unknown";
}
