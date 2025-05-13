import { MercadoPagoConfig, Payment, Preference, Customer } from 'mercadopago';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { format, addMonths, addDays } from 'date-fns';
import { generateToken, verifyToken } from '../utils/jwt';

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
const customerClient = new Customer(client);

// Valores dos planos
const PLAN_VALUES = {
  'mensal': 99.90,
  'anual': 960.00,
  'trial': 0
};

// URLs de retorno para pagamentos
const SUCCESS_URL = process.env.NODE_ENV === 'production' 
  ? 'https://querofretes.com.br/payment-success' 
  : 'http://localhost:5000/payment-success';

const FAILURE_URL = process.env.NODE_ENV === 'production'
  ? 'https://querofretes.com.br/payment-cancel'
  : 'http://localhost:5000/payment-cancel';

/**
 * Cria ou busca um cliente no Mercado Pago
 * @param userId ID do usuário 
 * @param email Email do usuário
 * @param name Nome do usuário
 * @returns ID do cliente no Mercado Pago
 */
export async function getOrCreateMercadoPagoCustomer(userId: number, email: string, name: string) {
  try {
    // Verificar se usuário já tem ID de cliente do Mercado Pago
    const user = await storage.getUser(userId);
    
    if (user?.mercadopagoCustomerId) {
      try {
        // Verificar se o cliente ainda existe no Mercado Pago
        const customer = await customerClient.get({ customerId: user.mercadopagoCustomerId });
        return user.mercadopagoCustomerId;
      } catch (error) {
        // Cliente não existe mais no Mercado Pago
        console.log('Cliente não encontrado no Mercado Pago, criando novo...');
      }
    }
    
    // Criar novo cliente no Mercado Pago
    const customerData = {
      email,
      first_name: name.split(' ')[0],
      last_name: name.split(' ').slice(1).join(' '),
      description: `Cliente QUERO FRETES - ID: ${userId}`
    };
    
    const customer = await customerClient.create({ body: customerData });
    
    // Atualizar ID do cliente no banco de dados
    if (customer.id) {
      await storage.updateUserMercadoPagoInfo(userId, { mercadopagoCustomerId: customer.id });
      return customer.id;
    }
    
    throw new Error('Falha ao criar cliente no Mercado Pago');
    
  } catch (error) {
    console.error('Erro ao obter/criar cliente no Mercado Pago:', error);
    throw error;
  }
}

/**
 * Cria uma preferência de pagamento para assinatura única (não recorrente)
 */
export async function createPaymentPreference(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
    }
    
    const userId = req.user.id;
    const user = req.user;
    
    if (!user.email) {
      return res.status(400).json({ error: { message: 'Usuário sem email cadastrado' } });
    }
    
    const { planType = 'mensal' } = req.body;
    
    if (!PLAN_VALUES[planType]) {
      return res.status(400).json({ error: { message: 'Tipo de plano inválido' } });
    }
    
    // Gerar token para controle interno
    const token = generateToken({ 
      userId,
      planType,
      timestamp: new Date().toISOString()
    });
    
    // Obter cliente no Mercado Pago
    const customerMpId = await getOrCreateMercadoPagoCustomer(userId, user.email, user.name);
    
    // Criar preferência de pagamento
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: `plano-${planType}`,
            title: `Plano ${planType.charAt(0).toUpperCase() + planType.slice(1)} QUERO FRETES`,
            quantity: 1,
            unit_price: PLAN_VALUES[planType],
            currency_id: 'BRL',
            description: planType === 'mensal' 
              ? 'Assinatura mensal QUERO FRETES' 
              : 'Assinatura anual QUERO FRETES (economize 20%)'
          }
        ],
        payer: {
          email: user.email,
          name: user.name.split(' ')[0],
          surname: user.name.split(' ').slice(1).join(' '),
          customer_id: customerMpId
        },
        back_urls: {
          success: SUCCESS_URL,
          failure: FAILURE_URL,
          pending: FAILURE_URL
        },
        auto_return: 'approved',
        statement_descriptor: 'QUERO FRETES',
        external_reference: token,
        expires: true,
        expiration_date_to: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
        metadata: {
          userId,
          planType,
          source: 'querofretes-web'
        }
      }
    });
    
    // Registrar tentativa de assinatura no banco de dados
    await storage.createSubscriptionEvent({
      userId,
      eventType: 'payment_created',
      metadata: {
        planType,
        preferenceId: preference.id,
        externalReference: token
      }
    });
    
    res.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      externalReference: token
    });
    
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    res.status(500).json({ error: { message: 'Falha ao criar pagamento' } });
  }
}

