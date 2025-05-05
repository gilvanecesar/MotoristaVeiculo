import {
  drivers,
  vehicles,
  clients,
  freights,
  freightDestinations,
  users,
  subscriptions,
  invoices,
  payments,
  CLIENT_TYPES,
  USER_TYPES,
  AUTH_PROVIDERS,
  SUBSCRIPTION_STATUS,
  INVOICE_STATUS,
  PLAN_TYPES,
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
  type User,
  type InsertUser,
  type Subscription,
  type InsertSubscription,
  type Invoice,
  type InsertInvoice,
  type Payment,
  type InsertPayment,
  type DriverWithVehicles,
  type FreightWithDestinations,
  type SubscriptionWithInvoices,
  type InvoiceWithPayments,
  type ClientWithSubscriptions,
} from "@shared/schema";
import { db, pool } from "./db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import crypto from "crypto";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

export interface IStorage {
  // Session store
  sessionStore: SessionStore;

  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  verifyUser(id: number): Promise<User | undefined>;
  updateLastLogin(id: number): Promise<User | undefined>;
  toggleUserAccess(id: number, isActive: boolean): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  createPasswordResetToken(email: string): Promise<{ token: string; user: User } | undefined>;
  verifyPasswordResetToken(token: string, email: string): Promise<User | undefined>;
  updatePassword(id: number, newPassword: string): Promise<User | undefined>;

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

  // Subscription operations
  getSubscriptions(): Promise<Subscription[]>;
  getSubscriptionsByUser(userId: number): Promise<Subscription[]>;
  getSubscriptionsByClient(clientId: number): Promise<Subscription[]>;
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
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(
    id: number,
    payment: Partial<InsertPayment>,
  ): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  
  // Finance operations
  getFinanceStats(): Promise<any>;
  updateFinanceSettings(settings: any): Promise<any>;
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
      
      if (!subscriptionsDb || subscriptionsDb.length === 0) {
        // Se não houver assinaturas na memória, retornar zeros
        return {
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          monthlyData: [
            { month: "Jan", revenue: 0 },
            { month: "Fev", revenue: 0 },
            { month: "Mar", revenue: 0 },
            { month: "Abr", revenue: 0 },
            { month: "Mai", revenue: 0 },
            { month: "Jun", revenue: 0 },
            { month: "Jul", revenue: 0 },
            { month: "Ago", revenue: 0 },
            { month: "Set", revenue: 0 },
            { month: "Out", revenue: 0 },
            { month: "Nov", revenue: 0 },
            { month: "Dez", revenue: 0 },
          ],
          subscriptionsByStatus: [
            { status: "Ativas", count: 0 },
            { status: "Teste", count: 0 },
            { status: "Canceladas", count: 0 },
            { status: "Atrasadas", count: 0 }
          ]
        };
      }
      
      // Calcular estatísticas com base em dados em memória
      const activeSubscriptions = subscriptionsDb.filter(s => s.status === 'active').length;
      const trialing = subscriptionsDb.filter(s => s.status === 'trialing').length;
      const canceled = subscriptionsDb.filter(s => s.status === 'canceled').length;
      const pastDue = subscriptionsDb.filter(s => s.status === 'past_due').length;
      
      // Calcular receita total baseada nas faturas pagas
      const paidInvoices = invoicesDb.filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
      
      // Calcular receita mensal (média dos últimos 3 meses)
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const recentInvoices = paidInvoices.filter(invoice => {
        return invoice.paidAt && new Date(invoice.paidAt) >= threeMonthsAgo;
      });
      
