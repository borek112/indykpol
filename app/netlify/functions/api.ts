import app from "../../api/boot";
import { seedDatabase } from "../../api/seed";

export default async (req: Request) => {
  try {
    await seedDatabase();
  } catch (error) {
    console.error("Seed error:", error);
  }

  const url = new URL(req.url);
  url.pathname = url.pathname.replace(/^\/\.netlify\/functions\/api/, "/api") || "/api";

  return app.fetch(new Request(url, req));
};
