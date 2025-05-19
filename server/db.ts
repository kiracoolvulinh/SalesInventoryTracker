import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: "postgresql://postgres:123abc..@localhost:5432/Ban_Hang"
});

// Create a Drizzle ORM instance
export const db = drizzle(pool, { schema });
