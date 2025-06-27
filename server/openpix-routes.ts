import { Express } from 'express';
import { isAuthenticated } from './middlewares';
import { createPixCharge, handleOpenPixWebhook, getChargeStatus, listOpenPixCharges, syncOpenPixPayments, getUserPayments } from './openpix-service';

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

  // Listar todas as cobranças (admin)
  app.get('/api/openpix/charges', isAuthenticated, listOpenPixCharges);

  // Sincronizar pagamentos (admin)
  app.post('/api/openpix/sync', isAuthenticated, syncOpenPixPayments);

  // Consultar pagamentos do usuário
  app.get('/api/openpix/my-payments', isAuthenticated, getUserPayments);

  console.log('Rotas do OpenPix configuradas com sucesso');
}