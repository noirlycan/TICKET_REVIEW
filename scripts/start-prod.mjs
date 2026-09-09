import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!process.env.DATABASE_URL) {
  console.error("[start-prod] DATABASE_URL is required (Postgres connection string)");
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
run("npx", ["next", "start", "-H", "0.0.0.0"]);
