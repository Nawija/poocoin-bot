// lib/db.ts
import { sql } from "@vercel/postgres";

export async function initDb() {
    await sql`
    CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT,
      description TEXT,
      createdAt TIMESTAMP DEFAULT NOW()
    );
  `;
}
