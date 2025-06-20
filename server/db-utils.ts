// Utilitários para lidar com timeouts e erros de conexão do banco
import { db } from "./db";

// Função para executar queries com retry automático
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 500
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), 8000)
        )
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Se é o último retry, lança o erro
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Log do retry apenas se não for erro de conexão comum
      if (!isConnectionError(error)) {
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, error.message);
      }
      
      // Aguarda antes do próximo retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumenta o delay linearmente (não exponencialmente para ser mais rápido)
      delay += 300;
    }
  }
  
  throw lastError;
}

// Função para verificar se um erro é de conexão
export function isConnectionError(error: any): boolean {
  const connectionErrors = [
    'Connection terminated',
    'Connection timeout',
    'ECONNRESET',
    'ETIMEDOUT',
    'Control plane request failed',
    'Failed to acquire permit',
    'Too many database connection',
    'database connection attempts',
    'XX000'
  ];
  
  return connectionErrors.some(msg => 
    error?.message?.includes(msg) || 
    error?.code?.includes(msg) ||
    error?.severity === 'ERROR'
  );
}

// Função para executar operação com fallback
export async function executeWithFallback<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'Database operation'
): Promise<T> {
  try {
    return await executeWithRetry(operation, 1, 200);
  } catch (error: any) {
    if (isConnectionError(error)) {
      // Log menos verboso para não poluir o console
      if (process.env.NODE_ENV === 'development') {
        console.warn(`${operationName}: usando fallback devido a instabilidade do BD`);
      }
      return fallbackValue;
    }
    throw error;
  }
}

// Cache simples em memória para operações críticas
const memoryCache = new Map<string, { data: any; expiry: number }>();

export function setCache(key: string, data: any, ttlSeconds: number = 60) {
  const expiry = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(key, { data, expiry });
}

export function getCache<T>(key: string): T | undefined {
  const cached = memoryCache.get(key);
  if (!cached) return undefined;
  
  if (Date.now() > cached.expiry) {
    memoryCache.delete(key);
    return undefined;
  }
  
  return cached.data as T;
}

export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now > value.expiry) {
      memoryCache.delete(key);
    }
  }
}