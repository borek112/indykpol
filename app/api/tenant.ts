import { and, eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { ContextUser } from "./context";
import { getDb } from "./queries/connection";
import { TRPCError } from "@trpc/server";

export async function requireBatchTenant(user: ContextUser, batchId: number) {
  if (!user.companyId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: user has no assigned company." });
  }
  const rows = await getDb()
    .select({ batch: schema.batches, house: schema.houses, farm: schema.farms })
    .from(schema.batches)
    .innerJoin(schema.houses, eq(schema.batches.houseId, schema.houses.id))
    .innerJoin(schema.farms, eq(schema.houses.farmId, schema.farms.id))
    .where(and(eq(schema.batches.id, batchId), eq(schema.farms.companyId, user.companyId)))
    .limit(1);
  const row = rows.at(0);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "TENANT_MISMATCH: batch is not owned by your company." });
  return row;
}
