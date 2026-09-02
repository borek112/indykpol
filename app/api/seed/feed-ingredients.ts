import { and, eq, isNull } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Db } from "./common";

const INGREDIENTS = [
  { name: "Pszenica", pricePerTon: "205.00", proteinPct: "12.50", energyKcal: 3150, lysinePct: "0.350", methioninePct: "0.180", fiberPct: "2.50", fatPct: "1.80", calciumPct: "0.05", phosphorusPct: "0.32" },
  { name: "Kukurydza", pricePerTon: "210.00", proteinPct: "8.50", energyKcal: 3370, lysinePct: "0.240", methioninePct: "0.180", fiberPct: "2.20", fatPct: "3.90", calciumPct: "0.02", phosphorusPct: "0.27" },
  { name: "Soja", pricePerTon: "420.00", proteinPct: "45.00", energyKcal: 2200, lysinePct: "2.800", methioninePct: "0.620", fiberPct: "3.60", fatPct: "1.70", calciumPct: "0.30", phosphorusPct: "0.65" },
  { name: "Mączka mięsno-kostna", pricePerTon: "250.00", proteinPct: "50.00", energyKcal: 2500, lysinePct: "2.400", methioninePct: "0.700", fiberPct: "1.00", fatPct: "8.00", calciumPct: "8.50", phosphorusPct: "4.20" },
  { name: "Olej rybny", pricePerTon: "800.00", proteinPct: "0.00", energyKcal: 8800, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "99.00", calciumPct: "0.00", phosphorusPct: "0.00" },
  { name: "CaCO3", pricePerTon: "100.00", proteinPct: "0.00", energyKcal: 0, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "38.00", phosphorusPct: "0.00" },
  { name: "Fosforan monokalkowy", pricePerTon: "350.00", proteinPct: "0.00", energyKcal: 0, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "17.00", phosphorusPct: "22.50" },
  { name: "Sól", pricePerTon: "50.00", proteinPct: "0.00", energyKcal: 0, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "0.00", phosphorusPct: "0.00" },
  { name: "Premiks witaminowo-mineralny", pricePerTon: "3000.00", proteinPct: "0.00", energyKcal: 0, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "12.00", phosphorusPct: "4.00" },
  { name: "Dodatek probiotyczny", pricePerTon: "2500.00", proteinPct: "0.00", energyKcal: 0, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "0.00", phosphorusPct: "0.00" },
  { name: "Kwas organiczny", pricePerTon: "1500.00", proteinPct: "0.00", energyKcal: 0, lysinePct: "0.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "0.00", phosphorusPct: "0.00" },
  { name: "L-lizyna", pricePerTon: "5000.00", proteinPct: "78.00", energyKcal: 3900, lysinePct: "78.000", methioninePct: "0.000", fiberPct: "0.00", fatPct: "0.00", calciumPct: "0.00", phosphorusPct: "0.00" },
] as const;

export async function seedFeedIngredients(db: Db) {
  for (const ingredient of INGREDIENTS) {
    const [existing] = await db.select().from(schema.feedIngredients)
      .where(and(isNull(schema.feedIngredients.companyId), eq(schema.feedIngredients.name, ingredient.name)))
      .limit(1);
    if (existing) continue;

    await db.insert(schema.feedIngredients).values({
      companyId: null,
      name: ingredient.name,
      countryCode: "PL",
      pricePerTon: ingredient.pricePerTon,
      currency: "EUR",
      proteinPct: ingredient.proteinPct,
      energyKcal: ingredient.energyKcal,
      lysinePct: ingredient.lysinePct,
      methioninePct: ingredient.methioninePct,
      fiberPct: ingredient.fiberPct,
      fatPct: ingredient.fatPct,
      calciumPct: ingredient.calciumPct,
      phosphorusPct: ingredient.phosphorusPct,
      stockTons: "0.00",
      moisturePct: "10.00",
      ashPct: "0.00",
      starchPct: ingredient.name === "Pszenica" ? "62.50" : ingredient.name === "Kukurydza" ? "60.50" : "0.00",
      cystinePct: "0.000",
      threoninePct: "0.000",
      tryptophanPct: "0.000",
      argininePct: "0.000",
      sodiumPct: ingredient.name === "Sól" ? "39.000" : "0.000",
      producer: "Demo Seed",
      extraParams: { scope: "global-demo" },
    });
  }
}
