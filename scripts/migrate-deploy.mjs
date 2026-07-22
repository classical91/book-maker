// Applies Prisma migrations before the app starts.
//
// Three scenarios are handled safely:
//   1. Fresh database (no tables)            -> `prisma migrate deploy` creates everything.
//   2. Prisma-managed database               -> `prisma migrate deploy` applies pending migrations.
//   3. Legacy database created before Prisma  -> the baseline migration is marked as
//      already-applied (`migrate resolve`) so deploy only runs newer migrations
//      instead of trying to recreate existing tables.
//
// This replaces the old approach of executing DDL from application requests.
import { spawnSync } from "node:child_process";
import { Client } from "pg";

// Must match the folder name in prisma/migrations for the initial schema.
const BASELINE_MIGRATION = "20240101000000_init";

function runPrisma(args) {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function needsBaseline() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to run migrations.");
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const managed = await client.query(
      "SELECT to_regclass('public._prisma_migrations') AS present",
    );
    if (managed.rows[0]?.present) {
      // Prisma is already tracking this database; nothing to baseline.
      return false;
    }

    const legacy = await client.query(
      "SELECT to_regclass('public.book_projects') AS present",
    );
    // Legacy schema exists but Prisma has never tracked it -> baseline it.
    return Boolean(legacy.rows[0]?.present);
  } finally {
    await client.end();
  }
}

async function main() {
  if (await needsBaseline()) {
    console.log(
      `Existing schema detected without Prisma migration history. Baselining ${BASELINE_MIGRATION}...`,
    );
    runPrisma(["migrate", "resolve", "--applied", BASELINE_MIGRATION]);
  }

  runPrisma(["migrate", "deploy"]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
