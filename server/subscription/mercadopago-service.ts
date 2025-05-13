import { MercadoPagoConfig, Payment, Preference, Customer, Plan, Subscription } from 'mercadopago';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { format, addMonths, addDays } from 'date-fns';
import { jwtSign, jwtVerify } from '../utils/jwt';

// Configurar o Mercado Pago com a chave de acesso
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurada');
}

// Inicializar cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

// Criar instâncias para métodos específicos
const paymentClient = new Payment(client);
const preferenceClient = new Preference(client);
const customerClient = new Customer(client);
const planClient = new Plan(client);
const subscriptionClient = new Subscription(client);

// Interface para representar objetos de pagamento
interface PaymentDetail {
  id: string;
  status: string;
  status_detail: string;
  description: string;
  payment_method: {
    id: string;
    type: string;
  };
  amount: number;
  date_created: string;
  date_approved: string | null;
  mercadopago_id: string;
  external_reference?: string;
  user_id?: number;
}

// Interface para rastrear o status da assinatura
interface SubscriptionInfo {
  id: string;
  status: string;
  planId: string;
  userId: number;
  frequency: 'monthly' | 'yearly';
  nextPaymentDate: Date;
  startDate: Date;
  lastPaymentDate: Date | null;
  price: number;
  active: boolean;
  externalReference?: string;
  paymentMethodId?: string;
}

/**
 * Cria ou busca um cliente no Mercado Pago
 * @param user Informações do usuário
 * @returns ID do cliente no Mercado Pago
 */
export async function getOrCreateCustomer(userId: number, email: string, name: string) {
  try {
    // Verificar se usuário já tem ID de cliente do Mercado Pago
    const user = await storage.getUserById(userId);
    
    if (user?.mercadopagoCustomerId) {
      // Verificar se o cliente ainda existe no Mercado Pago
      try {
        const customerResponse = await customerClient.get({ customerId: user.mercadopagoCustomerId });
        return user.mercadopagoCustomerId;
      } catch (error) {
        console.log('Cliente não encontrado no Mercado Pago, criando novo...', error);
        // Se não existir, vamos criar um novo
      }
    }
    
    // Criar novo cliente
    const customerData = {
      email,
      first_name: name.split(' ')[0] || '',
      last_name: name.split(' ').slice(1).join(' ') || '',
      description: `Cliente ${name} (ID: ${userId})`,
      metadata: {
        user_id: userId.toString()
      }
    };
    
    const response = await customerClient.create({ body: customerData });
    
    if (response && response.id) {
      // Salvar ID do cliente do Mercado Pago no usuário
      await storage.updateUser(userId, { mercadopagoCustomerId: response.id });
      return response.id;
    } else {
      throw new Error('Falha ao criar cliente no Mercado Pago');
    }
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
    
    // Obter tipo de plano da requisição (mensal ou anual)
    const planType = req.body.planType || 'monthly';
    
    // Definir preço com base no tipo de plano
    let amount: number;
    let title: string;
    
    if (planType === 'yearly') {
      amount = 960.00; // Anual: R$ 960,00
      title = 'Assinatura Anual - QUERO FRETES';
    } else {
      amount = 99.90; // Mensal: R$ 99,90
      title = 'Assinatura Mensal - QUERO FRETES';
    }
    
    // Duração do plano
    const durationInDays = planType === 'yearly' ? 365 : 30;
    
    // Data de expiração
    const expirationDate = new Date();
    if (planType === 'yearly') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    }
    
    // Criar referência externa com informações
    const externalReference = jwtSign({
      userId,
      planType,
      expirationDate: expirationDate.toISOString(),
      amount,
      createdAt: new Date().toISOString()
    });
    
    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          id: `plan-${planType}`,
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
          description: planType === 'yearly' ? 'Assinatura anual do sistema QUERO FRETES' : 'Assinatura mensal do sistema QUERO FRETES'
        }
      ],
      payer: {
        name: user.name || '',
        email: user.email,
        identification: {
          type: 'CPF',
          number: ''
        }
      },
      statement_descriptor: 'QUEROFRETES',
      external_reference: externalReference,
      back_urls: {
        success: `${req.protocol}://${req.get('host')}/subscribe/success`,
        failure: `${req.protocol}://${req.get('host')}/subscribe/failure`,
        pending: `${req.protocol}://${req.get('host')}/subscribe/pending`
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12
      },
      notification_url: `${req.protocol}://${req.get('host')}/api/mercadopago-webhook`
    };
    
    // Obter resposta do Mercado Pago
    const response = await preferenceClient.create({ body: preference });
    
    // Registrar tentativa de criação de assinatura no banco de dados
    await storage.createSubscriptionAttempt({
      userId,
      planType,
      amount,
      externalReference,
      createdAt: new Date(),
      preferenceId: response.id,
      status: 'pending',
      expirationDate
    });
    
    // Retornar dados da preferência para o frontend
    return res.json({
      preferenceId: response.id,
      redirectUrl: response.init_point,
      amount,
      planType,
      externalReference
    });
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    return res.status(500).json({ error: { message: 'Erro ao criar preferência de pagamento. Tente novamente mais tarde.' } });
  }
}