/**
 * Processa webhooks do Mercado Pago
 */
export async function processWebhook(req: Request, res: Response) {
  try {
    const { topic, id } = req.query;
    
    console.log('Webhook recebido:', { topic, id });
    
    if (topic === 'payment') {
      const paymentId = id as string;
      
      // Buscar informações completas do pagamento
      const payment = await paymentClient.get({ id: paymentId });
      
      if (!payment || !payment.external_reference) {
        return res.status(400).send('Referência externa não encontrada');
      }
      
      const { external_reference } = payment;
      
      // Decodificar token para obter informações da assinatura
      const tokenData = verifyToken(external_reference);
      
      if (!tokenData) {
        console.error('Token inválido ou expirado:', external_reference);
        return res.status(400).send('Referência externa inválida');
      }
      
      const { userId, planType } = tokenData;
      
      // Criar registro de pagamento
      const paymentRecord = {
        userId,
        status: payment.status,
        statusDetail: payment.status_detail,
        amount: payment.transaction_amount.toString(),
        paymentMethod: payment.payment_method_id,
        paymentMethodId: payment.payment_method_id,
        paymentTypeId: payment.payment_type_id,
        description: `Plano ${planType} QUERO FRETES`,
        dateCreated: new Date(payment.date_created),
        dateApproved: payment.date_approved ? new Date(payment.date_approved) : null,
        mercadopagoId: payment.id,
        externalReference: payment.external_reference,
        metadata: {
          mercadopagoData: payment
        }
      };
      
      const savedPayment = await storage.createMercadoPagoPayment(paymentRecord);
      
      // Se pagamento aprovado, criar ou atualizar assinatura
      if (payment.status === 'approved') {
        // Calcular datas da assinatura
        const startDate = new Date();
        let endDate;
        
        if (planType === 'mensal') {
          endDate = addMonths(startDate, 1);
        } else if (planType === 'anual') {
          endDate = addMonths(startDate, 12);
        } else {
          endDate = addDays(startDate, 7); // Trial
        }
        
        // Criar registro de assinatura
        const subscriptionData = {
          userId,
          status: 'active',
          planType,
          startDate,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          metadata: {
            paymentId: savedPayment.id,
            mercadopagoId: payment.id
          }
        };
        
        // Criar ou atualizar assinatura
        await storage.createOrUpdateSubscription(subscriptionData);
        
        // Atualizar status do usuário
        await storage.updateUser(userId, {
          subscriptionActive: true,
          subscriptionType: planType,
          subscriptionExpiresAt: endDate,
          paymentRequired: false
        });
        
        // Registrar evento
        await storage.createSubscriptionEvent({
          userId,
          eventType: 'subscription_activated',
          metadata: {
            planType,
            paymentId: savedPayment.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        });
      }
      
      res.status(200).send('OK');
    } else {
      // Outros tipos de webhook
      res.status(200).send('Webhook ignorado');
    }
    
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).send('Erro ao processar webhook');
  }
}

/**
 * Verifica o status da assinatura do usuário
 */
