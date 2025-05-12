import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Using the connection string from the requirements
const connectionString = "Host=localhost;Port=5432;Database=sales_management;Username=postgres;Password=123abc..";

export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
