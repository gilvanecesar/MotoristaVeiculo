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

      // Usar o objeto de usuário já fornecido pelo passport
      if (!req.user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      const user = req.user;

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

      // Formatar data de expiração para exibição na interface
      let formattedExpirationDate = null;
      if (user.subscriptionExpiresAt) {
        try {
          const expirationDate = new Date(user.subscriptionExpiresAt);
          formattedExpirationDate = format(expirationDate, "dd/MM/yyyy");
        } catch (err) {
          console.error("Erro ao formatar data de expiração:", err);
        }
      }

      // Determinar se a assinatura está ativa
      let active = false;
      if (user.subscriptionActive) {
        active = true;
      } else if (isTrial && user.subscriptionExpiresAt) {
        // Verificar se o período de teste ainda está válido
        const expirationDate = new Date(user.subscriptionExpiresAt);
        const now = new Date();
        active = expirationDate > now;
      }

      return res.json({
        active,
        isTrial,
        trialUsed,
        planType: user.subscriptionType || null,
        expiresAt: user.subscriptionExpiresAt || null,
        formattedExpirationDate,
        paymentMethod: stripePaymentMethod,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
        stripeCustomerId: user.stripeCustomerId || null,
      });
    } catch (error: any) {
      console.error("Erro ao obter informações da assinatura:", error);
      return res.status(500).json({ error: "Erro ao obter informações da assinatura" });
    }
  });

  // Endpoint para obter histórico de assinaturas e transações
  app.get("/api/user/subscription-history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Usar o objeto de usuário já fornecido pelo passport
      if (!req.user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      const user = req.user;

      let events = [];
      try {
        // A função não é mais usada - vamos retornar um array vazio por enquanto
        // events = await storage.getSubscriptionEvents(userId);
        events = [];
      } catch (err) {
        console.error("Erro ao obter eventos de assinatura:", err);
        // Não retornar erro para o cliente, apenas continuar com array vazio
      }

      // Obter faturas do cliente
      let invoices = [];
      try {
        // Invoices não implementado ainda, retornar vazio
        invoices = [];
      } catch (err) {
        console.error("Erro ao obter faturas:", err);
      }

      return res.json({
        events,
        invoices,
      });
    } catch (error: any) {
      console.error("Erro ao obter histórico de assinatura:", error);
      return res.status(500).json({ error: "Erro ao obter histórico de assinatura" });
    }
  });

  // Endpoint para obter faturas do usuário
  app.get("/api/user/invoices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // Usar o objeto de usuário já fornecido pelo passport
      if (!req.user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      const user = req.user;

      // Obter faturas diretamente do Stripe se o usuário tiver um customer ID
      if (user.stripeCustomerId) {
        try {
          const stripeInvoices = await stripe.invoices.list({
            customer: user.stripeCustomerId,
            limit: 20,
          });

          // Transformar dados do Stripe para o formato esperado pelo frontend
          const invoices = stripeInvoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid > 0 ? invoice.amount_paid : invoice.amount_due,
            status: invoice.status,
            created: invoice.created ? String(invoice.created) : null,
            period_start: invoice.period_start ? String(invoice.period_start) : null,
            period_end: invoice.period_end ? String(invoice.period_end) : null,
            subscription: invoice.subscription || '',
            pdf: invoice.invoice_pdf,
            payment_method: invoice.payment_intent 
              ? { card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2025 } } 
              : null
          }));

          return res.json({ invoices });
        } catch (err: any) {
          console.error("Erro ao obter faturas do Stripe:", err.message);
          return res.status(500).json({ error: "Erro ao obter faturas" });
        }
      } else {
        // Se o usuário não tiver um customer ID no Stripe, retornar uma lista vazia
        return res.json({ invoices: [] });
      }
    } catch (error: any) {
      console.error("Erro ao obter faturas:", error);
      return res.status(500).json({ error: "Erro ao obter faturas" });
    }
  });
}