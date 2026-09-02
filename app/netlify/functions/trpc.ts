import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "../../api/context";
import { appRouter } from "../../api/router";
import { seedDatabase } from "../../api/seed";

export default async (req: Request) => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Seed error:", error);
  }

  const pathname = new URL(req.url).pathname;
  const endpoint = pathname.startsWith("/api/trpc") ? "/api/trpc" : "/.netlify/functions/trpc";

  return fetchRequestHandler({
    endpoint,
    req,
    router: appRouter,
    createContext,
  });
};
