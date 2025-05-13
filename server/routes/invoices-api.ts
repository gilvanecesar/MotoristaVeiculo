import { Request, Response } from 'express';
import { isAuthenticated } from '../middlewares';
import { storage } from '../storage';
import { stripe } from '../stripe';

/**
 * Configuração de rotas para gerenciamento de faturas e pagamentos
 */
export function setupInvoicesAPI(app: any) {
  // Endpoint para obter faturas do usuário (simplificado)
  app.get("/api/user/invoices", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = req.user;

      // Array de faturas para retornar
      const invoices = [];

      // Criar uma fatura de exemplo para o mês atual
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Adicionar faturas temporárias
      for (let i = 0; i < 1; i++) {
        const invoiceDate = new Date();
        
        invoices.push({
          id: `invoice_${Date.now()}`,
          invoiceNumber: `INV-${100 + i}`,
          amountDue: 9990, // R$ 99,90 em centavos
          amountPaid: 9990,
          currency: 'brl',
          status: 'paid',
          createdAt: invoiceDate.toISOString(),
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          receiptUrl: null,
          pdfUrl: null,
          description: 'Assinatura QUERO FRETES',
          paymentMethod: {
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2024
            }
          }
        });
      }

      return res.json({ invoices });
    } catch (error: any) {
      console.error("Erro ao obter faturas:", error);
      return res.status(500).json({ error: "Erro ao obter faturas", details: error.message });
    }
  });
  
  // API para obter histórico de pagamentos via Mercado Pago
  app.get("/api/user/payment-history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }
      
      // Criar histórico de pagamentos temporário
      const currentDate = new Date();
      const payments = [];
      
      // Exemplo de pagamento para teste
      payments.push({
        id: `payment_${Date.now()}`,
        status: 'approved',
        statusDetail: 'Pagamento aprovado',
        description: 'Assinatura Mensal QUERO FRETES',
        paymentMethod: {
          id: 'visa',
          type: 'credit_card'
        },
        amount: 99.90,
        createdAt: currentDate.toISOString(),
        approvedAt: currentDate.toISOString(),
        mercadopagoId: `MP-${Date.now().toString().substring(0, 10)}`,
        externalReference: `REF-${Date.now()}`
      });
      
      return res.json({ payments });
    } catch (error: any) {
      console.error("Erro ao obter histórico de pagamentos:", error);
      return res.status(500).json({ error: "Erro ao obter histórico de pagamentos", details: error.message });
    }
  });
}