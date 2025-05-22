import { Request, Response } from "express";
import { storage } from "./storage";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { client } from "./mercadopago-client";

const paymentClient = new Payment(client);
const preferenceClient = new Preference(client);

/**
 * Consulta pagamentos diretamente na API do Mercado Pago
 * @param email Email do usuário a ser consultado
 */
export async function consultarPagamentosMercadoPago(req: Request, res: Response) {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: { message: 'Email é obrigatório' } });
    }
    
    console.log('Consultando pagamentos para o email:', email);
    
    // Buscar pagamentos por email
    const response = await paymentClient.search({
      options: {
        criteria: "desc",
        limit: 50
      },
      filters: {
        payer_email: email as string
      }
    });
    
    // Log para debug
    console.log('Total de resultados:', response.paging?.total || 0);
    
    // Mapear resultados para formato simplificado
    const pagamentos = (response.results || []).map(payment => ({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      date_created: payment.date_created,
      date_approved: payment.date_approved,
      amount: payment.transaction_amount,
      payment_method: payment.payment_method_id,
      external_reference: payment.external_reference
    }));
    
    // Dados para paginação
    const paginacao = {
      total: response.paging?.total || 0,
      offset: response.paging?.offset || 0,
      limit: response.paging?.limit || 0
    };
    
    return res.json({
      pagamentos,
      paginacao
    });
  } catch (error: any) {
    console.error('Erro ao consultar pagamentos:', error);
    return res.status(500).json({ 
      error: { message: error.message || 'Erro ao consultar pagamentos' } 
    });
  }
}

/**
 * Busca pagamentos do usuário no Mercado Pago
 * @param userId ID do usuário
 * @returns Lista de pagamentos formatada para o frontend
 */
export async function getUserPayments(userId: number) {
  try {
    // Buscar usuário
    const user = await storage.getUserById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Obter pagamentos do banco de dados local
    const payments = await storage.getPaymentsByUser(userId);
    
    // Mapear para formato de exibição
    return payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      date: payment.createdAt,
      description: payment.description || 'Pagamento QUERO FRETES',
      receiptUrl: payment.receiptUrl || null
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos do usuário:', error);
    return [];
  }
}

/**
 * Cria uma preferência de pagamento para assinatura única
 */
