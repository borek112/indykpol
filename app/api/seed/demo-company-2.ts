import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { Db } from "./common";
import { addDays, ensureCompany, isoDate } from "./common";

export async function seedDemoCompany2(db: Db) {
  const company = await ensureCompany(db, { name: "Farma Trójna", countryCode: "PL" });

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
      name: "Farma Trójna Central",
      countryCode: "PL",
      city: "Łódź",
      lat: "51.76000",
      lng: "19.27000",
      capacity: 21000,
    }).returning();
  }

  const houseSpecs = [
    { name: "Trójna Brooder", houseType: "brooder" as const, areaM2: "320.0" },
    { name: "Trójna Grower", houseType: "grower" as const, areaM2: "420.0" },
    { name: "Trójna Finisher", houseType: "finisher" as const, areaM2: "520.0" },
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
        lengthM: spec.houseType === "finisher" ? "52.0" : "42.0",
        widthM: spec.houseType === "finisher" ? "10.0" : "8.0",
        heightM: "4.0",
        feederCount: spec.houseType === "brooder" ? 26 : spec.houseType === "grower" ? 38 : 50,
        drinkerCount: spec.houseType === "brooder" ? 26 : spec.houseType === "grower" ? 38 : 50,
        lightingLux: spec.houseType === "brooder" ? 28 : 18,
        lightingHours: spec.houseType === "brooder" ? "20.0" : "16.0",
        ventilationM3h: spec.houseType === "brooder" ? 19000 : spec.houseType === "grower" ? 27000 : 33000,
      }).returning();
    }
    houseMap.set(spec.name, house.id);
  }

  const batches = [
    { code: "TROJNA-001-STARTER", houseName: "Trójna Brooder", ageDays: 10, plannedDays: 70, sex: "mixed" as const, initialCount: 9000, currentCount: 8974, chickPrice: "1.760" },
    { code: "TROJNA-002-FINISHER", houseName: "Trójna Finisher", ageDays: 38, plannedDays: 70, sex: "hens" as const, initialCount: 8800, currentCount: 8718, chickPrice: "1.770" },
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
