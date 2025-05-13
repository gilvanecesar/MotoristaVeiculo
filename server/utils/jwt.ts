import jwt from 'jsonwebtoken';

// Chave secreta usada para assinar tokens JWT
// Em produção, isso deve vir de uma variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'querofretes-subscription-token-secret';

// Tempo de expiração padrão para tokens (1 hora)
const DEFAULT_EXPIRATION = '1h';

/**
 * Gera um token JWT com os dados fornecidos
 * @param payload Dados a serem incluídos no token
 * @param expiresIn Tempo de expiração (opcional, padrão: 1h)
 * @returns Token JWT assinado
 */
export function generateToken(payload: any, expiresIn: string = DEFAULT_EXPIRATION): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT a ser verificado
 * @returns Dados decodificados do token ou null se inválido
 */
export function verifyToken(token: string): any | null {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

/**
 * Gera um token de expiração para uso em recuperação de senha
 * @param userId ID do usuário
 * @param email Email do usuário
 * @returns Token JWT com validade de 1 hora
 */
export function generatePasswordResetToken(userId: number, email: string): string {
  return generateToken({ userId, email, purpose: 'password-reset' }, '1h');
}

/**
 * Gera um token de pagamento para o Mercado Pago
 * @param userId ID do usuário
 * @param subscriptionId ID da assinatura (opcional)
 * @param planType Tipo de plano
 * @returns Token JWT com validade de 15 minutos
 */
export function generatePaymentToken(
  userId: number, 
  subscriptionId: number | null = null, 
  planType: string
): string {
  return generateToken(
    { 
      userId, 
      subscriptionId, 
      planType, 
      purpose: 'payment' 
    }, 
    '15m'
  );
}

/**
 * Gera um token de webhook para o Mercado Pago
 * @param subscriptionId ID da assinatura
 * @returns Token JWT com validade longa (30 dias)
 */
export function generateWebhookToken(subscriptionId: number): string {
  return generateToken(
    { subscriptionId, purpose: 'webhook' }, 
    '30d'
  );
}