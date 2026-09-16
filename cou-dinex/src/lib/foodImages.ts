/**
 * Food image resolution utility
 * Maps dish names and categories to high-quality campus dining photography
 */

export const FOOD_IMAGE_MAP: Record<string, string> = {
  "samucha": "/images/food/chicken-samucha.jpg",
  "samosa": "/images/food/chicken-samucha.jpg",
  "singara": "/images/food/crispy-singara.jpg",
  "shingara": "/images/food/crispy-singara.jpg",
  "biryani": "/images/food/chicken-biryani.jpg",
  "polao": "/images/food/chicken-biryani.jpg",
  "ilish": "/images/food/shorshe-ilish.jpg",
  "shorshe": "/images/food/shorshe-ilish.jpg",
  "fish": "/images/food/shorshe-ilish.jpg",
  "khichuri": "/images/food/khichuri-dim.jpg",
  "dim": "/images/food/khichuri-dim.jpg",
  "paratha": "/images/food/paratha-daal.jpg",
  "daal": "/images/food/paratha-daal.jpg",
  "ruti": "/images/food/paratha-daal.jpg",
  "chicken": "/images/food/chicken-biryani.jpg",
  "tea": "/images/food/milk-tea.jpg",
  "cha": "/images/food/milk-tea.jpg",
  "coffee": "/images/food/milk-tea.jpg",
  "lassi": "/images/food/sweet-lassi.jpg",
  "juice": "/images/food/sweet-lassi.jpg",
  "drink": "/images/food/sweet-lassi.jpg",
  "beverage": "/images/food/sweet-lassi.jpg",
  "rice": "/images/food/chicken-biryani.jpg",
};

export function getItemImageUrl(name?: string | null, category?: string | null, fallback?: string | null): string {
  if (fallback && fallback.trim().length > 0 && !fallback.includes("placeholder")) {
    return fallback;
  }

  const query = `${name || ""} ${category || ""}`.toLowerCase();

  for (const [keyword, url] of Object.entries(FOOD_IMAGE_MAP)) {
    if (query.includes(keyword)) {
      return url;
    }
  }

  return "/images/food/chicken-biryani.jpg";
}
