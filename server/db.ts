import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Please add it to your deployment secrets.",
  );
}

// Configurações otimizadas para reduzir problemas de conexão
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduzir drasticamente o pool
  min: 1, // Manter pelo menos uma conexão
  connectionTimeoutMillis: 10000, // Timeout mais conservador
  idleTimeoutMillis: 30000, // Timeout de idle reduzido
  // Em produção, pode ser necessário configurar SSL de maneira diferente
  ssl: {
    rejectUnauthorized: false
  },
  // Configurações de retry
  keepAlive: false, // Desabilitar keep-alive que pode causar problemas
  allowExitOnIdle: true,
};

console.log(`Conectando ao banco de dados no ambiente: ${process.env.NODE_ENV || 'development'}`);
const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
export { pool };
