/**
 * Boots the Express app without MongoDB and exercises the routes that do not
 * touch the database, to prove the middleware chain and routing are wired up.
 * Run with: node --import tsx scripts/smoke.ts
 */
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";

import { createServer } from "node:http";

import { createApp } from "../src/app.js";

const app = createApp();
const server = createServer(app);

await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("no port");
const base = `http://127.0.0.1:${address.port}`;

async function call(method: string, path: string, init?: RequestInit) {
  const response = await fetch(`${base}${path}`, init);
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

let failures = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}`, extra ?? "");
  }
}

console.log("health");
const health = await call("GET", "/api/v1/health");
check("GET /api/v1/health → 200", health.status === 200, health);
check(
  "health body is wrapped in { data }",
  typeof (health.body as { data?: unknown })?.data === "object",
  health.body,
);

console.log("unknown route");
const missing = await call("GET", "/api/v1/does-not-exist");
check("unknown route → 404", missing.status === 404, missing);

console.log("auth guards");
for (const [method, path] of [
  ["GET", "/api/v1/auth/me"],
  ["GET", "/api/v1/profile"],
  ["POST", "/api/v1/chat/ask"],
  ["GET", "/api/v1/notifications"],
] as const) {
  const res = await call(method, path);
  check(`${method} ${path} → 401`, res.status === 401, res);
}

console.log("validation");
const badRegister = await call("POST", "/api/v1/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "", mobile: "1", password: "x" }),
});
check("POST /auth/register with empty body → 400", badRegister.status === 400, badRegister);
check(
  "validation error carries a code",
  typeof (badRegister.body as { error?: { code?: string } })?.error?.code === "string",
  badRegister.body,
);

const badId = await call("GET", "/api/v1/government/services/%20");
check("GET /government/services/<blank> → 404 or 400", [400, 404].includes(badId.status), badId);

console.log("malformed json");
const malformed = await call("POST", "/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{not json",
});
check("POST /auth/login with malformed JSON → 400", malformed.status === 400, malformed);

console.log("security headers");
const res = await fetch(`${base}/api/v1/health`);
check("X-Powered-By removed", res.headers.get("x-powered-by") === null);
check("X-Request-Id present", Boolean(res.headers.get("x-request-id")));

server.close();
console.log(failures === 0 ? "\nALL SMOKE CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
