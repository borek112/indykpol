export function isNetlifyRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NETLIFY === "true" || Boolean(env.AWS_LAMBDA_FUNCTION_NAME);
}

export function shouldStartNodeServer(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production" && !isNetlifyRuntime(env);
}

export function shouldUseTurso(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean((env.TURSO_URL ?? env.TURSO_DATABASE_URL)?.trim());
}
