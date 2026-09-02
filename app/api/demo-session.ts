import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import * as schema from "@db/schema";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken } from "./auth/session";
import { getDb } from "./queries/connection";
import { seedDatabase } from "./seed";

export async function ensureDemoUser() {
  await seedDatabase();

  const db = getDb();
  const [company] = await db.select().from(schema.companies).where(eq(schema.companies.name, "Bródka Demo")).limit(1);
  if (!company) throw new Error("Demo company not found");

  let [user] = await db.select().from(schema.users).where(eq(schema.users.unionId, "demo-user")).limit(1);
  if (!user) {
    [user] = await db.insert(schema.users).values({
      unionId: "demo-user",
      name: "Demo User",
      role: "admin",
      companyId: company.id,
    }).returning();
  } else if (user.companyId !== company.id) {
    await db.update(schema.users).set({ companyId: company.id, name: "Demo User", role: "admin" }).where(eq(schema.users.id, user.id));
    [user] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1);
  }

  return user;
}

export async function createDemoLoginResponse(request: Request) {
  const user = await ensureDemoUser();
  const token = await signSessionToken({ userId: user.id, sessionVersion: user.sessionVersion });
  const headers = new Headers({
    Location: new URL("/", request.url).toString(),
  });

  headers.append("Set-Cookie", cookie.serialize(Session.cookieName, token, {
    ...getSessionCookieOptions(request.headers),
    maxAge: Math.floor(Session.maxAgeMs / 1000),
  }));

  return new Response(null, { status: 302, headers });
}
