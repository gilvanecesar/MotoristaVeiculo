import { Request, Response } from "express";
import { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../middlewares";
import { stripe } from "../stripe";
import { format } from "date-fns";

// Rotas para gerenciamento de assinatura

export function registerUserSubscriptionRoutes(app: Express) {
  // Endpoint para obter informações da assinatura do usuário
  app.get("/api/user/subscription-info", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Determinar se é um período de teste
      const isTrial = user.subscriptionType === "trial";
      const trialUsed = user.subscriptionType === "trial" || user.subscriptionExpiresAt != null;

      // Detalhes de pagamento do Stripe (se disponível)
      let stripePaymentMethod = null;
      if (user.stripeCustomerId) {
        try {
          const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
            expand: ["invoice_settings.default_payment_method"],
          });
          
          if (customer && !customer.deleted && customer.invoice_settings?.default_payment_method) {
            const paymentMethod = customer.invoice_settings.default_payment_method;
            if (typeof paymentMethod !== "string") {
              stripePaymentMethod = {
                brand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                expMonth: paymentMethod.card?.exp_month,
                expYear: paymentMethod.card?.exp_year,
              };
            }
          }
        } catch (err) {
          console.error("Erro ao obter detalhes do cliente no Stripe:", err);
          // Não retornar erro para o cliente, apenas continuar sem as informações de pagamento
        }
      }

      // Formatar informações para o cliente
      return res.json({
        active: user.subscriptionActive || false,
        isTrial,
        trialUsed,
        planType: user.subscriptionType || null,
        expiresAt: user.subscriptionExpiresAt || null,
        paymentMethod: stripePaymentMethod,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null
      });
    } catch (error) {
      console.error("Erro ao obter informações da assinatura:", error);
      return res.status(500).json({ error: "Erro ao obter informações da assinatura" });
    }
  });

  // Endpoint para obter faturas do usuário
  app.get("/api/user/invoices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        // Usuário não tem ID de cliente Stripe, retornar lista vazia
        return res.json({ invoices: [] });
      }

      // Buscar faturas no Stripe
      const invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 100, // Limitar para as 100 faturas mais recentes
      });

      return res.json({
        invoices: invoices.data
      });
    } catch (error) {
      console.error("Erro ao obter faturas:", error);
      return res.status(500).json({ error: "Erro ao obter faturas" });
    }
  });

  // Endpoint para obter histórico de assinatura
  app.get("/api/user/subscription-history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Buscar histórico de eventos de assinatura
      const events = await storage.getSubscriptionEvents(userId);

      return res.json({
        events
      });
    } catch (error) {
      console.error("Erro ao obter histórico de assinatura:", error);
      return res.status(500).json({ error: "Erro ao obter histórico de assinatura" });
    }
  });

  // Endpoint para reportar problemas de pagamento
  app.post("/api/report-payment-issue", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { issueType, description, email } = req.body;
      
      if (!issueType || !description) {
        return res.status(400).json({ error: "Tipo de problema e descrição são obrigatórios" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Registrar o problema
      const supportTicket = await storage.createSupportTicket({
        userId,
        issueType,
        description,
        contactEmail: email || user.email,
        status: "pending",
        createdAt: new Date(),
        resolvedAt: null
      });

      // Enviar notificação por email para o suporte
      // (Aqui você adicionaria o código para enviar email para o suporte)

      return res.json({
        success: true,
        ticketId: supportTicket.id,
        message: "Problema reportado com sucesso. Nossa equipe entrará em contato em breve."
      });
    } catch (error) {
      console.error("Erro ao reportar problema:", error);
      return res.status(500).json({ error: "Erro ao reportar problema" });
    }
  });
}