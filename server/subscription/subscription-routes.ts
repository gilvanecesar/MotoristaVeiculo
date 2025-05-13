import { Request, Response } from 'express';
import { isAuthenticated, isAdmin } from '../middlewares';
import { MercadoPagoStorageExtension } from './storage-extensions';
import { 
  createPaymentPreference, 
  processWebhook, 
  createTestPayment,
  activateTrialPeriod,
  checkUserSubscription,
  cancelUserSubscription,
  getUserPaymentsHistory
} from './mercadopago-service';
import { storage } from '../storage';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

// Extender o storage com métodos do Mercado Pago
const mercadoPagoStorage = new MercadoPagoStorageExtension();

// Associar métodos do storage para o mercadopago-service.ts
Object.assign(storage, mercadoPagoStorage);

/**
 * Configurar as rotas de assinatura do Mercado Pago
 */
export function setupMercadoPagoSubscriptionRoutes(app: any) {
  // Webhook para receber notificações do Mercado Pago
  app.post('/api/mercadopago-webhook', processWebhook);
  
  // Criar preferência de pagamento (gerar link para checkout)
  app.post('/api/create-payment-preference', isAuthenticated, createPaymentPreference);
  
  // Criar pagamento de teste
  app.post('/api/create-test-payment', isAuthenticated, createTestPayment);
  
  // Ativar período de teste
  app.post('/api/activate-trial', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const result = await activateTrialPeriod(req.user.id);
      
      res.json({
        success: true,
        message: result.message,
        expirationDate: result.expirationDate,
        formattedExpirationDate: format(result.expirationDate, "dd 'de' MMMM 'de' yyyy", { locale: pt })
      });
    } catch (error: any) {
      console.error('Erro ao ativar período de teste:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao ativar período de teste'
      });
    }
  });
  
  // Obter informações da assinatura do usuário
  app.get('/api/user/subscription-info', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const subscriptionInfo = await checkUserSubscription(req.user.id);
      
      // Formatar datas para exibição amigável
      let formattedExpirationDate = null;
      if (subscriptionInfo.expiresAt) {
        try {
          formattedExpirationDate = format(
            new Date(subscriptionInfo.expiresAt),
            "dd 'de' MMMM 'de' yyyy",
            { locale: pt }
          );
        } catch (err) {
          console.error('Erro ao formatar data de expiração:', err);
        }
      }
      
      res.json({
        ...subscriptionInfo,
        formattedExpirationDate
      });
    } catch (error: any) {
      console.error('Erro ao obter informações da assinatura:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter informações da assinatura'
      });
    }
  });
  
  // Obter histórico de pagamentos
  app.get('/api/user/payment-history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const payments = await getUserPaymentsHistory(req.user.id);
      
      res.json({
        success: true,
        payments
      });
    } catch (error: any) {
      console.error('Erro ao obter histórico de pagamentos:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter histórico de pagamentos'
      });
    }
  });
  
  // Cancelar assinatura
  app.post('/api/cancel-subscription', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const result = await cancelUserSubscription(req.user.id);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao cancelar assinatura'
      });
    }
  });
  
  // Rotas administrativas
  
  // Obter todas as assinaturas
  app.get('/api/admin/subscriptions', isAdmin, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      console.error('Erro ao obter assinaturas:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter assinaturas'
      });
    }
  });
  
  // Obter assinaturas de um usuário específico
  app.get('/api/admin/users/:userId/subscriptions', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: { message: 'ID de usuário inválido' } });
      }
      
      const subscriptions = await storage.getSubscriptionsByUser(userId);
      res.json(subscriptions);
    } catch (error: any) {
      console.error('Erro ao obter assinaturas do usuário:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter assinaturas do usuário'
      });
    }
  });
  
  // Atualizar status de uma assinatura (para administradores)
  app.post('/api/admin/subscriptions/:id/update-status', isAdmin, async (req: Request, res: Response) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(subscriptionId)) {
        return res.status(400).json({ error: { message: 'ID de assinatura inválido' } });
      }
      
      if (!status) {
        return res.status(400).json({ error: { message: 'Status não fornecido' } });
      }
      
      const subscription = await storage.getSubscription(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ error: { message: 'Assinatura não encontrada' } });
      }
      
      // Atualizar status da assinatura
      const updatedSubscription = await storage.updateSubscription(subscriptionId, { status });
      
      // Se o status for 'active', atualizar o usuário também
      if (status === 'active') {
        await storage.updateUser(subscription.userId, {
          subscriptionActive: true,
          paymentRequired: false
        });
      } else if (status === 'canceled' || status === 'inactive') {
        await storage.updateUser(subscription.userId, {
          subscriptionActive: false,
          paymentRequired: true
        });
      }
      
      res.json({
        success: true,
        subscription: updatedSubscription
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status da assinatura:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar status da assinatura'
      });
    }
  });
  
  // Criar manualmente uma assinatura para um usuário (para administradores)
  app.post('/api/admin/users/:userId/create-subscription', isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { planType, durationDays } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: { message: 'ID de usuário inválido' } });
      }
      
      if (!planType || !durationDays) {
        return res.status(400).json({ 
          error: { 
            message: 'Tipo de plano e duração em dias são obrigatórios' 
          } 
        });
      }
      
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ error: { message: 'Usuário não encontrado' } });
      }
      
      // Calcular datas
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(durationDays));
      
      // Criar assinatura
      const subscription = await storage.createOrUpdateSubscription({
        userId,
        status: 'active',
        planType,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate
      });
      
      // Atualizar usuário
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: planType,
        subscriptionExpiresAt: endDate,
        paymentRequired: false
      });
      
      res.json({
        success: true,
        message: `Assinatura ${planType} criada com sucesso para o usuário`,
        subscription
      });
    } catch (error: any) {
      console.error('Erro ao criar assinatura manualmente:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar assinatura manualmente'
      });
    }
  });
}