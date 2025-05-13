import { DatabaseStorage } from '../storage';
import { eq, desc, and } from 'drizzle-orm';
import { 
  users, 
  subscriptions, 
  invoices,
  payments
} from '@shared/schema';
import { 
  subscriptionAttempts,
  mercadoPagoPayments
} from '@shared/mercadopago-schema';

/**
 * Extensão do DatabaseStorage para funções específicas de assinatura
 */

// Funções de atualização de usuário
export async function updateUserMercadoPagoInfo(
  this: DatabaseStorage, 
  userId: number, 
  data: { mercadopagoCustomerId?: string }
) {
  const [updatedUser] = await this.db
    .update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();
  
  return updatedUser;
}

// Funções de gerenciamento de eventos de assinatura
export async function createSubscriptionEvent(
  this: DatabaseStorage,
  data: {
    userId: number;
    eventType: string;
    metadata?: any;
  }
) {
  const [event] = await this.db
    .insert(subscriptionEvents)
    .values({
      userId: data.userId,
      eventType: data.eventType,
      createdAt: new Date(),
    })
    .returning();
  
  return event;
}

export async function getSubscriptionEvents(
  this: DatabaseStorage, 
  userId: number, 
  limit = 20
) {
  const events = await this.db
    .select()
    .from(subscriptionEvents)
    .where(eq(subscriptionEvents.userId, userId))
    .orderBy(desc(subscriptionEvents.createdAt))
    .limit(limit);
  
  return events;
}

// Funções de gerenciamento de assinaturas
export async function getSubscription(
  this: DatabaseStorage, 
  userId: number
) {
  const [subscription] = await this.db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    ));
  
  return subscription;
}

export async function getSubscriptionById(
  this: DatabaseStorage, 
  subscriptionId: number
) {
  const [subscription] = await this.db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId));
  
  return subscription;
}

export async function getSubscriptionsByUser(
  this: DatabaseStorage, 
  userId: number
) {
  const userSubscriptions = await this.db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
  
  return userSubscriptions;
}

export async function createSubscription(
  this: DatabaseStorage, 
  data: {
    userId: number;
    status: string;
    planType: string;
    startDate: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    metadata?: any;
  }
) {
  const [subscription] = await this.db
    .insert(subscriptions)
    .values({
      userId: data.userId,
      status: data.status,
      planType: data.planType,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: data.metadata || {},
    })
    .returning();
  
  return subscription;
}

export async function updateSubscription(
  this: DatabaseStorage, 
  subscriptionId: number, 
  data: Partial<{
    status: string;
    planType: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    canceledAt: Date;
    metadata: any;
  }>
) {
  const [subscription] = await this.db
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  
  return subscription;
}

export async function createOrUpdateSubscription(
  this: DatabaseStorage, 
  data: {
    userId: number;
    status: string;
    planType: string;
    startDate?: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    metadata?: any;
  }
) {
  // Verificar se existe assinatura ativa
  const existingSubscription = await this.getSubscription(data.userId);
  
  if (existingSubscription) {
    // Atualizar assinatura existente
    return this.updateSubscription(existingSubscription.id, {
      status: data.status,
      planType: data.planType,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      metadata: data.metadata
    });
  } else {
    // Criar nova assinatura
    return this.createSubscription({
      userId: data.userId,
      status: data.status,
      planType: data.planType,
      startDate: data.startDate || new Date(),
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      metadata: data.metadata
    });
  }
}

// Funções para pagamentos do Mercado Pago
export async function createMercadoPagoPayment(
  this: DatabaseStorage, 
  data: {
    userId: number;
    status: string;
    statusDetail: string;
    amount: string;
    paymentMethod: string;
    paymentMethodId: string;
    paymentTypeId: string;
    description: string;
    dateCreated: Date;
    dateApproved: Date | null;
    mercadopagoId: string;
    externalReference?: string;
    metadata?: any;
  }
) {
  const [payment] = await this.db
    .insert(invoices)
    .values({
      userId: data.userId,
      status: data.status,
      amount: data.amount,
      description: data.description,
      createdAt: data.dateCreated,
      updatedAt: new Date(),
      paidAt: data.dateApproved,
      metadata: {
        ...data.metadata,
        mercadopagoId: data.mercadopagoId,
        statusDetail: data.statusDetail,
        paymentMethod: data.paymentMethod,
        paymentMethodId: data.paymentMethodId,
        paymentTypeId: data.paymentTypeId,
        externalReference: data.externalReference
      },
    })
    .returning();
  
  return payment;
}

