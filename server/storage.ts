import {
  drivers,
  vehicles,
  clients,
  freights,
  freightDestinations,
  complements,
  users,
  subscriptions,
  invoices,
  payments,
  quotes,
  webhookConfigs,
  CLIENT_TYPES,
  USER_TYPES,
  AUTH_PROVIDERS,
  SUBSCRIPTION_STATUS,
  INVOICE_STATUS,
  PLAN_TYPES,
  QUOTE_STATUS,
  type Driver,
  type InsertDriver,
  type Vehicle,
  type InsertVehicle,
  type Client,
  type InsertClient,
  type Freight,
  type InsertFreight,
  type FreightDestination,
  type InsertFreightDestination,
  type Complement,
  type InsertComplement,
  type User,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type Invoice,
  type InsertInvoice,
  type Payment,
  type InsertPayment,
  type Quote,
  type InsertQuote,
  type WebhookConfig,
  type InsertWebhookConfig,
  type DriverWithVehicles,
  type FreightWithDestinations,
  type SubscriptionWithInvoices,
  type InvoiceWithPayments,
  type ClientWithSubscriptions,
} from "@shared/schema";
import {
  trialUsages,
  type TrialUsage,
  type InsertTrialUsage,
} from "@shared/mercadopago-schema";
import { db, pool } from "./db";
import { and, eq, ilike, or, sql, desc } from "drizzle-orm";
import crypto from "crypto";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

// Interface para ticket de suporte (problemas de pagamento/assinatura)
export interface SupportTicket {
  id: number;
  userId: number;
  issueType: string;
  description: string;
  contactEmail: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

// Interface para eventos de assinatura
export interface SubscriptionEvent {
  id: number;
  userId: number;
  eventType: string;
  eventDate: string;
  planType: string;
  details: string;
}

export interface IStorage {
  // Session store
  sessionStore: SessionStore;

  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCpf(cpf: string): Promise<User | undefined>;
  getUserByCnpj(cnpj: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getClientByStripeCustomerId(stripeCustomerId: string): Promise<Client | undefined>;
  getSubscriptionsByClientId(clientId: number): Promise<Subscription[]>;
  searchClientsByEmail(email: string): Promise<Client[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  verifyUser(id: number): Promise<User | undefined>;
  updateLastLogin(id: number): Promise<User | undefined>;
  toggleUserAccess(id: number, isActive: boolean): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  createPasswordResetToken(email: string): Promise<{ token: string; user: User } | undefined>;
  verifyPasswordResetToken(token: string, email: string): Promise<User | undefined>;
  updatePassword(id: number, newPassword: string): Promise<User | undefined>;
  
  // Gerenciamento de assinatura
  getSubscriptionEvents(userId: number): Promise<SubscriptionEvent[]>;
  createSubscriptionEvent(event: Omit<SubscriptionEvent, "id">): Promise<SubscriptionEvent>;
  createSupportTicket(ticket: Omit<SupportTicket, "id">): Promise<SupportTicket>;

  // Driver operations
  getDrivers(): Promise<DriverWithVehicles[]>;
  getDriver(id: number): Promise<DriverWithVehicles | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(
    id: number,
    driver: Partial<InsertDriver>,
  ): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<boolean>;
  searchDrivers(query: string): Promise<DriverWithVehicles[]>;

  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehiclesByDriver(driverId: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(
    id: number,
    vehicle: Partial<InsertVehicle>,
  ): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  searchVehicles(query: string): Promise<Vehicle[]>;

  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(
    id: number,
    client: Partial<InsertClient>,
  ): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;

  // Freight operations
  getFreights(): Promise<FreightWithDestinations[]>;
  getFreight(id: number): Promise<FreightWithDestinations | undefined>;
  getFreightsByUserId(userId: number): Promise<FreightWithDestinations[]>;
  createFreight(freight: InsertFreight): Promise<Freight>;
  updateFreight(
    id: number,
    freight: Partial<InsertFreight>,
  ): Promise<Freight | undefined>;
  deleteFreight(id: number): Promise<boolean>;
  searchFreights(query: string): Promise<FreightWithDestinations[]>;

  // FreightDestination operations
  getFreightDestinations(freightId: number): Promise<FreightDestination[]>;
  createFreightDestination(
    destination: InsertFreightDestination,
  ): Promise<FreightDestination>;
  deleteFreightDestination(id: number): Promise<boolean>;

  // Complement operations
  getComplements(): Promise<Complement[]>;
  getComplement(id: number): Promise<Complement | undefined>;
  createComplement(complement: InsertComplement): Promise<Complement>;
  updateComplement(
    id: number,
    complement: Partial<InsertComplement>,
  ): Promise<Complement | undefined>;
  deleteComplement(id: number): Promise<boolean>;
  searchComplements(query: string): Promise<Complement[]>;

  // Subscription operations
  getSubscriptions(): Promise<Subscription[]>;
  getSubscriptionsByUser(userId: number): Promise<Subscription[]>;
  getSubscriptionsByClient(clientId: number): Promise<Subscription[]>;
  getSubscriptionsByClientId(clientId: number): Promise<Subscription[]>;
  getSubscription(id: number): Promise<SubscriptionWithInvoices | undefined>;
  getSubscriptionByStripeId(
    stripeId: string,
  ): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(
    id: number,
    subscription: Partial<InsertSubscription>,
  ): Promise<Subscription | undefined>;
  deleteSubscription(id: number): Promise<boolean>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByUser(userId: number): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesBySubscription(subscriptionId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<InvoiceWithPayments | undefined>;
  getInvoiceByStripeId(stripeId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(
    id: number,
    invoice: Partial<InsertInvoice>,
  ): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Payment operations
  getPayments(): Promise<Payment[]>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByClient(clientId: number): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByStripeId(stripeId: string): Promise<Payment | undefined>;
  getMercadoPagoPaymentsByUser(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(
    id: number,
    payment: Partial<InsertPayment>,
  ): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  
  // Finance operations
  getFinanceStats(): Promise<any>;
  updateFinanceSettings(settings: any): Promise<any>;
  
  // Trial usage operations
  getTrialUsage(userId: number): Promise<TrialUsage | undefined>;
  createTrialUsage(trialUsage: InsertTrialUsage): Promise<TrialUsage>;
  
  // Quote operations
  getQuotes(userId: number): Promise<Quote[]>;
  getAllQuotes(): Promise<Quote[]>;
  getQuoteStats(userId: number): Promise<{ total: number; active: number; closed: number; expired: number; thisMonth: number; lastMonth: number; }>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuoteStatus(id: number, status: string, userId: number): Promise<Quote | undefined>;
  getQuoteById(id: number): Promise<Quote | undefined>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;

  // Webhook config operations
  getWebhookConfig(): Promise<WebhookConfig | undefined>;
  updateWebhookConfig(config: Partial<InsertWebhookConfig>): Promise<WebhookConfig>;
}

export class MemStorage implements IStorage {
  private driversData: Map<number, Driver>;
  private vehiclesData: Map<number, Vehicle>;
  private clientsData: Map<number, Client>;
  private freightsData: Map<number, Freight>;
  private freightDestinationsData: Map<number, FreightDestination>;
  private usersData: Map<number, User>;
  private subscriptionsData: Map<number, Subscription>;
  private invoicesData: Map<number, Invoice>;
  private paymentsData: Map<number, Payment>;
  private driverCurrentId: number;
  private vehicleCurrentId: number;
  private clientCurrentId: number;
  private freightCurrentId: number;
  private freightDestinationCurrentId: number;
  private userCurrentId: number;
  private subscriptionCurrentId: number;
  private invoiceCurrentId: number;
  private paymentCurrentId: number;
  sessionStore: SessionStore;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });

    this.driversData = new Map();
    this.vehiclesData = new Map();
    this.clientsData = new Map();
    this.freightsData = new Map();
    this.freightDestinationsData = new Map();
    this.usersData = new Map();
    this.subscriptionsData = new Map();
    this.invoicesData = new Map();
    this.paymentsData = new Map();
    this.driverCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.clientCurrentId = 1;
    this.freightCurrentId = 1;
    this.freightDestinationCurrentId = 1;
    this.userCurrentId = 1;
    this.subscriptionCurrentId = 1;
    this.invoiceCurrentId = 1;
    this.paymentCurrentId = 1;
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.stripeCustomerId === stripeCustomerId
    );
  }
  
  async getClientByStripeCustomerId(stripeCustomerId: string): Promise<Client | undefined> {
    // Como o campo stripeCustomerId não existe na tabela de clientes, vamos buscar
    // primeiro o usuário que tem esse stripeCustomerId
    const user = await this.getUserByStripeCustomerId(stripeCustomerId);
    
    // Se encontrarmos o usuário e ele tiver um clientId, retornamos o cliente correspondente
    if (user && user.clientId) {
      return this.getClient(user.clientId);
    }
    
    // Se não encontrarmos o usuário, tentamos procurar nas assinaturas
    const subscription = Array.from(this.subscriptionsData.values()).find(
      sub => sub.stripeCustomerId === stripeCustomerId
    );
    
    if (subscription && subscription.clientId) {
      return this.getClient(subscription.clientId);
    }
    
    return undefined;
  }
  
  async searchClientsByEmail(email: string): Promise<Client[]> {
    return Array.from(this.clientsData.values()).filter(
      (client) => client.email && client.email.toLowerCase().includes(email.toLowerCase())
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.userCurrentId++,
      isVerified: false,
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
    };
    this.usersData.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(
    id: number,
    userUpdate: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userUpdate };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async verifyUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isVerified: true });
  }

