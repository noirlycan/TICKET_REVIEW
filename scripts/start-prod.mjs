import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Railway / Neon / generic Postgres URL aliases
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL ||
    process.env.DATABASE_PRIVATE_URL ||
    "";
}

if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  console.error(`
[start-prod] DATABASE_URL is missing.

On Railway:
  1. Project → New → Database → PostgreSQL
  2. Open your web service → Variables
  3. Add variable DATABASE_URL = \${{ Postgres.DATABASE_URL }}
     (use Variable Reference to the Postgres service)
  4. Also set DIRECT_URL to the same reference (or omit; start script copies it)
  5. Set AUTH_SECRET, AUTH_TRUST_HOST=true, ADMIN_USERNAME, ADMIN_PASSWORD
  6. Redeploy
`);
  process.exit(1);
}

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
