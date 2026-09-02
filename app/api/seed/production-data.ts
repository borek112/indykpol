import { and, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Db } from "./common";
import { addDays, isoDate, round } from "./common";

const BATCH_BLUEPRINTS = [
  { code: "DEMO-001-FINISHER", ageDays: 45, adg: 75, fcr: 2.45, dailyMortalityPct: 0.033, liveCount: 9850, pricePerKg: 1.8 },
  { code: "DEMO-002-GROWER", ageDays: 15, adg: 40, fcr: 1.85, dailyMortalityPct: 0.033, liveCount: 11940, pricePerKg: 1.8 },
  { code: "TROJNA-001-STARTER", ageDays: 10, adg: 32, fcr: 1.55, dailyMortalityPct: 0.028, liveCount: 8974, pricePerKg: 1.8 },
  { code: "TROJNA-002-FINISHER", ageDays: 38, adg: 68, fcr: 2.28, dailyMortalityPct: 0.024, liveCount: 8718, pricePerKg: 1.8 },
] as const;

const MORTALITY_CAUSES = ["sudden death", "trampling", "starvation", "disease", "unknown"] as const;

export async function seedProductionData(db: Db) {
  const batches = await db.select().from(schema.batches);

  for (const blueprint of BATCH_BLUEPRINTS) {
    const batch = batches.find((item) => item.code === blueprint.code);
    if (!batch) continue;

    const [house] = await db.select().from(schema.houses).where(eq(schema.houses.id, batch.houseId)).limit(1);
    if (!house) continue;

    const climateSource = `demo-seed:${batch.code}`;
    const climateExists = await db.select().from(schema.climateLogs)
      .where(and(eq(schema.climateLogs.houseId, house.id), eq(schema.climateLogs.source, climateSource)))
      .limit(1);
    if (climateExists.length === 0) {
      const climateRows = [];
      for (let daysBack = 29; daysBack >= 0; daysBack--) {
        for (const hour of [0, 6, 12, 18]) {
          const ts = addDays(new Date(), -daysBack);
          ts.setHours(hour, 0, 0, 0);
          const ageAtReading = Math.max(0, blueprint.ageDays - daysBack);
          climateRows.push({
            houseId: house.id,
            ts,
            tempC: (26 - Math.min(ageAtReading, 30) * 0.15 + hour * 0.01).toFixed(1),
            humidityPct: (62 + (daysBack % 6) + (hour === 12 ? 3 : 0)).toFixed(1),
            ammoniaPpm: (5 + (daysBack % 7) * 1.2).toFixed(1),
            co2Ppm: 600 + (daysBack % 10) * 90 + hour * 10,
            ventilationPct: 20 + Math.min(ageAtReading * 0.7, 40) + (hour === 12 ? 6 : 0),
            source: climateSource,
          });
        }
      }
      await db.insert(schema.climateLogs).values(climateRows);
    }

    const weighingExists = await db.select().from(schema.weighings).where(eq(schema.weighings.batchId, batch.id)).limit(1);
    if (weighingExists.length === 0) {
      const weighDays = new Set<number>([7, 14, 21, 28, 35, 42, blueprint.ageDays].filter((day) => day > 0 && day <= blueprint.ageDays));
      const weighings = [...weighDays].sort((a, b) => a - b).map((dayAge) => {
        const avgWeightG = Math.round(60 + dayAge * blueprint.adg);
        const stdDevG = Math.round(avgWeightG * 0.1);
        return {
          batchId: batch.id,
          weighedAt: addDays(new Date(), dayAge - blueprint.ageDays),
          dayAge,
          sampleSize: 220 + (dayAge % 4) * 20,
          avgWeightG,
          medianG: avgWeightG - 15,
          stdDevG,
          minG: Math.round(avgWeightG * 0.85),
          maxG: Math.round(avgWeightG * 1.15),
          cv: round((stdDevG / avgWeightG) * 100).toFixed(2),
          operator: "demo-seed",
        };
      });
      await db.insert(schema.weighings).values(weighings);
    }

    const mortalityExists = await db.select().from(schema.mortalities).where(eq(schema.mortalities.batchId, batch.id)).limit(1);
    if (mortalityExists.length === 0) {
      let remaining = batch.initialCount - blueprint.liveCount;
      const mortalities = [];
      for (let offset = blueprint.ageDays - 1; offset >= 0; offset--) {
        const day = addDays(new Date(), -offset);
        const baseline = Math.max(1, Math.round(batch.initialCount * (blueprint.dailyMortalityPct / 100)));
        const count = offset === 0 ? remaining : Math.min(remaining, baseline + (offset % 3));
        remaining -= count;
        mortalities.push({
          batchId: batch.id,
          day: isoDate(day),
          count,
          cause: MORTALITY_CAUSES[offset % MORTALITY_CAUSES.length],
        });
      }
      if (remaining !== 0) {
        mortalities[mortalities.length - 1]!.count += remaining;
      }
      await db.insert(schema.mortalities).values(mortalities);
      await db.update(schema.batches).set({ currentCount: blueprint.liveCount }).where(eq(schema.batches.id, batch.id));
    }

    const feedExists = await db.select().from(schema.feedUsages).where(eq(schema.feedUsages.batchId, batch.id)).limit(1);
    if (feedExists.length === 0) {
      const currentWeightKg = (60 + blueprint.ageDays * blueprint.adg) / 1000;
      const gainKg = Math.max(blueprint.liveCount * currentWeightKg - batch.initialCount * 0.05, 1);
      const totalFeedKg = gainKg * blueprint.fcr;
      const feedRows = Array.from({ length: blueprint.ageDays }, (_, index) => ({
        batchId: batch.id,
        day: isoDate(addDays(new Date(), index - blueprint.ageDays + 1)),
        kg: (totalFeedKg / blueprint.ageDays).toFixed(1),
      }));
      await db.insert(schema.feedUsages).values(feedRows);
    }

    const forecastExists = await db.select().from(schema.batchForecasts).where(eq(schema.batchForecasts.batchId, batch.id)).limit(1);
    if (forecastExists.length === 0) {
      const currentWeightKg = (60 + blueprint.ageDays * blueprint.adg) / 1000;
      const revenue = blueprint.liveCount * currentWeightKg * blueprint.pricePerKg;
      const feedCost = (blueprint.fcr * blueprint.liveCount * currentWeightKg * 0.42);
      await db.insert(schema.batchForecasts).values({
        batchId: batch.id,
        weeklyForecasts: Array.from({ length: 4 }, (_, index) => ({
          week: index + 1,
          ageDays: blueprint.ageDays + (index + 1) * 7,
          weightKg: round(currentWeightKg + (index + 1) * (blueprint.adg / 1000) * 7, 3),
          fcr: round(blueprint.fcr + index * 0.03, 3),
        })),
        predictedFcr: blueprint.fcr.toFixed(3),
        predictedAdg: blueprint.adg.toFixed(3),
        predictedEpef: round((currentWeightKg * 100) / (blueprint.fcr * blueprint.ageDays), 3).toFixed(3),
        predictedMortalityPct: round(((batch.initialCount - blueprint.liveCount) / batch.initialCount) * 100, 2).toFixed(2),
        predictedFeedTons: round((blueprint.fcr * blueprint.liveCount * currentWeightKg) / 1000, 3).toFixed(3),
        predictedFeedCost: round(feedCost, 2).toFixed(2),
        predictedMargin: round(revenue - feedCost, 2).toFixed(2),
        currency: "EUR",
        assumptions: ["Demo forecast", "Revenue at 1.80 EUR/kg"],
        confidenceIntervals: {
          weightKg: { low: round(currentWeightKg * 0.97, 3), high: round(currentWeightKg * 1.03, 3) },
          fcr: { low: round(blueprint.fcr - 0.05, 3), high: round(blueprint.fcr + 0.05, 3) },
        },
      });
    }

    const advisorExists = await db.select().from(schema.economicsAiAdvisors).where(eq(schema.economicsAiAdvisors.batchId, batch.id)).limit(1);
    if (advisorExists.length === 0) {
      await db.insert(schema.economicsAiAdvisors).values([
        {
          batchId: batch.id,
          category: "feed",
          priority: "high",
          title: `Feed curve adjustment for ${batch.code}`,
          description: "Trim expensive protein sources by 0.8% and rebalance with grain energy.",
          justification: "Current nutrient headroom allows a lower-cost blend without dropping below the demo standard.",
          estimatedSavings: "420.00",
          estimatedGain: "0.00",
          actionTaken: false,
        },
        {
          batchId: batch.id,
          category: "energy",
          priority: "medium",
          title: `Ventilation tuning for ${batch.code}`,
          description: "Reduce midday fan intensity when humidity is below target range.",
          justification: "Climate logs show spare humidity margin and elevated ventilation cost in stable periods.",
          estimatedSavings: "180.00",
          estimatedGain: "0.00",
          actionTaken: false,
        },
        {
          batchId: batch.id,
          category: "general",
          priority: batch.code.endsWith("FINISHER") ? "critical" : "medium",
          title: `Margin watch for ${batch.code}`,
          description: "Monitor mortality and feed conversion together to protect batch margin.",
          justification: "The batch forecast indicates small performance losses have a direct effect on net margin at current sale price.",
          estimatedSavings: "0.00",
          estimatedGain: "260.00",
          actionTaken: false,
        },
      ]);
    }
  }
}
