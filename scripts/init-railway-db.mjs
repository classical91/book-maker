import { readFile } from "node:fs/promises";
import { Client } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const client = new Client({
    connectionString,
  });

  await client.connect();

  try {
    const existing = await client.query(
      "SELECT to_regclass('public.book_projects') AS book_projects",
    );

    if (existing.rows[0]?.book_projects) {
      console.log("Database schema already present. Skipping init.");
      return;
    }

    const schemaSql = await readFile(new URL("../prisma/init.sql", import.meta.url), "utf8");

    await client.query(schemaSql);
    console.log("Database schema initialized.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