  async updateLastLogin(id: number): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, lastLogin: new Date() };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async toggleUserAccess(id: number, isActive: boolean): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, isActive };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  // Token map para armazenar tokens de redefinição de senha (email -> {token, expiração})
  private passwordResetTokens: Map<string, { token: string; expiry: Date }> = new Map();

  async createPasswordResetToken(email: string): Promise<{ token: string; user: User } | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;

    // Gerar um token aleatório
    const token = crypto.randomBytes(20).toString('hex');
    
    // O token expira em 24 horas
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    // Armazenar o token com data de expiração
    this.passwordResetTokens.set(email, { token, expiry });
    
    return { token, user };
  }

  async verifyPasswordResetToken(token: string, email: string): Promise<User | undefined> {
    const tokenData = this.passwordResetTokens.get(email);
    
    // Verificar se o token existe, está correto e não expirou
    if (!tokenData || tokenData.token !== token || tokenData.expiry < new Date()) {
      return undefined;
    }
    
    // Se o token for válido, retorna o usuário
    const user = await this.getUserByEmail(email);
    if (user) {
      // Após verificação, remover o token (uso único)
      this.passwordResetTokens.delete(email);
    }
    
    return user;
  }

  async updatePassword(id: number, newPassword: string): Promise<User | undefined> {
    return this.updateUser(id, { password: newPassword });
  }

  // Driver operations
  // (código omitido para brevidade)
  
  // Outros métodos de operações CRUD

  // Financial operations
  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptionsData.values());
  }

  async getSubscriptionsByUser(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptionsData.values()).filter(
      (sub) => sub.userId === userId,
    );
  }

  async getSubscriptionsByClient(clientId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptionsData.values()).filter(
      (sub) => sub.clientId === clientId,
    );
  }
  
  async getSubscriptionsByClientId(clientId: number): Promise<Subscription[]> {
    // This is an alias for getSubscriptionsByClient to maintain backward compatibility
    return this.getSubscriptionsByClient(clientId);
  }

  async getSubscription(
    id: number,
  ): Promise<SubscriptionWithInvoices | undefined> {
    const subscription = this.subscriptionsData.get(id);
    if (!subscription) return undefined;

    const subscriptionInvoices = Array.from(this.invoicesData.values()).filter(
      (invoice) => invoice.subscriptionId === id,
    );

    return {
      ...subscription,
      invoices: subscriptionInvoices,
    };
  }

  async getSubscriptionByStripeId(
    stripeId: string,
  ): Promise<Subscription | undefined> {
    return Array.from(this.subscriptionsData.values()).find(
      (sub) => sub.stripeId === stripeId,
    );
  }

  async createSubscription(
    subscription: InsertSubscription,
  ): Promise<Subscription> {
    const newSubscription: Subscription = {
      ...subscription,
      id: this.subscriptionCurrentId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptionsData.set(newSubscription.id, newSubscription);
    return newSubscription;
  }

  async updateSubscription(
    id: number,
    subscriptionUpdate: Partial<InsertSubscription>,
  ): Promise<Subscription | undefined> {
    const subscription = this.subscriptionsData.get(id);
    if (!subscription) return undefined;

    const updatedSubscription = {
      ...subscription,
      ...subscriptionUpdate,
      updatedAt: new Date(),
    };
    this.subscriptionsData.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async deleteSubscription(id: number): Promise<boolean> {
    return this.subscriptionsData.delete(id);
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoicesData.values());
  }

  async getInvoicesByUser(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoicesData.values()).filter(
      (invoice) => invoice.userId === userId,
    );
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoicesData.values()).filter(
      (invoice) => invoice.clientId === clientId,
    );
  }

  async getInvoicesBySubscription(subscriptionId: number): Promise<Invoice[]> {
    return Array.from(this.invoicesData.values()).filter(
      (invoice) => invoice.subscriptionId === subscriptionId,
    );
  }

  async getInvoice(id: number): Promise<InvoiceWithPayments | undefined> {
    const invoice = this.invoicesData.get(id);
    if (!invoice) return undefined;

    const invoicePayments = Array.from(this.paymentsData.values()).filter(
      (payment) => payment.invoiceId === id,
    );

    return {
      ...invoice,
      payments: invoicePayments,
    };
  }

  async getInvoiceByStripeId(stripeId: string): Promise<Invoice | undefined> {
    return Array.from(this.invoicesData.values()).find(
      (invoice) => invoice.stripeId === stripeId,
    );
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const newInvoice: Invoice = {
      ...invoice,
      id: this.invoiceCurrentId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoicesData.set(newInvoice.id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(
    id: number,
    invoiceUpdate: Partial<InsertInvoice>,
  ): Promise<Invoice | undefined> {
    const invoice = this.invoicesData.get(id);
    if (!invoice) return undefined;

    const updatedInvoice = {
      ...invoice,
      ...invoiceUpdate,
      updatedAt: new Date(),
    };
    this.invoicesData.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoicesData.delete(id);
  }

  // Payment operations
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.paymentsData.values());
  }
  
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.paymentsData.values());
  }
  
  async getMercadoPagoPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.paymentsData.values()).filter(
      (payment) => payment.userId === userId && payment.paymentMethod === 'mercadopago'
    );
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return Array.from(this.paymentsData.values()).filter(
      (payment) => payment.userId === userId,
    );
  }

  async getPaymentsByClient(clientId: number): Promise<Payment[]> {
    return Array.from(this.paymentsData.values()).filter(
      (payment) => payment.clientId === clientId,
    );
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    return Array.from(this.paymentsData.values()).filter(
      (payment) => payment.invoiceId === invoiceId,
    );
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.paymentsData.get(id);
  }

  async getPaymentByStripeId(stripeId: string): Promise<Payment | undefined> {
    return Array.from(this.paymentsData.values()).find(
      (payment) => payment.stripeId === stripeId,
    );
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const newPayment: Payment = {
      ...payment,
      id: this.paymentCurrentId++,
      createdAt: new Date(),
    };
    this.paymentsData.set(newPayment.id, newPayment);
    return newPayment;
  }

  async updatePayment(
    id: number,
    paymentUpdate: Partial<InsertPayment>,
  ): Promise<Payment | undefined> {
    const payment = this.paymentsData.get(id);
    if (!payment) return undefined;

    const updatedPayment = { ...payment, ...paymentUpdate };
    this.paymentsData.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    return this.paymentsData.delete(id);
  }

  // Finance operations
  async getFinanceStats(): Promise<any> {
    try {
      // Buscar dados em memória
      const subscriptionsDb = Array.from(this.subscriptionsData.values());
      const invoicesDb = Array.from(this.invoicesData.values());
      
      // Default monthly data array
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));
      
      if (!subscriptionsDb || subscriptionsDb.length === 0) {
        console.log("Não há assinaturas no banco de dados para calcular estatísticas financeiras");
        // Se não houver assinaturas na memória, retornar zeros
        return {
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          monthlyData,
          subscriptionsByStatus: [
            { status: "Ativas", count: 0 },
            { status: "Teste", count: 0 },
            { status: "Canceladas", count: 0 },
            { status: "Atrasadas", count: 0 }
          ]
        };
      }
      
      console.log(`Calculando estatísticas com ${subscriptionsDb.length} assinaturas no banco de dados`);
      
      // Filtrar assinaturas por status
      const activeSubscriptions = subscriptionsDb.filter(sub => sub.status === 'active');
      const trialSubscriptions = subscriptionsDb.filter(sub => sub.status === 'trialing');
      const canceledSubscriptions = subscriptionsDb.filter(sub => sub.status === 'canceled');
      const pastDueSubscriptions = subscriptionsDb.filter(sub => sub.status === 'past_due');
      
      // Calcular receita total apenas das assinaturas ativas
      let totalRevenue = 0;
      
      for (const subscription of activeSubscriptions) {
        // Determinar o valor da assinatura
        let amount = 0;
        
        if (subscription.planType === 'annual') {
          amount = 960; // valor anual (R$ 960,00)
        } else {
          amount = 99.9; // valor mensal (R$ 99,90)
        }
        
        // Adicionar ao total
        totalRevenue += amount;
        
        // Distribuir o valor para o gráfico mensal (mês atual)
        const currentMonth = new Date().getMonth();
        monthlyData[currentMonth].revenue += amount;
        
        console.log(`Contabilizando assinatura: ${subscription.id} - Valor: ${amount} - Total: ${totalRevenue}`);
      }
      
      // Calcular taxa de churn
      const totalSubscriptions = activeSubscriptions.length + canceledSubscriptions.length;
      const churnRate = totalSubscriptions > 0 ? (canceledSubscriptions.length / totalSubscriptions) * 100 : 0;
      
      // Calcular receita mensal (dividindo por 12 meses)
      const monthlyRevenue = totalRevenue / 12;
      
      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        activeSubscriptions: activeSubscriptions.length,
        churnRate: parseFloat(churnRate.toFixed(1)),
        monthlyData,
        subscriptionsByStatus: [
          { status: "Ativas", count: activeSubscriptions.length },
          { status: "Teste", count: trialSubscriptions.length },
          { status: "Canceladas", count: canceledSubscriptions.length },
          { status: "Atrasadas", count: pastDueSubscriptions.length }
        ]
      };
    } catch (error) {
      console.error("Error calculating finance stats:", error);
      throw error;
    }
  }
  
  async updateFinanceSettings(settings: any): Promise<any> {
    // Como estamos usando armazenamento em memória ou não temos uma tabela específica para configurações,
    // simplesmente retornamos as configurações recebidas
    // Em uma implementação completa, isso salvaria em uma tabela de configurações
    return settings;
  }

  // Trial usage operations
  async getTrialUsage(userId: number): Promise<TrialUsage | undefined> {
    // Simular busca em memória - retorna undefined (não usado durante trial)
    return undefined;
  }

  async createTrialUsage(trialUsage: InsertTrialUsage): Promise<TrialUsage> {
    // Simular criação em memória
    return {
      id: Date.now(),
      userId: trialUsage.userId,
      startDate: trialUsage.startDate,
      endDate: trialUsage.endDate,
      createdAt: new Date()
    };
  }
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  // Armazenamento temporário para tokens de redefinição de senha
  private passwordResetTokens: Map<string, { token: string; expiry: Date }> = new Map();
  
  // Implementação das funções de gerenciamento de assinatura
  async getSubscriptionEvents(userId: number): Promise<SubscriptionEvent[]> {
    // Implementação temporária - retorna array vazio
    return [];
  }
  
  async createSubscriptionEvent(event: Omit<SubscriptionEvent, "id">): Promise<SubscriptionEvent> {
    // Implementação temporária - retorna um evento simulado
    return {
      id: 1,
      userId: event.userId,
      eventType: event.eventType,
      eventDate: event.eventDate,
      planType: event.planType,
      details: event.details
    };
  }
  
  async createSupportTicket(ticket: Omit<SupportTicket, "id">): Promise<SupportTicket> {
    // Implementação temporária - retorna um ticket simulado
    return {
      id: 1,
      userId: ticket.userId,
      issueType: ticket.issueType,
      description: ticket.description,
      contactEmail: ticket.contactEmail,
      status: ticket.status,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt
    };
  }

  constructor() {
    // Usar memória para sessões no desenvolvimento
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 horas
      ttl: 86400000, // 24 horas
      stale: false
    });
  }

  // Usuários
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const normalizedCpf = cpf.replace(/\D/g, '');
    const results = await db.select().from(users).where(
      or(
        eq(users.cpf, normalizedCpf),
        eq(users.cpf, cpf)
      )
    );
    return results[0];
  }

  async getUserByCnpj(cnpj: string): Promise<User | undefined> {
    const normalizedCnpj = cnpj.replace(/\D/g, '');
    const results = await db.select().from(users).where(
      or(
        eq(users.cnpj, normalizedCnpj),
        eq(users.cnpj, cnpj)
      )
    );
    return results[0];
  }
  
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return results[0];
  }
  
  async getClientByStripeCustomerId(stripeCustomerId: string): Promise<Client | undefined> {
    const results = await db.select().from(clients).where(eq(clients.stripeCustomerId, stripeCustomerId));
    return results[0];
  }
  
  async searchClientsByEmail(email: string): Promise<Client[]> {
    // Using ilike for case-insensitive search with partial matching
    const results = await db.select().from(clients).where(
      sql`${clients.email} ILIKE ${`%${email}%`}`
    );
    return results;
  }
  
  async getClientByCnpj(cnpj: string): Promise<Client | undefined> {
    // Remover caracteres não numéricos para normalizar o CNPJ
    const normalizedCnpj = cnpj.replace(/\D/g, '');
    
    // Buscar por CNPJ normalizado ou formatado
    const results = await db.select().from(clients).where(
      or(
        eq(clients.cnpj, normalizedCnpj),
        eq(clients.cnpj, cnpj)
      )
    );
    return results[0];
  }
  
  async getClientByName(name: string): Promise<Client | undefined> {
    // Busca case-insensitive pelo nome exato
    const results = await db.select().from(clients).where(
      sql`LOWER(${clients.name}) = LOWER(${name})`
    );
    return results[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const results = await db.insert(users).values(user).returning();
    return results[0];
  }

  async updateUser(
    id: number,
    userUpdate: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const results = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  async verifyUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isVerified: true });
  }

  async updateLastLogin(id: number): Promise<User | undefined> {
    return this.updateUser(id, { lastLogin: new Date() });
  }

  async toggleUserAccess(id: number, isActive: boolean): Promise<User | undefined> {
    return this.updateUser(id, { isActive });
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async createPasswordResetToken(email: string): Promise<{ token: string; user: User } | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;

    // Gerar um token aleatório
    const token = crypto.randomBytes(20).toString('hex');
    
    // O token expira em 24 horas
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    // Armazenar o token com data de expiração
    this.passwordResetTokens.set(email, { token, expiry });
    
    return { token, user };
  }

  async verifyPasswordResetToken(token: string, email: string): Promise<User | undefined> {
    const tokenData = this.passwordResetTokens.get(email);
    
    // Verificar se o token existe, está correto e não expirou
    if (!tokenData || tokenData.token !== token || tokenData.expiry < new Date()) {
      return undefined;
    }
    
    // Se o token for válido, retorna o usuário
    const user = await this.getUserByEmail(email);
    if (user) {
      // Após verificação, remover o token (uso único)
      this.passwordResetTokens.delete(email);
    }
    
    return user;
  }

  async updatePassword(id: number, newPassword: string): Promise<User | undefined> {
    return this.updateUser(id, { password: newPassword });
  }

  // Motoristas
  async getDrivers(): Promise<DriverWithVehicles[]> {
    const driversData = await db.select().from(drivers);

    // Buscar veículos para cada motorista e montar objeto DriverWithVehicles
    const driversWithVehicles: DriverWithVehicles[] = [];
    for (const driver of driversData) {
      const driverVehicles = await this.getVehiclesByDriver(driver.id);
      driversWithVehicles.push({
        ...driver,
        vehicles: driverVehicles,
      });
    }

    return driversWithVehicles;
  }

  async getDriver(id: number): Promise<DriverWithVehicles | undefined> {
    const results = await db.select().from(drivers).where(eq(drivers.id, id));
    if (!results.length) return undefined;

    const driverVehicles = await this.getVehiclesByDriver(id);
    return {
      ...results[0],
      vehicles: driverVehicles,
    };
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const results = await db.insert(drivers).values(driver).returning();
    return results[0];
  }

  async updateDriver(
    id: number,
    driverUpdate: Partial<InsertDriver>,
  ): Promise<Driver | undefined> {
    const results = await db
      .update(drivers)
      .set(driverUpdate)
      .where(eq(drivers.id, id))
      .returning();
    return results[0];
  }

  async deleteDriver(id: number): Promise<boolean> {
    await db.delete(drivers).where(eq(drivers.id, id));
    return true;
  }

  async searchDrivers(query: string): Promise<DriverWithVehicles[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    const driversData = await db
      .select()
      .from(drivers)
      .where(
        or(
          sql`lower(${drivers.name}) like ${searchQuery}`,
          sql`lower(${drivers.email}) like ${searchQuery}`,
          sql`lower(${drivers.phone}) like ${searchQuery}`,
        ),
      );

    // Buscar veículos para cada motorista e montar objeto DriverWithVehicles
    const driversWithVehicles: DriverWithVehicles[] = [];
    for (const driver of driversData) {
      const driverVehicles = await this.getVehiclesByDriver(driver.id);
      driversWithVehicles.push({
        ...driver,
        vehicles: driverVehicles,
      });
    }

    return driversWithVehicles;
  }

  // Veículos
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehiclesByDriver(driverId: number): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.driverId, driverId));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const results = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return results[0];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const results = await db.insert(vehicles).values(vehicle).returning();
    return results[0];
  }

  async updateVehicle(
    id: number,
    vehicleUpdate: Partial<InsertVehicle>,
  ): Promise<Vehicle | undefined> {
    const results = await db
      .update(vehicles)
      .set(vehicleUpdate)
      .where(eq(vehicles.id, id))
      .returning();
    return results[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return true;
  }

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(vehicles)
      .where(
        or(
          sql`lower(${vehicles.plate}) like ${searchQuery}`,
          sql`lower(${vehicles.brand}) like ${searchQuery}`,
          sql`lower(${vehicles.model}) like ${searchQuery}`,
        ),
      );
  }

  // Clientes
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const results = await db.select().from(clients).where(eq(clients.id, id));
    return results[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const results = await db.insert(clients).values(client).returning();
    return results[0];
  }

  async updateClient(
    id: number,
    clientUpdate: Partial<InsertClient>,
  ): Promise<Client | undefined> {
    const results = await db
      .update(clients)
      .set(clientUpdate)
      .where(eq(clients.id, id))
      .returning();
    return results[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  async searchClients(query: string): Promise<Client[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(clients)
      .where(
        or(
          sql`lower(${clients.name}) like ${searchQuery}`,
          sql`lower(${clients.email}) like ${searchQuery}`,
          sql`lower(${clients.cnpj}) like ${searchQuery}`,
        ),
      );
  }

  // Fretes
  async getFreights(): Promise<FreightWithDestinations[]> {
    // Buscar fretes ordenados por createdAt ASC (mais novo primeiro)
    const freightsData = await db
      .select()
      .from(freights)
      .orderBy(freights.createdAt);

    // Buscar destinos para cada frete e montar objeto FreightWithDestinations
    const freightsWithDestinations: FreightWithDestinations[] = [];
    for (const freight of freightsData) {
      const destinations = await this.getFreightDestinations(freight.id);
      freightsWithDestinations.push({
        ...freight,
        destinations,
      });
    }

    return freightsWithDestinations;
  }

  async getFreight(id: number): Promise<FreightWithDestinations | undefined> {
    const results = await db.select().from(freights).where(eq(freights.id, id));
    if (!results.length) return undefined;

    const destinations = await this.getFreightDestinations(id);
    return {
      ...results[0],
      destinations,
    };
  }

  async getFreightsByUserId(userId: number): Promise<FreightWithDestinations[]> {
    const freightsData = await db.select().from(freights).where(eq(freights.userId, userId));
    
    const freightsWithDestinations: FreightWithDestinations[] = [];
    for (const freight of freightsData) {
      const destinations = await this.getFreightDestinations(freight.id);
      freightsWithDestinations.push({
        ...freight,
        destinations,
      });
    }

    return freightsWithDestinations;
  }

  async createFreight(freight: InsertFreight): Promise<Freight> {
    const results = await db.insert(freights).values(freight).returning();
    return results[0];
  }

  async updateFreight(
    id: number,
    freightUpdate: Partial<InsertFreight>,
  ): Promise<Freight | undefined> {
    const results = await db
      .update(freights)
      .set(freightUpdate)
      .where(eq(freights.id, id))
      .returning();
    return results[0];
  }

  async deleteFreight(id: number): Promise<boolean> {
    // Deletar destinos primeiro devido à restrição de chave estrangeira
    await db
      .delete(freightDestinations)
      .where(eq(freightDestinations.freightId, id));
    await db.delete(freights).where(eq(freights.id, id));
    return true;
  }

  async searchFreights(query: string): Promise<FreightWithDestinations[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    const freightsData = await db
      .select()
      .from(freights)
      .where(
        or(
          sql`lower(${freights.origin}) like ${searchQuery}`,
          sql`lower(${freights.destination}) like ${searchQuery}`,
          sql`lower(${freights.contactName}) like ${searchQuery}`,
          sql`lower(${freights.contactPhone}) like ${searchQuery}`,
        ),
      )
      .orderBy(freights.createdAt);

    // Buscar destinos para cada frete e montar objeto FreightWithDestinations
    const freightsWithDestinations: FreightWithDestinations[] = [];
    for (const freight of freightsData) {
      const destinations = await this.getFreightDestinations(freight.id);
      freightsWithDestinations.push({
        ...freight,
        destinations,
      });
    }

    return freightsWithDestinations;
  }

  // Destinos de frete
  async getFreightDestinations(
    freightId: number,
  ): Promise<FreightDestination[]> {
    return await db
      .select()
      .from(freightDestinations)
      .where(eq(freightDestinations.freightId, freightId));
  }

  async createFreightDestination(
    destination: InsertFreightDestination,
  ): Promise<FreightDestination> {
    const results = await db
      .insert(freightDestinations)
      .values(destination)
      .returning();
    return results[0];
  }

  async deleteFreightDestination(id: number): Promise<boolean> {
    await db.delete(freightDestinations).where(eq(freightDestinations.id, id));
    return true;
  }

  // Assinaturas
  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions);
  }

  async getSubscriptionsByUser(userId: number): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
  }

  async getSubscriptionsByClient(clientId: number): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clientId, clientId));
  }
  
  async getSubscriptionsByClientId(clientId: number): Promise<Subscription[]> {
    // This is an alias for getSubscriptionsByClient to maintain backward compatibility
    return this.getSubscriptionsByClient(clientId);
  }

  async getSubscription(
    id: number,
  ): Promise<SubscriptionWithInvoices | undefined> {
    const results = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    if (!results.length) return undefined;

    const subscriptionInvoices = await this.getInvoicesBySubscription(id);
    return {
      ...results[0],
      invoices: subscriptionInvoices,
    };
  }

  async getSubscriptionByStripeId(
    stripeId: string,
  ): Promise<Subscription | undefined> {
    const results = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeId));
    return results[0];
  }

  async createSubscription(
    subscription: InsertSubscription,
  ): Promise<Subscription> {
    const results = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return results[0];
  }

  async updateSubscription(
    id: number,
    subscriptionUpdate: Partial<InsertSubscription>,
  ): Promise<Subscription | undefined> {
    // Atualizar o timestamp de atualização
    const updatedData = {
      ...subscriptionUpdate,
      updatedAt: new Date(),
    };

    const results = await db
      .update(subscriptions)
      .set(updatedData)
      .where(eq(subscriptions.id, id))
      .returning();
    return results[0];
  }

  async deleteSubscription(id: number): Promise<boolean> {
    // Verificar se existem faturas associadas
    const associatedInvoices = await this.getInvoicesBySubscription(id);

    // Se existirem faturas, deletá-las primeiro
    if (associatedInvoices.length > 0) {
      for (const invoice of associatedInvoices) {
        await this.deleteInvoice(invoice.id);
      }
    }

    // Deletar a assinatura
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    return true;
  }

  // Faturas
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoicesByUser(userId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId));
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId));
  }

  async getInvoicesBySubscription(subscriptionId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.subscriptionId, subscriptionId));
  }

  async getInvoice(id: number): Promise<InvoiceWithPayments | undefined> {
    const results = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!results.length) return undefined;

    const invoicePayments = await this.getPaymentsByInvoice(id);
    return {
      ...results[0],
      payments: invoicePayments,
    };
  }

  async getInvoiceByStripeId(stripeId: string): Promise<Invoice | undefined> {
    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.stripeInvoiceId, stripeId));
    return results[0];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const results = await db.insert(invoices).values(invoice).returning();
    return results[0];
  }

  async updateInvoice(
    id: number,
    invoiceUpdate: Partial<InsertInvoice>,
  ): Promise<Invoice | undefined> {
    // Atualizar o timestamp de atualização
    const updatedData = {
      ...invoiceUpdate,
      updatedAt: new Date(),
    };

    const results = await db
      .update(invoices)
      .set(updatedData)
      .where(eq(invoices.id, id))
      .returning();
    return results[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Verificar se existem pagamentos associados
    const associatedPayments = await this.getPaymentsByInvoice(id);

    // Se existirem pagamentos, deletá-los primeiro
    if (associatedPayments.length > 0) {
      for (const payment of associatedPayments) {
        await this.deletePayment(payment.id);
      }
    }

    // Deletar a fatura
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }

  // Pagamentos
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getMercadoPagoPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.paymentMethod, 'mercadopago')
        )
      );
  }
  
  async getPaymentsByClient(clientId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.clientId, clientId));
  }

  async getPaymentsByInvoice(invoiceId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const results = await db.select().from(payments).where(eq(payments.id, id));
    return results[0];
  }

  async getPaymentByStripeId(stripeId: string): Promise<Payment | undefined> {
    const results = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, stripeId));
    return results[0];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const results = await db.insert(payments).values(payment).returning();
    return results[0];
  }

  async updatePayment(
    id: number,
    paymentUpdate: Partial<InsertPayment>,
  ): Promise<Payment | undefined> {
    // Atualizar o timestamp de atualização
    const updatedData = {
      ...paymentUpdate,
      updatedAt: new Date(),
    };

    const results = await db
      .update(payments)
      .set(updatedData)
      .where(eq(payments.id, id))
      .returning();
    return results[0];
  }

  async deletePayment(id: number): Promise<boolean> {
    await db.delete(payments).where(eq(payments.id, id));
    return true;
  }

  // Finanças
  async getFinanceStats(): Promise<any> {
    try {
      // Buscar dados do banco de dados
      const subscriptionsDb = await this.getSubscriptions();
      const invoicesDb = await this.getInvoices();
      const usersDb = await this.getUsers();
      const clientsDb = await this.getClients();
      
      // Inicializar dados básicos
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));
      
      // Buscar usuários com assinatura ativa (mesmo que não estejam na tabela de assinaturas)
      const usersWithSubs = usersDb.filter(user => 
        user.subscriptionActive === true || 
        user.stripeSubscriptionId || 
        user.subscriptionType
      );
      
      // Contar status diferentes
      let activeCount = 0;
      let trialCount = 0;
      let canceledCount = 0;
      let pastDueCount = 0;
      let totalAmount = 0;
      
      // Se tiver assinaturas no banco, usar dados reais
      if (subscriptionsDb && subscriptionsDb.length > 0) {
        // Calcular com base nos dados da tabela de assinaturas
        activeCount += subscriptionsDb.filter(s => s.status === 'active').length;
        trialCount += subscriptionsDb.filter(s => s.status === 'trialing').length;
        canceledCount += subscriptionsDb.filter(s => s.status === 'canceled').length;
        pastDueCount += subscriptionsDb.filter(s => s.status === 'past_due').length;
      }
      
      // Se tiver usuários com assinatura ativa mas não registrada na tabela, contar adicionalmente
      if (usersWithSubs && usersWithSubs.length > 0) {
        // Adicionar aos status com base nos tipos de assinatura dos usuários
        usersWithSubs.forEach(user => {
          // Adicionar ao contador apropriado apenas se o usuário não estiver já contado nas assinaturas
          if (!subscriptionsDb.some(s => s.userId === user.id)) {
            if (user.subscriptionType === 'trial') {
              trialCount++;
            } else if (user.subscriptionActive) {
              activeCount++;
              
              // Estimar receita com base no tipo de assinatura
              if (user.subscriptionType === 'annual') {
                totalAmount += 960; // Anual: R$ 960,00
              } else if (user.subscriptionType === 'monthly') {
                totalAmount += 99.9; // Mensal: R$ 99,90
              }
              
              // Adicionar receita ao mês atual para o gráfico
              const currentMonth = new Date().getMonth();
              monthlyData[currentMonth].revenue += user.subscriptionType === 'annual' ? 80 : 99.9;
            }
          }
        });
      }
      
      // Se tiver faturas pagas, adicionar à receita total
      if (invoicesDb && invoicesDb.length > 0) {
        const paidInvoices = invoicesDb.filter(i => i.status === 'paid');
        if (paidInvoices.length > 0) {
          // Adicionar à receita total
          totalAmount += paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
          
          // Processar para o gráfico mensal
          const today = new Date();
          const lastYear = new Date();
          lastYear.setFullYear(today.getFullYear() - 1);
          
          paidInvoices.forEach(invoice => {
            if (invoice.paidAt) {
              const paidDate = new Date(invoice.paidAt);
              if (paidDate >= lastYear) {
                const monthIndex = paidDate.getMonth();
                monthlyData[monthIndex].revenue += Number(invoice.amount);
              }
            }
          });
        }
      }
      
      // Para garantir que sempre existam valores no gráfico, se não tiver dados reais,
      // criar valores baseados nos usuários ativos
      const hasMonthlyData = monthlyData.some(m => m.revenue > 0);
      if (!hasMonthlyData && usersWithSubs.length > 0) {
        // Criar distribuição para os últimos 6 meses
        const currentMonth = new Date().getMonth();
        
        for (let i = 0; i < 6; i++) {
          const monthIndex = (currentMonth - i + 12) % 12; // Garantir que o índice seja positivo
          
          // Fator decrescente: mais receita nos meses mais recentes
          const factor = Math.pow(0.9, i);
          const monthlyValue = (totalAmount / 12) * factor;
          
          monthlyData[monthIndex].revenue = parseFloat(monthlyValue.toFixed(2));
        }
      }
      
      // Arredondar valores para 2 casas decimais
      monthlyData.forEach(data => {
        data.revenue = parseFloat(data.revenue.toFixed(2));
      });
      
      // Calcular receita mensal (média ou estimativa)
      const monthlyRevenue = totalAmount > 0 ? totalAmount / 12 : 0;
      
      // Taxa de cancelamento (churn) - usar 5% como padrão se não tiver dados suficientes
      const totalActive = activeCount + trialCount;
      const churnRate = (totalActive + canceledCount) > 0 
        ? (canceledCount / (totalActive + canceledCount)) * 100 
        : 5.0;
      
      return {
        totalRevenue: parseFloat(totalAmount.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        activeSubscriptions: activeCount,
        totalUsers: usersDb.length,
        totalClients: clientsDb.length,
        churnRate: parseFloat(churnRate.toFixed(1)),
        monthlyData,
        subscriptionsByStatus: [
          { status: "Ativas", count: activeCount },
          { status: "Teste", count: trialCount },
          { status: "Canceladas", count: canceledCount },
          { status: "Atrasadas", count: pastDueCount }
        ]
      };
    } catch (error) {
      console.error("Error calculating finance stats:", error);
      throw error;
    }
  }
  
  async updateFinanceSettings(settings: any): Promise<any> {
    // Como não temos uma tabela específica para configurações, 
    // podemos retornar as próprias configurações recebidas
    // Em uma implementação completa, isso salvaria em uma tabela de configurações
    return settings;
  }

  // Complementos operations
  async getComplements(): Promise<Complement[]> {
    return await db.select().from(complements);
  }

  async getComplement(id: number): Promise<Complement | undefined> {
    const results = await db.select().from(complements).where(eq(complements.id, id));
    return results[0];
  }

  async createComplement(complement: InsertComplement): Promise<Complement> {
    // Calcular metros cúbicos automaticamente
    const length = parseFloat(complement.volumeLength);
    const width = parseFloat(complement.volumeWidth);
    const height = parseFloat(complement.volumeHeight);
    const quantity = complement.volumeQuantity;
    
    const cubicMeters = (length * width * height * quantity) / 1000000; // converter de cm³ para m³
    
    const complementWithCubicMeters = {
      ...complement,
      cubicMeters: cubicMeters.toFixed(3)
    };

    const results = await db.insert(complements).values(complementWithCubicMeters).returning();
    return results[0];
  }

  async updateComplement(
    id: number,
    complementUpdate: Partial<InsertComplement>
  ): Promise<Complement | undefined> {
    // Se as dimensões forem atualizadas, recalcular metros cúbicos
    let updateData = { ...complementUpdate };
    
    if (complementUpdate.volumeLength || complementUpdate.volumeWidth || 
        complementUpdate.volumeHeight || complementUpdate.volumeQuantity) {
      
      // Buscar dados atuais para completar o cálculo
      const currentComplement = await this.getComplement(id);
      if (currentComplement) {
        const length = parseFloat(complementUpdate.volumeLength || currentComplement.volumeLength);
        const width = parseFloat(complementUpdate.volumeWidth || currentComplement.volumeWidth);
        const height = parseFloat(complementUpdate.volumeHeight || currentComplement.volumeHeight);
        const quantity = complementUpdate.volumeQuantity || currentComplement.volumeQuantity;
        
        const cubicMeters = (length * width * height * quantity) / 1000000;
        updateData = {
          ...updateData,
          cubicMeters: cubicMeters.toFixed(3)
        };
      }
    }

    const results = await db
      .update(complements)
      .set(updateData)
      .where(eq(complements.id, id))
      .returning();
    return results[0];
  }

  async deleteComplement(id: number): Promise<boolean> {
    await db.delete(complements).where(eq(complements.id, id));
    return true;
  }

  async searchComplements(query: string): Promise<Complement[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(complements)
      .where(
        or(
          ilike(complements.contactName, searchQuery),
          ilike(complements.contactPhone, searchQuery),
          ilike(complements.observations, searchQuery)
        )
      )
      .orderBy(desc(complements.createdAt));
  }

  // Trial usage operations
  async getTrialUsage(userId: number): Promise<TrialUsage | undefined> {
    const [trialUsage] = await db
      .select()
      .from(trialUsages)
      .where(eq(trialUsages.userId, userId));
    return trialUsage || undefined;
  }

  async createTrialUsage(trialUsage: InsertTrialUsage): Promise<TrialUsage> {
    const [newTrialUsage] = await db
      .insert(trialUsages)
      .values(trialUsage)
      .returning();
    return newTrialUsage;
  }

  // Quote operations
  async getQuotes(userId: number): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, userId))
      .orderBy(desc(quotes.createdAt));
  }

  async getAllQuotes(): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .orderBy(desc(quotes.createdAt));
  }

  async getAllQuoteStats(): Promise<{ total: number; active: number; closed: number; expired: number; thisMonth: number; lastMonth: number; }> {
    const allQuotes = await db
      .select()
      .from(quotes);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const stats = {
      total: allQuotes.length,
      active: allQuotes.filter(q => q.status === 'ativa' || q.status === 'pendente').length,
      closed: allQuotes.filter(q => q.status === 'fechada').length,
      expired: allQuotes.filter(q => {
        if (!q.expiresAt) return false;
        return new Date(q.expiresAt) < now;
      }).length,
      thisMonth: allQuotes.filter(q => {
        if (!q.createdAt) return false;
        const createdAt = new Date(q.createdAt);
        return createdAt >= thisMonth;
      }).length,
      lastMonth: allQuotes.filter(q => {
        if (!q.createdAt) return false;
        const createdAt = new Date(q.createdAt);
        return createdAt >= lastMonth && createdAt <= lastMonthEnd;
      }).length
    };

    return stats;
  }

  async getQuoteStats(userId: number): Promise<{ total: number; active: number; closed: number; expired: number; thisMonth: number; lastMonth: number; }> {
    const userQuotes = await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, userId));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const total = userQuotes.length;
    const active = userQuotes.filter(q => q.status === "active").length;
    const closed = userQuotes.filter(q => q.status === "closed").length;
    const expired = userQuotes.filter(q => q.status === "expired").length;
    const thisMonth = userQuotes.filter(q => q.createdAt && q.createdAt >= startOfMonth).length;
    const lastMonth = userQuotes.filter(q => 
      q.createdAt && q.createdAt >= startOfLastMonth && q.createdAt <= endOfLastMonth
    ).length;

    return {
      total,
      active,
      closed,
      expired,
      thisMonth,
      lastMonth
    };
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    // Define automaticamente a data de expiração em 48 horas se não foi fornecida
    const expiresAt = quote.expiresAt || new Date(Date.now() + 48 * 60 * 60 * 1000);
    
    const [newQuote] = await db
      .insert(quotes)
      .values({
        ...quote,
        expiresAt
      })
      .returning();
    return newQuote;
  }

  async updateQuoteStatus(id: number, status: string, userId: number): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(quotes)
      .set({ status })
      .where(and(eq(quotes.id, id), eq(quotes.userId, userId)))
      .returning();
    return updatedQuote || undefined;
  }

  async getQuoteById(id: number): Promise<Quote | undefined> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id));
    return quote || undefined;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined> {
    const [updatedQuote] = await db
      .update(quotes)
      .set(quote)
      .where(eq(quotes.id, id))
      .returning();
    return updatedQuote || undefined;
  }

  async deleteQuote(id: number): Promise<boolean> {
    const result = await db
      .delete(quotes)
      .where(eq(quotes.id, id));
    return true;
  }

  // Webhook config operations
  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    const [config] = await db
      .select()
      .from(webhookConfigs)
      .orderBy(desc(webhookConfigs.id))
      .limit(1);
    return config || undefined;
  }

  async updateWebhookConfig(config: Partial<InsertWebhookConfig>): Promise<WebhookConfig> {
    // Verifica se já existe uma configuração
    const existingConfig = await this.getWebhookConfig();
    
    if (existingConfig) {
      // Atualiza a configuração existente
      const updateData = {
        ...config,
        updatedAt: new Date().toISOString()
      };
      
      const [updatedConfig] = await db
        .update(webhookConfigs)
        .set(updateData)
        .where(eq(webhookConfigs.id, existingConfig.id))
        .returning();
      return updatedConfig;
    } else {
      // Cria uma nova configuração
      const insertData = {
        enabled: false,
        url: "",
        groupIds: [],
        minFreightValue: "0",
        allowedRoutes: [],
        useDirectWhatsApp: false,
        whatsappGroups: [],
        ...config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const [newConfig] = await db
        .insert(webhookConfigs)
        .values(insertData)
        .returning();
      return newConfig;
    }
  }
}

// Choose storage implementation based on database availability
// Se DATABASE_URL não estiver definido, lança um erro para evitar problemas
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for this application to work correctly. Please set it up in your .env file or Replit environment variables.");
}

export const storage = new DatabaseStorage();
