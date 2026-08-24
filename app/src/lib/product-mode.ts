export type ProductMode = "demo" | "production";

export function getProductMode(): ProductMode {
  return import.meta.env.VITE_DEMO_MODE === "true" ? "demo" : "production";
}

export function productModeLabel(mode: ProductMode) {
  return mode === "demo" ? "DEMO — dane demonstracyjne" : "PRODUCTION — dane firmy";
}
