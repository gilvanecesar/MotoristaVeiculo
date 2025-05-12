import { Request, Response } from "express";
import { isAuthenticated } from "./middlewares";
import { storage } from "./storage";

/**
 * Configura as rotas de assinatura utilizando Mercado Pago
 */
export function setupSubscriptionRoutes(app: any) {
  // Endpoint para obter informações da assinatura do usuário
  app.get("/api/user/subscription-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).send({ error: { message: "Não autenticado" } });
      }
      
      // Verificar se o usuário tem um período de teste ativo
      const isTrial = user.subscriptionType === "trial";
      const trialUsed = user.subscriptionType === "trial" || user.subscriptionExpiresAt != null;
      
      // Determinar status da assinatura com base nos dados do usuário
      const active = user.subscriptionActive || false;
      
      // Buscar assinaturas e pagamentos do Mercado Pago
      const userSubscriptions = await storage.getSubscriptionsByUser(user.id);
      const userPayments = await storage.getMercadoPagoPaymentsByUser(user.id);
      
      console.log(`Usuário possui ${userSubscriptions.length} assinaturas e ${userPayments?.length || 0} pagamentos no Mercado Pago`);
      
      // Retornando informações básicas do banco + dados do Mercado Pago se disponíveis
      let paymentInfo = {
        paymentMethod: "mercadopago",
        lastPaymentDate: null as Date | null,
        nextPaymentDate: null as Date | null
      };
      
      // Se tiver pagamentos do Mercado Pago, usar o mais recente
      if (userPayments && userPayments.length > 0) {
        const latestPayment = userPayments[0]; // Assumindo que estão ordenados por data
        paymentInfo.lastPaymentDate = latestPayment.createdAt;
        
        // Buscar a assinatura relacionada ao pagamento
        if (latestPayment.subscriptionId) {
          const relatedSubscription = await storage.getSubscription(latestPayment.subscriptionId);
          if (relatedSubscription) {
            paymentInfo.nextPaymentDate = relatedSubscription.currentPeriodEnd;
          }
        }
      }
      
      // Retornar informações de assinatura usando dados do Mercado Pago
      return res.json({
        active,
        isTrial,
        trialUsed,
        planType: user.subscriptionType || null,
        expiresAt: user.subscriptionExpiresAt || null,
        paymentMethod: paymentInfo.paymentMethod,
        lastPaymentDate: paymentInfo.lastPaymentDate ? new Date(paymentInfo.lastPaymentDate).toISOString() : null,
        nextPaymentDate: paymentInfo.nextPaymentDate ? new Date(paymentInfo.nextPaymentDate).toISOString() : null,
        paymentRequired: user.paymentRequired || false
      });
    } catch (error) {
      console.error("Erro ao buscar informações de assinatura:", error);
      return res.status(500).json({ error: { message: "Erro ao buscar informações de assinatura" } });
    }
  });
}