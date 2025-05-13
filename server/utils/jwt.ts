import jwt from 'jsonwebtoken';

// Chave secreta para assinar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'querofretes_mercadopago_secret_key';

/**
 * Assina um token JWT com dados
 * @param payload Dados a serem incluídos no token
 * @returns Token JWT assinado
 */
export function jwtSign(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT a ser verificado
 * @returns Dados decodificados do token
 */
export function jwtVerify(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}