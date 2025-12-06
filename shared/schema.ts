import { pgTable, text, serial, integer, boolean, timestamp, date, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";



// Enums para tipos de veículos e carrocerias
export const VEHICLE_TYPES = {
  // Leves
  LEVE_TODOS: "leve_todos",
  LEVE_FIORINO: "leve_fiorino",
  LEVE_TOCO: "leve_toco",
  LEVE_VLC: "leve_vlc",
  
  // Médios
  MEDIO_TODOS: "medio_todos",
  MEDIO_BITRUCK: "medio_bitruck",
  MEDIO_TRUCK: "medio_truck",
  
  // Pesados
  PESADO_TODOS: "pesado_todos",
  PESADO_BITREM: "pesado_bitrem",
  PESADO_CARRETA: "pesado_carreta",
  PESADO_CARRETA_LS: "pesado_carreta_ls",
  PESADO_RODOTREM: "pesado_rodotrem",
  PESADO_VANDERLEIA: "pesado_vanderleia"
} as const;

export const BODY_TYPES = {
  BAU: "bau",
  GRANELEIRA: "graneleira",
  BASCULANTE: "basculante",
  PLATAFORMA: "plataforma",
  TANQUE: "tanque",
  FRIGORIFICA: "frigorifica",
  PORTA_CONTEINER: "porta_conteiner",
  SIDER: "sider",
  CACAMBA: "cacamba",
  ABERTA: "aberta",
  FECHADA: "fechada"
} as const;

// Tipos de carga para fretes
export const CARGO_TYPES = {
  COMPLETA: "completa",
  COMPLEMENTO: "complemento",
} as const;

// Opções para lona
export const TARP_OPTIONS = {
  SIM: "sim",
  NAO: "nao",
} as const;

// Opções para pedágio
export const TOLL_OPTIONS = {
  INCLUSO: "incluso",
  A_PARTE: "a_parte",
} as const;

export type VehicleType = typeof VEHICLE_TYPES[keyof typeof VEHICLE_TYPES];
export type BodyType = typeof BODY_TYPES[keyof typeof BODY_TYPES];
export type CargoType = typeof CARGO_TYPES[keyof typeof CARGO_TYPES];
export type TarpOption = typeof TARP_OPTIONS[keyof typeof TARP_OPTIONS];
export type TollOption = typeof TOLL_OPTIONS[keyof typeof TOLL_OPTIONS];

// ANTT Calculator Types
export const ANTT_CARGO_TYPES = {
  CARGA_GERAL: "carga_geral",
  CARGA_GRANEL_PRESSURIZADA: "carga_granel_pressurizada", 
  CONTEINERIZADA: "conteinerizada",
  FRIGORIFICADA_OU_AQUECIDA: "frigorificada_ou_aquecida",
  GRANEL_LIQUIDO: "granel_liquido",
  GRANEL_SOLIDO: "granel_solido",
  NEOGRANEL: "neogranel",
  PERIGOSA_CARGA_GERAL: "perigosa_carga_geral",
  PERIGOSA_CONTEINERIZADA: "perigosa_conteinerizada",
  PERIGOSA_FRIGORIFICADA: "perigosa_frigorificada",
  PERIGOSA_GRANEL_LIQUIDO: "perigosa_granel_liquido",
  PERIGOSA_GRANEL_SOLIDO: "perigosa_granel_solido"
} as const;

export type AnttCargoType = typeof ANTT_CARGO_TYPES[keyof typeof ANTT_CARGO_TYPES];

// Driver schema
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf").notNull().unique(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  birthdate: date("birthdate").notNull(),
  
  // CNH information
  cnh: text("cnh").notNull().unique(),
  cnhCategory: text("cnh_category").notNull(),
  cnhExpiration: date("cnh_expiration").notNull(),
  cnhIssueDate: date("cnh_issue_date").notNull(),
  
  // Address information
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipcode: text("zipcode").notNull(),
  
  // Location tracking
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  lastLocationUpdate: timestamp("last_location_update"),
  locationEnabled: boolean("location_enabled").default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  userId: integer("user_id").notNull().references(() => users.id),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  renavam: text("renavam"),
  
  // Tipo de veículo e carroceria
  vehicleType: text("vehicle_type").notNull(),
  bodyType: text("body_type").notNull(),
  
  // Campos adicionais
  chassi: text("chassi"),
  capacity: text("capacity"),
  observations: text("observations"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de clientes
export const CLIENT_TYPES = {
  SHIPPER: "embarcador",  // Antigo shipper
  CARRIER: "transportador", // Antigo carrier
  AGENT: "agente"         // Antigo agent
} as const;

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),  // Apenas CNPJ, obrigatório
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  
  // Tipo de cliente
  clientType: text("client_type").notNull(),
  
  // Address information (opcional)
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  zipcode: text("zipcode"),
  
  // Informações de contato adicional
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  notes: text("notes"),
  
  // Logo
  logoUrl: text("logo_url"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de fretes
export const freights = pgTable("freights", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: integer("user_id"), // Usuário que criou o frete
  origin: text("origin").notNull(),
  originState: text("origin_state").notNull(),
  destination: text("destination").notNull(),
  destinationState: text("destination_state").notNull(),
  destination1: text("destination1"),
  destinationState1: text("destination_state1"),
  destination2: text("destination2"),
  destinationState2: text("destination_state2"),
  cargoType: text("cargo_type").notNull(), // completa ou complemento
  needsTarp: text("needs_tarp").notNull(), // sim ou não
  productType: text("product_type").notNull(),
  cargoWeight: decimal("cargo_weight", { precision: 10, scale: 2 }).default('0').notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleTypesSelected: text("vehicle_types_selected"), // Lista de tipos de veículos selecionados (separados por vírgula)
  bodyType: text("body_type").notNull(),
  bodyTypesSelected: text("body_types_selected"), // Lista de tipos de carrocerias selecionados (separados por vírgula)
  isTracked: boolean("is_tracked").default(false), // Se a carga é rastreada
  valueType: text("value_type"), // "known" (já sei o valor) ou "to_combine" (a combinar)
  freightValue: decimal("freight_value", { precision: 10, scale: 2 }).default('0').notNull(),
  valueCalculation: text("value_calculation"), // Como o valor foi calculado (opcional)
  tollOption: text("toll_option").notNull(), // incluso ou a parte
  paymentMethod: text("payment_method"), // Forma de pagamento (opcional)
  advancePayment: text("advance_payment"), // Adiantamento (opcional)
  observations: text("observations"),
  status: text("status").default("aberto").notNull(), // aberto, em andamento, concluído, cancelado
  
  // Informações de contato
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  
  // Para fretes com múltiplos destinos
  hasMultipleDestinations: boolean("has_multiple_destinations").default(false),
  
  // Data de expiração do frete (30 dias a partir da criação por padrão)
  expirationDate: timestamp("expiration_date"),
  
  // Tracking de engajamento
  views: integer("views").default(0).notNull(), // Contagem de visualizações
  interestedDrivers: integer("interested_drivers").default(0).notNull(), // Contagem de cliques no WhatsApp
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para destinos adicionais de fretes
export const freightDestinations = pgTable("freight_destinations", {
  id: serial("id").primaryKey(),
  freightId: integer("freight_id").notNull().references(() => freights.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  destinationState: text("destination_state").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de complementos (cargas de complemento)
export const complements = pgTable("complements", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: integer("user_id"), // Usuário que criou o complemento
  
  // Origem e destino
  origin: text("origin").notNull(), // Cidade de origem
  originState: text("origin_state").notNull(), // Estado de origem
  destination: text("destination").notNull(), // Cidade de destino
  destinationState: text("destination_state").notNull(), // Estado de destino
  
  // Informações da carga
  weight: decimal("weight", { precision: 10, scale: 2 }).notNull(), // Peso em kg
  volumeQuantity: integer("volume_quantity").notNull(), // Quantidade de volumes
  volumeLength: decimal("volume_length", { precision: 8, scale: 2 }).notNull(), // Comprimento em metros
  volumeWidth: decimal("volume_width", { precision: 8, scale: 2 }).notNull(), // Largura em metros
  volumeHeight: decimal("volume_height", { precision: 8, scale: 2 }).notNull(), // Altura em metros
  cubicMeters: decimal("cubic_meters", { precision: 10, scale: 3 }).notNull(), // Metragem cúbica calculada
  
  // Valores financeiros
  invoiceValue: decimal("invoice_value", { precision: 12, scale: 2 }).notNull(), // Valor da nota fiscal
  freightValue: decimal("freight_value", { precision: 10, scale: 2 }).notNull(), // Valor do frete complemento
  
  // Informações de contato
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  
  // Status
  status: text("status").default("ativo").notNull(), // ativo, inativo, concluído
  
  // Observações
  observations: text("observations"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas using drizzle-zod
export const insertDriverSchema = createInsertSchema(drivers)
  .omit({ id: true, createdAt: true });

export const insertVehicleSchema = createInsertSchema(vehicles)
  .omit({ id: true, createdAt: true });

export const insertClientSchema = createInsertSchema(clients)
  .omit({ id: true, createdAt: true });

export const insertFreightSchema = createInsertSchema(freights)
  .omit({ id: true, createdAt: true });

export const insertFreightDestinationSchema = createInsertSchema(freightDestinations)
  .omit({ id: true, createdAt: true });

export const insertComplementSchema = createInsertSchema(complements)
  .omit({ id: true, createdAt: true, cubicMeters: true }); // cubicMeters será calculado automaticamente

// Validator schemas with additional validation
export const driverValidator = insertDriverSchema.extend({
  cpf: z.string().min(11).max(14),
  phone: z.string().min(10).max(15),
  birthdate: z.coerce.date(),
  cnhExpiration: z.coerce.date(),
  cnhIssueDate: z.coerce.date(),
});

export const vehicleValidator = insertVehicleSchema.extend({
  plate: z.string().min(7).max(8),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
  vehicleType: z.enum([
    // Leves
    VEHICLE_TYPES.LEVE_TODOS,
    VEHICLE_TYPES.LEVE_FIORINO,
    VEHICLE_TYPES.LEVE_TOCO,
    VEHICLE_TYPES.LEVE_VLC,
    
    // Médios
    VEHICLE_TYPES.MEDIO_TODOS,
    VEHICLE_TYPES.MEDIO_BITRUCK,
    VEHICLE_TYPES.MEDIO_TRUCK,
    
    // Pesados
    VEHICLE_TYPES.PESADO_TODOS,
    VEHICLE_TYPES.PESADO_BITREM,
    VEHICLE_TYPES.PESADO_CARRETA,
    VEHICLE_TYPES.PESADO_CARRETA_LS,
    VEHICLE_TYPES.PESADO_RODOTREM,
    VEHICLE_TYPES.PESADO_VANDERLEIA
  ]),
  bodyType: z.enum([
    BODY_TYPES.BAU,
    BODY_TYPES.GRANELEIRA,
    BODY_TYPES.BASCULANTE,
    BODY_TYPES.PLATAFORMA,
    BODY_TYPES.TANQUE,
    BODY_TYPES.FRIGORIFICA,
    BODY_TYPES.PORTA_CONTEINER,
    BODY_TYPES.SIDER,
    BODY_TYPES.CACAMBA,
    BODY_TYPES.ABERTA,
    BODY_TYPES.FECHADA
  ]),
});

export const clientValidator = insertClientSchema.extend({
  cnpj: z.string().min(11).max(18).refine(
    (value) => {
      // Remove formatação
      const cleanValue = value.replace(/\D/g, '');
      
      // Verifica se é um CNPJ válido (14 dígitos)
      if (cleanValue.length === 14) {
        return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) || /^\d{14}$/.test(value);
      }
      
      // Verifica se é um CPF válido (11 dígitos)
      if (cleanValue.length === 11) {
        return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value) || /^\d{11}$/.test(value);
      }
      
      return false;
    },
    { message: "CNPJ/CPF inválido. Use o formato XX.XXX.XXX/XXXX-XX (CNPJ) ou XXX.XXX.XXX-XX (CPF)" }
  ),
  clientType: z.enum([
    CLIENT_TYPES.SHIPPER, 
    CLIENT_TYPES.CARRIER, 
    CLIENT_TYPES.AGENT
  ], {
    errorMap: () => ({ message: "Selecione um tipo de cliente válido" })
  }),
  phone: z.string().min(10).max(15),
  whatsapp: z.string().min(10).max(15).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
});

export const freightValidator = insertFreightSchema.extend({
  clientId: z.coerce.number().positive().nullable().default(null),
  cargoType: z.enum([CARGO_TYPES.COMPLETA, CARGO_TYPES.COMPLEMENTO]),
  needsTarp: z.enum([TARP_OPTIONS.SIM, TARP_OPTIONS.NAO]),
  valueType: z.enum(["known", "to_combine"]).optional(),
  valueCalculation: z.string().optional().or(z.literal('')),
  tollOption: z.enum([TOLL_OPTIONS.INCLUSO, TOLL_OPTIONS.A_PARTE]),
  paymentMethod: z.string().optional().or(z.literal('')),
  advancePayment: z.string().optional().or(z.literal('')),
  observations: z.string().max(500).optional().or(z.literal('')),
  cargoWeight: z.string().default("0"),
  freightValue: z.string().default("0"),
  contactName: z.string().min(3),
  contactPhone: z.string().min(10).max(15),
  vehicleType: z.enum([
    // Leves
    VEHICLE_TYPES.LEVE_TODOS,
    VEHICLE_TYPES.LEVE_FIORINO,
    VEHICLE_TYPES.LEVE_TOCO,
    VEHICLE_TYPES.LEVE_VLC,
    
    // Médios
    VEHICLE_TYPES.MEDIO_TODOS,
    VEHICLE_TYPES.MEDIO_BITRUCK,
    VEHICLE_TYPES.MEDIO_TRUCK,
    
    // Pesados
    VEHICLE_TYPES.PESADO_TODOS,
    VEHICLE_TYPES.PESADO_BITREM,
    VEHICLE_TYPES.PESADO_CARRETA,
    VEHICLE_TYPES.PESADO_CARRETA_LS,
    VEHICLE_TYPES.PESADO_RODOTREM,
    VEHICLE_TYPES.PESADO_VANDERLEIA
  ]),
  vehicleTypesSelected: z.string().optional(),
  bodyType: z.enum([
    BODY_TYPES.BAU,
    BODY_TYPES.GRANELEIRA,
    BODY_TYPES.BASCULANTE,
    BODY_TYPES.PLATAFORMA,
    BODY_TYPES.TANQUE,
    BODY_TYPES.FRIGORIFICA,
    BODY_TYPES.PORTA_CONTEINER,
    BODY_TYPES.SIDER,
    BODY_TYPES.CACAMBA,
    BODY_TYPES.ABERTA,
    BODY_TYPES.FECHADA
  ]),
  bodyTypesSelected: z.string().optional(),
});

export const freightDestinationValidator = insertFreightDestinationSchema.extend({
  order: z.number().int().positive(),
});

export const complementValidator = insertComplementSchema.extend({
  clientId: z.coerce.number().min(1, "Cliente deve ser selecionado"),
  origin: z.string().min(3, "Cidade de origem é obrigatória"),
  originState: z.string().min(2, "Estado de origem é obrigatório"),
  destination: z.string().min(3, "Cidade de destino é obrigatória"),
  destinationState: z.string().min(2, "Estado de destino é obrigatório"),
  weight: z.string().min(1, "Peso é obrigatório"),
  volumeQuantity: z.coerce.number().int().positive("Quantidade de volumes deve ser um número positivo"),
  volumeLength: z.string().min(1, "Comprimento é obrigatório"),
  volumeWidth: z.string().min(1, "Largura é obrigatória"), 
  volumeHeight: z.string().min(1, "Altura é obrigatória"),
  cubicMeters: z.string().optional(),
  invoiceValue: z.string().min(1, "Valor da nota fiscal é obrigatório"),
  freightValue: z.string().min(1, "Valor do frete é obrigatório"),
  contactName: z.string().min(3, "Nome do contato deve ter pelo menos 3 caracteres"),
  contactPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(15, "Telefone deve ter no máximo 15 dígitos"),
  observations: z.string().optional().or(z.literal('')),
});

// Types
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Freight = typeof freights.$inferSelect;
export type InsertFreight = z.infer<typeof insertFreightSchema>;
export type FreightDestination = typeof freightDestinations.$inferSelect;
export type InsertFreightDestination = z.infer<typeof insertFreightDestinationSchema>;
export type Complement = typeof complements.$inferSelect;
export type InsertComplement = z.infer<typeof insertComplementSchema>;

// Types for forms
// User profile types
export const USER_TYPES = {
  DRIVER: "motorista",   // Antigo driver
  AGENT: "agente",       // Antigo agent
  SHIPPER: "embarcador", // Antigo shipper
  ADMIN: "administrador", // Antigo admin
  CARRIER: "transportador" // Antigo carrier
} as const;

// Authentication providers
export const AUTH_PROVIDERS = {
  LOCAL: "local",
  GOOGLE: "google"
} as const;

// Profile types
export const PROFILE_TYPES = {
  MOTORISTA: "motorista",
  EMBARCADOR: "embarcador", 
  AGENCIADOR: "agenciador",
  ADMIN: "admin"
} as const;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  password: text("password"),
  name: text("name").notNull(),
  profileType: text("profile_type").notNull(),
  authProvider: text("auth_provider").notNull().default(AUTH_PROVIDERS.LOCAL),
  providerId: text("provider_id"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  
  // Dados específicos por perfil
  cpf: text("cpf").unique(),
  cnpj: text("cnpj").unique(),
  phone: text("phone"),
  whatsapp: text("whatsapp").notNull(),
  anttVehicle: text("antt_vehicle"), // ANTT do veículo para motoristas
  vehiclePlate: text("vehicle_plate"), // Placa do veículo para motoristas
  
  // Informações de assinatura
  subscriptionActive: boolean("subscription_active").notNull().default(false),
  subscriptionType: text("subscription_type"),  // "trial", "monthly" ou "annual"
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  // Dados de pagamento removidos - apenas OpenPix agora
  paymentRequired: boolean("payment_required").default(false),
  
  // Controle de trial
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  trialUsed: boolean("trial_used").notNull().default(false),
  
  // Referências opcionais para ligar o usuário aos perfis específicos
  driverId: integer("driver_id").references(() => drivers.id),
  clientId: integer("client_id").references(() => clients.id)
});

// Insert and validation schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true });

export const userValidator = insertUserSchema.extend({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp deve ter pelo menos 10 dígitos"),
  profileType: z.enum([
    USER_TYPES.DRIVER, 
    USER_TYPES.AGENT, 
    USER_TYPES.SHIPPER, 
    USER_TYPES.ADMIN,
    USER_TYPES.CARRIER
  ], {
    errorMap: () => ({ message: "Selecione um tipo de perfil válido" })
  }),
  authProvider: z.enum([
    AUTH_PROVIDERS.LOCAL,
    AUTH_PROVIDERS.GOOGLE
  ]).default(AUTH_PROVIDERS.LOCAL)
});

// Export user types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];

// AI Chat Schema
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiChatSessions = pgTable("ai_chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dailyMessageCount: integer("daily_message_count").notNull().default(0),
  lastResetDate: date("last_reset_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat message types
export type AIChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAIChatMessage = typeof aiChatMessages.$inferInsert;
export type AIChatSession = typeof aiChatSessions.$inferSelect;
export type InsertAIChatSession = typeof aiChatSessions.$inferInsert;

// Status das assinaturas
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired"
} as const;

// Status de faturas
export const INVOICE_STATUS = {
  PAID: "paid",
  OPEN: "open",
  VOID: "void",
  UNCOLLECTIBLE: "uncollectible",
  UPCOMING: "upcoming"
} as const;

// Tipos de planos
export const PLAN_TYPES = {
  TRIAL: "trial",
  MONTHLY: "monthly",
  ANNUAL: "annual"
} as const;

// Tabela de assinaturas
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  // Dados do Stripe removidos - apenas OpenPix agora
  status: text("status").notNull(),  // SUBSCRIPTION_STATUS
  planType: text("plan_type").notNull(), // PLAN_TYPES
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  metadata: json("metadata"),  // Para armazenar informações adicionais
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de faturas
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  // Dados do Stripe removidos - apenas OpenPix agora
  status: text("status").notNull(), // INVOICE_STATUS
  invoiceNumber: text("invoice_number"),
  description: text("description"),
  amount: decimal("amount").notNull(),
  amountPaid: decimal("amount_paid"),
  amountDue: decimal("amount_due"),
  currency: text("currency").default("brl"),
  invoiceDate: timestamp("invoice_date"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  receiptUrl: text("receipt_url"),
  metadata: json("metadata"),  // Para armazenar informações adicionais
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de pagamentos
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  // Dados do Stripe removidos - apenas OpenPix agora
  amount: decimal("amount").notNull(),
  currency: text("currency").default("brl"),
  status: text("status").notNull(), // succeeded, processing, canceled, etc.
  paymentType: text("payment_type"), // credit card, bank transfer, etc.
  paymentMethod: text("payment_method"), // visa, mastercard, etc.
  last4: text("last4"), // últimos 4 dígitos do cartão
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  cardBrand: text("card_brand"),
  metadata: json("metadata"),  // Para armazenar informações adicionais
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas usando drizzle-zod
export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertPaymentSchema = createInsertSchema(payments)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Validators com validação adicional
export const subscriptionValidator = insertSubscriptionSchema.extend({
  status: z.enum([
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.TRIALING,
    SUBSCRIPTION_STATUS.PAST_DUE,
    SUBSCRIPTION_STATUS.CANCELED,
    SUBSCRIPTION_STATUS.UNPAID,
    SUBSCRIPTION_STATUS.INCOMPLETE,
    SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED
  ]),
  planType: z.enum([
    PLAN_TYPES.MONTHLY,
    PLAN_TYPES.ANNUAL
  ]),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
});

export const invoiceValidator = insertInvoiceSchema.extend({
  status: z.enum([
    INVOICE_STATUS.PAID,
    INVOICE_STATUS.OPEN,
    INVOICE_STATUS.VOID,
    INVOICE_STATUS.UNCOLLECTIBLE,
    INVOICE_STATUS.UPCOMING
  ]),
  amount: z.coerce.number().nonnegative(),
  amountPaid: z.coerce.number().nonnegative().optional(),
  amountDue: z.coerce.number().nonnegative().optional(),
  invoiceDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paidAt: z.coerce.date().optional(),
});

export const paymentValidator = insertPaymentSchema.extend({
  amount: z.coerce.number().positive(),
  status: z.string().min(1),
});

// Tipos
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];
export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];
export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES];

// Tipos para relacionamentos
export type DriverWithVehicles = Driver & { vehicles: Vehicle[] };
export type FreightWithDestinations = Freight & { destinations?: FreightDestination[] };
export type FreightWithUser = Freight & { 
  destinations?: FreightDestination[];
  user?: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
};
export type ClientWithSubscriptions = Client & { subscriptions?: Subscription[] };
export type SubscriptionWithInvoices = Subscription & { invoices?: Invoice[] };
export type InvoiceWithPayments = Invoice & { payments?: Payment[] };

// Tabela de eventos de assinatura (para log de atividades)
export const subscriptionEvents = pgTable("subscription_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema para eventos de assinatura
export const insertSubscriptionEventSchema = createInsertSchema(subscriptionEvents)
  .omit({ id: true, createdAt: true });

// Validator para eventos de assinatura
export const subscriptionEventValidator = insertSubscriptionEventSchema.extend({
  eventType: z.string().min(1, "Tipo de evento é obrigatório"),
});

// Tipo para eventos de assinatura
export type SubscriptionEvent = typeof subscriptionEvents.$inferSelect;
export type InsertSubscriptionEvent = z.infer<typeof insertSubscriptionEventSchema>;

// Status de pagamento PIX OpenPix
export const OPENPIX_PAYMENT_STATUS = {
  ACTIVE: "ACTIVE",      // Pendente de pagamento
  COMPLETED: "COMPLETED", // Pagamento realizado
  EXPIRED: "EXPIRED"     // Expirado
} as const;

// Tabela para controlar pagamentos OpenPix e assinaturas
export const openPixPayments = pgTable("openpix_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Dados do OpenPix
  openPixChargeId: text("openpix_charge_id").unique().notNull(), // ID da cobrança OpenPix
  correlationId: text("correlation_id").unique().notNull(),      // ID de correlação único
  status: text("status").notNull().default(OPENPIX_PAYMENT_STATUS.ACTIVE),
  
  // Dados financeiros
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Valor em reais
  amountCents: integer("amount_cents").notNull(),                   // Valor em centavos (OpenPix)
  
  // Dados PIX
  pixCode: text("pix_code"),          // Código PIX (copia e cola)
  qrCodeImage: text("qr_code_image"), // URL da imagem QR Code
  paymentUrl: text("payment_url"),    // URL de pagamento OpenPix
  
  // Controle de assinatura
  planType: text("plan_type").notNull().default("monthly"),
  subscriptionStartDate: timestamp("subscription_start_date"),     // Data de início da assinatura
  subscriptionEndDate: timestamp("subscription_end_date"),         // Data de fim da assinatura (30 dias)
  
  // Status do processamento
  processed: boolean("processed").default(false),                  // Se já foi processado pelo webhook
  subscriptionActivated: boolean("subscription_activated").default(false), // Se a assinatura foi ativada
  
  // Metadados
  webhookData: json("webhook_data"),  // Dados recebidos do webhook OpenPix
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),       // Data do pagamento
  refundedAt: timestamp("refunded_at"), // Data do reembolso
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schema para OpenPix
export const insertOpenPixPaymentSchema = createInsertSchema(openPixPayments)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Validator para OpenPix
export const openPixPaymentValidator = insertOpenPixPaymentSchema.extend({
  status: z.enum([
    OPENPIX_PAYMENT_STATUS.ACTIVE,
    OPENPIX_PAYMENT_STATUS.COMPLETED,
    OPENPIX_PAYMENT_STATUS.EXPIRED
  ]),
  amount: z.coerce.number().positive(),
  amountCents: z.coerce.number().positive(),
  planType: z.enum([PLAN_TYPES.MONTHLY, PLAN_TYPES.ANNUAL]),
});

// Tipos OpenPix
export type OpenPixPayment = typeof openPixPayments.$inferSelect;
export type InsertOpenPixPayment = z.infer<typeof insertOpenPixPaymentSchema>;
export type OpenPixPaymentStatus = typeof OPENPIX_PAYMENT_STATUS[keyof typeof OPENPIX_PAYMENT_STATUS];

// Tipos de transporte para cotações
export const TRANSPORT_TYPES = {
  CARGA: "carga",
  MUDANCA: "mudanca",
  VEICULO: "veiculo"
} as const;

export type TransportType = typeof TRANSPORT_TYPES[keyof typeof TRANSPORT_TYPES];

// Status de cotação
export const QUOTE_STATUS = {
  ATIVA: "ativa",
  FECHADA: "fechada",
  CANCELADA: "cancelada",
  EXPIRADA: "expirada"
} as const;

export type QuoteStatus = typeof QUOTE_STATUS[keyof typeof QUOTE_STATUS];

// Tabela de cotações
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Removido notNull() para permitir cotações públicas
  
  // Campos para cotações públicas
  clientName: text("client_name"), // Nome do cliente público
  clientEmail: text("client_email"), // Email do cliente público
  clientPhone: text("client_phone"), // Telefone do cliente público
  
  // Origem e destino
  origin: text("origin").notNull(),
  originState: text("origin_state"),
  destination: text("destination").notNull(),
  destinationState: text("destination_state"),
  
  // Detalhes da carga
  cargoType: text("cargo_type"),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  volume: decimal("volume", { precision: 10, scale: 2 }),
  urgency: text("urgency"),
  deliveryDate: date("delivery_date"),
  price: decimal("price", { precision: 10, scale: 2 }),
  
  // Campos originais (para compatibilidade)
  transportType: text("transport_type"),
  noteValue: decimal("note_value", { precision: 10, scale: 2 }),
  quantity: integer("quantity"),
  totalWeight: decimal("total_weight", { precision: 10, scale: 2 }),
  
  // Dados do embarcador (para cotações autenticadas)
  shipperName: text("shipper_name"),
  shipperEmail: text("shipper_email"),
  shipperWhatsapp: text("shipper_whatsapp"),
  
  // Descrição
  description: text("description"),
  observations: text("observations"),
  
  // Status
  status: text("status").notNull().default("pendente"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Data de expiração da cotação
});

// Insert schema para cotações
export const insertQuoteSchema = createInsertSchema(quotes)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Validator para cotações
export const quoteValidator = insertQuoteSchema.extend({
  transportType: z.enum([
    TRANSPORT_TYPES.CARGA,
    TRANSPORT_TYPES.MUDANCA,
    TRANSPORT_TYPES.VEICULO
  ]),
  origin: z.string().min(1, "Origem é obrigatória"),
  destination: z.string().min(1, "Destino é obrigatório"),
  shipperName: z.string().min(1, "Nome do embarcador é obrigatório"),
  shipperEmail: z.string().email("Email inválido"),
  shipperWhatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  status: z.enum([
    QUOTE_STATUS.ATIVA,
    QUOTE_STATUS.FECHADA,
    QUOTE_STATUS.CANCELADA,
    QUOTE_STATUS.EXPIRADA
  ]).optional(),
});

// Tipos de cotação
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

// Tabela de configurações do webhook
export const webhookConfigs = pgTable("webhook_configs", {
  id: serial("id").primaryKey(),
  enabled: boolean("enabled").default(false),
  url: text("url").default(""),
  groupIds: json("group_ids").default("[]"),
  minFreightValue: decimal("min_freight_value", { precision: 10, scale: 2 }).default("0"),
  allowedRoutes: json("allowed_routes").default("[]"),
  useDirectWhatsApp: boolean("use_direct_whatsapp").default(false),
  whatsappGroups: json("whatsapp_groups").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Insert schema para configurações do webhook
export const insertWebhookConfigSchema = createInsertSchema(webhookConfigs)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Tipos de configuração do webhook
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;

// Tabela de códigos de verificação de telefone
export const phoneVerificationCodes = pgTable("phone_verification_codes", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  verified: boolean("verified").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema para códigos de verificação
export const insertPhoneVerificationCodeSchema = createInsertSchema(phoneVerificationCodes)
  .omit({ id: true, createdAt: true });

// Tipos de código de verificação
export type PhoneVerificationCode = typeof phoneVerificationCodes.$inferSelect;
export type InsertPhoneVerificationCode = z.infer<typeof insertPhoneVerificationCodeSchema>;

// Status de campanhas
export const CAMPAIGN_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

// Tabela de campanhas promocionais para WhatsApp
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default(CAMPAIGN_STATUS.INACTIVE),
  randomize: boolean("randomize").default(true),
  displayOrder: integer("display_order").default(0),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de mensagens das campanhas
export const campaignMessages = pgTable("campaign_messages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title"),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas para campanhas
export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, createdAt: true, updatedAt: true });

export const insertCampaignMessageSchema = createInsertSchema(campaignMessages)
  .omit({ id: true, createdAt: true });

// Validators para campanhas
export const campaignValidator = insertCampaignSchema.extend({
  name: z.string().min(1, "Nome da campanha é obrigatório"),
  status: z.enum([CAMPAIGN_STATUS.ACTIVE, CAMPAIGN_STATUS.INACTIVE]),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
});

export const campaignMessageValidator = insertCampaignMessageSchema.extend({
  campaignId: z.coerce.number().positive("ID da campanha é obrigatório"),
  body: z.string().min(1, "Texto da mensagem é obrigatório"),
});

// Tipos de campanhas
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type CampaignMessage = typeof campaignMessages.$inferSelect;
export type InsertCampaignMessage = z.infer<typeof insertCampaignMessageSchema>;
export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];

// Tipo para campanha com mensagens
export type CampaignWithMessages = Campaign & { messages: CampaignMessage[] };

// ============ FREIGHT ENGAGEMENT ANALYTICS ============

// Tipos de eventos de engajamento
export const ENGAGEMENT_EVENT_TYPES = {
  VIEW: "view",
  WHATSAPP_CLICK: "whatsapp_click",
  PHONE_CLICK: "phone_click",
  SHARE_CLICK: "share_click",
} as const;

export type EngagementEventType = typeof ENGAGEMENT_EVENT_TYPES[keyof typeof ENGAGEMENT_EVENT_TYPES];

// Tabela de eventos de engajamento de fretes
export const freightEngagementEvents = pgTable("freight_engagement_events", {
  id: serial("id").primaryKey(),
  freightId: integer("freight_id").notNull().references(() => freights.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schema para eventos de engajamento
export const insertFreightEngagementEventSchema = createInsertSchema(freightEngagementEvents)
  .omit({ id: true, createdAt: true });

// Tipos de eventos de engajamento
export type FreightEngagementEvent = typeof freightEngagementEvents.$inferSelect;
export type InsertFreightEngagementEvent = z.infer<typeof insertFreightEngagementEventSchema>;

// Tipo para estatísticas de engajamento de um frete
export type FreightEngagementStats = {
  freightId: number;
  totalViews: number;
  uniqueViews: number;
  whatsappClicks: number;
  phoneClicks: number;
  shareClicks: number;
};
