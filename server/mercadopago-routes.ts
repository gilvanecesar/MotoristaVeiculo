import { Express, Request, Response } from 'express';
import { isAuthenticated, isActive, isAdmin } from './middlewares';
import { storage } from './storage';
import { format } from 'date-fns';
import { createPaymentPreference, processWebhook, createTestPayment, getUserPayments } from './mercadopago';

/**
 * Configura todas as rotas relacionadas a assinaturas e pagamentos via Mercado Pago
 * @param app Express app
 */
export function setupMercadoPagoRoutes(app: Express) {
  console.log('Configurando Mercado Pago como gateway de pagamento principal');
  
  // Rotas para criação e gerenciamento de pagamentos
  app.post('/api/subscription/create-payment', isAuthenticated, isActive, createPaymentPreference);
  app.post('/api/mercadopago/create-payment', isAuthenticated, isActive, createPaymentPreference); // Rota adicional para compatibilidade
  app.post('/api/webhooks/mercadopago', processWebhook);
  app.get('/api/webhooks/mercadopago', processWebhook); // Alguns webhooks do MP são enviados como GET
  
  // Rota de teste para administradores
  app.get("/api/mercadopago/test-payment", isAdmin, createTestPayment);
  
  // Rota para simular pagamento bem-sucedido (ambiente de desenvolvimento)
  app.post('/api/mercadopago/simulate-payment', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const { planType } = req.body;
      console.log('Simulando pagamento para plano:', planType);
      
      // Atualizar usuário com assinatura ativa
      const user = req.user;
      const userId = user.id;
      
      // Verificar se ambiente é de desenvolvimento
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: { message: 'Esta rota só está disponível em ambiente de desenvolvimento' } });
      }
      
      // Calcular data de expiração
      const now = new Date();
      const expiresAt = new Date(now);
      if (planType === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      
      // Atualizar informações de assinatura
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: planType,
        subscriptionExpiresAt: expiresAt,
        paymentRequired: false
      });
      
      // Criar evento de assinatura
      await storage.createSubscriptionEvent({
        userId,
        eventType: 'subscription_activated',
        description: `Assinatura ${planType} ativada via simulação de pagamento`
      });
      
      return res.json({
        success: true,
        message: 'Pagamento simulado com sucesso',
        subscriptionDetails: {
          active: true,
          type: planType,
          expiresAt: expiresAt,
        }
      });
    } catch (error: any) {
      console.error('Erro ao simular pagamento:', error);
      return res.status(500).json({ error: { message: 'Erro ao simular pagamento' } });
    }
  });
  
  // Rota para obter informações de assinatura do usuário atual
  app.get('/api/user/subscription-info', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const user = req.user;
      
      // Verificar se o usuário tem assinatura ativa
      const active = !!user.subscriptionActive;
      const type = user.subscriptionType || 'none';
      const isTrial = type === 'trial';
      
      // Datas formatadas para o frontend
      let startDate = null;
      let endDate = null;
      let formattedStartDate = null;
      let formattedEndDate = null;
      
      if (user.subscriptionExpiresAt) {
        try {
          endDate = new Date(user.subscriptionExpiresAt);
          formattedEndDate = format(endDate, 'dd/MM/yyyy');
        } catch (err) {
          console.error('Erro ao formatar data de expiração:', err);
        }
      }
      
      // Calcular dias restantes
      let daysRemaining = 0;
      if (endDate) {
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      
      return res.json({
        active,
        isTrial,
        type,
        startDate,
        endDate: user.subscriptionExpiresAt,
        formattedStartDate,
        formattedEndDate,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
      });
    } catch (error) {
      console.error('Erro ao obter informações da assinatura:', error);
      return res.status(500).json({ error: { message: 'Erro ao obter informações da assinatura' } });
    }
  });
  
  // Rota para obter faturas/pagamentos do usuário
  app.get('/api/invoices', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const userId = req.user.id;
      
      // Buscar pagamentos do Mercado Pago para o usuário
      const payments = await getUserPayments(userId);
      
      return res.json(payments);
    } catch (error) {
      console.error('Erro ao obter faturas:', error);
      return res.status(500).json({ error: { message: 'Erro ao obter faturas' } });
    }
  });
  
  // Rota para ativar período de teste
  app.post('/api/activate-trial', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const userId = req.user.id;
      
      // Verificar se o usuário já tem assinatura ativa
      if (req.user.subscriptionActive) {
        return res.status(400).json({ error: { message: 'Usuário já possui assinatura ativa' } });
      }
      
      // Configurar período de teste (7 dias)
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Atualizar informações de assinatura do usuário
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: 'trial',
        subscriptionExpiresAt: trialEndDate,
        paymentRequired: true
      });
      
      return res.json({
        message: 'Período de teste ativado com sucesso',
        expiresAt: trialEndDate
      });
    } catch (error) {
      console.error('Erro ao ativar período de teste:', error);
      return res.status(500).json({ error: { message: 'Erro ao ativar período de teste' } });
    }
  });
  
  // Rota para cancelar assinatura
  app.post('/api/cancel-subscription', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
      }
      
      const userId = req.user.id;
      
      // Atualizar informações de assinatura do usuário
      await storage.updateUser(userId, {
        subscriptionActive: false,
        subscriptionExpiresAt: new Date() // Expirar imediatamente
      });
      
      return res.json({
        message: 'Assinatura cancelada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      return res.status(500).json({ error: { message: 'Erro ao cancelar assinatura' } });
    }
  });
}