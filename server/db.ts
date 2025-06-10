import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please add it to your deployment secrets.",
  );
}

// Configurações diferentes para desenvolvimento e produção
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  min: 2,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 300000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 0,
  // Em produção, pode ser necessário configurar SSL de maneira diferente
  ssl: {
    rejectUnauthorized: false
  }
};

console.log(`Conectando ao banco de dados no ambiente: ${process.env.NODE_ENV || 'development'}`);
const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
export { pool };
