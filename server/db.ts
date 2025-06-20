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
  max: 10, // Reduzir pool para evitar sobrecarga
  connectionTimeoutMillis: 20000, // Aumentar timeout
  idleTimeoutMillis: 60000, // Aumentar idle timeout
  query_timeout: 30000, // Timeout para queries
  statement_timeout: 30000,
  // Em produção, pode ser necessário configurar SSL de maneira diferente
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações de retry
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

console.log(`Conectando ao banco de dados no ambiente: ${process.env.NODE_ENV || 'development'}`);
const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
export { pool };
