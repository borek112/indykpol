import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "../queries/connection";
import * as schema from "@db/schema";
import { DEMO_BATCH_CODES, DEMO_COMPANY_NAMES, DEMO_STANDARD_CODES } from "./constants";

export type Db = ReturnType<typeof getDb>;

export function today() {
  return new Date();
}

export function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

export async function ensureCompany(db: Db, values: {
  name: string;
  countryCode: string;
  baseCurrency?: string;
}) {
  const [existing] = await db.select().from(schema.companies).where(eq(schema.companies.name, values.name)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(schema.companies).values({
    name: values.name,
    countryCode: values.countryCode,
    baseCurrency: values.baseCurrency ?? "EUR",
  }).returning();
  return created;
}

export async function getDemoCompanies(db: Db) {
  return db.select().from(schema.companies).where(inArray(schema.companies.name, [...DEMO_COMPANY_NAMES]));
}

export async function getDemoBatches(db: Db) {
  return db.select().from(schema.batches).where(inArray(schema.batches.code, [...DEMO_BATCH_CODES]));
}

export async function hasDemoSeed(db: Db) {
  const [company] = await db.select().from(schema.companies).where(inArray(schema.companies.name, [...DEMO_COMPANY_NAMES])).limit(1);
  const [standard] = await db.select().from(schema.nutritionalStandards)
    .where(and(isNull(schema.nutritionalStandards.companyId), inArray(schema.nutritionalStandards.code, [...DEMO_STANDARD_CODES])))
    .limit(1);
  const [batch] = await db.select().from(schema.batches).where(inArray(schema.batches.code, [...DEMO_BATCH_CODES])).limit(1);
  return Boolean(company && standard && batch);
}