      const monthlyRevenue = recentInvoices.length > 0
        ? recentInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0) / 3
        : 0;
      
      // Taxa de cancelamento (churn)
      const totalSubscriptions = subscriptionsDb.length;
      const churnRate = totalSubscriptions > 0
        ? (canceled / totalSubscriptions) * 100
        : 0;
      
      // Agrupar receita por mês para os últimos 12 meses
      const lastYear = new Date();
      lastYear.setFullYear(today.getFullYear() - 1);
      
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));
      
      // Processar as faturas pagas para montar o gráfico de receita mensal
      paidInvoices.forEach(invoice => {
        if (invoice.paidAt) {
          const paidDate = new Date(invoice.paidAt);
          if (paidDate >= lastYear) {
            const monthIndex = paidDate.getMonth();
            monthlyData[monthIndex].revenue += Number(invoice.amount);
          }
        }
      });
      
      // Arredondar valores para 2 casas decimais
      monthlyData.forEach(data => {
        data.revenue = parseFloat(data.revenue.toFixed(2));
      });
      
      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        activeSubscriptions,
        churnRate: parseFloat(churnRate.toFixed(1)),
        monthlyData,
        subscriptionsByStatus: [
          { status: "Ativas", count: activeSubscriptions },
          { status: "Teste", count: trialing },
          { status: "Canceladas", count: canceled },
          { status: "Atrasadas", count: pastDue }
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
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  // Armazenamento temporário para tokens de redefinição de senha
  private passwordResetTokens: Map<string, { token: string; expiry: Date }> = new Map();

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
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
    const freightsData = await db.select().from(freights);

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
      );

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
      
      if (!subscriptionsDb || subscriptionsDb.length === 0) {
        // Se não houver assinaturas no banco, retornar zeros
        return {
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          churnRate: 0,
          monthlyData: [
            { month: "Jan", revenue: 0 },
            { month: "Fev", revenue: 0 },
            { month: "Mar", revenue: 0 },
            { month: "Abr", revenue: 0 },
            { month: "Mai", revenue: 0 },
            { month: "Jun", revenue: 0 },
            { month: "Jul", revenue: 0 },
            { month: "Ago", revenue: 0 },
            { month: "Set", revenue: 0 },
            { month: "Out", revenue: 0 },
            { month: "Nov", revenue: 0 },
            { month: "Dez", revenue: 0 },
          ],
          subscriptionsByStatus: [
            { status: "Ativas", count: 0 },
            { status: "Teste", count: 0 },
            { status: "Canceladas", count: 0 },
            { status: "Atrasadas", count: 0 }
          ]
        };
      }
      
      // Calcular estatísticas com base em dados reais do banco
      const activeSubscriptions = subscriptionsDb.filter(s => s.status === 'active').length;
      const trialing = subscriptionsDb.filter(s => s.status === 'trialing').length;
      const canceled = subscriptionsDb.filter(s => s.status === 'canceled').length;
      const pastDue = subscriptionsDb.filter(s => s.status === 'past_due').length;
      
      // Calcular receita total baseada nas faturas pagas
      const paidInvoices = invoicesDb.filter(i => i.status === 'paid');
      const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
      
      // Calcular receita mensal (média dos últimos 3 meses)
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const recentInvoices = paidInvoices.filter(invoice => {
        return invoice.paidAt && new Date(invoice.paidAt) >= threeMonthsAgo;
      });
      
      const monthlyRevenue = recentInvoices.length > 0
        ? recentInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0) / 3
        : 0;
      
      // Taxa de cancelamento (churn)
      const totalSubscriptions = subscriptionsDb.length;
      const churnRate = totalSubscriptions > 0
        ? (canceled / totalSubscriptions) * 100
        : 0;
      
      // Agrupar receita por mês para os últimos 12 meses
      const lastYear = new Date();
      lastYear.setFullYear(today.getFullYear() - 1);
      
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));
      
      // Processar as faturas pagas para montar o gráfico de receita mensal
      paidInvoices.forEach(invoice => {
        if (invoice.paidAt) {
          const paidDate = new Date(invoice.paidAt);
          if (paidDate >= lastYear) {
            const monthIndex = paidDate.getMonth();
            monthlyData[monthIndex].revenue += Number(invoice.amount);
          }
        }
      });
      
      // Arredondar valores para 2 casas decimais
      monthlyData.forEach(data => {
        data.revenue = parseFloat(data.revenue.toFixed(2));
      });
      
      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        monthlyRevenue: parseFloat(monthlyRevenue.toFixed(2)),
        activeSubscriptions,
        churnRate: parseFloat(churnRate.toFixed(1)),
        monthlyData,
        subscriptionsByStatus: [
          { status: "Ativas", count: activeSubscriptions },
          { status: "Teste", count: trialing },
          { status: "Canceladas", count: canceled },
          { status: "Atrasadas", count: pastDue }
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
}

// Choose storage implementation based on database availability
// Se DATABASE_URL não estiver definido, lança um erro para evitar problemas
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required for this application to work correctly. Please set it up in your .env file or Replit environment variables.");
}

export const storage = new DatabaseStorage();
