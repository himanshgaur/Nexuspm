import { PrismaClient } from "@prisma/client";
import { sqlitePrismaAdapter } from "./sqliteDb.js";
import dotenv from "dotenv";

dotenv.config();

let dbClient;

const hasNeonPostgres =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.includes("postgresql://") &&
  !process.env.DATABASE_URL.includes("YOUR_PASSWORD");

if (hasNeonPostgres) {
  try {
    dbClient = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
    console.log("⚡ [Database Engine] Connected to Neon PostgreSQL via Prisma ORM");
  } catch (err) {
    console.warn("⚠️ Failed connecting to Neon PostgreSQL, using persistent SQLite database:", err.message);
    dbClient = sqlitePrismaAdapter;
  }
} else {
  console.log("📦 [Database Engine] Using persistent SQLite database (server/nexus.db).");
  console.log("💡 [Tip] To connect live Neon PostgreSQL, add DATABASE_URL in .env");
  dbClient = sqlitePrismaAdapter;
}

export default dbClient;