/**
 * Processa webhooks do Mercado Pago
 */
export async function processWebhook(req: Request, res: Response) {
  try {
    console.log('Webhook do Mercado Pago recebido:', req.body);
    
    const { type, data } = req.body;
    
    if (type !== 'payment') {
      // Responder com sucesso para outros tipos de webhook
      return res.status(200).send('OK');
    }
    
    // Obter ID do pagamento
    const paymentId = data.id;
    
    // Buscar dados do pagamento no Mercado Pago
    const paymentResponse = await paymentClient.get({ id: paymentId });
    
    if (!paymentResponse) {
      console.error('Pagamento não encontrado no Mercado Pago:', paymentId);
      return res.status(404).send('Pagamento não encontrado');
    }
    
    // Verificar se o pagamento tem uma referência externa
    if (!paymentResponse.external_reference) {
      console.error('Pagamento sem referência externa:', paymentId);
      return res.status(200).send('Pagamento sem referência externa');
    }
    
    // Decodificar a referência externa (JWT)
    let decodedReference;
    try {
      decodedReference = jwtVerify(paymentResponse.external_reference);
    } catch (error) {
      console.error('Erro ao decodificar referência externa:', error);
      return res.status(200).send('Referência externa inválida');
    }
    
    const { userId, planType, expirationDate, amount } = decodedReference;
    
    // Verificar status do pagamento
    const isApproved = paymentResponse.status === 'approved';
    
    // Se o pagamento foi aprovado, atualizar a assinatura do usuário
    if (isApproved) {
      // Buscar usuário
      const user = await storage.getUserById(userId);
      
      if (!user) {
        console.error('Usuário não encontrado:', userId);
        return res.status(200).send('Usuário não encontrado');
      }
      
      // Criar ou atualizar registro de pagamento
      await storage.createMercadoPagoPayment({
        userId,
        mercadopagoId: paymentResponse.id,
        status: paymentResponse.status,
        statusDetail: paymentResponse.status_detail,
        paymentMethodId: paymentResponse.payment_method.id,
        paymentTypeId: paymentResponse.payment_method.type,
        amount: paymentResponse.transaction_amount,
        externalReference: paymentResponse.external_reference,
        dateCreated: new Date(paymentResponse.date_created),
        dateApproved: paymentResponse.date_approved ? new Date(paymentResponse.date_approved) : null
      });
      
      // Atualizar usuário com informações da assinatura
      await storage.updateUser(userId, {
        subscriptionActive: true,
        subscriptionType: planType,
        subscriptionExpiresAt: new Date(expirationDate),
        paymentRequired: false
      });
      
      // Registrar assinatura no sistema
      await storage.createOrUpdateSubscription({
        userId,
        planType,
        status: 'active',
        amount,
        startDate: new Date(),
        currentPeriodEnd: new Date(expirationDate),
        paymentId: paymentResponse.id,
        paymentMethodId: paymentResponse.payment_method.id,
        paymentMethodType: paymentResponse.payment_method.type
      });
      
      console.log(`Assinatura do usuário ${userId} atualizada com sucesso`);
    } else {
      console.log(`Pagamento ${paymentId} não aprovado. Status: ${paymentResponse.status}`);
    }
    
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    return res.status(500).send('Erro interno');
  }
}

/**
 * Verifica se um usuário tem uma assinatura ativa
 * @param userId ID do usuário
 * @returns Status da assinatura do usuário
 */
