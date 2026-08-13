import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { Paths } from "@contracts/constants";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

/* =========================================================
   HEALTHCHECK
   ========================================================= */

app.get("/health", (c) => {
  return c.json({
    status: "ok",
  });
});

/* =========================================================
   BODY LIMIT
   ========================================================= */

app.use(
  bodyLimit({
    maxSize: 50 * 1024 * 1024,
  }),
);

/* =========================================================
   KIMI OAUTH CALLBACK
   Ładowany dynamicznie, żeby moduł auth/JWKS nie blokował
   startu całego serwera.
   ========================================================= */

app.get(Paths.oauthCallback, async (c) => {
  const { createOAuthCallbackHandler } = await import("./kimi/auth");

  const handler = createOAuthCallbackHandler();

  return handler(c);
});

/* =========================================================
   DEV LOGIN
   Tylko poza production.
   ========================================================= */

if (!env.isProduction) {
  app.get("/api/dev-login", async (c) => {
    const { signSessionToken } = await import("./kimi/session");
    const { findUserByUnionId } = await import("./queries/users");
    const { setCookie } = await import("hono/cookie");
    const { getSessionCookieOptions } = await import("./lib/cookies");

    const user = await findUserByUnionId(
      env.ownerUnionId || "dev-owner",
    );

    if (!user) {
      return c.json(
        {
          error:
            "Brak użytkownika dev w lokalnej bazie — uruchom seed/dev-login z docs/BTE_LOCAL_DEV.md",
        },
        404,
      );
    }

    const token = await signSessionToken({
      unionId: user.unionId,
      clientId: env.appId,
    });

    setCookie(
      c,
      "kimi_sid",
      token,
      getSessionCookieOptions(c.req.raw.headers),
    );

    return c.redirect("/");
  });
}

/* =========================================================
   UPLOAD PLIKÓW
   ========================================================= */

app.post("/api/upload", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return c.json(
      {
        error: "Brak pliku",
      },
      400,
    );
  }

  const { mkdir, writeFile } = await import("fs/promises");

  const dir = env.uploadDir;

  await mkdir(dir, {
    recursive: true,
  });

  const safe = file.name
    .replace(
      /[^\w.\-ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ]/g,
      "_",
    )
    .slice(-120);

  const name = `${Date.now()}_${safe}`;

  await writeFile(
    `${dir}/${name}`,
    Buffer.from(await file.arrayBuffer()),
  );

  return c.json({
    ok: true,
    url: `/uploads/${name}`,
    name: file.name,
    size: file.size,
  });
});

/* =========================================================
   ODCZYT UPLOADÓW
   ========================================================= */

app.get("/uploads/*", async (c) => {
  const { readFile } = await import("fs/promises");

  const filePath = `${env.uploadDir}/${c.req.path.replace(
    /^\/uploads\//,
    "",
  )}`;

  try {
    const buf = await readFile(filePath);

    const ext =
      filePath
        .split(".")
        .pop()
        ?.toLowerCase() ?? "";

    const mime =
      ext === "pdf"
        ? "application/pdf"
        : ext === "png"
          ? "image/png"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : "application/octet-stream";

    return c.body(
      new Uint8Array(buf),
      200,
      {
        "Content-Type": mime,
      },
    );
  } catch {
    return c.json(
      {
        error: "Not found",
      },
      404,
    );
  }
});

/* =========================================================
   INGEST API
   Dane z komputerów, czujników i systemów zewnętrznych.
   Autoryzacja przez X-API-Key.
   ========================================================= */

