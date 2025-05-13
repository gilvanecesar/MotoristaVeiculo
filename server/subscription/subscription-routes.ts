import { Express, Request, Response } from 'express';
import { isAuthenticated, isActive, isAdmin } from '../middlewares';
import { 
  createPaymentPreference, 
  processWebhook, 
  activateFreeTrial, 
  cancelUserSubscription,
  getUserPayments,
  getUserSubscriptionStatus
} from './mercadopago-service-v2';
import { storage } from '../storage';
import { registerSubscriptionExtensions } from './storage-extensions';

/**
 * Configura todas as rotas relacionadas a assinaturas e pagamentos via Mercado Pago
 * @param app Express app
 */
export function setupMercadoPagoSubscriptionRoutes(app: Express) {
  console.log('Configurando rotas de assinatura via Mercado Pago');
  
  // Registrar extensões de armazenamento para suportar as novas funcionalidades
  registerSubscriptionExtensions(storage as any);
  
  // Rotas para criação e gerenciamento de pagamentos
  app.post('/api/subscription/create-payment', isAuthenticated, isActive, createPaymentPreference);
  
  // Webhook para processamento de notificações
  app.post('/api/webhooks/mercadopago', processWebhook);
  app.get('/api/webhooks/mercadopago', processWebhook); // Alguns webhooks do MP são enviados como GET
  
  // Rotas para obter informações de assinatura
  app.get('/api/subscription/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const status = await getUserSubscriptionStatus(req.user.id);
      res.json(status);
    } catch (error) {
      console.error('Erro ao obter status de assinatura:', error);
      res.status(500).json({ error: { message: 'Erro ao obter status de assinatura' } });
    }
  });
  
  // Rota para cancelar assinatura
  app.post('/api/subscription/cancel', isAuthenticated, cancelUserSubscription);
  
  // Rota para ativar período de teste
  app.post('/api/subscription/activate-trial', isAuthenticated, activateFreeTrial);
  
  // Rota para obter histórico de pagamentos
  app.get('/api/subscription/payment-history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const payments = await getUserPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      console.error('Erro ao obter histórico de pagamentos:', error);
      res.status(500).json({ error: { message: 'Erro ao obter histórico de pagamentos' } });
    }
  });
  
  // Rotas administrativas
  app.get('/api/admin/subscriptions', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // Obter todas as assinaturas ativas
      const activeSubscriptions = await storage.getActiveSubscriptions();
      
      // Formatar para o frontend
      const formattedSubscriptions = await Promise.all(activeSubscriptions.map(async (sub) => {
        const user = await storage.getUser(sub.userId);
        return {
          id: sub.id,
          userId: sub.userId,
          userName: user?.name || 'Usuário desconhecido',
          userEmail: user?.email || 'Email desconhecido',
          status: sub.status,
          planType: sub.planType,
          startDate: sub.createdAt,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          canceledAt: sub.canceledAt || null
        };
      }));
      
      res.json(formattedSubscriptions);
    } catch (error) {
      console.error('Erro ao obter assinaturas:', error);
      res.status(500).json({ error: { message: 'Erro ao obter assinaturas' } });
    }
  });
  
  // Rota para enviar lembrete de pagamento (admin)
  app.post('/api/admin/send-payment-reminder/:userId', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: { message: 'Usuário não encontrado' } });
      }
      
      // Esta parte depende do serviço de email implementado
      // Aqui você pode importar e usar uma função de envio de email
      // Por exemplo: await sendPaymentReminderEmail(user, req.body.message);
      
      // Registrar evento
      await storage.createSubscriptionEvent({
        userId,
        eventType: 'payment_reminder_sent',
        metadata: {
          sentBy: req.user?.id,
          message: req.body.message || 'Lembrete de pagamento'
        }
      });
      
      res.json({ success: true, message: 'Lembrete de pagamento enviado' });
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      res.status(500).json({ error: { message: 'Erro ao enviar lembrete de pagamento' } });
    }
  });
  
  // Rota para obter eventos de assinatura de um usuário (admin)
  app.get('/api/admin/subscription-events/:userId', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const events = await storage.getSubscriptionEvents(userId, 50);
      res.json(events);
    } catch (error) {
      console.error('Erro ao obter eventos de assinatura:', error);
      res.status(500).json({ error: { message: 'Erro ao obter eventos de assinatura' } });
    }
  });
  
  console.log('Rotas de assinatura via Mercado Pago configuradas com sucesso');
}