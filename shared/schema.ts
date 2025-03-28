import { pgTable, text, serial, integer, boolean, timestamp, date, decimal } from "drizzle-orm/pg-core";
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

// Driver schema
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
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
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Vehicle schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  renavam: text("renavam"),
  
  // Tipo de veículo e carroceria
  vehicleType: text("vehicle_type").notNull(),
  bodyType: text("body_type").notNull(),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela de clientes
export const CLIENT_TYPES = {
  SHIPPER: "shipper",     // Embarcador
  CARRIER: "carrier",     // Transportador
  AGENT: "agent"          // Agente
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
  
  // Address information
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipcode: text("zipcode").notNull(),
  
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
  clientId: integer("client_id").references(() => clients.id),
  origin: text("origin").notNull(),
  originState: text("origin_state").notNull(),
  destination: text("destination").notNull(),
  destinationState: text("destination_state").notNull(),
  cargoType: text("cargo_type").notNull(), // completa ou complemento
  needsTarp: text("needs_tarp").notNull(), // sim ou não
  productType: text("product_type").notNull(),
  cargoWeight: decimal("cargo_weight").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  bodyType: text("body_type").notNull(),
  freightValue: decimal("freight_value").notNull(),
  tollOption: text("toll_option").notNull(), // incluso ou a parte
  paymentMethod: text("payment_method").notNull(),
  observations: text("observations"),
  status: text("status").default("aberto").notNull(), // aberto, em andamento, concluído, cancelado
  
  // Informações de contato
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  
  // Para fretes com múltiplos destinos
  hasMultipleDestinations: boolean("has_multiple_destinations").default(false),
  
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
  cnpj: z.string().min(14).max(18).refine(
    (value) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) || /^\d{14}$/.test(value),
    { message: "CNPJ inválido. Use o formato XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX" }
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
  cargoType: z.enum([CARGO_TYPES.COMPLETA, CARGO_TYPES.COMPLEMENTO]),
  needsTarp: z.enum([TARP_OPTIONS.SIM, TARP_OPTIONS.NAO]),
  tollOption: z.enum([TOLL_OPTIONS.INCLUSO, TOLL_OPTIONS.A_PARTE]),
  observations: z.string().max(500).optional().or(z.literal('')),
  cargoWeight: z.coerce.number().positive(),
  freightValue: z.coerce.number().positive(),
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

export const freightDestinationValidator = insertFreightDestinationSchema.extend({
  order: z.number().int().positive(),
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

// Types for forms
// User profile types
export const USER_TYPES = {
  DRIVER: "driver",
  AGENT: "agent",
  SHIPPER: "shipper",
  ADMIN: "admin"
} as const;

// Authentication providers
export const AUTH_PROVIDERS = {
  LOCAL: "local",
  GOOGLE: "google"
} as const;

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull(),
  profileType: text("profile_type").notNull(),
  authProvider: text("auth_provider").notNull().default(AUTH_PROVIDERS.LOCAL),
  providerId: text("provider_id"),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
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
  profileType: z.enum([
    USER_TYPES.DRIVER, 
    USER_TYPES.AGENT, 
    USER_TYPES.SHIPPER, 
    USER_TYPES.ADMIN
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

export type DriverWithVehicles = Driver & { vehicles: Vehicle[] };
export type FreightWithDestinations = Freight & { destinations?: FreightDestination[] };
