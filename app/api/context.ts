import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./auth/local";
import { env } from "./lib/env";

export type ContextUser = Omit<User, "passwordHash" | "sessionVersion">;

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: ContextUser;
};

function demoUser(companyId: number): ContextUser {
  return {
    id: 0,
    unionId: "demo",
    name: "Demo Admin",
    email: "demo@indykpol.local",
    avatar: null,
    role: "admin",
    companyId,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignInAt: new Date(),
  };
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Anonymous access is intentionally available only in the separately
    // configured public demo deployment. Production keeps session-based
    // tenant isolation; the demo instance is a shared admin workspace.
    if (env.demoMode && env.demoCompanyId) {
      ctx.user = demoUser(env.demoCompanyId);
    }
  }
  return ctx;
}