app.post("/api/v1/ingest", async (c) => {
  const { verifyApiKey } = await import(
    "./transfer-router"
  );

  const key =
    c.req.header("x-api-key") ?? "";

  const apiKey = key
    ? await verifyApiKey(key)
    : null;

  if (!apiKey) {
    return c.json(
      {
        error:
          "Nieprawidłowy lub nieaktywny klucz API",
      },
      401,
    );
  }

  const body = await c.req
    .json()
    .catch(() => null);

  if (
    !body ||
    typeof body.type !== "string"
  ) {
    return c.json(
      {
        error: "Wymagane pole type",
      },
      400,
    );
  }

  const { getDb } = await import(
    "./queries/connection"
  );

  const s = await import("@db/schema");

  const db = getDb();

  switch (body.type) {
    case "climate": {
      if (!body.houseId) {
        return c.json(
          {
            error: "Wymagane houseId",
          },
          400,
        );
      }

      const [{ id }] = await db
        .insert(s.climateLogs)
        .values({
          houseId: Number(body.houseId),

          tempC:
            body.tempC != null
              ? String(body.tempC)
              : null,

          humidityPct:
            body.humidityPct != null
              ? String(body.humidityPct)
              : null,

          co2Ppm:
            body.co2Ppm != null
              ? Number(body.co2Ppm)
              : null,

          ammoniaPpm:
            body.ammoniaPpm != null
              ? String(body.ammoniaPpm)
              : null,

          ventilationPct:
            body.ventilationPct != null
              ? Number(body.ventilationPct)
              : null,

          source: `api:${apiKey.keyPrefix}`,
        })
        .$returningId();

      return c.json({
        ok: true,
        inserted: "climate",
        id,
      });
    }

    case "feedUsage": {
      if (
        !body.batchId ||
        !body.kg
      ) {
        return c.json(
          {
            error:
              "Wymagane batchId i kg",
          },
          400,
        );
      }

      const [{ id }] = await db
        .insert(s.feedUsages)
        .values({
          batchId: Number(body.batchId),

          day: String(
            body.day ??
              new Date()
                .toISOString()
                .slice(0, 10),
          ),

          kg: String(body.kg),
        })
        .$returningId();

      return c.json({
        ok: true,
        inserted: "feedUsage",
        id,
      });
    }

    case "mortality": {
      if (
        !body.batchId ||
        !body.count
      ) {
        return c.json(
          {
            error:
              "Wymagane batchId i count",
          },
          400,
        );
      }

      const [{ id }] = await db
        .insert(s.mortalities)
        .values({
          batchId: Number(body.batchId),

          day: String(
            body.day ??
              new Date()
                .toISOString()
                .slice(0, 10),
          ),

          count: Number(body.count),

          cause: String(
            body.cause ??
              "zgłoszenie API",
          ),
        })
        .$returningId();

      return c.json({
        ok: true,
        inserted: "mortality",
        id,
      });
    }

    case "weighing": {
      if (
        !body.batchId ||
        !body.avgWeightG
      ) {
        return c.json(
          {
            error:
              "Wymagane batchId i avgWeightG",
          },
          400,
        );
      }

      const [{ id }] = await db
        .insert(s.weighings)
        .values({
          batchId: Number(
            body.batchId,
          ),

          weighedAt:
            body.weighedAt
              ? new Date(
                  body.weighedAt,
                )
              : new Date(),

          dayAge: Number(
            body.dayAge ?? 0,
          ),

          sampleSize: Number(
            body.sampleSize ?? 1,
          ),

          avgWeightG: Number(
            body.avgWeightG,
          ),

          operator: `api:${apiKey.keyPrefix}`,
        })
        .$returningId();

      return c.json({
        ok: true,
        inserted: "weighing",
        id,
      });
    }

    default:
      return c.json(
        {
          error: `Nieznany typ: ${body.type}. Dozwolone: climate, feedUsage, mortality, weighing`,
        },
        400,
      );
  }
});

/* =========================================================
   TRPC
   ========================================================= */

app.use(
  "/api/trpc/*",
  async (c) => {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
    });
  },
);

/* =========================================================
   API 404
   ========================================================= */

app.all(
  "/api/*",
  (c) =>
    c.json(
      {
        error: "Not Found",
      },
      404,
    ),
);

/* =========================================================
   EXPORT
   ========================================================= */

export default app;

/* =========================================================
   PRODUCTION SERVER
   ========================================================= */

if (env.isProduction) {
  const { serve } = await import(
    "@hono/node-server"
  );

  const { serveStaticFiles } =
    await import("./lib/vite");

  serveStaticFiles(app);

  const port = Number(
    process.env.PORT || 3000,
  );

  serve(
    {
      fetch: app.fetch,
      port,
      hostname: "0.0.0.0",
    },
    (info) => {
      console.log(
        `Server running on 0.0.0.0:${info.port}`,
      );
    },
  );
}
