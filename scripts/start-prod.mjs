import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, "prisma", "data.db");

// Always use one absolute SQLite file so migrate/seed/app share the same DB.
const current = process.env.DATABASE_URL ?? "";
if (
  !current ||
  current.startsWith("file:./") ||
  current.startsWith("file:prisma/") ||
  current === "file:./prod.db" ||
  current === "file:./dev.db"
) {
  process.env.DATABASE_URL = `file:${dbFile}`;
}

console.log(`[start-prod] cwd=${root}`);
console.log(`[start-prod] DATABASE_URL=${process.env.DATABASE_URL}`);

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
