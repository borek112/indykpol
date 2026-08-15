export type ProductMode = "demo" | "full";

const MODE_KEY = "bte_product_mode";

export function getProductMode(): ProductMode {
  if (typeof window === "undefined") return "demo";
  const raw = window.localStorage.getItem(MODE_KEY);
  return raw === "full" ? "full" : "demo";
}

export function setProductMode(mode: ProductMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_KEY, mode);
  window.location.reload();
}

export function productModeLabel(mode: ProductMode) {
  return mode === "demo" ? "DEMO — dane demonstracyjne" : "FULL — środowisko produkcyjne";
}
