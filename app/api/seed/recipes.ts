import { and, eq, inArray, isNull } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Db } from "./common";
import { DEMO_COMPANY_NAMES } from "./constants";

const RECIPE_TARGETS = [
  { name: "Starter Tom", phase: "starter", sex: "toms", proteinPct: "28.00", energyKcal: 2900 },
  { name: "Starter Hen", phase: "starter", sex: "hens", proteinPct: "30.00", energyKcal: 2850 },
  { name: "Starter Mixed", phase: "starter", sex: "mixed", proteinPct: "29.00", energyKcal: 2875 },
  { name: "Grower Tom", phase: "grower", sex: "toms", proteinPct: "22.00", energyKcal: 3050 },
  { name: "Grower Hen", phase: "grower", sex: "hens", proteinPct: "24.00", energyKcal: 3000 },
  { name: "Grower Mixed", phase: "grower", sex: "mixed", proteinPct: "23.00", energyKcal: 3025 },
  { name: "Finisher Tom", phase: "finisher", sex: "toms", proteinPct: "18.00", energyKcal: 3200 },
  { name: "Finisher Hen", phase: "finisher", sex: "hens", proteinPct: "20.00", energyKcal: 3150 },
  { name: "Finisher Mixed", phase: "finisher", sex: "mixed", proteinPct: "19.00", energyKcal: 3175 },
] as const;

const RECIPE_ITEMS: Record<string, Array<{ name: string; percent: number }>> = {
  starter: [
    { name: "Pszenica", percent: 24 },
    { name: "Kukurydza", percent: 18 },
    { name: "Soja", percent: 36 },
    { name: "Mączka mięsno-kostna", percent: 10 },
    { name: "Olej rybny", percent: 5 },
    { name: "Fosforan monokalkowy", percent: 2.5 },
    { name: "Premiks witaminowo-mineralny", percent: 2.0 },
    { name: "L-lizyna", percent: 2.5 },
  ],
  grower: [
    { name: "Pszenica", percent: 31 },
    { name: "Kukurydza", percent: 26 },
    { name: "Soja", percent: 24 },
    { name: "Mączka mięsno-kostna", percent: 8 },
    { name: "Olej rybny", percent: 4 },
    { name: "CaCO3", percent: 2 },
    { name: "Premiks witaminowo-mineralny", percent: 2 },
    { name: "Dodatek probiotyczny", percent: 1.5 },
    { name: "L-lizyna", percent: 1.5 },
  ],
  finisher: [
    { name: "Pszenica", percent: 37 },
    { name: "Kukurydza", percent: 31 },
    { name: "Soja", percent: 16 },
    { name: "Mączka mięsno-kostna", percent: 6 },
    { name: "Olej rybny", percent: 4 },
    { name: "CaCO3", percent: 2 },
    { name: "Premiks witaminowo-mineralny", percent: 1.5 },
    { name: "Kwas organiczny", percent: 1.0 },
    { name: "L-lizyna", percent: 1.5 },
  ],
};

const asNumber = (value: unknown) => Number(value ?? 0);

export async function seedRecipes(db: Db) {
  const companies = await db.select().from(schema.companies).where(inArray(schema.companies.name, [...DEMO_COMPANY_NAMES]));
  const ingredients = await db.select().from(schema.feedIngredients)
    .where(and(isNull(schema.feedIngredients.companyId), inArray(schema.feedIngredients.name, [
      "Pszenica",
      "Kukurydza",
      "Soja",
      "Mączka mięsno-kostna",
      "Olej rybny",
      "CaCO3",
      "Fosforan monokalkowy",
      "Premiks witaminowo-mineralny",
      "Dodatek probiotyczny",
      "Kwas organiczny",
      "L-lizyna",
    ])));
  const ingredientMap = new Map(ingredients.map((ingredient) => [ingredient.name, ingredient]));

  for (const company of companies) {
    for (const recipe of RECIPE_TARGETS) {
      const recipeName = `${company.name} · ${recipe.name}`;
      let [record] = await db.select().from(schema.recipes)
        .where(and(eq(schema.recipes.companyId, company.id), eq(schema.recipes.name, recipeName)))
        .limit(1);
      if (!record) {
        const items = RECIPE_ITEMS[recipe.phase];
        const profile = items.reduce((acc, item) => {
          const ingredient = ingredientMap.get(item.name)!;
          const ratio = item.percent / 100;
          acc.costPerTon += asNumber(ingredient.pricePerTon) * ratio;
          acc.proteinPct += asNumber(ingredient.proteinPct) * ratio;
          acc.energyKcal += asNumber(ingredient.energyKcal) * ratio;
          acc.lysinePct += asNumber(ingredient.lysinePct) * ratio;
          return acc;
        }, { costPerTon: 0, proteinPct: 0, energyKcal: 0, lysinePct: 0 });

        [record] = await db.insert(schema.recipes).values({
          companyId: company.id,
          name: recipeName,
          ageGroup: recipe.phase,
          strategy: "balanced",
          costPerTon: profile.costPerTon.toFixed(2),
          proteinPct: profile.proteinPct.toFixed(2),
          energyKcal: Math.round(profile.energyKcal),
          lysinePct: profile.lysinePct.toFixed(3),
          explanation: `Demo recipe for ${recipe.name} seeded for Netlify/Turso preview.`,
          version: 1,
          author: "demo-seed",
          status: "active",
          sex: recipe.sex,
          season: "all",
          genetics: "Hybrid Converter",
        }).returning();
      }

      const itemsExist = await db.select().from(schema.recipeItems).where(eq(schema.recipeItems.recipeId, record.id)).limit(1);
      if (itemsExist.length > 0) continue;

      await db.insert(schema.recipeItems).values(
        RECIPE_ITEMS[recipe.phase].map((item) => ({
          recipeId: record!.id,
          ingredientId: ingredientMap.get(item.name)!.id,
          percent: item.percent.toFixed(2),
        })),
      );
    }
  }
}
