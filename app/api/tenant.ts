import { and, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { ContextUser } from "./context";
import { getDb } from "./queries/connection";
import { TRPCError } from "@trpc/server";
import { env } from "./lib/env";

export function isDemoContext(user: ContextUser): boolean {
  return env.demoMode && user.unionId === "demo";
}

export function requireTenantCompany(user: ContextUser): number {
  if (!user.companyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: user has no assigned company." });
  }
  return user.companyId;
}

export function requireRequestedCompany(user: ContextUser, requestedCompanyId: number): number {
  if (isDemoContext(user)) return requestedCompanyId;
  const companyId = requireTenantCompany(user);
  if (requestedCompanyId !== companyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: company is not assigned to this user." });
  }
  return companyId;
}

export async function requireFarmTenant(user: ContextUser, farmId: number) {
  const companyId = requireTenantCompany(user);
  const query = getDb().select().from(schema.farms).where(isDemoContext(user)
    ? eq(schema.farms.id, farmId)
    : and(eq(schema.farms.id, farmId), eq(schema.farms.companyId, companyId)));
  const [farm] = await query.limit(1);
  if (!farm) throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: farm is not owned by your company." });
  return farm;
}

export async function requireHouseTenant(user: ContextUser, houseId: number) {
  const companyId = requireTenantCompany(user);
  const rows = await getDb().select({ house: schema.houses, farm: schema.farms })
    .from(schema.houses).innerJoin(schema.farms, eq(schema.houses.farmId, schema.farms.id))
    .where(isDemoContext(user)
      ? eq(schema.houses.id, houseId)
      : and(eq(schema.houses.id, houseId), eq(schema.farms.companyId, companyId))).limit(1);
  const row = rows.at(0);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: house is not owned by your company." });
  return row;
}

export async function requireBatchTenant(user: ContextUser, batchId: number) {
  const companyId = requireTenantCompany(user);
  const rows = await getDb()
    .select({ batch: schema.batches, house: schema.houses, farm: schema.farms })
    .from(schema.batches)
    .innerJoin(schema.houses, eq(schema.batches.houseId, schema.houses.id))
    .innerJoin(schema.farms, eq(schema.houses.farmId, schema.farms.id))
    .where(isDemoContext(user)
      ? eq(schema.batches.id, batchId)
      : and(eq(schema.batches.id, batchId), eq(schema.farms.companyId, companyId)))
    .limit(1);
  const row = rows.at(0);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: batch is not owned by your company." });
  return row;
}

export async function requireRecipeTenant(user: ContextUser, recipeId: number) {
  const companyId = requireTenantCompany(user);
  const [recipe] = await getDb().select().from(schema.recipes)
    .where(and(eq(schema.recipes.id, recipeId), eq(schema.recipes.companyId, companyId))).limit(1);
  if (!recipe) throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: recipe is not owned by your company." });
  return recipe;
}

export async function requireSiloTenant(user: ContextUser, siloId: number) {
  const companyId = requireTenantCompany(user);
  const rows = await getDb().select({ silo: schema.silos, farm: schema.farms })
    .from(schema.silos)
    .innerJoin(schema.farms, eq(schema.silos.farmId, schema.farms.id))
    .where(and(eq(schema.silos.id, siloId), eq(schema.farms.companyId, companyId))).limit(1);
  const row = rows.at(0);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: silo is not owned by your company." });
  return row;
}
