import { and, eq, isNull } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Db } from "./common";

const STANDARDS = [
  { code: "DEMO-STARTER-TOMS", name: "Starter Tom", gender: "toms", phase: "starter", ageFromDays: 0, ageToDays: 14, meMinKcal: 2800, meMaxKcal: 2950, proteinMinPct: "28.00", proteinMaxPct: "30.00", lysineMinPct: "1.100", methionineMinPct: "0.550" },
  { code: "DEMO-STARTER-HENS", name: "Starter Hen", gender: "hens", phase: "starter", ageFromDays: 0, ageToDays: 14, meMinKcal: 2800, meMaxKcal: 2950, proteinMinPct: "28.00", proteinMaxPct: "30.00", lysineMinPct: "1.150", methionineMinPct: "0.560" },
  { code: "DEMO-STARTER-MIXED", name: "Starter Mixed", gender: "mixed", phase: "starter", ageFromDays: 0, ageToDays: 14, meMinKcal: 2800, meMaxKcal: 2950, proteinMinPct: "28.00", proteinMaxPct: "30.00", lysineMinPct: "1.120", methionineMinPct: "0.550" },
  { code: "DEMO-GROWER-TOMS", name: "Grower Tom", gender: "toms", phase: "grower", ageFromDays: 15, ageToDays: 35, meMinKcal: 3000, meMaxKcal: 3100, proteinMinPct: "22.00", proteinMaxPct: "24.00", lysineMinPct: "0.850", methionineMinPct: "0.430" },
  { code: "DEMO-GROWER-HENS", name: "Grower Hen", gender: "hens", phase: "grower", ageFromDays: 15, ageToDays: 35, meMinKcal: 3000, meMaxKcal: 3100, proteinMinPct: "22.00", proteinMaxPct: "24.00", lysineMinPct: "0.900", methionineMinPct: "0.440" },
  { code: "DEMO-GROWER-MIXED", name: "Grower Mixed", gender: "mixed", phase: "grower", ageFromDays: 15, ageToDays: 35, meMinKcal: 3000, meMaxKcal: 3100, proteinMinPct: "22.00", proteinMaxPct: "24.00", lysineMinPct: "0.880", methionineMinPct: "0.430" },
  { code: "DEMO-FINISHER-TOMS", name: "Finisher Tom", gender: "toms", phase: "finisher", ageFromDays: 36, ageToDays: 70, meMinKcal: 3150, meMaxKcal: 3250, proteinMinPct: "18.00", proteinMaxPct: "20.00", lysineMinPct: "0.650", methionineMinPct: "0.360" },
  { code: "DEMO-FINISHER-HENS", name: "Finisher Hen", gender: "hens", phase: "finisher", ageFromDays: 36, ageToDays: 70, meMinKcal: 3150, meMaxKcal: 3250, proteinMinPct: "18.00", proteinMaxPct: "20.00", lysineMinPct: "0.700", methionineMinPct: "0.370" },
  { code: "DEMO-FINISHER-MIXED", name: "Finisher Mixed", gender: "mixed", phase: "finisher", ageFromDays: 36, ageToDays: 70, meMinKcal: 3150, meMaxKcal: 3250, proteinMinPct: "18.00", proteinMaxPct: "20.00", lysineMinPct: "0.680", methionineMinPct: "0.360" },
] as const;

export async function seedNutritionalStandards(db: Db) {
  for (const standard of STANDARDS) {
    const [existing] = await db.select().from(schema.nutritionalStandards)
      .where(and(isNull(schema.nutritionalStandards.companyId), eq(schema.nutritionalStandards.code, standard.code)))
      .limit(1);
    if (existing) continue;

    await db.insert(schema.nutritionalStandards).values({
      companyId: null,
      name: standard.name,
      code: standard.code,
      gender: standard.gender,
      productionType: "broiler",
      phase: standard.phase,
      ageFromDays: standard.ageFromDays,
      ageToDays: standard.ageToDays,
      targetWeightFromKg: standard.phase === "starter" ? "0.08" : standard.phase === "grower" ? "0.70" : "3.10",
      targetWeightToKg: standard.phase === "starter" ? "0.55" : standard.phase === "grower" ? "3.20" : "6.50",
      meMinKcal: standard.meMinKcal,
      meMaxKcal: standard.meMaxKcal,
      proteinMinPct: standard.proteinMinPct,
      proteinMaxPct: standard.proteinMaxPct,
      fatMinPct: standard.phase === "starter" ? "5.50" : standard.phase === "grower" ? "6.00" : "6.50",
      fatMaxPct: standard.phase === "starter" ? "8.00" : standard.phase === "grower" ? "8.50" : "9.00",
      fiberMaxPct: standard.phase === "starter" ? "4.00" : standard.phase === "grower" ? "4.50" : "5.00",
      lysineMinPct: standard.lysineMinPct,
      methionineMinPct: standard.methionineMinPct,
      calciumMinPct: standard.phase === "finisher" ? "0.85" : "1.00",
      calciumMaxPct: standard.phase === "finisher" ? "1.10" : "1.25",
      phosphorusMinPct: standard.phase === "finisher" ? "0.50" : "0.60",
      sodiumMinPct: "0.160",
      sodiumMaxPct: "0.220",
      extraParams: {
        threonineMinPct: standard.phase === "starter" ? 1.05 : standard.phase === "grower" ? 0.85 : 0.72,
        notes: "Demo standard shared across tenants",
      },
    });
  }
}
