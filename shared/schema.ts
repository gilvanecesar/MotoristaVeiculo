import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

// Types
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// Types for forms
export type DriverWithVehicles = Driver & { vehicles: Vehicle[] };
