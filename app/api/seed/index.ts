import { getDb } from "../queries/connection";
import { seedDemoCompany1 } from "./demo-company-1";
import { seedDemoCompany2 } from "./demo-company-2";
import { seedFeedIngredients } from "./feed-ingredients";
import { hasDemoSeed } from "./common";
import { seedNutritionalStandards } from "./nutritional-standards";
import { seedProductionData } from "./production-data";
import { seedRecipes } from "./recipes";

export async function seedDatabase() {
  const db = getDb();

  console.log("🌱 Starting database seed...");

  try {
    if (await hasDemoSeed(db)) {
      console.log("✅ Demo database already seeded, skipping...");
      return;
    }

    console.log("📋 Seeding nutritional standards...");
    await seedNutritionalStandards(db);

    console.log("🥕 Seeding feed ingredients...");
    await seedFeedIngredients(db);

    console.log("🏭 Seeding demo companies...");
    await seedDemoCompany1(db);
    await seedDemoCompany2(db);

    console.log("📖 Seeding recipes...");
    await seedRecipes(db);

    console.log("📊 Seeding production data...");
    await seedProductionData(db);

    console.log("✅ Database seed completed!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

if (import.meta.main) {
  seedDatabase().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