export async function getUserSubscriptionStatus(userId: number) {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar se tem assinatura ativa
    const active = user.subscriptionActive || false;
    
    // Buscar histórico de pagamentos
    const payments = await storage.getMercadoPagoPaymentsByUser(userId);
    
    // Obter informações da assinatura ativa
    const subscription = await storage.getSubscription(userId);
    
    return {
      active,
      userId,
      planType: user.subscriptionType || null,
      expiresAt: user.subscriptionExpiresAt || null,
      isTrial: user.subscriptionType === 'trial',
      paymentRequired: user.paymentRequired || false,
      subscription,
      paymentHistory: payments
    };
  } catch (error) {
    console.error('Erro ao verificar assinatura do usuário:', error);
    throw error;
  }
}

/**
 * Cancela a assinatura de um usuário
 */
export async function cancelUserSubscription(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
    }
    
    const userId = req.user.id;
    
    // Buscar assinatura atual
    const subscription = await storage.getSubscription(userId);
    
    if (!subscription) {
      return res.status(404).json({ error: { message: 'Nenhuma assinatura encontrada' } });
    }
    
    // Atualizar assinatura no banco de dados
    const canceledAt = new Date();
    
    await storage.updateSubscription(subscription.id, {
      status: 'canceled',
      canceledAt
    });
    
    // Atualizar usuário
    await storage.updateUser(userId, {
      subscriptionActive: false
    });
    
    // Registrar evento
    await storage.createSubscriptionEvent({
      userId,
      eventType: 'subscription_canceled',
      metadata: {
        subscriptionId: subscription.id,
        canceledAt: canceledAt.toISOString()
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Assinatura cancelada com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: { message: 'Falha ao cancelar assinatura' } });
  }
}

/**
 * Ativa o período de teste gratuito para um usuário
 */
export async function activateFreeTrial(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
    }
    
    const userId = req.user.id;
    
    // Verificar se o usuário já usou o período de teste
    const hasUsedTrial = await storage.hasUserUsedTrial(userId);
    
    if (hasUsedTrial) {
      return res.status(400).json({ 
        error: { message: 'Você já utilizou seu período de teste gratuito' } 
      });
    }
    
    // Calcular datas do período de teste
    const startDate = new Date();
    const endDate = addDays(startDate, 7);
    
    // Criar registro de assinatura
    const subscriptionData = {
      userId,
      status: 'active',
      planType: 'trial',
      startDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      metadata: {
        isTrial: true
      }
    };
    
    // Criar assinatura
    const subscription = await storage.createSubscription(subscriptionData);
    
    // Registrar uso do período de teste
    await storage.createTrialUsage({
      userId,
      startDate,
      endDate
    });
    
    // Atualizar status do usuário
    await storage.updateUser(userId, {
      subscriptionActive: true,
      subscriptionType: 'trial',
      subscriptionExpiresAt: endDate,
      paymentRequired: true // Após o período de teste, precisará pagar
    });
    
    // Registrar evento
    await storage.createSubscriptionEvent({
      userId,
      eventType: 'trial_activated',
      metadata: {
        subscriptionId: subscription.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    res.json({
      success: true,
      message: 'Período de teste ativado com sucesso',
      data: {
        subscriptionId: subscription.id,
        startDate,
        endDate,
        planType: 'trial'
      }
    });
    
  } catch (error) {
    console.error('Erro ao ativar período de teste:', error);
    res.status(500).json({ error: { message: 'Falha ao ativar período de teste' } });
  }
}

/**
 * Obtém o histórico de pagamentos do usuário
 */
export async function getUserPayments(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
    }
    
    const userId = req.user.id;
    
    // Buscar pagamentos
    const payments = await storage.getMercadoPagoPaymentsByUser(userId);
    
    // Formatar para o frontend
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
      description: payment.description,
      paymentMethod: {
        id: payment.paymentMethodId,
        type: payment.paymentTypeId
      },
      amount: parseFloat(payment.amount),
      createdAt: payment.dateCreated,
      approvedAt: payment.dateApproved,
      mercadopagoId: payment.mercadopagoId,
      externalReference: payment.externalReference
    }));
    
    res.json(formattedPayments);
    
  } catch (error) {
    console.error('Erro ao obter histórico de pagamentos:', error);
    res.status(500).json({ error: { message: 'Falha ao obter histórico de pagamentos' } });
  }
}