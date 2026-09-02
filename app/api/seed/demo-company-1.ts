import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Db } from "./common";
import { addDays, ensureCompany, isoDate } from "./common";

export async function seedDemoCompany1(db: Db) {
  const company = await ensureCompany(db, { name: "Bródka Demo", countryCode: "PL" });

  let [line] = await db.select().from(schema.geneticLines)
    .where(eq(schema.geneticLines.companyId, company.id))
    .limit(1);
  if (!line) {
    [line] = await db.insert(schema.geneticLines).values({
      companyId: company.id,
      name: "Hybrid Converter",
      supplier: "Hybrid Turkeys",
    }).returning();
  }

  let [farm] = await db.select().from(schema.farms)
    .where(eq(schema.farms.companyId, company.id))
    .limit(1);
  if (!farm) {
    [farm] = await db.insert(schema.farms).values({
      companyId: company.id,
      name: "Bródka Demo Farm",
      countryCode: "PL",
      city: "Białystok",
      lat: "52.20000",
      lng: "21.07000",
      capacity: 22000,
    }).returning();
  }

  const houseSpecs = [
    { name: "Brooder House", houseType: "brooder" as const, areaM2: "300.0" },
    { name: "Grower House", houseType: "grower" as const, areaM2: "400.0" },
    { name: "Finisher House", houseType: "finisher" as const, areaM2: "500.0" },
  ];

  const houseMap = new Map<string, number>();
  for (const spec of houseSpecs) {
    let [house] = await db.select().from(schema.houses)
      .where(eq(schema.houses.name, spec.name))
      .limit(1);
    if (!house) {
      [house] = await db.insert(schema.houses).values({
        farmId: farm.id,
        name: spec.name,
        houseType: spec.houseType,
        areaM2: spec.areaM2,
        maxDensityKgM2: "42.0",
        lengthM: spec.name === "Finisher House" ? "50.0" : "40.0",
        widthM: spec.name === "Finisher House" ? "10.0" : "8.0",
        heightM: "4.0",
        feederCount: spec.houseType === "brooder" ? 24 : spec.houseType === "grower" ? 36 : 48,
        drinkerCount: spec.houseType === "brooder" ? 24 : spec.houseType === "grower" ? 36 : 48,
        lightingLux: spec.houseType === "brooder" ? 30 : 18,
        lightingHours: spec.houseType === "brooder" ? "20.0" : "16.0",
        ventilationM3h: spec.houseType === "brooder" ? 18000 : spec.houseType === "grower" ? 26000 : 32000,
      }).returning();
    }
    houseMap.set(spec.name, house.id);
  }

  const batches = [
    { code: "DEMO-001-FINISHER", houseName: "Finisher House", ageDays: 45, plannedDays: 70, sex: "toms" as const, initialCount: 10000, currentCount: 9850, chickPrice: "1.800" },
    { code: "DEMO-002-GROWER", houseName: "Grower House", ageDays: 15, plannedDays: 70, sex: "toms" as const, initialCount: 12000, currentCount: 11940, chickPrice: "1.780" },
  ];

  for (const batch of batches) {
    const [existing] = await db.select().from(schema.batches).where(eq(schema.batches.code, batch.code)).limit(1);
    if (existing) continue;
    const startDate = addDays(new Date(), -batch.ageDays);
    await db.insert(schema.batches).values({
      houseId: houseMap.get(batch.houseName)!,
      geneticLineId: line.id,
      code: batch.code,
      geneticLine: "Hybrid Converter",
      sex: batch.sex,
      chickSupplier: "Hybrid Turkeys",
      chickPrice: batch.chickPrice,
      startDate: isoDate(startDate),
      plannedEndDate: isoDate(addDays(startDate, batch.plannedDays)),
      initialCount: batch.initialCount,
      currentCount: batch.currentCount,
      soldCount: 0,
    });
  }

  return company;
}
