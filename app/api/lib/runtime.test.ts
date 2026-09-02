import { describe, expect, it } from "vitest";
import { isNetlifyRuntime, shouldStartNodeServer, shouldUseTurso } from "./runtime";

describe("runtime helpers", () => {
  it("wykrywa środowisko Netlify", () => {
    expect(isNetlifyRuntime({ NETLIFY: "true" })).toBe(true);
    expect(isNetlifyRuntime({ AWS_LAMBDA_FUNCTION_NAME: "fn" })).toBe(true);
    expect(isNetlifyRuntime({})).toBe(false);
  });

  it("uruchamia serwer Node tylko poza runtime Netlify", () => {
    expect(shouldStartNodeServer({ NODE_ENV: "production" })).toBe(true);
    expect(shouldStartNodeServer({ NODE_ENV: "production", NETLIFY: "true" })).toBe(false);
    expect(shouldStartNodeServer({ NODE_ENV: "development" })).toBe(false);
  });

  it("wykrywa konfigurację Turso", () => {
    expect(shouldUseTurso({ TURSO_URL: "libsql://demo.turso.io" })).toBe(true);
    expect(shouldUseTurso({ TURSO_DATABASE_URL: "libsql://demo.turso.io" })).toBe(true);
    expect(shouldUseTurso({ TURSO_URL: "" })).toBe(false);
  });
});
