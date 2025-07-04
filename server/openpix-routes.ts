import { Express, Request, Response } from 'express';
import { isAuthenticated, isAdmin } from './middlewares';
import { createPixCharge, simulatePixPayment, handleOpenPixWebhook, handleOpenPixRefundWebhook, getChargeStatus, listOpenPixCharges, syncOpenPixPayments, getUserPayments, getUserOpenPixCharges, getOpenPixFinanceStats, getOpenPixSubscriptions, getOpenPixInvoices, getOpenPixWebhookConfigAPI, updateOpenPixWebhookConfigAPI, forcePaymentSync, configureOpenPixWebhook, listOpenPixWebhooks, configureOpenPixApiKey } from './openpix-service';
import axios from 'axios';

/**
 * Buscar informações completas da API OpenPix
 */
export async function getOpenPixApiInfo(req: Request, res: Response) {
  try {
    console.log('=== OPENPIX API INFO REQUEST ===');
    
    const apiInfo = {
      config: {
        apiUrl: 'https://api.openpix.com.br/api/v1',
        authorization: process.env.OPENPIX_AUTHORIZATION ? 'Configurado ✓' : 'Não configurado ✗',
        webhookUrl: process.env.OPENPIX_WEBHOOK_URL || 'Não configurado',
        environment: process.env.NODE_ENV || 'development'
      },
      endpoints: {
        charges: '/charge',
        webhook: '/webhook/openpix',
        refunds: '/reembolso',
        customers: '/customer',
        subscriptions: '/subscription'
      },
      status: {
        apiConnection: 'Conectado',
        lastUpdate: new Date().toISOString(),
        totalCharges: 0,
        totalRevenue: 0
      },
      features: {
        pixPayments: 'Ativo',
        webhooks: 'Configurado',
        refunds: 'Suportado',
        qrCode: 'Geração automática',
        brCode: 'Código copia-e-cola'
      }
    };

    // Buscar estatísticas reais
    try {
      const charges = await axios.get(`${process.env.OPENPIX_API_URL || 'https://api.openpix.com.br/api/v1'}/charge`, {
        headers: {
          'Authorization': process.env.OPENPIX_AUTHORIZATION,
          'Content-Type': 'application/json'
        }
      });

      if (charges.data && charges.data.charges) {
        apiInfo.status.totalCharges = charges.data.charges.length;
        apiInfo.status.totalRevenue = charges.data.charges
          .filter((charge: any) => charge.status === 'COMPLETED')
          .reduce((sum: number, charge: any) => sum + (charge.value || 0), 0) / 100;
      }
    } catch (error) {
      console.log('Erro ao buscar estatísticas OpenPix:', error);
      apiInfo.status.apiConnection = 'Erro na conexão';
    }

    console.log('Informações da API OpenPix:', apiInfo);
    res.json(apiInfo);
  } catch (error) {
    console.error('Erro ao buscar informações da API OpenPix:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar informações da API',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

/**
 * Configura rotas do OpenPix
 */
export function setupOpenPixRoutes(app: Express) {
  console.log('Configurando rotas do OpenPix...');

  // Criar cobrança PIX
  app.post('/api/openpix/create-charge', isAuthenticated, createPixCharge);

  // Simular pagamento PIX para testes
  app.post('/api/openpix/simulate-payment', isAuthenticated, simulatePixPayment);

  // Webhook do OpenPix (sem autenticação)
  app.post('/api/webhooks/openpix', handleOpenPixWebhook);

  // Webhook específico para reembolsos OpenPix (sem autenticação)
  app.post('/api/webhooks/openpix/refund', handleOpenPixRefundWebhook);

  // Webhook com ID específico usado pela OpenPix (no padrão /api/)
  app.post('/api/webhook/7a2c033e-98e4-4ce2-b499-2e6dd16556f4', (req, res) => {
    console.log('🎯 Webhook OpenPix com ID específico atingido - dados recebidos:', JSON.stringify(req.body, null, 2));
    handleOpenPixWebhook(req, res);
  });

  // Webhook genérico para qualquer ID (no padrão /api/)
  app.post('/api/webhook/:webhookId', (req, res) => {
    console.log(`🎯 Webhook genérico atingido - ID: ${req.params.webhookId} - dados recebidos:`, JSON.stringify(req.body, null, 2));
    handleOpenPixWebhook(req, res);
  });

  // Webhook para verificação de reembolso no domínio principal
  app.post('/reembolso', (req, res) => {
    console.log('🎯 Webhook /reembolso atingido - dados recebidos:', JSON.stringify(req.body, null, 2));
    handleOpenPixRefundWebhook(req, res);
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

  // Informações da API OpenPix (restrito a administradores)
  app.get('/api/openpix/info', isAdmin, getOpenPixApiInfo);

  // Configurar webhook da OpenPix
  app.post('/api/openpix/configure-webhook', isAuthenticated, configureOpenPixWebhook);

  // Listar webhooks configurados
  app.get('/api/openpix/webhooks', isAuthenticated, listOpenPixWebhooks);

  // Configurar chave API da OpenPix
  app.post('/api/openpix/configure-api-key', isAuthenticated, configureOpenPixApiKey);

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