export async function checkUserSubscription(userId: number) {
  try {
    const user = await storage.getUserById(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar se o usuário tem uma assinatura ativa
    let active = false;
    
    if (user.subscriptionActive) {
      // Verificar se a assinatura está expirada
      if (user.subscriptionExpiresAt) {
        const expirationDate = new Date(user.subscriptionExpiresAt);
        const now = new Date();
        active = expirationDate > now;
      }
    }
    
    // Obter histórico de pagamentos
    const payments = await storage.getMercadoPagoPaymentsByUser(userId);
    
    // Obter informações da assinatura ativa
    const subscription = await storage.getActiveSubscription(userId);
    
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
 * @param userId ID do usuário
 * @returns Status da operação
 */
export async function cancelUserSubscription(userId: number) {
  try {
    // Obter assinatura ativa do usuário
    const subscription = await storage.getActiveSubscription(userId);
    
    if (!subscription) {
      throw new Error('Nenhuma assinatura ativa encontrada');
    }
    
    // Atualizar status da assinatura no banco de dados
    await storage.updateSubscription(subscription.id, {
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    // Atualizar usuário
    await storage.updateUser(userId, {
      subscriptionActive: false,
      paymentRequired: true
    });
    
    return { success: true, message: 'Assinatura cancelada com sucesso' };
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
}

/**
 * Ativa um período de teste para o usuário
 * @param userId ID do usuário
 * @returns Status da operação
 */
export async function activateTrialPeriod(userId: number) {
  try {
    const user = await storage.getUserById(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar se o usuário já utilizou o período de teste
    const hasUsedTrial = await storage.hasUserUsedTrial(userId);
    
    if (hasUsedTrial) {
      throw new Error('Usuário já utilizou o período de teste gratuito');
    }
    
    // Calcular data de expiração (7 dias a partir de hoje)
    const expirationDate = addDays(new Date(), 7);
    
    // Atualizar usuário com dados do período de teste
    await storage.updateUser(userId, {
      subscriptionActive: true,
      subscriptionType: 'trial',
      subscriptionExpiresAt: expirationDate,
      paymentRequired: false
    });
    
    // Registrar utilização do período de teste
    await storage.createTrialUsage({
      userId,
      startDate: new Date(),
      endDate: expirationDate
    });
    
    return { 
      success: true, 
      expirationDate, 
      message: 'Período de teste ativado com sucesso'
    };
  } catch (error) {
    console.error('Erro ao ativar período de teste:', error);
    throw error;
  }
}

/**
 * Gera um link de pagamento para teste
 */
export async function createTestPayment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Usuário não autenticado' } });
    }
    
    // Criar preferência de pagamento de teste
    const preference = {
      items: [
        {
          id: 'test-payment',
          title: 'Pagamento de Teste - QUERO FRETES',
          quantity: 1,
          unit_price: 0.01, // Valor mínimo para teste: R$ 0,01
          currency_id: 'BRL',
          description: 'Pagamento de teste para validação do sistema QUERO FRETES'
        }
      ],
      external_reference: `test-${req.user.id}-${Date.now()}`,
      back_urls: {
        success: `${req.protocol}://${req.get('host')}/subscribe/success`,
        failure: `${req.protocol}://${req.get('host')}/subscribe/failure`,
        pending: `${req.protocol}://${req.get('host')}/subscribe/pending`
      },
      auto_return: 'approved',
    };
    
    // Obter resposta do Mercado Pago
    const response = await preferenceClient.create({ body: preference });
    
    // Retornar dados da preferência para o frontend
    return res.json({
      preferenceId: response.id,
      redirectUrl: response.init_point
    });
  } catch (error) {
    console.error('Erro ao criar pagamento de teste:', error);
    return res.status(500).json({ 
      error: { message: 'Erro ao criar pagamento de teste. Tente novamente mais tarde.' }
    });
  }
}

/**
 * Verifica periodicamente assinaturas expiradas e envia notificações
 */
export async function checkExpiredSubscriptions() {
  try {
    const now = new Date();
    
    // Obter todas as assinaturas ativas
    const activeSubscriptions = await storage.getActiveSubscriptions();
    
    for (const subscription of activeSubscriptions) {
      // Verificar se a assinatura está expirada
      if (subscription.currentPeriodEnd < now) {
        console.log(`Assinatura ${subscription.id} do usuário ${subscription.userId} expirada`);
        
        // Atualizar status da assinatura
        await storage.updateSubscription(subscription.id, { status: 'expired' });
        
        // Atualizar usuário
        await storage.updateUser(subscription.userId, {
          subscriptionActive: false,
          paymentRequired: true
        });
        
        // Aqui poderia ser adicionado o envio de notificação por email
      }
    }
    
    console.log('Verificação de assinaturas expiradas concluída');
  } catch (error) {
    console.error('Erro ao verificar assinaturas expiradas:', error);
  }
}

/**
 * Busca histórico de pagamentos de um usuário
 * @param userId ID do usuário
 * @returns Lista de pagamentos
 */
export async function getUserPaymentsHistory(userId: number) {
  try {
    // Buscar pagamentos do usuário no banco de dados local
    const userPayments = await storage.getMercadoPagoPaymentsByUser(userId);
    
    // Formatar pagamentos para o frontend
    const formattedPayments = userPayments.map(payment => ({
      id: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
      description: 'Assinatura QUERO FRETES',
      paymentMethod: {
        id: payment.paymentMethodId,
        type: payment.paymentTypeId
      },
      amount: payment.amount,
      createdAt: payment.dateCreated.toISOString(),
      approvedAt: payment.dateApproved ? payment.dateApproved.toISOString() : null,
      mercadopagoId: payment.mercadopagoId,
      externalReference: payment.externalReference
    }));
    
    return formattedPayments;
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    throw error;
  }
}