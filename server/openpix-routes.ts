import { Express } from 'express';
import { isAuthenticated } from './middlewares';
import { createPixCharge, handleOpenPixWebhook, getChargeStatus } from './openpix-service';

/**
 * Configura rotas do OpenPix
 */
export function setupOpenPixRoutes(app: Express) {
  console.log('Configurando rotas do OpenPix...');

  // Criar cobrança PIX
  app.post('/api/openpix/create-charge', isAuthenticated, createPixCharge);

  // Webhook do OpenPix (sem autenticação)
  app.post('/api/webhooks/openpix', handleOpenPixWebhook);

  // Consultar status de cobrança
  app.get('/api/openpix/charge/:chargeId', isAuthenticated, getChargeStatus);

  console.log('Rotas do OpenPix configuradas com sucesso');
}