export async function createPaymentPreference(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
    }
    
    const userId = req.user.id;
    const { planType } = req.body;
    
    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ 
        error: { message: 'Tipo de plano inválido. Use "monthly" ou "yearly".' } 
      });
    }
    
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'Usuário não encontrado' } });
    }
    
    // Definir valor com base no tipo de plano
    const amount = planType === 'yearly' ? 960.00 : 99.90;
    
    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          id: `subscription-${planType}`,
          title: `Assinatura ${planType === 'yearly' ? 'Anual' : 'Mensal'} - QUERO FRETES`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
          description: `Assinatura ${planType === 'yearly' ? 'Anual' : 'Mensal'} da plataforma QUERO FRETES`
        }
      ],
      payer: {
        email: user.email,
        name: user.name,
      },
      back_urls: {
        success: `${process.env.NODE_ENV === 'production' ? 'https://querofretes.com.br' : 'https://25d0c31e-3b27-44fa-9254-e6c7cf4b7204.id.repl.co'}/payment-success`,
        failure: `${process.env.NODE_ENV === 'production' ? 'https://querofretes.com.br' : 'https://25d0c31e-3b27-44fa-9254-e6c7cf4b7204.id.repl.co'}/payment-failure`,
        pending: `${process.env.NODE_ENV === 'production' ? 'https://querofretes.com.br' : 'https://25d0c31e-3b27-44fa-9254-e6c7cf4b7204.id.repl.co'}/payment-pending`,
      },
      auto_return: 'all',
      notification_url: `${process.env.NODE_ENV === 'production' ? 'https://querofretes.com.br' : 'https://25d0c31e-3b27-44fa-9254-e6c7cf4b7204.id.repl.co'}/api/webhooks/mercadopago`,
      external_reference: JSON.stringify({
        userId: user.id,
        planType: planType,
        isSubscription: true
      }),
      statement_descriptor: 'QUERO FRETES',
    };
    
    console.log('Criando preferência de pagamento com o Mercado Pago...');
    
    try {
      // Criar preferência de pagamento
      const response = await preferenceClient.create({ body: preference });
      console.log('Preferência criada com sucesso. ID:', response.id);
      
      // Registrar assinatura no banco de dados
      await storage.createSubscription({
        userId: user.id,
        status: 'pending',
        planType: planType,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(
          new Date().setMonth(
            new Date().getMonth() + (planType === 'yearly' ? 12 : 1)
          )
        ),
        clientId: user.clientId,
        metadata: {
          preferenceId: response.id,
          amount: amount.toString(),
          planType: planType
        }
      });
      
      // Registrar evento na tabela de eventos
      await storage.createSubscriptionEvent({
        userId: user.id,
        eventType: 'subscription_created',
        metadata: {
          preferenceId: response.id,
          planType: planType,
          amount: amount.toString()
        }
      });
      
      // Retornar URL de pagamento
      console.log('Retornando URL de pagamento:', response.init_point);
      return res.json({
        url: response.init_point,
        preferenceId: response.id,
        success: true
      });
    } catch (mpError: any) {
      console.error('Erro específico do Mercado Pago:', mpError);
      console.error('Detalhes do erro:', mpError.response?.data || 'Sem detalhes adicionais');
      
      // Registrar erro como evento
      await storage.createSubscriptionEvent({
        userId: user.id,
        eventType: 'payment_error',
        metadata: {
          error: mpError.message,
          errorDetails: JSON.stringify(mpError.response?.data || {}),
          planType: planType,
          amount: amount.toString()
        }
      });
      
      return res.status(500).json({ 
        error: { 
          message: 'Falha na comunicação com o Mercado Pago. Por favor, tente novamente.',
          details: mpError.message
        } 
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar preferência de pagamento:', error);
    return res.status(500).json({ 
      error: { message: error.message || 'Erro ao criar preferência de pagamento' } 
    });
  }
}

/**
 * Processa webhooks do Mercado Pago
 */
export async function processWebhook(req: Request, res: Response) {
  try {
    const { id, topic, type } = req.query;
    
    // Log mais detalhado para debugging
    console.log('Webhook recebido do Mercado Pago:', { 
      id, 
      topic, 
      type,
      query: req.query,
      body: req.body
    });
    
    // Verificar tipo de notificação
    if (topic === 'payment' || type === 'payment') {
      const paymentId = id;
      console.log('Buscando detalhes do pagamento:', paymentId);
      
      try {
        const payment = await paymentClient.get({ id: Number(paymentId) });
        
        console.log('Detalhes do pagamento:', payment.id, payment.status);
        
        // Extrair referência externa
        const externalReference = payment.external_reference;
        
        // Tentar identificar usuário pela referência externa
        if (externalReference) {
          try {
            const referenceData = JSON.parse(externalReference);
            const userId = referenceData.userId;
            const planType = referenceData.planType || 'monthly'; // Default para mensal
            const isSubscription = referenceData.isSubscription !== false; // Default para true
            
            if (userId) {
              // Buscar usuário pelo ID
              const user = await storage.getUserById(userId);
              if (user) {
                await processPayment(payment, user, planType, isSubscription);
                return res.status(200).send('Webhook processado com sucesso');
              }
            }
          } catch (parseError) {
            console.error('Erro ao processar referência externa:', parseError);
          }
        }
        
        // Tentar identificar usuário pelo email
        if (payment.payer && payment.payer.email) {
          const payerEmail = payment.payer.email;
          console.log('Tentando identificar usuário pelo email:', payerEmail);
          
          const user = await storage.getUserByEmail(payerEmail);
          if (user) {
            console.log('Usuário encontrado pelo email:', user.id, user.email);
            
            // Determinar tipo de plano com base no valor
            let planType = 'monthly';
            if (payment.transaction_amount) {
              const amount = Number(payment.transaction_amount);
              if (amount >= 600) {
                planType = 'yearly';
              } else if (amount >= 70 && amount <= 90) {
                planType = 'monthly';
              }
            }
            
            await processPayment(payment, user, planType, true);
            return res.status(200).send('Webhook processado com sucesso via email');
          } else {
            console.log('Nenhum usuário encontrado para o email:', payerEmail);
          }
        }
        
        // Se chegou aqui, não foi possível identificar o usuário
        console.log('Impossível identificar usuário para este pagamento');
        return res.status(404).send('Usuário não identificado');
      } catch (paymentError) {
        console.error('Erro ao buscar detalhes do pagamento:', paymentError);
        return res.status(500).send('Erro ao buscar detalhes do pagamento');
      }
    }
    
    // Para outros tipos de notificação
    return res.status(200).send('Notificação recebida');
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return res.status(500).send('Erro interno ao processar webhook');
  }
}

/**
 * Processa um pagamento para um usuário específico
 */
async function processPayment(payment: any, user: any, planType: string, isSubscription: boolean) {
  const userId = user.id;
  
  // Para pagamentos aprovados
  if (payment.status === 'approved') {
    if (isSubscription) {
      // Calcular data de expiração baseada no tipo de plano
      const now = new Date();
      const expirationDate = new Date();
      
      if (planType === 'yearly') {
        expirationDate.setFullYear(now.getFullYear() + 1);
      } else {
        expirationDate.setMonth(now.getMonth() + 1);
      }
      
      // Atualizar dados do usuário
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: planType,
        subscriptionExpiresAt: expirationDate.toISOString(),
        paymentRequired: false
      });
      
      // Verificar se já existe uma assinatura
      const subscriptions = await storage.getSubscriptionsByUser(userId);
      
      // Criar ou atualizar assinatura
      let subscriptionId;
      if (subscriptions.length > 0) {
        const latestSubscription = subscriptions[0];
        await storage.updateSubscription(latestSubscription.id, {
          status: 'active',
          metadata: {
            ...latestSubscription.metadata,
            paymentId: payment.id.toString(),
            paymentMethod: payment.payment_method_id || 'mercadopago'
          }
        });
        subscriptionId = latestSubscription.id;
      } else {
        // Criar nova assinatura se não existir
        const newSubscription = await storage.createSubscription({
          userId: userId,
          status: 'active',
          planType: planType,
          currentPeriodStart: new Date(),
          currentPeriodEnd: expirationDate,
          clientId: user.clientId,
          metadata: {
            paymentId: payment.id.toString(),
            amount: payment.transaction_amount?.toString() || '0'
          }
        });
        subscriptionId = newSubscription.id;
      }
      
      // Registrar fatura
      await storage.createInvoice({
        userId: userId,
        status: 'paid',
        amount: payment.transaction_amount?.toString() || '0',
        clientId: user.clientId,
        subscriptionId: subscriptionId,
        description: `Assinatura ${planType === 'yearly' ? 'Anual' : 'Mensal'} - QUERO FRETES`,
        dueDate: new Date(),
        paidAt: new Date(),
        metadata: {
          paymentId: payment.id.toString(),
          paymentMethod: payment.payment_method_id || 'mercadopago'
        }
      });
      
      // Registrar evento
      await storage.createSubscriptionEvent({
        userId: userId,
        eventType: 'payment_success',
        metadata: {
          paymentId: payment.id.toString(),
          amount: payment.transaction_amount?.toString() || '0',
          planType: planType
        }
      });
      
      // Enviar email de confirmação se possível
      try {
        const { sendSubscriptionEmail } = await import('./email-service');
        await sendSubscriptionEmail(
          user.email,
          user.name,
          planType,
          new Date(),
          expirationDate,
          payment.transaction_amount || 0
        );
      } catch (emailError) {
        console.error('Erro ao enviar email de assinatura:', emailError);
      }
    }
  } else if (payment.status === 'pending' || payment.status === 'in_process') {
    // Registrar evento de pagamento pendente
    await storage.createSubscriptionEvent({
      userId: userId,
      eventType: 'payment_pending',
      metadata: {
        paymentId: payment.id.toString(),
        amount: payment.transaction_amount?.toString() || '0',
        planType: planType,
        status: payment.status
      }
    });
  } else if (payment.status === 'rejected') {
    // Registrar evento de pagamento rejeitado
    await storage.createSubscriptionEvent({
      userId: userId,
      eventType: 'payment_failed',
      metadata: {
        paymentId: payment.id.toString(),
        amount: payment.transaction_amount?.toString() || '0',
        planType: planType,
        status: payment.status,
        reason: payment.status_detail || 'Não especificado'
      }
    });
  }
}

/**
 * Gera um link de pagamento para teste
 */
export async function createTestPayment(req: Request, res: Response) {
  try {
    const preferenceData = {
      items: [
        {
          id: "test-payment",
          title: "Teste de Pagamento",
          unit_price: 1.00,
          quantity: 1,
        }
      ],
      back_urls: {
        success: `${req.headers.origin || 'https://querofretes.com.br'}/payment-success`,
        failure: `${req.headers.origin || 'https://querofretes.com.br'}/payment-failure`,
      },
    };
    
    const preference = await preferenceClient.create({ body: preferenceData });
    res.json({
      id: preference.id,
      url: preference.init_point
    });
  } catch (error: any) {
    console.error('Erro ao criar pagamento de teste:', error);
    res.status(500).json({ error: error.message });
  }
}