export async function getMercadoPagoPaymentsByUser(
  this: DatabaseStorage, 
  userId: number
) {
  const payments = await this.db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
  
  // Formatar para compatibilidade com a API
  return payments.map(payment => {
    const metadata = payment.metadata as any || {};
    
    return {
      id: payment.id,
      status: payment.status,
      statusDetail: metadata.statusDetail || 'unknown',
      amount: payment.amount,
      description: payment.description,
      paymentMethod: metadata.paymentMethod || null,
      paymentMethodId: metadata.paymentMethodId || null,
      paymentTypeId: metadata.paymentTypeId || null,
      dateCreated: payment.createdAt,
      dateApproved: payment.paidAt,
      mercadopagoId: metadata.mercadopagoId || null,
      externalReference: metadata.externalReference || null
    };
  });
}

// Funções para gerenciamento de período de teste
export async function hasUserUsedTrial(
  this: DatabaseStorage, 
  userId: number
) {
  const subscriptionWithTrial = await this.db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.planType, 'trial')
    ))
    .limit(1);
  
  return subscriptionWithTrial.length > 0;
}

export async function createTrialUsage(
  this: DatabaseStorage, 
  data: {
    userId: number;
    startDate: Date;
    endDate: Date;
  }
) {
  // Criamos um registro de evento para marcar o uso do trial
  return this.createSubscriptionEvent({
    userId: data.userId,
    eventType: 'trial_usage',
    metadata: {
      startDate: data.startDate,
      endDate: data.endDate
    }
  });
}

// Função para registrar métodos de pagamento
export async function registerMercadoPagoPaymentMethod(
  this: DatabaseStorage, 
  data: {
    userId: number;
    paymentMethod: string;
    lastFour: string;
    cardBrand?: string;
    cardExpirationMonth?: string;
    cardExpirationYear?: string;
    mercadopagoId: string;
  }
) {
  const [paymentMethod] = await this.db
    .insert(paymentMethods)
    .values({
      userId: data.userId,
      paymentMethod: data.paymentMethod,
      last4: data.lastFour,
      cardBrand: data.cardBrand || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      metadata: {
        mercadopagoId: data.mercadopagoId,
        expirationMonth: data.cardExpirationMonth,
        expirationYear: data.cardExpirationYear
      }
    })
    .returning();
  
  return paymentMethod;
}

// Registrar estas funções na classe DatabaseStorage
export function registerSubscriptionExtensions(storage: DatabaseStorage) {
  storage.updateUserMercadoPagoInfo = updateUserMercadoPagoInfo.bind(storage);
  storage.createSubscriptionEvent = createSubscriptionEvent.bind(storage);
  storage.getSubscriptionEvents = getSubscriptionEvents.bind(storage);
  storage.getSubscription = getSubscription.bind(storage);
  storage.getSubscriptionById = getSubscriptionById.bind(storage);
  storage.getSubscriptionsByUser = getSubscriptionsByUser.bind(storage);
  storage.createSubscription = createSubscription.bind(storage);
  storage.updateSubscription = updateSubscription.bind(storage);
  storage.createOrUpdateSubscription = createOrUpdateSubscription.bind(storage);
  storage.createMercadoPagoPayment = createMercadoPagoPayment.bind(storage);
  storage.getMercadoPagoPaymentsByUser = getMercadoPagoPaymentsByUser.bind(storage);
  storage.hasUserUsedTrial = hasUserUsedTrial.bind(storage);
  storage.createTrialUsage = createTrialUsage.bind(storage);
  storage.registerMercadoPagoPaymentMethod = registerMercadoPagoPaymentMethod.bind(storage);
}