import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { Request, Response } from 'express';
import { storage } from './storage';
import { format } from 'date-fns';

// Configurar o Mercado Pago com a chave de acesso
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurada');
}

// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

// Criar instâncias para métodos específicos
const paymentClient = new Payment(client);
const preferenceClient = new Preference(client);

/**
 * Busca pagamentos do usuário no Mercado Pago
 * @param userId ID do usuário
 * @returns Lista de pagamentos formatada para o frontend
 */
export async function getUserPayments(userId: number) {
  try {
    // Buscar pagamentos do usuário no banco de dados local
    const userPayments = await storage.getMercadoPagoPaymentsByUser(userId);
    
    if (!userPayments || userPayments.length === 0) {
      return [];
    }
    
    // Formatar pagamentos para o formato esperado pelo frontend
    const formattedPayments = userPayments.map(payment => {
      const createdDate = payment.createdAt instanceof Date 
        ? payment.createdAt 
        : new Date(payment.createdAt || Date.now());
      
      return {
        id: `mp_${payment.id}`,
        invoiceNumber: `MP-${payment.id}`,
        amountDue: Number(payment.amount) * 100, // Converter para centavos como no Stripe
        amountPaid: Number(payment.amount) * 100,
        currency: 'brl',
        status: payment.status || 'paid',
        createdAt: String(Math.floor(createdDate.getTime() / 1000)), // Timestamp em segundos
        periodStart: String(Math.floor(createdDate.getTime() / 1000)),
        periodEnd: String(Math.floor(createdDate.getTime() / 1000)),
        dueDate: String(Math.floor(createdDate.getTime() / 1000)),
        paymentMethod: 'mercadopago',
        description: payment.description || 'Pagamento via Mercado Pago',
        url: payment.receiptUrl || null,
        pdf: null
      };
    });
    
    return formattedPayments;
  } catch (error) {
    console.error('Erro ao buscar pagamentos do Mercado Pago:', error);
    return [];
  }
}

/**
 * Cria uma preferência de pagamento para assinatura única
 */
export async function createPaymentPreference(req: Request, res: Response) {
  try {
    console.log('Iniciando criação de preferência de pagamento:', req.body);
    const { planType } = req.body;
    const user = req.user;
    
    if (!user) {
      console.log('Falha na autenticação: usuário não encontrado na requisição');
      return res.status(401).json({ 
        error: "Usuário não autenticado" 
      });
    }
    
    console.log('Processando pagamento para usuário:', user.id, user.email);
    
    // Definir preço com base no tipo de plano
    const amount = planType === 'yearly' ? 960.00 : 99.90;
    console.log('Tipo de plano selecionado:', planType, 'Valor:', amount);
    
    // Verificar integridade do token
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('ERRO: Token do Mercado Pago não configurado');
      return res.status(500).json({ 
        error: { message: 'Configuração do Mercado Pago ausente' } 
      });
    }
    
    // Configurar preferência de pagamento
    const preference = {
      items: [
        {
          id: `assinatura-${planType}`,
          title: `Assinatura QUERO FRETES - ${planType === 'yearly' ? 'Anual' : 'Mensal'}`,
          description: `Assinatura ${planType === 'yearly' ? 'anual' : 'mensal'} da plataforma QUERO FRETES`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
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
    const { id, topic } = req.query;
    
    console.log('Webhook recebido do Mercado Pago:', { id, topic });
    
    // Verificar tipo de notificação
    if (topic === 'payment') {
      const paymentId = id;
      const payment = await paymentClient.get({ id: Number(paymentId) });
      
      console.log('Detalhes do pagamento:', JSON.stringify(payment));
      
      // Extrair referência externa
      const externalReference = payment.external_reference;
      if (!externalReference) {
        return res.status(400).send('Referência externa não encontrada');
      }
      
      try {
        const referenceData = JSON.parse(externalReference);
        const userId = referenceData.userId;
        const planType = referenceData.planType;
        const isSubscription = referenceData.isSubscription;
        
        if (!userId || !planType) {
          return res.status(400).send('Dados de referência incompletos');
        }
        
        // Buscar usuário
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).send('Usuário não encontrado');
        }
        
        // Processar de acordo com o status do pagamento
        if (payment.status === 'approved') {
          // Para assinaturas, atualizar dados do usuário
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
            
            // Atualizar status da assinatura
            const subscriptions = await storage.getSubscriptionsByUser(userId);
            if (subscriptions.length > 0) {
              const latestSubscription = subscriptions[0];
              await storage.updateSubscription(latestSubscription.id, {
                status: 'active',
                metadata: {
                  ...latestSubscription.metadata,
                  paymentId: payment.id.toString(),
                  preferenceId: payment.preference_id || null
                }
              });
            }
            
            // Registrar fatura
            await storage.createInvoice({
              userId: userId,
              status: 'paid',
              amount: payment.transaction_amount.toString(),
              clientId: user.clientId,
              subscriptionId: subscriptions[0]?.id || null,
              description: `Assinatura ${planType} - QUERO FRETES`,
              dueDate: new Date(),
              paidAt: new Date(),
              metadata: {
                paymentId: payment.id.toString(),
                preferenceId: payment.preference_id || null,
                paymentMethod: payment.payment_method_id || 'mercadopago'
              },
              paymentMethod: 'mercadopago',
              receiptUrl: null
            });
            
            // Registrar evento
            await storage.createSubscriptionEvent({
              userId: userId,
              eventType: 'payment_success',
              metadata: {
                paymentId: payment.id.toString(),
                amount: payment.transaction_amount.toString(),
                planType: planType
              }
            });
          }
          
          return res.status(200).send('Webhook processado com sucesso');
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
          
          return res.status(200).send('Webhook de pagamento pendente processado');
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
              reason: payment.status_detail
            }
          });
          
          return res.status(200).send('Webhook de pagamento rejeitado processado');
        }
      } catch (parseError) {
        console.error('Erro ao processar referência externa:', parseError);
        return res.status(400).send('Formato de referência externa inválido');
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
 * Gera um link de pagamento para teste
 */
export async function createTestPayment(req: Request, res: Response) {
  try {
    const preferenceData = {
      items: [
        {
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