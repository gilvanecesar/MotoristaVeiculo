import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums para tipos de veículos e carrocerias
export const VEHICLE_TYPES = {
  LEVE: "leve",
  MEDIO: "medio",
  PESADO: "pesado",
  EXTRA_PESADO: "extra_pesado"
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

export type VehicleType = typeof VEHICLE_TYPES[keyof typeof VEHICLE_TYPES];
export type BodyType = typeof BODY_TYPES[keyof typeof BODY_TYPES];

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
  vehicleType: text("vehicle_type").notNull().default("leve"),
  bodyType: text("body_type").notNull().default("fechada"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas using drizzle-zod
export const insertDriverSchema = createInsertSchema(drivers)
  .omit({ id: true, createdAt: true });

export const insertVehicleSchema = createInsertSchema(vehicles)
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
    VEHICLE_TYPES.LEVE,
    VEHICLE_TYPES.MEDIO,
    VEHICLE_TYPES.PESADO,
    VEHICLE_TYPES.EXTRA_PESADO
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

// Types
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// Types for forms
export type DriverWithVehicles = Driver & { vehicles: Vehicle[] };
