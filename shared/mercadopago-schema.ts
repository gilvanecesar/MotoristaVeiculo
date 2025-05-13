import { pgTable, text, serial, integer, boolean, timestamp, date, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Tabela de eventos de assinatura
export const subscriptionEvents = pgTable("subscription_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Status de pagamento do Mercado Pago
export const MERCADOPAGO_PAYMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  AUTHORIZED: "authorized", 
  IN_PROCESS: "in_process",
  IN_MEDIATION: "in_mediation",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  CHARGED_BACK: "charged_back"
} as const;

// Tabela para armazenar pagamentos do Mercado Pago
export const mercadoPagoPayments = pgTable("mercadopago_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Dados do Mercado Pago
  mercadopagoId: text("mercadopago_id").notNull().unique(),
  status: text("status").notNull(), // Baseado em MERCADOPAGO_PAYMENT_STATUS
  statusDetail: text("status_detail"),
  
  // Informações de pagamento
  paymentMethodId: text("payment_method_id"),
  paymentTypeId: text("payment_type_id"), // credit_card, debit_card, etc.
  externalReference: text("external_reference"),
  
  // Dados financeiros
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("BRL"),
  
  // Informações temporais
  dateCreated: timestamp("date_created").notNull(),
  dateApproved: timestamp("date_approved"),
  dateLastUpdated: timestamp("date_last_updated"),
  
  // Informações adicionais
  description: text("description"),
  metadata: json("metadata")
});

// Tabela para armazenar tentativas de criação de assinatura
export const subscriptionAttempts = pgTable("subscription_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Dados da tentativa
  planType: text("plan_type").notNull(), // monthly, annual, trial
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  externalReference: text("external_reference"),
  preferenceId: text("preference_id"),
  
  // Status da tentativa
  status: text("status").notNull(), // pending, completed, failed
  
  // Informações temporais
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  expirationDate: timestamp("expiration_date")
});

// Tabela para armazenar o uso de períodos de teste
export const trialUsages = pgTable("trial_usages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents)
  .omit({ id: true, createdAt: true });

export const insertMercadoPagoPaymentSchema = createInsertSchema(mercadoPagoPayments)
  .omit({ id: true });

export const insertSubscriptionAttemptSchema = createInsertSchema(subscriptionAttempts)
  .omit({ id: true, createdAt: true });

export const insertTrialUsageSchema = createInsertSchema(trialUsages)
  .omit({ id: true, createdAt: true });

// Validators
export const subscriptionEventValidator = insertSubscriptionEventSchema.extend({
  eventType: z.string().min(1),
  createdAt: z.coerce.date().optional()
});

export const mercadoPagoPaymentValidator = insertMercadoPagoPaymentSchema.extend({
  amount: z.coerce.number().positive(),
  status: z.enum([
    MERCADOPAGO_PAYMENT_STATUS.PENDING,
    MERCADOPAGO_PAYMENT_STATUS.APPROVED,
    MERCADOPAGO_PAYMENT_STATUS.AUTHORIZED,
    MERCADOPAGO_PAYMENT_STATUS.IN_PROCESS,
    MERCADOPAGO_PAYMENT_STATUS.IN_MEDIATION,
    MERCADOPAGO_PAYMENT_STATUS.REJECTED, 
    MERCADOPAGO_PAYMENT_STATUS.CANCELLED,
    MERCADOPAGO_PAYMENT_STATUS.REFUNDED,
    MERCADOPAGO_PAYMENT_STATUS.CHARGED_BACK
  ]),
  dateCreated: z.coerce.date(),
  dateApproved: z.coerce.date().optional().nullable(),
  dateLastUpdated: z.coerce.date().optional().nullable()
});

export const subscriptionAttemptValidator = insertSubscriptionAttemptSchema.extend({
  amount: z.coerce.number().positive(),
  planType: z.string().min(1),
  status: z.enum(["pending", "completed", "failed"]),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date()
});

export const trialUsageValidator = insertTrialUsageSchema.extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

// Types
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;

export type MercadoPagoPayment = typeof mercadoPagoPayments.$inferSelect;
export type InsertMercadoPagoPayment = z.infer<typeof insertMercadoPagoPaymentSchema>;

export type SubscriptionAttempt = typeof subscriptionAttempts.$inferSelect;
export type InsertSubscriptionAttempt = z.infer<typeof insertSubscriptionAttemptSchema>;

export type TrialUsage = typeof trialUsages.$inferSelect;
export type InsertTrialUsage = z.infer<typeof insertTrialUsageSchema>;

export type MercadoPagoPaymentStatus = typeof MERCADOPAGO_PAYMENT_STATUS[keyof typeof MERCADOPAGO_PAYMENT_STATUS];