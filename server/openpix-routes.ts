import { Express } from 'express';
import { isAuthenticated } from './middlewares';
import { createPixCharge, handleOpenPixWebhook, getChargeStatus, listOpenPixCharges, syncOpenPixPayments, getUserPayments, getUserOpenPixCharges, getOpenPixFinanceStats, getOpenPixSubscriptions, getOpenPixInvoices, getOpenPixWebhookConfigAPI, updateOpenPixWebhookConfigAPI } from './openpix-service';

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
  
  // Buscar cobranças específicas do usuário logado (segura)
  app.get('/api/openpix/my-charges', isAuthenticated, getUserOpenPixCharges);

  // Sincronizar pagamentos (admin)
  app.post('/api/openpix/sync', isAuthenticated, syncOpenPixPayments);

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

  // ===== ROTA DE TESTE PARA REEMBOLSO PIX =====
  
  // Simular reembolso PIX para teste (Admin only)
  app.post('/api/openpix/test-refund', isAuthenticated, async (req, res) => {
    try {
      const { correlationId } = req.body;
      
      if (!correlationId) {
        return res.status(400).json({ error: 'correlationId é obrigatório' });
      }

      console.log(`🧪 Testando reembolso PIX para correlationId: ${correlationId}`);

      // Simular webhook de reembolso
      const mockRefundWebhook = {
        charge: {
          correlationID: correlationId,
          status: 'REFUND'
        },
        pix: null // Para reembolsos, o pix pode ser null
      };

      // Chamar o handler do webhook diretamente
      const { handleOpenPixWebhook } = require('./openpix-service');
      const mockReq = {
        body: mockRefundWebhook
      } as any;

      const mockRes = {
        status: (code: number) => ({
          json: (data: any) => {
            console.log(`Webhook de reembolso processado com status: ${code}`);
            return res.status(200).json({ 
              success: true, 
              message: 'Reembolso PIX simulado com sucesso',
              correlationId,
              webhookResponse: data 
            });
          },
          send: (data: any) => {
            console.log(`Webhook de reembolso processado: ${data}`);
            return res.status(200).json({ 
              success: true, 
              message: 'Reembolso PIX simulado com sucesso',
              correlationId,
              webhookResponse: data 
            });
          }
        })
      } as any;

      await handleOpenPixWebhook(mockReq, mockRes);

    } catch (error: any) {
      console.error('Erro ao testar reembolso:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  });

  console.log('Rotas do OpenPix configuradas com sucesso');
}