import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnv({ path: path.join(root, ".env") });

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim()) return String(value).trim();
  }
  return "";
}

function fromPgParts() {
  const host = firstEnv("PGHOST", "POSTGRES_HOST");
  const port = firstEnv("PGPORT", "POSTGRES_PORT") || "5432";
  const user = firstEnv("PGUSER", "POSTGRES_USER");
  const password = firstEnv("PGPASSWORD", "POSTGRES_PASSWORD");
  const database = firstEnv("PGDATABASE", "POSTGRES_DB", "POSTGRES_DATABASE");
  if (!host || !user || !password || !database) return "";
  const enc = encodeURIComponent;
  return `postgresql://${enc(user)}:${enc(password)}@${host}:${port}/${database}`;
}

function resolveDatabaseUrl() {
  return (
    firstEnv(
      "DATABASE_URL",
      "POSTGRES_URL",
      "POSTGRESQL_URL",
      "DATABASE_PRIVATE_URL",
      "DATABASE_PUBLIC_URL",
    ) || fromPgParts()
  );
}

process.env.DATABASE_URL = resolveDatabaseUrl();

if (process.env.DATABASE_URL && !firstEnv("DIRECT_URL")) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  const related = Object.keys(process.env)
    .filter((k) => /^(DATABASE|POSTGRES|PG)/i.test(k))
    .sort();
  console.error(`
[start-prod] DATABASE_URL is missing on this service.

Related env keys present: ${related.length ? related.join(", ") : "(none)"}

Fix on Railway (Web service → Variables):
  1. Ensure a PostgreSQL service exists in the SAME project.
  2. Add Variable → "Add Reference" (not raw text):
       DATABASE_URL  →  <PostgresService>.DATABASE_URL
       DIRECT_URL    →  <PostgresService>.DATABASE_URL
  3. Also set:
       AUTH_SECRET=<random>
       AUTH_TRUST_HOST=true
       ADMIN_USERNAME=admin
       ADMIN_PASSWORD=<your-password>
  4. Save → Deployments → Redeploy

Service name in the reference must match your Postgres service name
(e.g. Postgres, PostgreSQL, ticket-review-db).
`);
  process.exit(1);
}

console.log("[start-prod] DATABASE_URL is set");
console.log("[start-prod] Running migrate + seed + next start");

function run(command, args) {
  console.log(`[start-prod] $ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["tsx", "prisma/seed.ts"]);
run("npx", ["next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"]);
