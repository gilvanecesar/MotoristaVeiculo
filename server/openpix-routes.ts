import { Express } from 'express';
import { isAuthenticated } from './middlewares';
import { createPixCharge, handleOpenPixWebhook, handleOpenPixRefundWebhook, getChargeStatus, listOpenPixCharges, syncOpenPixPayments, getUserPayments, getUserOpenPixCharges, getOpenPixFinanceStats, getOpenPixSubscriptions, getOpenPixInvoices, getOpenPixWebhookConfigAPI, updateOpenPixWebhookConfigAPI, forcePaymentSync } from './openpix-service';

/**
 * Configura rotas do OpenPix
 */
export function setupOpenPixRoutes(app: Express) {
  console.log('Configurando rotas do OpenPix...');

  // Criar cobrança PIX
  app.post('/api/openpix/create-charge', isAuthenticated, createPixCharge);

  // Webhook do OpenPix (sem autenticação)
  app.post('/api/webhooks/openpix', handleOpenPixWebhook);

  // Webhook específico para reembolsos OpenPix (sem autenticação)
  app.post('/api/webhooks/openpix/refund', handleOpenPixRefundWebhook);

  // Webhook para verificação de reembolso no domínio principal
  app.post('/reembolso', (req, res, next) => {
    console.log('🎯 Webhook /reembolso atingido - dados recebidos:', JSON.stringify(req.body, null, 2));
    handleOpenPixRefundWebhook(req, res, next);
  });

  // Consultar status de cobrança
  app.get('/api/openpix/charge/:chargeId', isAuthenticated, getChargeStatus);

  // Listar todas as cobranças (admin)
  app.get('/api/openpix/charges', isAuthenticated, listOpenPixCharges);
  
  // Buscar cobranças específicas do usuário logado (segura)
  app.get('/api/openpix/my-charges', isAuthenticated, getUserOpenPixCharges);

  // Sincronizar pagamentos (admin)
  app.post('/api/openpix/sync', isAuthenticated, syncOpenPixPayments);

  // Forçar sincronização de um pagamento específico
  app.post('/api/openpix/force-sync/:chargeId', isAuthenticated, forcePaymentSync);

  // Consultar pagamentos do usuário
  app.get('/api/openpix/my-payments', isAuthenticated, getUserPayments);

  // ===== ROTAS ADMINISTRATIVAS OPENPIX =====
  
  // Estatísticas financeiras em tempo real da OpenPix (Admin)
  app.get('/api/admin/openpix/finance/stats', isAuthenticated, getOpenPixFinanceStats);
  
  // Assinaturas da OpenPix (Admin)
  app.get('/api/admin/openpix/subscriptions', isAuthenticated, getOpenPixSubscriptions);
  
  // Faturas da OpenPix (Admin)
  app.get('/api/admin/openpix/invoices', isAuthenticated, getOpenPixInvoices);

  // ===== CONFIGURAÇÃO DE WEBHOOK WHATSAPP =====
  
  // Obter configuração do webhook WhatsApp (Admin)
  app.get('/api/openpix/webhook/config', isAuthenticated, getOpenPixWebhookConfigAPI);
  
  // Atualizar configuração do webhook WhatsApp (Admin)
  app.post('/api/openpix/webhook/config', isAuthenticated, updateOpenPixWebhookConfigAPI);

  console.log('Rotas do OpenPix configuradas com sucesso');
}