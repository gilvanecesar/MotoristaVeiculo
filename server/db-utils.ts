// Utilitários para lidar com timeouts e erros de conexão do banco
import { db } from "./db";

// Função para executar queries com retry automático
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), 15000)
        )
      ]);
    } catch (error: any) {
      lastError = error;
      
      // Se é o último retry, lança o erro
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Log do retry
      console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, error.message);
      
      // Aguarda antes do próximo retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumenta o delay exponencialmente
      delay *= 2;
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
    'Control plane request failed'
  ];
  
  return connectionErrors.some(msg => 
    error?.message?.includes(msg) || 
    error?.code?.includes(msg)
  );
}

// Função para executar operação com fallback
export async function executeWithFallback<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'Database operation'
): Promise<T> {
  try {
    return await executeWithRetry(operation, 2, 500);
  } catch (error: any) {
    if (isConnectionError(error)) {
      console.warn(`${operationName} falhou devido a problemas de conexão, usando fallback:`, error.message);
      return fallbackValue;
    }
    throw error;
  }
}