import {
  drivers, vehicles, clients, freights, freightDestinations, users,
  CLIENT_TYPES, USER_TYPES, AUTH_PROVIDERS,
  type Driver, type InsertDriver,
  type Vehicle, type InsertVehicle, 
  type Client, type InsertClient,
  type Freight, type InsertFreight,
  type FreightDestination, type InsertFreightDestination,
  type User, type InsertUser,
  type DriverWithVehicles,
  type FreightWithDestinations
} from "@shared/schema";
import { db, pool } from "./db";
import { and, eq, ilike, or, sql } from "drizzle-orm";
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
  deleteUser(id: number): Promise<boolean>;
  
  // Driver operations
  getDrivers(): Promise<DriverWithVehicles[]>;
  getDriver(id: number): Promise<DriverWithVehicles | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<boolean>;
  searchDrivers(query: string): Promise<DriverWithVehicles[]>;
  
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehiclesByDriver(driverId: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  searchVehicles(query: string): Promise<Vehicle[]>;
  
  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;
  
  // Freight operations
  getFreights(): Promise<FreightWithDestinations[]>;
  getFreight(id: number): Promise<FreightWithDestinations | undefined>;
  createFreight(freight: InsertFreight): Promise<Freight>;
  updateFreight(id: number, freight: Partial<InsertFreight>): Promise<Freight | undefined>;
  deleteFreight(id: number): Promise<boolean>;
  searchFreights(query: string): Promise<FreightWithDestinations[]>;
  
  // FreightDestination operations
  getFreightDestinations(freightId: number): Promise<FreightDestination[]>;
  createFreightDestination(destination: InsertFreightDestination): Promise<FreightDestination>;
  deleteFreightDestination(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private driversData: Map<number, Driver>;
  private vehiclesData: Map<number, Vehicle>;
  private clientsData: Map<number, Client>;
  private freightsData: Map<number, Freight>;
  private freightDestinationsData: Map<number, FreightDestination>;
  private usersData: Map<number, User>;
  private driverCurrentId: number;
  private vehicleCurrentId: number;
  private clientCurrentId: number;
  private freightCurrentId: number;
  private freightDestinationCurrentId: number;
  private userCurrentId: number;
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
    this.driverCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.clientCurrentId = 1;
    this.freightCurrentId = 1;
    this.freightDestinationCurrentId = 1;
    this.userCurrentId = 1;
  }

  // Implementação dos métodos para MemStorage...
  // (código omitido para brevidade)
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
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

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const results = await db.update(users).set(userUpdate).where(eq(users.id, id)).returning();
    return results[0];
  }

  async verifyUser(id: number): Promise<User | undefined> {
    return this.updateUser(id, { isVerified: true });
  }

  async updateLastLogin(id: number): Promise<User | undefined> {
    return this.updateUser(id, { lastLogin: new Date() });
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
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
        vehicles: driverVehicles
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
      vehicles: driverVehicles
    };
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const results = await db.insert(drivers).values(driver).returning();
    return results[0];
  }

  async updateDriver(id: number, driverUpdate: Partial<InsertDriver>): Promise<Driver | undefined> {
    const results = await db.update(drivers).set(driverUpdate).where(eq(drivers.id, id)).returning();
    return results[0];
  }

  async deleteDriver(id: number): Promise<boolean> {
    await db.delete(drivers).where(eq(drivers.id, id));
    return true;
  }

  async searchDrivers(query: string): Promise<DriverWithVehicles[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    const driversData = await db.select().from(drivers).where(
      or(
        sql`lower(${drivers.name}) like ${searchQuery}`,
        sql`lower(${drivers.email}) like ${searchQuery}`,
        sql`lower(${drivers.phone}) like ${searchQuery}`
      )
    );
    
    // Buscar veículos para cada motorista e montar objeto DriverWithVehicles
    const driversWithVehicles: DriverWithVehicles[] = [];
    for (const driver of driversData) {
      const driverVehicles = await this.getVehiclesByDriver(driver.id);
      driversWithVehicles.push({
        ...driver,
        vehicles: driverVehicles
      });
    }
    
    return driversWithVehicles;
  }

  // Veículos
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehiclesByDriver(driverId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const results = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return results[0];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const results = await db.insert(vehicles).values(vehicle).returning();
    return results[0];
  }

  async updateVehicle(id: number, vehicleUpdate: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const results = await db.update(vehicles).set(vehicleUpdate).where(eq(vehicles.id, id)).returning();
    return results[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return true;
  }

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(vehicles).where(
      or(
        sql`lower(${vehicles.plate}) like ${searchQuery}`,
        sql`lower(${vehicles.brand}) like ${searchQuery}`,
        sql`lower(${vehicles.model}) like ${searchQuery}`
      )
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

  async updateClient(id: number, clientUpdate: Partial<InsertClient>): Promise<Client | undefined> {
    const results = await db.update(clients).set(clientUpdate).where(eq(clients.id, id)).returning();
    return results[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  async searchClients(query: string): Promise<Client[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    return await db.select().from(clients).where(
      or(
        sql`lower(${clients.name}) like ${searchQuery}`,
        sql`lower(${clients.email}) like ${searchQuery}`,
        sql`lower(${clients.cnpj}) like ${searchQuery}`
      )
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
        destinations
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
      destinations
    };
  }

  async createFreight(freight: InsertFreight): Promise<Freight> {
    const results = await db.insert(freights).values(freight).returning();
    return results[0];
  }

  async updateFreight(id: number, freightUpdate: Partial<InsertFreight>): Promise<Freight | undefined> {
    const results = await db.update(freights).set(freightUpdate).where(eq(freights.id, id)).returning();
    return results[0];
  }

  async deleteFreight(id: number): Promise<boolean> {
    // Deletar destinos primeiro devido à restrição de chave estrangeira
    await db.delete(freightDestinations).where(eq(freightDestinations.freightId, id));
    await db.delete(freights).where(eq(freights.id, id));
    return true;
  }

  async searchFreights(query: string): Promise<FreightWithDestinations[]> {
    const searchQuery = `%${query.toLowerCase()}%`;
    const freightsData = await db.select().from(freights).where(
      or(
        sql`lower(${freights.origin}) like ${searchQuery}`,
        sql`lower(${freights.destination}) like ${searchQuery}`,
        sql`lower(${freights.contactName}) like ${searchQuery}`,
        sql`lower(${freights.contactPhone}) like ${searchQuery}`
      )
    );
    
    // Buscar destinos para cada frete e montar objeto FreightWithDestinations
    const freightsWithDestinations: FreightWithDestinations[] = [];
    for (const freight of freightsData) {
      const destinations = await this.getFreightDestinations(freight.id);
      freightsWithDestinations.push({
        ...freight,
        destinations
      });
    }
    
    return freightsWithDestinations;
  }

  // Destinos de frete
  async getFreightDestinations(freightId: number): Promise<FreightDestination[]> {
    return await db.select().from(freightDestinations).where(eq(freightDestinations.freightId, freightId));
  }

  async createFreightDestination(destination: InsertFreightDestination): Promise<FreightDestination> {
    const results = await db.insert(freightDestinations).values(destination).returning();
    return results[0];
  }

  async deleteFreightDestination(id: number): Promise<boolean> {
    await db.delete(freightDestinations).where(eq(freightDestinations.id, id));
    return true;
  }
}

// Exportar instância do storage com PostgreSQL
export const storage = new DatabaseStorage();