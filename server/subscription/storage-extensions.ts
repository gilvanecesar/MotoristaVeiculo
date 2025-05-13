import { db } from "../db";
import { 
  mercadoPagoPayments, 
  subscriptionAttempts, 
  trialUsages,
  users, 
  subscriptions,
  type MercadoPagoPayment,
  type InsertMercadoPagoPayment,
  type SubscriptionAttempt,
  type InsertSubscriptionAttempt,
  type TrialUsage,
  type InsertTrialUsage,
  type Subscription,
  type InsertSubscription
} from "@shared/schema";
import { eq, desc, and, lt, gt, isNull } from "drizzle-orm";

/**
 * Extensão para o storage com suporte para Mercado Pago
 */
export class MercadoPagoStorageExtension {
  
  /**
   * Cria um novo pagamento do Mercado Pago
   */
  async createMercadoPagoPayment(data: InsertMercadoPagoPayment): Promise<MercadoPagoPayment> {
    const [payment] = await db.insert(mercadoPagoPayments).values(data).returning();
    return payment;
  }
  
  /**
   * Obtém um pagamento do Mercado Pago pelo ID
   */
  async getMercadoPagoPayment(id: number): Promise<MercadoPagoPayment | undefined> {
    const [payment] = await db.select().from(mercadoPagoPayments).where(eq(mercadoPagoPayments.id, id));
    return payment;
  }
  
  /**
   * Obtém um pagamento do Mercado Pago pelo ID externo
   */
  async getMercadoPagoPaymentByExternalId(mercadopagoId: string): Promise<MercadoPagoPayment | undefined> {
    const [payment] = await db
      .select()
      .from(mercadoPagoPayments)
      .where(eq(mercadoPagoPayments.mercadopagoId, mercadopagoId));
    return payment;
  }
  
  /**
   * Obtém todos os pagamentos do Mercado Pago de um usuário
   */
  async getMercadoPagoPaymentsByUser(userId: number): Promise<MercadoPagoPayment[]> {
    return db
      .select()
      .from(mercadoPagoPayments)
      .where(eq(mercadoPagoPayments.userId, userId))
      .orderBy(desc(mercadoPagoPayments.dateCreated));
  }
  
  /**
   * Atualiza um pagamento do Mercado Pago
   */
  async updateMercadoPagoPayment(
    id: number, 
    data: Partial<InsertMercadoPagoPayment>
  ): Promise<MercadoPagoPayment | undefined> {
    const [payment] = await db
      .update(mercadoPagoPayments)
      .set(data)
      .where(eq(mercadoPagoPayments.id, id))
      .returning();
    return payment;
  }
  
  /**
   * Cria uma tentativa de assinatura
   */
  async createSubscriptionAttempt(data: InsertSubscriptionAttempt): Promise<SubscriptionAttempt> {
    const [attempt] = await db.insert(subscriptionAttempts).values(data).returning();
    return attempt;
  }
  
  /**
   * Obtém uma tentativa de assinatura pelo ID
   */
  async getSubscriptionAttempt(id: number): Promise<SubscriptionAttempt | undefined> {
    const [attempt] = await db.select().from(subscriptionAttempts).where(eq(subscriptionAttempts.id, id));
    return attempt;
  }
  
  /**
   * Obtém uma tentativa de assinatura pela referência externa
   */
  async getSubscriptionAttemptByReference(reference: string): Promise<SubscriptionAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(subscriptionAttempts)
      .where(eq(subscriptionAttempts.externalReference, reference));
    return attempt;
  }
  
  /**
   * Atualiza uma tentativa de assinatura
   */
  async updateSubscriptionAttempt(
    id: number, 
    data: Partial<InsertSubscriptionAttempt>
  ): Promise<SubscriptionAttempt | undefined> {
    const [attempt] = await db
      .update(subscriptionAttempts)
      .set(data)
      .where(eq(subscriptionAttempts.id, id))
      .returning();
    return attempt;
  }
  
  /**
   * Cria ou atualiza uma assinatura para um usuário
   */
  async createOrUpdateSubscription(
    data: Partial<InsertSubscription> & { userId: number }
  ): Promise<Subscription> {
    // Verificar se já existe uma assinatura ativa para o usuário
    const existingSubscription = await this.getActiveSubscription(data.userId);
    
    if (existingSubscription) {
      // Atualizar assinatura existente
      const [updated] = await db
        .update(subscriptions)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, existingSubscription.id))
        .returning();
      
      return updated;
    } else {
      // Criar nova assinatura
      const [subscription] = await db
        .insert(subscriptions)
        .values({
          ...data,
          status: data.status || 'active',
          planType: data.planType || 'monthly',
          currentPeriodStart: data.currentPeriodStart || new Date(),
          currentPeriodEnd: data.currentPeriodEnd || new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return subscription;
    }
  }
  
  /**
   * Obtém a assinatura ativa de um usuário
   */
  async getActiveSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .orderBy(desc(subscriptions.createdAt));
    
    return subscription;
  }
  
  /**
   * Atualiza uma assinatura
   */
  async updateSubscription(
    id: number, 
    data: Partial<InsertSubscription>
  ): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    
    return subscription;
  }
  
  /**
   * Verifica se um usuário já utilizou o período de teste
   */
  async hasUserUsedTrial(userId: number): Promise<boolean> {
    const [usage] = await db
      .select()
      .from(trialUsages)
      .where(eq(trialUsages.userId, userId));
    
    return !!usage;
  }
  
  /**
   * Registra utilização do período de teste
   */
  async createTrialUsage(data: InsertTrialUsage): Promise<TrialUsage> {
    const [usage] = await db.insert(trialUsages).values(data).returning();
    return usage;
  }
  
  /**
   * Obtém todas as assinaturas ativas
   */
  async getActiveSubscriptions(): Promise<Subscription[]> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
  }
  
  /**
   * Atualiza o mercadopagoCustomerId do usuário
   */
  async updateMercadoPagoCustomerId(userId: number, customerId: string): Promise<void> {
    await db
      .update(users)
      .set({ mercadopagoCustomerId: customerId })
      .where(eq(users.id, userId));
  }
}